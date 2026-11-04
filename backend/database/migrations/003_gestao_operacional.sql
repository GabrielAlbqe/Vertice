-- Extensao aditiva para requisitos Vertice 2.0. Requer backup e aprovacao.
-- DDL tem commit implicito. Nao executar junto de outra migracao.
DROP PROCEDURE IF EXISTS vertice_migracao_003;
DELIMITER $$
CREATE PROCEDURE vertice_migracao_003()
BEGIN
  IF @@FOREIGN_KEY_CHECKS <> 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Habilite FOREIGN_KEY_CHECKS'; END IF;
  IF EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND IS_NULLABLE<>'YES' AND ((TABLE_NAME='ocorrencia_obra' AND COLUMN_NAME IN ('classificacao','responsavel_id','prazo_previsto')) OR (TABLE_NAME='foto_obra' AND COLUMN_NAME IN ('atividade_id','excluido_em','excluido_por')))) OR EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND ((TABLE_NAME='ocorrencia_obra' AND ((COLUMN_NAME='classificacao' AND COLUMN_TYPE<>'varchar(100)') OR (COLUMN_NAME='responsavel_id' AND COLUMN_TYPE<>'int') OR (COLUMN_NAME='prazo_previsto' AND COLUMN_TYPE<>'date'))) OR (TABLE_NAME='foto_obra' AND ((COLUMN_NAME='atividade_id' AND COLUMN_TYPE<>'int') OR (COLUMN_NAME='excluido_por' AND COLUMN_TYPE<>'int') OR (COLUMN_NAME='excluido_em' AND COLUMN_TYPE<>'datetime'))))) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Colunas operacionais divergentes; revisar antes de migrar';
  END IF;
  IF EXISTS(SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL AND ((TABLE_NAME='ocorrencia_obra' AND COLUMN_NAME='responsavel_id' AND NOT(REFERENCED_TABLE_NAME='usuario' AND REFERENCED_COLUMN_NAME='id_usuario')) OR (TABLE_NAME='foto_obra' AND COLUMN_NAME='atividade_id' AND NOT(REFERENCED_TABLE_NAME='atividade_eap' AND REFERENCED_COLUMN_NAME='id_atividade')) OR (TABLE_NAME='foto_obra' AND COLUMN_NAME='excluido_por' AND NOT(REFERENCED_TABLE_NAME='usuario' AND REFERENCED_COLUMN_NAME='id_usuario')))) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='FK operacional divergente';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ocorrencia_obra' AND COLUMN_NAME='classificacao') THEN
    ALTER TABLE ocorrencia_obra ADD COLUMN classificacao VARCHAR(100) NULL;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ocorrencia_obra' AND COLUMN_NAME='responsavel_id') THEN
    ALTER TABLE ocorrencia_obra ADD COLUMN responsavel_id INT NULL;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ocorrencia_obra' AND COLUMN_NAME='prazo_previsto') THEN
    ALTER TABLE ocorrencia_obra ADD COLUMN prazo_previsto DATE NULL;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ocorrencia_obra' AND COLUMN_NAME='responsavel_id' AND REFERENCED_TABLE_NAME='usuario' AND REFERENCED_COLUMN_NAME='id_usuario') THEN
    ALTER TABLE ocorrencia_obra ADD CONSTRAINT fk_ocorrencia_designado FOREIGN KEY(responsavel_id) REFERENCES usuario(id_usuario);
  END IF;
  IF (SELECT COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ocorrencia_historico' AND COLUMN_NAME='acao') = 'enum(''Criada'',''Resolvida'')' THEN
    ALTER TABLE ocorrencia_historico MODIFY COLUMN acao ENUM('Criada','Resolvida','Atualizada') NOT NULL;
  ELSEIF (SELECT COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='ocorrencia_historico' AND COLUMN_NAME='acao') <> 'enum(''Criada'',''Resolvida'',''Atualizada'')' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='Historico de ocorrencias divergente';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='foto_obra' AND COLUMN_NAME='atividade_id') THEN
    ALTER TABLE foto_obra ADD COLUMN atividade_id INT NULL;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='foto_obra' AND COLUMN_NAME='excluido_em') THEN
    ALTER TABLE foto_obra ADD COLUMN excluido_em DATETIME NULL;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='foto_obra' AND COLUMN_NAME='excluido_por') THEN
    ALTER TABLE foto_obra ADD COLUMN excluido_por INT NULL;
  END IF;
  IF NOT EXISTS(SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='foto_obra' AND COLUMN_NAME='atividade_id' AND REFERENCED_TABLE_NAME='atividade_eap' AND REFERENCED_COLUMN_NAME='id_atividade') THEN
    ALTER TABLE foto_obra ADD CONSTRAINT fk_foto_atividade FOREIGN KEY(atividade_id) REFERENCES atividade_eap(id_atividade);
  END IF;
  IF NOT EXISTS(SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='foto_obra' AND COLUMN_NAME='excluido_por' AND REFERENCED_TABLE_NAME='usuario' AND REFERENCED_COLUMN_NAME='id_usuario') THEN
    ALTER TABLE foto_obra ADD CONSTRAINT fk_foto_exclusao FOREIGN KEY(excluido_por) REFERENCES usuario(id_usuario);
  END IF;
  CREATE TABLE IF NOT EXISTS foto_historico (
    id_historico INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    foto_id INT NOT NULL,
    usuario_id INT NOT NULL,
    acao ENUM('Enviada','Excluida') NOT NULL,
    descricao VARCHAR(1000) NOT NULL,
    registrado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_foto_evento FOREIGN KEY(foto_id) REFERENCES foto_obra(id_foto),
    CONSTRAINT fk_foto_evento_autor FOREIGN KEY(usuario_id) REFERENCES usuario(id_usuario)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
END$$
DELIMITER ;
CALL vertice_migracao_003();
DROP PROCEDURE IF EXISTS vertice_migracao_003;
