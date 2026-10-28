-- Aplicação manual após backup e revisão. Não executar bd.sql em banco existente.
-- Pré-condição para o índice: resolver duplicidades SEM excluir dados automaticamente.
-- SELECT LOWER(TRIM(email)), COUNT(*) FROM usuario GROUP BY LOWER(TRIM(email)) HAVING COUNT(*) > 1;
-- E-mails passam a ser normalizados pela API; revisar os legados antes de aplicar o índice.
ALTER TABLE usuario ADD UNIQUE INDEX uq_usuario_email (email);
-- Preserva valores existentes; permite preços fracionários aceitos pelo frontend.
ALTER TABLE cadastro_de_insumos MODIFY COLUMN valor_unitario DECIMAL(12,2) NULL;
