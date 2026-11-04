-- Aditiva e idempotente. Aplicar no principal somente com autorização e backup.
CREATE TABLE IF NOT EXISTS vertice_security_state (
  chave VARCHAR(191) NOT NULL PRIMARY KEY,
  valor JSON NOT NULL,
  contador BIGINT UNSIGNED NOT NULL DEFAULT 0,
  expira_em BIGINT UNSIGNED NOT NULL,
  INDEX idx_security_expira (expira_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
