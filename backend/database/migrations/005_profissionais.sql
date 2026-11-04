CREATE TABLE IF NOT EXISTS profissional (
  id_profissional INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_construtora INT NOT NULL,
  codigo VARCHAR(50) NOT NULL,
  nome VARCHAR(150) NOT NULL,
  cargo VARCHAR(100) NOT NULL,
  equipe_id INT NULL,
  terceirizada_id INT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE KEY profissional_codigo (id_construtora, codigo),
  CONSTRAINT profissional_construtora FOREIGN KEY (id_construtora) REFERENCES construtora(id_construtora),
  CONSTRAINT profissional_equipe FOREIGN KEY (equipe_id) REFERENCES cadastro_de_equipes(id_cadastro_equipes),
  CONSTRAINT profissional_terceirizada FOREIGN KEY (terceirizada_id) REFERENCES cadastro_de_equipes_terceirizadas(id_equipe_terceirizada),
  CONSTRAINT profissional_uma_equipe CHECK (equipe_id IS NULL OR terceirizada_id IS NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
