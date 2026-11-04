CREATE TABLE IF NOT EXISTS gestao_auditoria (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 construtora_id INT NOT NULL, usuario_id INT NOT NULL, obra_id INT NULL,
 evento VARCHAR(80) NOT NULL, recurso VARCHAR(50) NOT NULL, recurso_id INT NOT NULL,
 detalhes JSON NOT NULL, registrado_em TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 KEY auditoria_empresa_data(construtora_id,registrado_em,id),
 FOREIGN KEY(construtora_id) REFERENCES construtora(id_construtora),
 FOREIGN KEY(usuario_id) REFERENCES usuario(id_usuario),
 FOREIGN KEY(obra_id) REFERENCES obra(id_obra) ON DELETE SET NULL
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS estoque_config (
 insumo_id INT PRIMARY KEY, unidade VARCHAR(20) NOT NULL, minimo DECIMAL(14,3) NULL,
 CHECK(minimo IS NULL OR minimo>=0),
 FOREIGN KEY(insumo_id) REFERENCES cadastro_de_insumos(id_insumos)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS estoque_movimento (
 id INT AUTO_INCREMENT PRIMARY KEY, insumo_id INT NOT NULL, usuario_id INT NOT NULL,
 tipo ENUM('Entrada','Saida') NOT NULL, quantidade INT NOT NULL, saldo_apos INT NOT NULL,
 competencia DATE NOT NULL, descricao VARCHAR(500) NOT NULL,
 apropriacao_id INT NULL UNIQUE, registrado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK(quantidade>0), CHECK(saldo_apos>=0),
 FOREIGN KEY(insumo_id) REFERENCES cadastro_de_insumos(id_insumos),
 FOREIGN KEY(usuario_id) REFERENCES usuario(id_usuario),
 FOREIGN KEY(apropriacao_id) REFERENCES apropriacao(id_apropriacao),
 KEY estoque_material_data(insumo_id,competencia,id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS etapa_planejamento (
 etapa_id INT PRIMARY KEY, inicio_previsto DATE NOT NULL, fim_previsto DATE NOT NULL,
 inicio_real DATE NULL, fim_real DATE NULL, responsavel_id INT NULL,
 situacao ENUM('Planejada','Em andamento','Concluida','Paralisada') NOT NULL,
 progresso DECIMAL(5,2) NULL, critica BOOLEAN NOT NULL DEFAULT FALSE,
 atividade_id INT NULL,
 CHECK(fim_previsto>=inicio_previsto), CHECK(fim_real IS NULL OR (inicio_real IS NOT NULL AND fim_real>=inicio_real)),
 CHECK(progresso IS NULL OR progresso BETWEEN 0 AND 100),
 FOREIGN KEY(etapa_id) REFERENCES etapa(id_etapa),
 FOREIGN KEY(responsavel_id) REFERENCES usuario(id_usuario),
 FOREIGN KEY(atividade_id) REFERENCES atividade_eap(id_atividade)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS maquina_evento (
 id INT AUTO_INCREMENT PRIMARY KEY, maquinario_id INT NOT NULL, usuario_id INT NOT NULL,
 tipo ENUM('Utilizacao','Manutencao prevista','Manutencao concluida','Indisponibilidade','Disponibilidade') NOT NULL,
 inicio DATE NOT NULL, fim DATE NOT NULL, horas DECIMAL(8,2) NULL,
 custo DECIMAL(14,2) NULL, descricao VARCHAR(500) NOT NULL,
 diario_id INT NULL, manutencao_id INT NULL UNIQUE, registrado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK(fim>=inicio), CHECK(horas IS NULL OR horas>0), CHECK(custo IS NULL OR custo>=0),
 FOREIGN KEY(maquinario_id) REFERENCES cadastro_de_maquinario(id_maquina),
 FOREIGN KEY(usuario_id) REFERENCES usuario(id_usuario),
 FOREIGN KEY(diario_id) REFERENCES diario_obra(id_diario),
 FOREIGN KEY(manutencao_id) REFERENCES maquina_evento(id),
 KEY maquina_periodo(maquinario_id,inicio,fim)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS custo_detalhe (
 custo_id INT PRIMARY KEY, categoria VARCHAR(80) NOT NULL, descricao VARCHAR(500) NOT NULL,
 FOREIGN KEY(custo_id) REFERENCES custo_realizado(id_custo_realizado)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS notificacao_leitura (
 usuario_id INT NOT NULL, chave VARCHAR(150) NOT NULL,
 lida_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(usuario_id,chave), FOREIGN KEY(usuario_id) REFERENCES usuario(id_usuario)
) ENGINE=InnoDB;
