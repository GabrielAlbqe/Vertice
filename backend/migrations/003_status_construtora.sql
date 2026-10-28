-- Aplicar manualmente após backup. Preserva as empresas existentes como ativas.
ALTER TABLE construtora ADD COLUMN status ENUM('Ativo','Inativo') NOT NULL DEFAULT 'Ativo';
