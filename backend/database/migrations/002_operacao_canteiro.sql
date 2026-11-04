-- Proposta aditiva. Nao aplicar em valen sem aprovacao e backup.
-- Tabelas novas: nenhum registro legado e alterado ou classificado retroativamente.
CREATE TABLE IF NOT EXISTS diario_complemento (
  diario_id INT NOT NULL PRIMARY KEY,
  observacoes TEXT NOT NULL,
  registrado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_complemento_diario FOREIGN KEY (diario_id) REFERENCES diario_obra(id_diario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE IF NOT EXISTS diario_equipe_presente (
  diario_id INT NOT NULL,
  equipe_id INT NOT NULL,
  PRIMARY KEY(diario_id,equipe_id),
  CONSTRAINT fk_presenca_diario FOREIGN KEY(diario_id) REFERENCES diario_obra(id_diario),
  CONSTRAINT fk_presenca_equipe FOREIGN KEY(equipe_id) REFERENCES cadastro_de_equipes(id_cadastro_equipes)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE IF NOT EXISTS diario_terceirizada_presente (
  diario_id INT NOT NULL,
  equipe_id INT NOT NULL,
  PRIMARY KEY(diario_id,equipe_id),
  CONSTRAINT fk_presenca_terceira_diario FOREIGN KEY(diario_id) REFERENCES diario_obra(id_diario),
  CONSTRAINT fk_presenca_terceira_equipe FOREIGN KEY(equipe_id) REFERENCES cadastro_de_equipes_terceirizadas(id_equipe_terceirizada)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE IF NOT EXISTS diario_maquinario_utilizado (
  diario_id INT NOT NULL,
  maquinario_id INT NOT NULL,
  quantidade INT NOT NULL,
  PRIMARY KEY(diario_id,maquinario_id),
  CONSTRAINT fk_utilizacao_diario FOREIGN KEY(diario_id) REFERENCES diario_obra(id_diario),
  CONSTRAINT fk_utilizacao_maquina FOREIGN KEY(maquinario_id) REFERENCES cadastro_de_maquinario(id_maquina),
  CHECK(quantidade > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE IF NOT EXISTS apropriacao_registro (
  apropriacao_id INT NOT NULL PRIMARY KEY,
  diario_id INT DEFAULT NULL,
  registrado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_registro_apropriacao FOREIGN KEY(apropriacao_id) REFERENCES apropriacao(id_apropriacao),
  CONSTRAINT fk_registro_diario FOREIGN KEY(diario_id) REFERENCES diario_obra(id_diario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE IF NOT EXISTS foto_obra (
  id_foto INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  obra_id INT NOT NULL,
  usuario_id INT NOT NULL,
  descricao VARCHAR(1000) NOT NULL,
  arquivo VARCHAR(80) NOT NULL UNIQUE,
  mime VARCHAR(50) NOT NULL,
  tamanho INT NOT NULL,
  sha256 CHAR(64) NOT NULL,
  registrado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_foto_obra_data(obra_id,registrado_em),
  CONSTRAINT fk_foto_obra FOREIGN KEY(obra_id) REFERENCES obra(id_obra),
  CONSTRAINT fk_foto_usuario FOREIGN KEY(usuario_id) REFERENCES usuario(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE IF NOT EXISTS ocorrencia_obra (
  id_ocorrencia INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  obra_id INT NOT NULL,
  usuario_id INT NOT NULL,
  descricao VARCHAR(4000) NOT NULL,
  localizacao VARCHAR(255) NOT NULL,
  prioridade ENUM('Baixa','Media','Alta','Critica') NOT NULL,
  status ENUM('Aberta','Resolvida') NOT NULL DEFAULT 'Aberta',
  registrado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolvido_em DATETIME DEFAULT NULL,
  resolvido_por INT DEFAULT NULL,
  resolucao VARCHAR(4000) DEFAULT NULL,
  KEY idx_ocorrencia_obra_status(obra_id,status),
  CONSTRAINT fk_ocorrencia_obra FOREIGN KEY(obra_id) REFERENCES obra(id_obra),
  CONSTRAINT fk_ocorrencia_autor FOREIGN KEY(usuario_id) REFERENCES usuario(id_usuario),
  CONSTRAINT fk_ocorrencia_responsavel FOREIGN KEY(resolvido_por) REFERENCES usuario(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE IF NOT EXISTS ocorrencia_historico (
  id_historico INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  ocorrencia_id INT NOT NULL,
  usuario_id INT NOT NULL,
  acao ENUM('Criada','Resolvida') NOT NULL,
  descricao VARCHAR(4000) NOT NULL,
  registrado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_evento_ocorrencia FOREIGN KEY(ocorrencia_id) REFERENCES ocorrencia_obra(id_ocorrencia),
  CONSTRAINT fk_evento_usuario FOREIGN KEY(usuario_id) REFERENCES usuario(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE IF NOT EXISTS requisicao_operacional (
  usuario_id INT NOT NULL,
  chave VARCHAR(80) NOT NULL,
  hash CHAR(64) NOT NULL,
  resposta JSON DEFAULT NULL,
  registrado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(usuario_id,chave),
  CONSTRAINT fk_requisicao_usuario FOREIGN KEY(usuario_id) REFERENCES usuario(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
