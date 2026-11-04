-- Requer backup verificado e aprovacao explicita para valen.
-- DDL MySQL possui commit implicito. Nao executar migracoes simultaneamente.
DROP PROCEDURE IF EXISTS vertice_migracao_001;
DELIMITER $$
CREATE PROCEDURE vertice_migracao_001()
BEGIN
  DECLARE fk_atual VARCHAR(64);
  DECLARE fk_tabela VARCHAR(64);
  DECLARE fk_coluna VARCHAR(64);
  DECLARE fk_delete VARCHAR(16);
  DECLARE fk_update VARCHAR(16);
  DECLARE n INT;
  IF @@FOREIGN_KEY_CHECKS <> 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Habilite FOREIGN_KEY_CHECKS antes da migracao';
  END IF;
  IF (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='cargo' AND CONSTRAINT_NAME='PRIMARY') > 1 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='PK composta de cargo inesperada';
  END IF;
  SELECT COUNT(*) INTO n FROM apropriacao a LEFT JOIN cadastro_de_insumos i
    ON i.id_insumos=a.id_insumo WHERE i.id_insumos IS NULL;
  IF n <> 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Apropriacoes com insumos invalidos; revisar sem apagar dados';
  END IF;
  SELECT COUNT(*) INTO n FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='cargo';
  IF n > 0 THEN
    IF n <> 3 OR (SELECT COUNT(*) FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='cargo' AND (
        (COLUMN_NAME='id_cargo' AND COLUMN_TYPE='int' AND COLUMN_KEY='PRI' AND EXTRA='auto_increment' AND IS_NULLABLE='NO') OR
        (COLUMN_NAME='nome_cargo' AND COLUMN_TYPE='varchar(100)' AND IS_NULLABLE='NO') OR
        (COLUMN_NAME='descricao' AND COLUMN_TYPE='varchar(255)' AND IS_NULLABLE='YES'))) <> 3 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Estrutura de cargo inesperada; revisao manual necessaria';
    END IF;
  END IF;
  SELECT COUNT(*) INTO n FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='cadastro_de_insumos'
      AND CONSTRAINT_NAME='PRIMARY' AND COLUMN_NAME='id_insumos';
  IF n <> 1 OR (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='cadastro_de_insumos' AND CONSTRAINT_NAME='PRIMARY')<>1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='PK de insumos inesperada'; END IF;
  SELECT COUNT(*) INTO n FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='apropriacao'
      AND COLUMN_NAME='id_insumo' AND REFERENCED_TABLE_NAME IS NOT NULL;
  IF n > 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Multiplas FKs de insumos; revisar'; END IF;
  SELECT MAX(CONSTRAINT_NAME), MAX(REFERENCED_TABLE_NAME), MAX(REFERENCED_COLUMN_NAME)
    INTO fk_atual, fk_tabela, fk_coluna FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='apropriacao'
      AND COLUMN_NAME='id_insumo' AND REFERENCED_TABLE_NAME IS NOT NULL;
  IF fk_atual IS NOT NULL AND NOT (
      (fk_tabela='cadastro_de_insumos' AND fk_coluna='id_insumos') OR
      (fk_tabela='cadastro de insumos' AND LOWER(fk_coluna)='id_insumos')) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Destino da FK inesperado; revisar';
  END IF;
  IF fk_atual IS NOT NULL THEN
    SELECT DELETE_RULE,UPDATE_RULE INTO fk_delete,fk_update FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='apropriacao' AND CONSTRAINT_NAME=fk_atual;
    IF fk_delete NOT IN ('RESTRICT','NO ACTION','CASCADE','SET NULL') OR fk_update NOT IN ('RESTRICT','NO ACTION','CASCADE','SET NULL') THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Acoes referenciais inesperadas';
    END IF;
  END IF;
  CREATE TABLE IF NOT EXISTS cargo (
    id_cargo INT NOT NULL AUTO_INCREMENT,
    nome_cargo VARCHAR(100) NOT NULL,
    descricao VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (id_cargo)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  IF fk_atual IS NULL THEN
    ALTER TABLE apropriacao ADD CONSTRAINT fk_apropriacao_insumo
      FOREIGN KEY (id_insumo) REFERENCES cadastro_de_insumos (id_insumos);
  ELSEIF NOT (fk_tabela='cadastro_de_insumos' AND fk_coluna='id_insumos') THEN
    SET @vertice_ddl=CONCAT('ALTER TABLE apropriacao DROP FOREIGN KEY `',
      REPLACE(fk_atual,'`','``'), '`, ADD CONSTRAINT fk_apropriacao_insumo FOREIGN KEY (id_insumo) REFERENCES cadastro_de_insumos (id_insumos) ON DELETE ',fk_delete,' ON UPDATE ',fk_update);
    PREPARE vertice_stmt FROM @vertice_ddl;
    EXECUTE vertice_stmt;
    DEALLOCATE PREPARE vertice_stmt;
  END IF;
END$$
DELIMITER ;
CALL vertice_migracao_001();
DROP PROCEDURE IF EXISTS vertice_migracao_001;
