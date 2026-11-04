DROP PROCEDURE IF EXISTS vertice_equipes_007;
DELIMITER $$
CREATE PROCEDURE vertice_equipes_007()
BEGIN
 IF NOT EXISTS(SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='obra' AND INDEX_NAME='obra_empresa_007') THEN
  ALTER TABLE obra ADD UNIQUE KEY obra_empresa_007(id_obra,id_construtora);
 END IF;
 IF NOT EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='cadastro_de_equipes' AND COLUMN_NAME='id_construtora') THEN
  ALTER TABLE cadastro_de_equipes ADD id_construtora INT NULL, ADD ativo BOOLEAN NOT NULL DEFAULT TRUE, ADD versao INT UNSIGNED NOT NULL DEFAULT 0, MODIFY idobra INT NULL;
 END IF;
 UPDATE cadastro_de_equipes e JOIN obra o ON o.id_obra=e.idobra SET e.id_construtora=o.id_construtora WHERE e.id_construtora IS NULL;
 IF NOT EXISTS(SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND CONSTRAINT_NAME='equipe_empresa_007') THEN
  ALTER TABLE cadastro_de_equipes
   ADD CONSTRAINT equipe_empresa_007 FOREIGN KEY(id_construtora) REFERENCES construtora(id_construtora),
   ADD CONSTRAINT equipe_obra_empresa_007 FOREIGN KEY(idobra,id_construtora) REFERENCES obra(id_obra,id_construtora),
   ADD CONSTRAINT equipe_owner_007 CHECK(id_construtora IS NOT NULL OR idobra IS NOT NULL),
   ADD CONSTRAINT equipe_ativa_007 CHECK(ativo IN (0,1)),
   ADD CONSTRAINT equipe_inativa_007 CHECK(ativo=1 OR idobra IS NULL);
 END IF;
 IF NOT EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='cadastro_de_equipes_terceirizadas' AND COLUMN_NAME='id_construtora') THEN
  ALTER TABLE cadastro_de_equipes_terceirizadas ADD id_construtora INT NULL, ADD ativo BOOLEAN NOT NULL DEFAULT TRUE, ADD versao INT UNSIGNED NOT NULL DEFAULT 0, MODIFY id_obra INT NULL;
 END IF;
 UPDATE cadastro_de_equipes_terceirizadas e JOIN obra o ON o.id_obra=e.id_obra SET e.id_construtora=o.id_construtora WHERE e.id_construtora IS NULL;
 IF EXISTS(SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND CONSTRAINT_NAME='fk_equipes_terceirizadas_obra' AND (DELETE_RULE='CASCADE' OR UPDATE_RULE='CASCADE')) THEN
  ALTER TABLE cadastro_de_equipes_terceirizadas DROP FOREIGN KEY fk_equipes_terceirizadas_obra,
   ADD CONSTRAINT terceira_obra_007 FOREIGN KEY(id_obra) REFERENCES obra(id_obra);
 END IF;
 IF NOT EXISTS(SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND CONSTRAINT_NAME='terceira_empresa_007') THEN
  ALTER TABLE cadastro_de_equipes_terceirizadas
   ADD CONSTRAINT terceira_empresa_007 FOREIGN KEY(id_construtora) REFERENCES construtora(id_construtora),
   ADD CONSTRAINT terceira_obra_empresa_007 FOREIGN KEY(id_obra,id_construtora) REFERENCES obra(id_obra,id_construtora),
   ADD CONSTRAINT terceira_owner_007 CHECK(id_construtora IS NOT NULL OR id_obra IS NOT NULL),
   ADD CONSTRAINT terceira_ativa_007 CHECK(ativo IN (0,1)),
   ADD CONSTRAINT terceira_inativa_007 CHECK(ativo=1 OR id_obra IS NULL);
 END IF;
END$$
DELIMITER ;
CALL vertice_equipes_007();
DROP PROCEDURE vertice_equipes_007;
CREATE TABLE IF NOT EXISTS equipe_transferencia (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 construtora_id INT NOT NULL, usuario_id INT NOT NULL,
 equipe_id INT NULL, terceirizada_id INT NULL,
 obra_anterior INT NULL, obra_atual INT NULL,
 ativo_anterior BOOLEAN NULL, ativo_atual BOOLEAN NOT NULL,
 versao INT UNSIGNED NOT NULL, motivo VARCHAR(500) NOT NULL,
 registrado_em TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 CHECK((equipe_id IS NULL) <> (terceirizada_id IS NULL)),
 FOREIGN KEY(construtora_id) REFERENCES construtora(id_construtora),
 FOREIGN KEY(usuario_id) REFERENCES usuario(id_usuario),
 FOREIGN KEY(equipe_id) REFERENCES cadastro_de_equipes(id_cadastro_equipes),
 FOREIGN KEY(terceirizada_id) REFERENCES cadastro_de_equipes_terceirizadas(id_equipe_terceirizada),
 FOREIGN KEY(obra_anterior) REFERENCES obra(id_obra),
 FOREIGN KEY(obra_atual) REFERENCES obra(id_obra),
 KEY equipe_historico(construtora_id,equipe_id,id),
 KEY terceira_historico(construtora_id,terceirizada_id,id)
) ENGINE=InnoDB;
