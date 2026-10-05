-- Vértice: dados de teste para o Analytics Financeiro (MySQL 8, banco valen).
-- Executar o arquivo inteiro em uma mesma conexão (ex.: MySQL Workbench).
-- Usa SOMENTE a construtora EXISTENTE id_construtora = 1. Não cria construtora.
-- Se ela não existir, os INSERTs não inserem dados. Confira seed_pronto abaixo.
-- Identificação: obras com prefixo 'Vértice Teste -', exclusivamente da construtora 1.
-- Reexecução: NOT EXISTS reutiliza os IDs e não duplica os mesmos registros.
-- Não modifica registros existentes. Pode completar uma execução interrompida.
-- Não insere valor_total: o MySQL calcula essa coluna a partir de quantidade e custo_unitario.
-- Esperado: 6 obras, 30 insumos, 18 equipes, 18 máquinas, 36 etapas,
-- 108 custos planejados, 42 RDOs e 126 custos realizados.
-- Cenários: abaixo 72%, próximo 99%, acima 118%, planejamento 4%, concluída 93%, paralisada 68%.
-- Percentuais aproximados: tarifas arredondadas a centavos.
SET @seed_construtora = 1;
SET @seed_lock = GET_LOCK('vertice_seed_analytics_teste', 10);
SET @seed_pronto = @seed_lock = 1 AND EXISTS (SELECT 1 FROM valen.construtora WHERE id_construtora = @seed_construtora);
SELECT @seed_pronto AS seed_pronto, @seed_construtora AS construtora_existente;

-- OBRA 1: Vértice Teste - Residencial Aurora. Planejado 350000, realizado aproximado 252000.
INSERT INTO valen.obra (nome, status, id_construtora, categoria, numero_pavimentos, data_inicio_planejada, data_termino_planejada, orcamento_planejado)
SELECT 'Vértice Teste - Residencial Aurora', 'Em Andamento', 1, 'Residencial', 4, '2026-01-01', '2026-12-20', 350000 FROM DUAL
WHERE @seed_pronto AND NOT EXISTS (SELECT 1 FROM valen.obra WHERE nome = 'Vértice Teste - Residencial Aurora' AND id_construtora = @seed_construtora);

SET @obra = (SELECT MIN(id_obra) FROM valen.obra WHERE nome = 'Vértice Teste - Residencial Aurora' AND id_construtora = @seed_construtora);
INSERT INTO valen.cadastro_de_insumos (nome, quantidade_disponivel, valor_unitario, idobra)
SELECT 'Cimento CP II', 225, 22, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Cimento CP II');

SET @insumo_0 = (SELECT MIN(id_insumos) FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Cimento CP II');
INSERT INTO valen.cadastro_de_insumos (nome, quantidade_disponivel, valor_unitario, idobra)
SELECT 'Areia média', 315, 34, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Areia média');

SET @insumo_1 = (SELECT MIN(id_insumos) FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Areia média');
INSERT INTO valen.cadastro_de_insumos (nome, quantidade_disponivel, valor_unitario, idobra)
SELECT 'Brita 1', 405, 46, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Brita 1');

SET @insumo_2 = (SELECT MIN(id_insumos) FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Brita 1');
INSERT INTO valen.cadastro_de_insumos (nome, quantidade_disponivel, valor_unitario, idobra)
SELECT 'Bloco cerâmico', 495, 58, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Bloco cerâmico');

SET @insumo_3 = (SELECT MIN(id_insumos) FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Bloco cerâmico');
INSERT INTO valen.cadastro_de_insumos (nome, quantidade_disponivel, valor_unitario, idobra)
SELECT 'Vergalhão CA50', 585, 70, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Vergalhão CA50');

SET @insumo_4 = (SELECT MIN(id_insumos) FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Vergalhão CA50');
INSERT INTO valen.cadastro_de_equipes (nome_equipe, etapa_atuacao, quantidade_profissionais, custo_diario, custo_mensal, idobra)
SELECT 'Equipe de Fundação', 'Infraestrutura', 4, 900, 19800, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_equipes WHERE idobra = @obra AND nome_equipe = 'Equipe de Fundação');

SET @equipe_0 = (SELECT MIN(id_cadastro_equipes) FROM valen.cadastro_de_equipes WHERE idobra = @obra AND nome_equipe = 'Equipe de Fundação');
INSERT INTO valen.cadastro_de_equipes (nome_equipe, etapa_atuacao, quantidade_profissionais, custo_diario, custo_mensal, idobra)
SELECT 'Equipe Estrutural', 'Supraestrutura e Alvenaria', 6, 1140, 25080, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_equipes WHERE idobra = @obra AND nome_equipe = 'Equipe Estrutural');

SET @equipe_1 = (SELECT MIN(id_cadastro_equipes) FROM valen.cadastro_de_equipes WHERE idobra = @obra AND nome_equipe = 'Equipe Estrutural');
INSERT INTO valen.cadastro_de_equipes (nome_equipe, etapa_atuacao, quantidade_profissionais, custo_diario, custo_mensal, idobra)
SELECT 'Equipe de Acabamentos', 'Acabamentos', 8, 1380, 30360, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_equipes WHERE idobra = @obra AND nome_equipe = 'Equipe de Acabamentos');

SET @equipe_2 = (SELECT MIN(id_cadastro_equipes) FROM valen.cadastro_de_equipes WHERE idobra = @obra AND nome_equipe = 'Equipe de Acabamentos');
INSERT INTO valen.cadastro_de_maquinario (nome, quantidade, etapa_atuacao, custo_diario, status, idobra)
SELECT 'Betoneira 400L', 1, 'Infraestrutura', 180, 'Ativo', @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_maquinario WHERE idobra = @obra AND nome = 'Betoneira 400L');

SET @maquina_0 = (SELECT MIN(id_maquina) FROM valen.cadastro_de_maquinario WHERE idobra = @obra AND nome = 'Betoneira 400L');
INSERT INTO valen.cadastro_de_maquinario (nome, quantidade, etapa_atuacao, custo_diario, status, idobra)
SELECT 'Retroescavadeira', 2, 'Mobilização', 360, 'Ativo', @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_maquinario WHERE idobra = @obra AND nome = 'Retroescavadeira');

SET @maquina_1 = (SELECT MIN(id_maquina) FROM valen.cadastro_de_maquinario WHERE idobra = @obra AND nome = 'Retroescavadeira');
INSERT INTO valen.cadastro_de_maquinario (nome, quantidade, etapa_atuacao, custo_diario, status, idobra)
SELECT 'Plataforma elevatória', 3, 'Acabamentos', 540, 'Ativo', @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_maquinario WHERE idobra = @obra AND nome = 'Plataforma elevatória');

SET @maquina_2 = (SELECT MIN(id_maquina) FROM valen.cadastro_de_maquinario WHERE idobra = @obra AND nome = 'Plataforma elevatória');
INSERT INTO valen.etapa (id_obra, nome_etapa, descricao)
SELECT @obra, 'Mobilização', 'Etapa de teste Analytics - Mobilização' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Mobilização');

SET @etapa_0 = (SELECT MIN(id_etapa) FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Mobilização');
INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Mobilização', 'Equipe', 6650, '2026-01-01', '2026-02-28' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Mobilização' AND origem_custo = 'Equipe' AND data_inicio_prevista = '2026-01-01' AND data_fim_prevista = '2026-02-28');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Mobilização', 'Insumo', 8225, '2026-01-01', '2026-02-28' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Mobilização' AND origem_custo = 'Insumo' AND data_inicio_prevista = '2026-01-01' AND data_fim_prevista = '2026-02-28');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Mobilização', 'Maquinário', 2625, '2026-01-01', '2026-02-28' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Mobilização' AND origem_custo = 'Maquinário' AND data_inicio_prevista = '2026-01-01' AND data_fim_prevista = '2026-02-28');

INSERT INTO valen.etapa (id_obra, nome_etapa, descricao)
SELECT @obra, 'Infraestrutura', 'Etapa de teste Analytics - Infraestrutura' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Infraestrutura');

SET @etapa_1 = (SELECT MIN(id_etapa) FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Infraestrutura');
INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Infraestrutura', 'Equipe', 26600, '2026-03-01', '2026-04-28' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Infraestrutura' AND origem_custo = 'Equipe' AND data_inicio_prevista = '2026-03-01' AND data_fim_prevista = '2026-04-28');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Infraestrutura', 'Insumo', 32900, '2026-03-01', '2026-04-28' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Infraestrutura' AND origem_custo = 'Insumo' AND data_inicio_prevista = '2026-03-01' AND data_fim_prevista = '2026-04-28');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Infraestrutura', 'Maquinário', 10500, '2026-03-01', '2026-04-28' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Infraestrutura' AND origem_custo = 'Maquinário' AND data_inicio_prevista = '2026-03-01' AND data_fim_prevista = '2026-04-28');

INSERT INTO valen.etapa (id_obra, nome_etapa, descricao)
SELECT @obra, 'Supraestrutura e Alvenaria', 'Etapa de teste Analytics - Supraestrutura e Alvenaria' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Supraestrutura e Alvenaria');

SET @etapa_2 = (SELECT MIN(id_etapa) FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Supraestrutura e Alvenaria');
INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Supraestrutura e Alvenaria', 'Equipe', 39900, '2026-04-29', '2026-06-26' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Supraestrutura e Alvenaria' AND origem_custo = 'Equipe' AND data_inicio_prevista = '2026-04-29' AND data_fim_prevista = '2026-06-26');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Supraestrutura e Alvenaria', 'Insumo', 49350, '2026-04-29', '2026-06-26' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Supraestrutura e Alvenaria' AND origem_custo = 'Insumo' AND data_inicio_prevista = '2026-04-29' AND data_fim_prevista = '2026-06-26');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Supraestrutura e Alvenaria', 'Maquinário', 15750, '2026-04-29', '2026-06-26' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Supraestrutura e Alvenaria' AND origem_custo = 'Maquinário' AND data_inicio_prevista = '2026-04-29' AND data_fim_prevista = '2026-06-26');

INSERT INTO valen.etapa (id_obra, nome_etapa, descricao)
SELECT @obra, 'Instalações', 'Etapa de teste Analytics - Instalações' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Instalações');

SET @etapa_3 = (SELECT MIN(id_etapa) FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Instalações');
INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Instalações', 'Equipe', 26600, '2026-06-27', '2026-08-24' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Instalações' AND origem_custo = 'Equipe' AND data_inicio_prevista = '2026-06-27' AND data_fim_prevista = '2026-08-24');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Instalações', 'Insumo', 32900, '2026-06-27', '2026-08-24' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Instalações' AND origem_custo = 'Insumo' AND data_inicio_prevista = '2026-06-27' AND data_fim_prevista = '2026-08-24');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Instalações', 'Maquinário', 10500, '2026-06-27', '2026-08-24' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Instalações' AND origem_custo = 'Maquinário' AND data_inicio_prevista = '2026-06-27' AND data_fim_prevista = '2026-08-24');

INSERT INTO valen.etapa (id_obra, nome_etapa, descricao)
SELECT @obra, 'Revestimentos', 'Etapa de teste Analytics - Revestimentos' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Revestimentos');

SET @etapa_4 = (SELECT MIN(id_etapa) FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Revestimentos');
INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Revestimentos', 'Equipe', 19950, '2026-08-25', '2026-10-22' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Revestimentos' AND origem_custo = 'Equipe' AND data_inicio_prevista = '2026-08-25' AND data_fim_prevista = '2026-10-22');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Revestimentos', 'Insumo', 24675, '2026-08-25', '2026-10-22' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Revestimentos' AND origem_custo = 'Insumo' AND data_inicio_prevista = '2026-08-25' AND data_fim_prevista = '2026-10-22');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Revestimentos', 'Maquinário', 7875, '2026-08-25', '2026-10-22' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Revestimentos' AND origem_custo = 'Maquinário' AND data_inicio_prevista = '2026-08-25' AND data_fim_prevista = '2026-10-22');

INSERT INTO valen.etapa (id_obra, nome_etapa, descricao)
SELECT @obra, 'Acabamento', 'Etapa de teste Analytics - Acabamento' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Acabamento');

SET @etapa_5 = (SELECT MIN(id_etapa) FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Acabamento');
INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Acabamento', 'Equipe', 13300, '2026-10-23', '2026-12-20' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Acabamento' AND origem_custo = 'Equipe' AND data_inicio_prevista = '2026-10-23' AND data_fim_prevista = '2026-12-20');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Acabamento', 'Insumo', 16450, '2026-10-23', '2026-12-20' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Acabamento' AND origem_custo = 'Insumo' AND data_inicio_prevista = '2026-10-23' AND data_fim_prevista = '2026-12-20');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Acabamento', 'Maquinário', 5250, '2026-10-23', '2026-12-20' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Acabamento' AND origem_custo = 'Maquinário' AND data_inicio_prevista = '2026-10-23' AND data_fim_prevista = '2026-12-20');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-01-10', 'Integral', 'Nublado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-01-10' AND turno = 'Integral');

SET @rdo_0 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-01-10' AND turno = 'Integral');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_0, @rdo_0, 'Equipe', @equipe_0, '2026-01-10', 10, 957.6 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_0 AND id_rdo = @rdo_0 AND origem_custo = 'Equipe' AND id_origem = @equipe_0 AND data = '2026-01-10');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_0, @rdo_0, 'Insumo', @insumo_0, '2026-01-10', 100, 118.44 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_0 AND id_rdo = @rdo_0 AND origem_custo = 'Insumo' AND id_origem = @insumo_0 AND data = '2026-01-10');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_0, @rdo_0, 'Maquinário', @maquina_0, '2026-01-10', 10, 378 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_0 AND id_rdo = @rdo_0 AND origem_custo = 'Maquinário' AND id_origem = @maquina_0 AND data = '2026-01-10');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-02-11', 'Manhã', 'Ensolarado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-02-11' AND turno = 'Manhã');

SET @rdo_1 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-02-11' AND turno = 'Manhã');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_0, @rdo_1, 'Equipe', @equipe_1, '2026-02-11', 10, 957.6 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_0 AND id_rdo = @rdo_1 AND origem_custo = 'Equipe' AND id_origem = @equipe_1 AND data = '2026-02-11');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_0, @rdo_1, 'Insumo', @insumo_1, '2026-02-11', 100, 118.44 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_0 AND id_rdo = @rdo_1 AND origem_custo = 'Insumo' AND id_origem = @insumo_1 AND data = '2026-02-11');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_0, @rdo_1, 'Maquinário', @maquina_1, '2026-02-11', 10, 378 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_0 AND id_rdo = @rdo_1 AND origem_custo = 'Maquinário' AND id_origem = @maquina_1 AND data = '2026-02-11');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-03-12', 'Integral', 'Ensolarado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-03-12' AND turno = 'Integral');

SET @rdo_2 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-03-12' AND turno = 'Integral');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_1, @rdo_2, 'Equipe', @equipe_2, '2026-03-12', 10, 957.6 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_1 AND id_rdo = @rdo_2 AND origem_custo = 'Equipe' AND id_origem = @equipe_2 AND data = '2026-03-12');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_1, @rdo_2, 'Insumo', @insumo_2, '2026-03-12', 100, 118.44 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_1 AND id_rdo = @rdo_2 AND origem_custo = 'Insumo' AND id_origem = @insumo_2 AND data = '2026-03-12');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_1, @rdo_2, 'Maquinário', @maquina_2, '2026-03-12', 10, 378 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_1 AND id_rdo = @rdo_2 AND origem_custo = 'Maquinário' AND id_origem = @maquina_2 AND data = '2026-03-12');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-04-13', 'Manhã', 'Nublado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-04-13' AND turno = 'Manhã');

SET @rdo_3 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-04-13' AND turno = 'Manhã');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_1, @rdo_3, 'Equipe', @equipe_0, '2026-04-13', 10, 957.6 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_1 AND id_rdo = @rdo_3 AND origem_custo = 'Equipe' AND id_origem = @equipe_0 AND data = '2026-04-13');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_1, @rdo_3, 'Insumo', @insumo_3, '2026-04-13', 100, 118.44 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_1 AND id_rdo = @rdo_3 AND origem_custo = 'Insumo' AND id_origem = @insumo_3 AND data = '2026-04-13');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_1, @rdo_3, 'Maquinário', @maquina_0, '2026-04-13', 10, 378 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_1 AND id_rdo = @rdo_3 AND origem_custo = 'Maquinário' AND id_origem = @maquina_0 AND data = '2026-04-13');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-05-14', 'Integral', 'Ensolarado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-05-14' AND turno = 'Integral');

SET @rdo_4 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-05-14' AND turno = 'Integral');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_2, @rdo_4, 'Equipe', @equipe_1, '2026-05-14', 10, 957.6 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_2 AND id_rdo = @rdo_4 AND origem_custo = 'Equipe' AND id_origem = @equipe_1 AND data = '2026-05-14');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_2, @rdo_4, 'Insumo', @insumo_4, '2026-05-14', 100, 118.44 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_2 AND id_rdo = @rdo_4 AND origem_custo = 'Insumo' AND id_origem = @insumo_4 AND data = '2026-05-14');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_2, @rdo_4, 'Maquinário', @maquina_1, '2026-05-14', 10, 378 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_2 AND id_rdo = @rdo_4 AND origem_custo = 'Maquinário' AND id_origem = @maquina_1 AND data = '2026-05-14');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-06-15', 'Manhã', 'Ensolarado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-06-15' AND turno = 'Manhã');

SET @rdo_5 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-06-15' AND turno = 'Manhã');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_3, @rdo_5, 'Equipe', @equipe_2, '2026-06-15', 10, 957.6 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_3 AND id_rdo = @rdo_5 AND origem_custo = 'Equipe' AND id_origem = @equipe_2 AND data = '2026-06-15');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_3, @rdo_5, 'Insumo', @insumo_0, '2026-06-15', 100, 118.44 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_3 AND id_rdo = @rdo_5 AND origem_custo = 'Insumo' AND id_origem = @insumo_0 AND data = '2026-06-15');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_3, @rdo_5, 'Maquinário', @maquina_2, '2026-06-15', 10, 378 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_3 AND id_rdo = @rdo_5 AND origem_custo = 'Maquinário' AND id_origem = @maquina_2 AND data = '2026-06-15');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-07-16', 'Integral', 'Nublado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-07-16' AND turno = 'Integral');

SET @rdo_6 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-07-16' AND turno = 'Integral');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_3, @rdo_6, 'Equipe', @equipe_0, '2026-07-16', 10, 957.6 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_3 AND id_rdo = @rdo_6 AND origem_custo = 'Equipe' AND id_origem = @equipe_0 AND data = '2026-07-16');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_3, @rdo_6, 'Insumo', @insumo_1, '2026-07-16', 100, 118.44 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_3 AND id_rdo = @rdo_6 AND origem_custo = 'Insumo' AND id_origem = @insumo_1 AND data = '2026-07-16');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_3, @rdo_6, 'Maquinário', @maquina_0, '2026-07-16', 10, 378 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_3 AND id_rdo = @rdo_6 AND origem_custo = 'Maquinário' AND id_origem = @maquina_0 AND data = '2026-07-16');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-08-17', 'Manhã', 'Ensolarado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-08-17' AND turno = 'Manhã');

SET @rdo_7 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-08-17' AND turno = 'Manhã');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_4, @rdo_7, 'Equipe', @equipe_1, '2026-08-17', 10, 957.6 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_4 AND id_rdo = @rdo_7 AND origem_custo = 'Equipe' AND id_origem = @equipe_1 AND data = '2026-08-17');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_4, @rdo_7, 'Insumo', @insumo_2, '2026-08-17', 100, 118.44 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_4 AND id_rdo = @rdo_7 AND origem_custo = 'Insumo' AND id_origem = @insumo_2 AND data = '2026-08-17');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_4, @rdo_7, 'Maquinário', @maquina_1, '2026-08-17', 10, 378 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_4 AND id_rdo = @rdo_7 AND origem_custo = 'Maquinário' AND id_origem = @maquina_1 AND data = '2026-08-17');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-09-18', 'Integral', 'Ensolarado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-09-18' AND turno = 'Integral');

SET @rdo_8 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-09-18' AND turno = 'Integral');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_4, @rdo_8, 'Equipe', @equipe_2, '2026-09-18', 10, 957.6 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_4 AND id_rdo = @rdo_8 AND origem_custo = 'Equipe' AND id_origem = @equipe_2 AND data = '2026-09-18');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_4, @rdo_8, 'Insumo', @insumo_3, '2026-09-18', 100, 118.44 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_4 AND id_rdo = @rdo_8 AND origem_custo = 'Insumo' AND id_origem = @insumo_3 AND data = '2026-09-18');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_4, @rdo_8, 'Maquinário', @maquina_2, '2026-09-18', 10, 378 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_4 AND id_rdo = @rdo_8 AND origem_custo = 'Maquinário' AND id_origem = @maquina_2 AND data = '2026-09-18');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-10-02', 'Manhã', 'Nublado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-10-02' AND turno = 'Manhã');

SET @rdo_9 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-10-02' AND turno = 'Manhã');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_5, @rdo_9, 'Equipe', @equipe_0, '2026-10-02', 10, 957.6 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_5 AND id_rdo = @rdo_9 AND origem_custo = 'Equipe' AND id_origem = @equipe_0 AND data = '2026-10-02');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_5, @rdo_9, 'Insumo', @insumo_4, '2026-10-02', 100, 118.44 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_5 AND id_rdo = @rdo_9 AND origem_custo = 'Insumo' AND id_origem = @insumo_4 AND data = '2026-10-02');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_5, @rdo_9, 'Maquinário', @maquina_0, '2026-10-02', 10, 378 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_5 AND id_rdo = @rdo_9 AND origem_custo = 'Maquinário' AND id_origem = @maquina_0 AND data = '2026-10-02');

-- OBRA 2: Vértice Teste - Centro Empresarial. Planejado 500000, realizado aproximado 495000.
INSERT INTO valen.obra (nome, status, id_construtora, categoria, numero_pavimentos, data_inicio_planejada, data_termino_planejada, orcamento_planejado)
SELECT 'Vértice Teste - Centro Empresarial', 'Em Andamento', 1, 'Comercial', 8, '2026-02-01', '2026-12-31', 500000 FROM DUAL
WHERE @seed_pronto AND NOT EXISTS (SELECT 1 FROM valen.obra WHERE nome = 'Vértice Teste - Centro Empresarial' AND id_construtora = @seed_construtora);

SET @obra = (SELECT MIN(id_obra) FROM valen.obra WHERE nome = 'Vértice Teste - Centro Empresarial' AND id_construtora = @seed_construtora);
INSERT INTO valen.cadastro_de_insumos (nome, quantidade_disponivel, valor_unitario, idobra)
SELECT 'Cimento CP II', 300, 29, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Cimento CP II');

SET @insumo_0 = (SELECT MIN(id_insumos) FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Cimento CP II');
INSERT INTO valen.cadastro_de_insumos (nome, quantidade_disponivel, valor_unitario, idobra)
SELECT 'Areia média', 390, 41, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Areia média');

SET @insumo_1 = (SELECT MIN(id_insumos) FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Areia média');
INSERT INTO valen.cadastro_de_insumos (nome, quantidade_disponivel, valor_unitario, idobra)
SELECT 'Brita 1', 480, 53, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Brita 1');

SET @insumo_2 = (SELECT MIN(id_insumos) FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Brita 1');
INSERT INTO valen.cadastro_de_insumos (nome, quantidade_disponivel, valor_unitario, idobra)
SELECT 'Bloco cerâmico', 570, 65, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Bloco cerâmico');

SET @insumo_3 = (SELECT MIN(id_insumos) FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Bloco cerâmico');
INSERT INTO valen.cadastro_de_insumos (nome, quantidade_disponivel, valor_unitario, idobra)
SELECT 'Vergalhão CA50', 660, 77, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Vergalhão CA50');

SET @insumo_4 = (SELECT MIN(id_insumos) FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Vergalhão CA50');
INSERT INTO valen.cadastro_de_equipes (nome_equipe, etapa_atuacao, quantidade_profissionais, custo_diario, custo_mensal, idobra)
SELECT 'Equipe de Fundação', 'Infraestrutura', 5, 1075, 23650, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_equipes WHERE idobra = @obra AND nome_equipe = 'Equipe de Fundação');

SET @equipe_0 = (SELECT MIN(id_cadastro_equipes) FROM valen.cadastro_de_equipes WHERE idobra = @obra AND nome_equipe = 'Equipe de Fundação');
INSERT INTO valen.cadastro_de_equipes (nome_equipe, etapa_atuacao, quantidade_profissionais, custo_diario, custo_mensal, idobra)
SELECT 'Equipe Estrutural', 'Supraestrutura e Alvenaria', 7, 1315, 28930, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_equipes WHERE idobra = @obra AND nome_equipe = 'Equipe Estrutural');

SET @equipe_1 = (SELECT MIN(id_cadastro_equipes) FROM valen.cadastro_de_equipes WHERE idobra = @obra AND nome_equipe = 'Equipe Estrutural');
INSERT INTO valen.cadastro_de_equipes (nome_equipe, etapa_atuacao, quantidade_profissionais, custo_diario, custo_mensal, idobra)
SELECT 'Equipe de Acabamentos', 'Acabamentos', 9, 1555, 34210, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_equipes WHERE idobra = @obra AND nome_equipe = 'Equipe de Acabamentos');

SET @equipe_2 = (SELECT MIN(id_cadastro_equipes) FROM valen.cadastro_de_equipes WHERE idobra = @obra AND nome_equipe = 'Equipe de Acabamentos');
INSERT INTO valen.cadastro_de_maquinario (nome, quantidade, etapa_atuacao, custo_diario, status, idobra)
SELECT 'Betoneira 400L', 2, 'Infraestrutura', 245, 'Ativo', @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_maquinario WHERE idobra = @obra AND nome = 'Betoneira 400L');

SET @maquina_0 = (SELECT MIN(id_maquina) FROM valen.cadastro_de_maquinario WHERE idobra = @obra AND nome = 'Betoneira 400L');
INSERT INTO valen.cadastro_de_maquinario (nome, quantidade, etapa_atuacao, custo_diario, status, idobra)
SELECT 'Retroescavadeira', 3, 'Mobilização', 425, 'Ativo', @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_maquinario WHERE idobra = @obra AND nome = 'Retroescavadeira');

SET @maquina_1 = (SELECT MIN(id_maquina) FROM valen.cadastro_de_maquinario WHERE idobra = @obra AND nome = 'Retroescavadeira');
INSERT INTO valen.cadastro_de_maquinario (nome, quantidade, etapa_atuacao, custo_diario, status, idobra)
SELECT 'Plataforma elevatória', 1, 'Acabamentos', 605, 'Inativo', @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_maquinario WHERE idobra = @obra AND nome = 'Plataforma elevatória');

SET @maquina_2 = (SELECT MIN(id_maquina) FROM valen.cadastro_de_maquinario WHERE idobra = @obra AND nome = 'Plataforma elevatória');
INSERT INTO valen.etapa (id_obra, nome_etapa, descricao)
SELECT @obra, 'Mobilização', 'Etapa de teste Analytics - Mobilização' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Mobilização');

SET @etapa_0 = (SELECT MIN(id_etapa) FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Mobilização');
INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Mobilização', 'Equipe', 9500, '2026-02-01', '2026-03-27' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Mobilização' AND origem_custo = 'Equipe' AND data_inicio_prevista = '2026-02-01' AND data_fim_prevista = '2026-03-27');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Mobilização', 'Insumo', 11750, '2026-02-01', '2026-03-27' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Mobilização' AND origem_custo = 'Insumo' AND data_inicio_prevista = '2026-02-01' AND data_fim_prevista = '2026-03-27');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Mobilização', 'Maquinário', 3750, '2026-02-01', '2026-03-27' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Mobilização' AND origem_custo = 'Maquinário' AND data_inicio_prevista = '2026-02-01' AND data_fim_prevista = '2026-03-27');

INSERT INTO valen.etapa (id_obra, nome_etapa, descricao)
SELECT @obra, 'Infraestrutura', 'Etapa de teste Analytics - Infraestrutura' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Infraestrutura');

SET @etapa_1 = (SELECT MIN(id_etapa) FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Infraestrutura');
INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Infraestrutura', 'Equipe', 38000, '2026-03-28', '2026-05-22' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Infraestrutura' AND origem_custo = 'Equipe' AND data_inicio_prevista = '2026-03-28' AND data_fim_prevista = '2026-05-22');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Infraestrutura', 'Insumo', 47000, '2026-03-28', '2026-05-22' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Infraestrutura' AND origem_custo = 'Insumo' AND data_inicio_prevista = '2026-03-28' AND data_fim_prevista = '2026-05-22');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Infraestrutura', 'Maquinário', 15000, '2026-03-28', '2026-05-22' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Infraestrutura' AND origem_custo = 'Maquinário' AND data_inicio_prevista = '2026-03-28' AND data_fim_prevista = '2026-05-22');

INSERT INTO valen.etapa (id_obra, nome_etapa, descricao)
SELECT @obra, 'Supraestrutura e Alvenaria', 'Etapa de teste Analytics - Supraestrutura e Alvenaria' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Supraestrutura e Alvenaria');

SET @etapa_2 = (SELECT MIN(id_etapa) FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Supraestrutura e Alvenaria');
INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Supraestrutura e Alvenaria', 'Equipe', 57000, '2026-05-23', '2026-07-17' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Supraestrutura e Alvenaria' AND origem_custo = 'Equipe' AND data_inicio_prevista = '2026-05-23' AND data_fim_prevista = '2026-07-17');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Supraestrutura e Alvenaria', 'Insumo', 70500, '2026-05-23', '2026-07-17' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Supraestrutura e Alvenaria' AND origem_custo = 'Insumo' AND data_inicio_prevista = '2026-05-23' AND data_fim_prevista = '2026-07-17');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Supraestrutura e Alvenaria', 'Maquinário', 22500, '2026-05-23', '2026-07-17' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Supraestrutura e Alvenaria' AND origem_custo = 'Maquinário' AND data_inicio_prevista = '2026-05-23' AND data_fim_prevista = '2026-07-17');

INSERT INTO valen.etapa (id_obra, nome_etapa, descricao)
SELECT @obra, 'Instalações', 'Etapa de teste Analytics - Instalações' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Instalações');

SET @etapa_3 = (SELECT MIN(id_etapa) FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Instalações');
INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Instalações', 'Equipe', 38000, '2026-07-18', '2026-09-10' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Instalações' AND origem_custo = 'Equipe' AND data_inicio_prevista = '2026-07-18' AND data_fim_prevista = '2026-09-10');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Instalações', 'Insumo', 47000, '2026-07-18', '2026-09-10' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Instalações' AND origem_custo = 'Insumo' AND data_inicio_prevista = '2026-07-18' AND data_fim_prevista = '2026-09-10');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Instalações', 'Maquinário', 15000, '2026-07-18', '2026-09-10' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Instalações' AND origem_custo = 'Maquinário' AND data_inicio_prevista = '2026-07-18' AND data_fim_prevista = '2026-09-10');

INSERT INTO valen.etapa (id_obra, nome_etapa, descricao)
SELECT @obra, 'Revestimentos', 'Etapa de teste Analytics - Revestimentos' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Revestimentos');

SET @etapa_4 = (SELECT MIN(id_etapa) FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Revestimentos');
INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Revestimentos', 'Equipe', 28500, '2026-09-11', '2026-11-05' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Revestimentos' AND origem_custo = 'Equipe' AND data_inicio_prevista = '2026-09-11' AND data_fim_prevista = '2026-11-05');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Revestimentos', 'Insumo', 35250, '2026-09-11', '2026-11-05' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Revestimentos' AND origem_custo = 'Insumo' AND data_inicio_prevista = '2026-09-11' AND data_fim_prevista = '2026-11-05');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Revestimentos', 'Maquinário', 11250, '2026-09-11', '2026-11-05' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Revestimentos' AND origem_custo = 'Maquinário' AND data_inicio_prevista = '2026-09-11' AND data_fim_prevista = '2026-11-05');

INSERT INTO valen.etapa (id_obra, nome_etapa, descricao)
SELECT @obra, 'Acabamento', 'Etapa de teste Analytics - Acabamento' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Acabamento');

SET @etapa_5 = (SELECT MIN(id_etapa) FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Acabamento');
INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Acabamento', 'Equipe', 19000, '2026-11-06', '2026-12-31' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Acabamento' AND origem_custo = 'Equipe' AND data_inicio_prevista = '2026-11-06' AND data_fim_prevista = '2026-12-31');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Acabamento', 'Insumo', 23500, '2026-11-06', '2026-12-31' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Acabamento' AND origem_custo = 'Insumo' AND data_inicio_prevista = '2026-11-06' AND data_fim_prevista = '2026-12-31');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Acabamento', 'Maquinário', 7500, '2026-11-06', '2026-12-31' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Acabamento' AND origem_custo = 'Maquinário' AND data_inicio_prevista = '2026-11-06' AND data_fim_prevista = '2026-12-31');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-02-11', 'Integral', 'Nublado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-02-11' AND turno = 'Integral');

SET @rdo_0 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-02-11' AND turno = 'Integral');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_0, @rdo_0, 'Equipe', @equipe_0, '2026-02-11', 10, 2090 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_0 AND id_rdo = @rdo_0 AND origem_custo = 'Equipe' AND id_origem = @equipe_0 AND data = '2026-02-11');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_0, @rdo_0, 'Insumo', @insumo_0, '2026-02-11', 100, 258.5 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_0 AND id_rdo = @rdo_0 AND origem_custo = 'Insumo' AND id_origem = @insumo_0 AND data = '2026-02-11');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_0, @rdo_0, 'Maquinário', @maquina_0, '2026-02-11', 10, 825 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_0 AND id_rdo = @rdo_0 AND origem_custo = 'Maquinário' AND id_origem = @maquina_0 AND data = '2026-02-11');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-03-12', 'Manhã', 'Ensolarado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-03-12' AND turno = 'Manhã');

SET @rdo_1 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-03-12' AND turno = 'Manhã');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_0, @rdo_1, 'Equipe', @equipe_1, '2026-03-12', 10, 2090 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_0 AND id_rdo = @rdo_1 AND origem_custo = 'Equipe' AND id_origem = @equipe_1 AND data = '2026-03-12');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_0, @rdo_1, 'Insumo', @insumo_1, '2026-03-12', 100, 258.5 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_0 AND id_rdo = @rdo_1 AND origem_custo = 'Insumo' AND id_origem = @insumo_1 AND data = '2026-03-12');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_0, @rdo_1, 'Maquinário', @maquina_1, '2026-03-12', 10, 825 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_0 AND id_rdo = @rdo_1 AND origem_custo = 'Maquinário' AND id_origem = @maquina_1 AND data = '2026-03-12');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-04-13', 'Integral', 'Ensolarado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-04-13' AND turno = 'Integral');

SET @rdo_2 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-04-13' AND turno = 'Integral');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_1, @rdo_2, 'Equipe', @equipe_2, '2026-04-13', 10, 2090 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_1 AND id_rdo = @rdo_2 AND origem_custo = 'Equipe' AND id_origem = @equipe_2 AND data = '2026-04-13');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_1, @rdo_2, 'Insumo', @insumo_2, '2026-04-13', 100, 258.5 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_1 AND id_rdo = @rdo_2 AND origem_custo = 'Insumo' AND id_origem = @insumo_2 AND data = '2026-04-13');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_1, @rdo_2, 'Maquinário', @maquina_2, '2026-04-13', 10, 825 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_1 AND id_rdo = @rdo_2 AND origem_custo = 'Maquinário' AND id_origem = @maquina_2 AND data = '2026-04-13');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-05-14', 'Manhã', 'Nublado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-05-14' AND turno = 'Manhã');

SET @rdo_3 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-05-14' AND turno = 'Manhã');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_2, @rdo_3, 'Equipe', @equipe_0, '2026-05-14', 10, 2090 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_2 AND id_rdo = @rdo_3 AND origem_custo = 'Equipe' AND id_origem = @equipe_0 AND data = '2026-05-14');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_2, @rdo_3, 'Insumo', @insumo_3, '2026-05-14', 100, 258.5 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_2 AND id_rdo = @rdo_3 AND origem_custo = 'Insumo' AND id_origem = @insumo_3 AND data = '2026-05-14');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_2, @rdo_3, 'Maquinário', @maquina_0, '2026-05-14', 10, 825 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_2 AND id_rdo = @rdo_3 AND origem_custo = 'Maquinário' AND id_origem = @maquina_0 AND data = '2026-05-14');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-06-15', 'Integral', 'Ensolarado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-06-15' AND turno = 'Integral');

SET @rdo_4 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-06-15' AND turno = 'Integral');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_2, @rdo_4, 'Equipe', @equipe_1, '2026-06-15', 10, 2090 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_2 AND id_rdo = @rdo_4 AND origem_custo = 'Equipe' AND id_origem = @equipe_1 AND data = '2026-06-15');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_2, @rdo_4, 'Insumo', @insumo_4, '2026-06-15', 100, 258.5 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_2 AND id_rdo = @rdo_4 AND origem_custo = 'Insumo' AND id_origem = @insumo_4 AND data = '2026-06-15');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_2, @rdo_4, 'Maquinário', @maquina_1, '2026-06-15', 10, 825 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_2 AND id_rdo = @rdo_4 AND origem_custo = 'Maquinário' AND id_origem = @maquina_1 AND data = '2026-06-15');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-07-16', 'Manhã', 'Ensolarado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-07-16' AND turno = 'Manhã');

SET @rdo_5 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-07-16' AND turno = 'Manhã');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_3, @rdo_5, 'Equipe', @equipe_2, '2026-07-16', 10, 2090 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_3 AND id_rdo = @rdo_5 AND origem_custo = 'Equipe' AND id_origem = @equipe_2 AND data = '2026-07-16');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_3, @rdo_5, 'Insumo', @insumo_0, '2026-07-16', 100, 258.5 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_3 AND id_rdo = @rdo_5 AND origem_custo = 'Insumo' AND id_origem = @insumo_0 AND data = '2026-07-16');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_3, @rdo_5, 'Maquinário', @maquina_2, '2026-07-16', 10, 825 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_3 AND id_rdo = @rdo_5 AND origem_custo = 'Maquinário' AND id_origem = @maquina_2 AND data = '2026-07-16');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-08-17', 'Integral', 'Nublado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-08-17' AND turno = 'Integral');

SET @rdo_6 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-08-17' AND turno = 'Integral');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_4, @rdo_6, 'Equipe', @equipe_0, '2026-08-17', 10, 2090 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_4 AND id_rdo = @rdo_6 AND origem_custo = 'Equipe' AND id_origem = @equipe_0 AND data = '2026-08-17');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_4, @rdo_6, 'Insumo', @insumo_1, '2026-08-17', 100, 258.5 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_4 AND id_rdo = @rdo_6 AND origem_custo = 'Insumo' AND id_origem = @insumo_1 AND data = '2026-08-17');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_4, @rdo_6, 'Maquinário', @maquina_0, '2026-08-17', 10, 825 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_4 AND id_rdo = @rdo_6 AND origem_custo = 'Maquinário' AND id_origem = @maquina_0 AND data = '2026-08-17');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-09-18', 'Manhã', 'Ensolarado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-09-18' AND turno = 'Manhã');

SET @rdo_7 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-09-18' AND turno = 'Manhã');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_4, @rdo_7, 'Equipe', @equipe_1, '2026-09-18', 10, 2090 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_4 AND id_rdo = @rdo_7 AND origem_custo = 'Equipe' AND id_origem = @equipe_1 AND data = '2026-09-18');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_4, @rdo_7, 'Insumo', @insumo_2, '2026-09-18', 100, 258.5 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_4 AND id_rdo = @rdo_7 AND origem_custo = 'Insumo' AND id_origem = @insumo_2 AND data = '2026-09-18');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_4, @rdo_7, 'Maquinário', @maquina_1, '2026-09-18', 10, 825 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_4 AND id_rdo = @rdo_7 AND origem_custo = 'Maquinário' AND id_origem = @maquina_1 AND data = '2026-09-18');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-10-02', 'Integral', 'Ensolarado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-10-02' AND turno = 'Integral');

SET @rdo_8 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-10-02' AND turno = 'Integral');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_5, @rdo_8, 'Equipe', @equipe_2, '2026-10-02', 10, 2090 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_5 AND id_rdo = @rdo_8 AND origem_custo = 'Equipe' AND id_origem = @equipe_2 AND data = '2026-10-02');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_5, @rdo_8, 'Insumo', @insumo_3, '2026-10-02', 100, 258.5 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_5 AND id_rdo = @rdo_8 AND origem_custo = 'Insumo' AND id_origem = @insumo_3 AND data = '2026-10-02');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_5, @rdo_8, 'Maquinário', @maquina_2, '2026-10-02', 10, 825 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_5 AND id_rdo = @rdo_8 AND origem_custo = 'Maquinário' AND id_origem = @maquina_2 AND data = '2026-10-02');

-- OBRA 3: Vértice Teste - Galpão Industrial. Planejado 720000, realizado aproximado 849600.
INSERT INTO valen.obra (nome, status, id_construtora, categoria, numero_pavimentos, data_inicio_planejada, data_termino_planejada, orcamento_planejado)
SELECT 'Vértice Teste - Galpão Industrial', 'Em Andamento', 1, 'Industrial', 2, '2026-03-01', '2026-11-30', 720000 FROM DUAL
WHERE @seed_pronto AND NOT EXISTS (SELECT 1 FROM valen.obra WHERE nome = 'Vértice Teste - Galpão Industrial' AND id_construtora = @seed_construtora);

SET @obra = (SELECT MIN(id_obra) FROM valen.obra WHERE nome = 'Vértice Teste - Galpão Industrial' AND id_construtora = @seed_construtora);
INSERT INTO valen.cadastro_de_insumos (nome, quantidade_disponivel, valor_unitario, idobra)
SELECT 'Cimento CP II', 375, 36, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Cimento CP II');

SET @insumo_0 = (SELECT MIN(id_insumos) FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Cimento CP II');
INSERT INTO valen.cadastro_de_insumos (nome, quantidade_disponivel, valor_unitario, idobra)
SELECT 'Areia média', 465, 48, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Areia média');

SET @insumo_1 = (SELECT MIN(id_insumos) FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Areia média');
INSERT INTO valen.cadastro_de_insumos (nome, quantidade_disponivel, valor_unitario, idobra)
SELECT 'Brita 1', 555, 60, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Brita 1');

SET @insumo_2 = (SELECT MIN(id_insumos) FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Brita 1');
INSERT INTO valen.cadastro_de_insumos (nome, quantidade_disponivel, valor_unitario, idobra)
SELECT 'Bloco cerâmico', 645, 72, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Bloco cerâmico');

SET @insumo_3 = (SELECT MIN(id_insumos) FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Bloco cerâmico');
INSERT INTO valen.cadastro_de_insumos (nome, quantidade_disponivel, valor_unitario, idobra)
SELECT 'Vergalhão CA50', 735, 84, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Vergalhão CA50');

SET @insumo_4 = (SELECT MIN(id_insumos) FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Vergalhão CA50');
INSERT INTO valen.cadastro_de_equipes (nome_equipe, etapa_atuacao, quantidade_profissionais, custo_diario, custo_mensal, idobra)
SELECT 'Equipe de Fundação', 'Infraestrutura', 6, 1250, 27500, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_equipes WHERE idobra = @obra AND nome_equipe = 'Equipe de Fundação');

SET @equipe_0 = (SELECT MIN(id_cadastro_equipes) FROM valen.cadastro_de_equipes WHERE idobra = @obra AND nome_equipe = 'Equipe de Fundação');
INSERT INTO valen.cadastro_de_equipes (nome_equipe, etapa_atuacao, quantidade_profissionais, custo_diario, custo_mensal, idobra)
SELECT 'Equipe Estrutural', 'Supraestrutura e Alvenaria', 8, 1490, 32780, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_equipes WHERE idobra = @obra AND nome_equipe = 'Equipe Estrutural');

SET @equipe_1 = (SELECT MIN(id_cadastro_equipes) FROM valen.cadastro_de_equipes WHERE idobra = @obra AND nome_equipe = 'Equipe Estrutural');
INSERT INTO valen.cadastro_de_equipes (nome_equipe, etapa_atuacao, quantidade_profissionais, custo_diario, custo_mensal, idobra)
SELECT 'Equipe de Acabamentos', 'Acabamentos', 10, 1730, 38060, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_equipes WHERE idobra = @obra AND nome_equipe = 'Equipe de Acabamentos');

SET @equipe_2 = (SELECT MIN(id_cadastro_equipes) FROM valen.cadastro_de_equipes WHERE idobra = @obra AND nome_equipe = 'Equipe de Acabamentos');
INSERT INTO valen.cadastro_de_maquinario (nome, quantidade, etapa_atuacao, custo_diario, status, idobra)
SELECT 'Betoneira 400L', 3, 'Infraestrutura', 310, 'Ativo', @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_maquinario WHERE idobra = @obra AND nome = 'Betoneira 400L');

SET @maquina_0 = (SELECT MIN(id_maquina) FROM valen.cadastro_de_maquinario WHERE idobra = @obra AND nome = 'Betoneira 400L');
INSERT INTO valen.cadastro_de_maquinario (nome, quantidade, etapa_atuacao, custo_diario, status, idobra)
SELECT 'Retroescavadeira', 1, 'Mobilização', 490, 'Ativo', @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_maquinario WHERE idobra = @obra AND nome = 'Retroescavadeira');

SET @maquina_1 = (SELECT MIN(id_maquina) FROM valen.cadastro_de_maquinario WHERE idobra = @obra AND nome = 'Retroescavadeira');
INSERT INTO valen.cadastro_de_maquinario (nome, quantidade, etapa_atuacao, custo_diario, status, idobra)
SELECT 'Plataforma elevatória', 2, 'Acabamentos', 670, 'Ativo', @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_maquinario WHERE idobra = @obra AND nome = 'Plataforma elevatória');

SET @maquina_2 = (SELECT MIN(id_maquina) FROM valen.cadastro_de_maquinario WHERE idobra = @obra AND nome = 'Plataforma elevatória');
INSERT INTO valen.etapa (id_obra, nome_etapa, descricao)
SELECT @obra, 'Mobilização', 'Etapa de teste Analytics - Mobilização' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Mobilização');

SET @etapa_0 = (SELECT MIN(id_etapa) FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Mobilização');
INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Mobilização', 'Equipe', 13680, '2026-03-01', '2026-04-14' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Mobilização' AND origem_custo = 'Equipe' AND data_inicio_prevista = '2026-03-01' AND data_fim_prevista = '2026-04-14');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Mobilização', 'Insumo', 16920, '2026-03-01', '2026-04-14' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Mobilização' AND origem_custo = 'Insumo' AND data_inicio_prevista = '2026-03-01' AND data_fim_prevista = '2026-04-14');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Mobilização', 'Maquinário', 5400, '2026-03-01', '2026-04-14' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Mobilização' AND origem_custo = 'Maquinário' AND data_inicio_prevista = '2026-03-01' AND data_fim_prevista = '2026-04-14');

INSERT INTO valen.etapa (id_obra, nome_etapa, descricao)
SELECT @obra, 'Infraestrutura', 'Etapa de teste Analytics - Infraestrutura' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Infraestrutura');

SET @etapa_1 = (SELECT MIN(id_etapa) FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Infraestrutura');
INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Infraestrutura', 'Equipe', 54720, '2026-04-15', '2026-05-30' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Infraestrutura' AND origem_custo = 'Equipe' AND data_inicio_prevista = '2026-04-15' AND data_fim_prevista = '2026-05-30');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Infraestrutura', 'Insumo', 67680, '2026-04-15', '2026-05-30' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Infraestrutura' AND origem_custo = 'Insumo' AND data_inicio_prevista = '2026-04-15' AND data_fim_prevista = '2026-05-30');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Infraestrutura', 'Maquinário', 21600, '2026-04-15', '2026-05-30' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Infraestrutura' AND origem_custo = 'Maquinário' AND data_inicio_prevista = '2026-04-15' AND data_fim_prevista = '2026-05-30');

INSERT INTO valen.etapa (id_obra, nome_etapa, descricao)
SELECT @obra, 'Supraestrutura e Alvenaria', 'Etapa de teste Analytics - Supraestrutura e Alvenaria' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Supraestrutura e Alvenaria');

SET @etapa_2 = (SELECT MIN(id_etapa) FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Supraestrutura e Alvenaria');
INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Supraestrutura e Alvenaria', 'Equipe', 82080, '2026-05-31', '2026-07-15' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Supraestrutura e Alvenaria' AND origem_custo = 'Equipe' AND data_inicio_prevista = '2026-05-31' AND data_fim_prevista = '2026-07-15');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Supraestrutura e Alvenaria', 'Insumo', 101520, '2026-05-31', '2026-07-15' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Supraestrutura e Alvenaria' AND origem_custo = 'Insumo' AND data_inicio_prevista = '2026-05-31' AND data_fim_prevista = '2026-07-15');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Supraestrutura e Alvenaria', 'Maquinário', 32400, '2026-05-31', '2026-07-15' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Supraestrutura e Alvenaria' AND origem_custo = 'Maquinário' AND data_inicio_prevista = '2026-05-31' AND data_fim_prevista = '2026-07-15');

INSERT INTO valen.etapa (id_obra, nome_etapa, descricao)
SELECT @obra, 'Instalações', 'Etapa de teste Analytics - Instalações' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Instalações');

SET @etapa_3 = (SELECT MIN(id_etapa) FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Instalações');
INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Instalações', 'Equipe', 54720, '2026-07-16', '2026-08-30' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Instalações' AND origem_custo = 'Equipe' AND data_inicio_prevista = '2026-07-16' AND data_fim_prevista = '2026-08-30');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Instalações', 'Insumo', 67680, '2026-07-16', '2026-08-30' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Instalações' AND origem_custo = 'Insumo' AND data_inicio_prevista = '2026-07-16' AND data_fim_prevista = '2026-08-30');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Instalações', 'Maquinário', 21600, '2026-07-16', '2026-08-30' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Instalações' AND origem_custo = 'Maquinário' AND data_inicio_prevista = '2026-07-16' AND data_fim_prevista = '2026-08-30');

INSERT INTO valen.etapa (id_obra, nome_etapa, descricao)
SELECT @obra, 'Revestimentos', 'Etapa de teste Analytics - Revestimentos' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Revestimentos');

SET @etapa_4 = (SELECT MIN(id_etapa) FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Revestimentos');
INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Revestimentos', 'Equipe', 41040, '2026-08-31', '2026-10-15' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Revestimentos' AND origem_custo = 'Equipe' AND data_inicio_prevista = '2026-08-31' AND data_fim_prevista = '2026-10-15');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Revestimentos', 'Insumo', 50760, '2026-08-31', '2026-10-15' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Revestimentos' AND origem_custo = 'Insumo' AND data_inicio_prevista = '2026-08-31' AND data_fim_prevista = '2026-10-15');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Revestimentos', 'Maquinário', 16200, '2026-08-31', '2026-10-15' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Revestimentos' AND origem_custo = 'Maquinário' AND data_inicio_prevista = '2026-08-31' AND data_fim_prevista = '2026-10-15');

INSERT INTO valen.etapa (id_obra, nome_etapa, descricao)
SELECT @obra, 'Acabamento', 'Etapa de teste Analytics - Acabamento' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Acabamento');

SET @etapa_5 = (SELECT MIN(id_etapa) FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Acabamento');
INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Acabamento', 'Equipe', 27360, '2026-10-16', '2026-11-30' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Acabamento' AND origem_custo = 'Equipe' AND data_inicio_prevista = '2026-10-16' AND data_fim_prevista = '2026-11-30');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Acabamento', 'Insumo', 33840, '2026-10-16', '2026-11-30' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Acabamento' AND origem_custo = 'Insumo' AND data_inicio_prevista = '2026-10-16' AND data_fim_prevista = '2026-11-30');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Acabamento', 'Maquinário', 10800, '2026-10-16', '2026-11-30' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Acabamento' AND origem_custo = 'Maquinário' AND data_inicio_prevista = '2026-10-16' AND data_fim_prevista = '2026-11-30');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-03-12', 'Integral', 'Nublado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-03-12' AND turno = 'Integral');

SET @rdo_0 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-03-12' AND turno = 'Integral');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_0, @rdo_0, 'Equipe', @equipe_0, '2026-03-12', 10, 4035.6 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_0 AND id_rdo = @rdo_0 AND origem_custo = 'Equipe' AND id_origem = @equipe_0 AND data = '2026-03-12');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_0, @rdo_0, 'Insumo', @insumo_0, '2026-03-12', 100, 499.14 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_0 AND id_rdo = @rdo_0 AND origem_custo = 'Insumo' AND id_origem = @insumo_0 AND data = '2026-03-12');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_0, @rdo_0, 'Maquinário', @maquina_0, '2026-03-12', 10, 1593 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_0 AND id_rdo = @rdo_0 AND origem_custo = 'Maquinário' AND id_origem = @maquina_0 AND data = '2026-03-12');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-04-13', 'Manhã', 'Ensolarado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-04-13' AND turno = 'Manhã');

SET @rdo_1 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-04-13' AND turno = 'Manhã');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_0, @rdo_1, 'Equipe', @equipe_1, '2026-04-13', 10, 4035.6 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_0 AND id_rdo = @rdo_1 AND origem_custo = 'Equipe' AND id_origem = @equipe_1 AND data = '2026-04-13');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_0, @rdo_1, 'Insumo', @insumo_1, '2026-04-13', 100, 499.14 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_0 AND id_rdo = @rdo_1 AND origem_custo = 'Insumo' AND id_origem = @insumo_1 AND data = '2026-04-13');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_0, @rdo_1, 'Maquinário', @maquina_1, '2026-04-13', 10, 1593 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_0 AND id_rdo = @rdo_1 AND origem_custo = 'Maquinário' AND id_origem = @maquina_1 AND data = '2026-04-13');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-05-14', 'Integral', 'Ensolarado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-05-14' AND turno = 'Integral');

SET @rdo_2 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-05-14' AND turno = 'Integral');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_1, @rdo_2, 'Equipe', @equipe_2, '2026-05-14', 10, 4035.6 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_1 AND id_rdo = @rdo_2 AND origem_custo = 'Equipe' AND id_origem = @equipe_2 AND data = '2026-05-14');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_1, @rdo_2, 'Insumo', @insumo_2, '2026-05-14', 100, 499.14 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_1 AND id_rdo = @rdo_2 AND origem_custo = 'Insumo' AND id_origem = @insumo_2 AND data = '2026-05-14');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_1, @rdo_2, 'Maquinário', @maquina_2, '2026-05-14', 10, 1593 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_1 AND id_rdo = @rdo_2 AND origem_custo = 'Maquinário' AND id_origem = @maquina_2 AND data = '2026-05-14');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-06-15', 'Manhã', 'Nublado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-06-15' AND turno = 'Manhã');

SET @rdo_3 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-06-15' AND turno = 'Manhã');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_2, @rdo_3, 'Equipe', @equipe_0, '2026-06-15', 10, 4035.6 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_2 AND id_rdo = @rdo_3 AND origem_custo = 'Equipe' AND id_origem = @equipe_0 AND data = '2026-06-15');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_2, @rdo_3, 'Insumo', @insumo_3, '2026-06-15', 100, 499.14 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_2 AND id_rdo = @rdo_3 AND origem_custo = 'Insumo' AND id_origem = @insumo_3 AND data = '2026-06-15');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_2, @rdo_3, 'Maquinário', @maquina_0, '2026-06-15', 10, 1593 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_2 AND id_rdo = @rdo_3 AND origem_custo = 'Maquinário' AND id_origem = @maquina_0 AND data = '2026-06-15');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-07-16', 'Integral', 'Ensolarado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-07-16' AND turno = 'Integral');

SET @rdo_4 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-07-16' AND turno = 'Integral');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_3, @rdo_4, 'Equipe', @equipe_1, '2026-07-16', 10, 4035.6 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_3 AND id_rdo = @rdo_4 AND origem_custo = 'Equipe' AND id_origem = @equipe_1 AND data = '2026-07-16');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_3, @rdo_4, 'Insumo', @insumo_4, '2026-07-16', 100, 499.14 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_3 AND id_rdo = @rdo_4 AND origem_custo = 'Insumo' AND id_origem = @insumo_4 AND data = '2026-07-16');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_3, @rdo_4, 'Maquinário', @maquina_1, '2026-07-16', 10, 1593 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_3 AND id_rdo = @rdo_4 AND origem_custo = 'Maquinário' AND id_origem = @maquina_1 AND data = '2026-07-16');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-08-17', 'Manhã', 'Ensolarado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-08-17' AND turno = 'Manhã');

SET @rdo_5 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-08-17' AND turno = 'Manhã');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_3, @rdo_5, 'Equipe', @equipe_2, '2026-08-17', 10, 4035.6 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_3 AND id_rdo = @rdo_5 AND origem_custo = 'Equipe' AND id_origem = @equipe_2 AND data = '2026-08-17');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_3, @rdo_5, 'Insumo', @insumo_0, '2026-08-17', 100, 499.14 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_3 AND id_rdo = @rdo_5 AND origem_custo = 'Insumo' AND id_origem = @insumo_0 AND data = '2026-08-17');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_3, @rdo_5, 'Maquinário', @maquina_2, '2026-08-17', 10, 1593 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_3 AND id_rdo = @rdo_5 AND origem_custo = 'Maquinário' AND id_origem = @maquina_2 AND data = '2026-08-17');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-09-18', 'Integral', 'Nublado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-09-18' AND turno = 'Integral');

SET @rdo_6 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-09-18' AND turno = 'Integral');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_4, @rdo_6, 'Equipe', @equipe_0, '2026-09-18', 10, 4035.6 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_4 AND id_rdo = @rdo_6 AND origem_custo = 'Equipe' AND id_origem = @equipe_0 AND data = '2026-09-18');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_4, @rdo_6, 'Insumo', @insumo_1, '2026-09-18', 100, 499.14 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_4 AND id_rdo = @rdo_6 AND origem_custo = 'Insumo' AND id_origem = @insumo_1 AND data = '2026-09-18');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_4, @rdo_6, 'Maquinário', @maquina_0, '2026-09-18', 10, 1593 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_4 AND id_rdo = @rdo_6 AND origem_custo = 'Maquinário' AND id_origem = @maquina_0 AND data = '2026-09-18');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-10-02', 'Manhã', 'Ensolarado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-10-02' AND turno = 'Manhã');

SET @rdo_7 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-10-02' AND turno = 'Manhã');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_5, @rdo_7, 'Equipe', @equipe_1, '2026-10-02', 10, 4035.6 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_5 AND id_rdo = @rdo_7 AND origem_custo = 'Equipe' AND id_origem = @equipe_1 AND data = '2026-10-02');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_5, @rdo_7, 'Insumo', @insumo_2, '2026-10-02', 100, 499.14 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_5 AND id_rdo = @rdo_7 AND origem_custo = 'Insumo' AND id_origem = @insumo_2 AND data = '2026-10-02');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_5, @rdo_7, 'Maquinário', @maquina_1, '2026-10-02', 10, 1593 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_5 AND id_rdo = @rdo_7 AND origem_custo = 'Maquinário' AND id_origem = @maquina_1 AND data = '2026-10-02');

-- OBRA 4: Vértice Teste - Residencial Horizonte. Planejado 950000, realizado aproximado 38000.
INSERT INTO valen.obra (nome, status, id_construtora, categoria, numero_pavimentos, data_inicio_planejada, data_termino_planejada, orcamento_planejado)
SELECT 'Vértice Teste - Residencial Horizonte', 'Planejamento', 1, 'Residencial', 10, '2026-09-01', '2026-12-31', 950000 FROM DUAL
WHERE @seed_pronto AND NOT EXISTS (SELECT 1 FROM valen.obra WHERE nome = 'Vértice Teste - Residencial Horizonte' AND id_construtora = @seed_construtora);

SET @obra = (SELECT MIN(id_obra) FROM valen.obra WHERE nome = 'Vértice Teste - Residencial Horizonte' AND id_construtora = @seed_construtora);
INSERT INTO valen.cadastro_de_insumos (nome, quantidade_disponivel, valor_unitario, idobra)
SELECT 'Cimento CP II', 450, 43, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Cimento CP II');

SET @insumo_0 = (SELECT MIN(id_insumos) FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Cimento CP II');
INSERT INTO valen.cadastro_de_insumos (nome, quantidade_disponivel, valor_unitario, idobra)
SELECT 'Areia média', 540, 55, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Areia média');

SET @insumo_1 = (SELECT MIN(id_insumos) FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Areia média');
INSERT INTO valen.cadastro_de_insumos (nome, quantidade_disponivel, valor_unitario, idobra)
SELECT 'Brita 1', 630, 67, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Brita 1');

SET @insumo_2 = (SELECT MIN(id_insumos) FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Brita 1');
INSERT INTO valen.cadastro_de_insumos (nome, quantidade_disponivel, valor_unitario, idobra)
SELECT 'Bloco cerâmico', 720, 79, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Bloco cerâmico');

SET @insumo_3 = (SELECT MIN(id_insumos) FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Bloco cerâmico');
INSERT INTO valen.cadastro_de_insumos (nome, quantidade_disponivel, valor_unitario, idobra)
SELECT 'Vergalhão CA50', 810, 91, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Vergalhão CA50');

SET @insumo_4 = (SELECT MIN(id_insumos) FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Vergalhão CA50');
INSERT INTO valen.cadastro_de_equipes (nome_equipe, etapa_atuacao, quantidade_profissionais, custo_diario, custo_mensal, idobra)
SELECT 'Equipe de Fundação', 'Infraestrutura', 7, 1425, 31350, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_equipes WHERE idobra = @obra AND nome_equipe = 'Equipe de Fundação');

SET @equipe_0 = (SELECT MIN(id_cadastro_equipes) FROM valen.cadastro_de_equipes WHERE idobra = @obra AND nome_equipe = 'Equipe de Fundação');
INSERT INTO valen.cadastro_de_equipes (nome_equipe, etapa_atuacao, quantidade_profissionais, custo_diario, custo_mensal, idobra)
SELECT 'Equipe Estrutural', 'Supraestrutura e Alvenaria', 9, 1665, 36630, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_equipes WHERE idobra = @obra AND nome_equipe = 'Equipe Estrutural');

SET @equipe_1 = (SELECT MIN(id_cadastro_equipes) FROM valen.cadastro_de_equipes WHERE idobra = @obra AND nome_equipe = 'Equipe Estrutural');
INSERT INTO valen.cadastro_de_equipes (nome_equipe, etapa_atuacao, quantidade_profissionais, custo_diario, custo_mensal, idobra)
SELECT 'Equipe de Acabamentos', 'Acabamentos', 11, 1905, 41910, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_equipes WHERE idobra = @obra AND nome_equipe = 'Equipe de Acabamentos');

SET @equipe_2 = (SELECT MIN(id_cadastro_equipes) FROM valen.cadastro_de_equipes WHERE idobra = @obra AND nome_equipe = 'Equipe de Acabamentos');
INSERT INTO valen.cadastro_de_maquinario (nome, quantidade, etapa_atuacao, custo_diario, status, idobra)
SELECT 'Betoneira 400L', 1, 'Infraestrutura', 375, 'Ativo', @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_maquinario WHERE idobra = @obra AND nome = 'Betoneira 400L');

SET @maquina_0 = (SELECT MIN(id_maquina) FROM valen.cadastro_de_maquinario WHERE idobra = @obra AND nome = 'Betoneira 400L');
INSERT INTO valen.cadastro_de_maquinario (nome, quantidade, etapa_atuacao, custo_diario, status, idobra)
SELECT 'Retroescavadeira', 2, 'Mobilização', 555, 'Ativo', @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_maquinario WHERE idobra = @obra AND nome = 'Retroescavadeira');

SET @maquina_1 = (SELECT MIN(id_maquina) FROM valen.cadastro_de_maquinario WHERE idobra = @obra AND nome = 'Retroescavadeira');
INSERT INTO valen.cadastro_de_maquinario (nome, quantidade, etapa_atuacao, custo_diario, status, idobra)
SELECT 'Plataforma elevatória', 3, 'Acabamentos', 735, 'Inativo', @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_maquinario WHERE idobra = @obra AND nome = 'Plataforma elevatória');

SET @maquina_2 = (SELECT MIN(id_maquina) FROM valen.cadastro_de_maquinario WHERE idobra = @obra AND nome = 'Plataforma elevatória');
INSERT INTO valen.etapa (id_obra, nome_etapa, descricao)
SELECT @obra, 'Mobilização', 'Etapa de teste Analytics - Mobilização' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Mobilização');

SET @etapa_0 = (SELECT MIN(id_etapa) FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Mobilização');
INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Mobilização', 'Equipe', 18050, '2026-09-01', '2026-09-20' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Mobilização' AND origem_custo = 'Equipe' AND data_inicio_prevista = '2026-09-01' AND data_fim_prevista = '2026-09-20');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Mobilização', 'Insumo', 22325, '2026-09-01', '2026-09-20' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Mobilização' AND origem_custo = 'Insumo' AND data_inicio_prevista = '2026-09-01' AND data_fim_prevista = '2026-09-20');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Mobilização', 'Maquinário', 7125, '2026-09-01', '2026-09-20' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Mobilização' AND origem_custo = 'Maquinário' AND data_inicio_prevista = '2026-09-01' AND data_fim_prevista = '2026-09-20');

INSERT INTO valen.etapa (id_obra, nome_etapa, descricao)
SELECT @obra, 'Infraestrutura', 'Etapa de teste Analytics - Infraestrutura' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Infraestrutura');

SET @etapa_1 = (SELECT MIN(id_etapa) FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Infraestrutura');
INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Infraestrutura', 'Equipe', 72200, '2026-09-21', '2026-10-10' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Infraestrutura' AND origem_custo = 'Equipe' AND data_inicio_prevista = '2026-09-21' AND data_fim_prevista = '2026-10-10');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Infraestrutura', 'Insumo', 89300, '2026-09-21', '2026-10-10' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Infraestrutura' AND origem_custo = 'Insumo' AND data_inicio_prevista = '2026-09-21' AND data_fim_prevista = '2026-10-10');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Infraestrutura', 'Maquinário', 28500, '2026-09-21', '2026-10-10' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Infraestrutura' AND origem_custo = 'Maquinário' AND data_inicio_prevista = '2026-09-21' AND data_fim_prevista = '2026-10-10');

INSERT INTO valen.etapa (id_obra, nome_etapa, descricao)
SELECT @obra, 'Supraestrutura e Alvenaria', 'Etapa de teste Analytics - Supraestrutura e Alvenaria' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Supraestrutura e Alvenaria');

SET @etapa_2 = (SELECT MIN(id_etapa) FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Supraestrutura e Alvenaria');
INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Supraestrutura e Alvenaria', 'Equipe', 108300, '2026-10-11', '2026-10-31' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Supraestrutura e Alvenaria' AND origem_custo = 'Equipe' AND data_inicio_prevista = '2026-10-11' AND data_fim_prevista = '2026-10-31');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Supraestrutura e Alvenaria', 'Insumo', 133950, '2026-10-11', '2026-10-31' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Supraestrutura e Alvenaria' AND origem_custo = 'Insumo' AND data_inicio_prevista = '2026-10-11' AND data_fim_prevista = '2026-10-31');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Supraestrutura e Alvenaria', 'Maquinário', 42750, '2026-10-11', '2026-10-31' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Supraestrutura e Alvenaria' AND origem_custo = 'Maquinário' AND data_inicio_prevista = '2026-10-11' AND data_fim_prevista = '2026-10-31');

INSERT INTO valen.etapa (id_obra, nome_etapa, descricao)
SELECT @obra, 'Instalações', 'Etapa de teste Analytics - Instalações' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Instalações');

SET @etapa_3 = (SELECT MIN(id_etapa) FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Instalações');
INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Instalações', 'Equipe', 72200, '2026-11-01', '2026-11-20' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Instalações' AND origem_custo = 'Equipe' AND data_inicio_prevista = '2026-11-01' AND data_fim_prevista = '2026-11-20');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Instalações', 'Insumo', 89300, '2026-11-01', '2026-11-20' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Instalações' AND origem_custo = 'Insumo' AND data_inicio_prevista = '2026-11-01' AND data_fim_prevista = '2026-11-20');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Instalações', 'Maquinário', 28500, '2026-11-01', '2026-11-20' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Instalações' AND origem_custo = 'Maquinário' AND data_inicio_prevista = '2026-11-01' AND data_fim_prevista = '2026-11-20');

INSERT INTO valen.etapa (id_obra, nome_etapa, descricao)
SELECT @obra, 'Revestimentos', 'Etapa de teste Analytics - Revestimentos' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Revestimentos');

SET @etapa_4 = (SELECT MIN(id_etapa) FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Revestimentos');
INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Revestimentos', 'Equipe', 54150, '2026-11-21', '2026-12-10' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Revestimentos' AND origem_custo = 'Equipe' AND data_inicio_prevista = '2026-11-21' AND data_fim_prevista = '2026-12-10');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Revestimentos', 'Insumo', 66975, '2026-11-21', '2026-12-10' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Revestimentos' AND origem_custo = 'Insumo' AND data_inicio_prevista = '2026-11-21' AND data_fim_prevista = '2026-12-10');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Revestimentos', 'Maquinário', 21375, '2026-11-21', '2026-12-10' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Revestimentos' AND origem_custo = 'Maquinário' AND data_inicio_prevista = '2026-11-21' AND data_fim_prevista = '2026-12-10');

INSERT INTO valen.etapa (id_obra, nome_etapa, descricao)
SELECT @obra, 'Acabamento', 'Etapa de teste Analytics - Acabamento' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Acabamento');

SET @etapa_5 = (SELECT MIN(id_etapa) FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Acabamento');
INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Acabamento', 'Equipe', 36100, '2026-12-11', '2026-12-31' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Acabamento' AND origem_custo = 'Equipe' AND data_inicio_prevista = '2026-12-11' AND data_fim_prevista = '2026-12-31');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Acabamento', 'Insumo', 44650, '2026-12-11', '2026-12-31' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Acabamento' AND origem_custo = 'Insumo' AND data_inicio_prevista = '2026-12-11' AND data_fim_prevista = '2026-12-31');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Acabamento', 'Maquinário', 14250, '2026-12-11', '2026-12-31' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Acabamento' AND origem_custo = 'Maquinário' AND data_inicio_prevista = '2026-12-11' AND data_fim_prevista = '2026-12-31');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-09-13', 'Integral', 'Nublado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-09-13' AND turno = 'Integral');

SET @rdo_0 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-09-13' AND turno = 'Integral');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_0, @rdo_0, 'Equipe', @equipe_0, '2026-09-13', 10, 1444 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_0 AND id_rdo = @rdo_0 AND origem_custo = 'Equipe' AND id_origem = @equipe_0 AND data = '2026-09-13');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_0, @rdo_0, 'Insumo', @insumo_0, '2026-09-13', 100, 178.6 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_0 AND id_rdo = @rdo_0 AND origem_custo = 'Insumo' AND id_origem = @insumo_0 AND data = '2026-09-13');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_0, @rdo_0, 'Maquinário', @maquina_0, '2026-09-13', 10, 570 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_0 AND id_rdo = @rdo_0 AND origem_custo = 'Maquinário' AND id_origem = @maquina_0 AND data = '2026-09-13');

-- OBRA 5: Vértice Teste - Reforma Comercial. Planejado 1200000, realizado aproximado 1116000.
INSERT INTO valen.obra (nome, status, id_construtora, categoria, numero_pavimentos, data_inicio_planejada, data_termino_planejada, orcamento_planejado)
SELECT 'Vértice Teste - Reforma Comercial', 'Concluida', 1, 'Reforma', 3, '2026-01-01', '2026-08-31', 1200000 FROM DUAL
WHERE @seed_pronto AND NOT EXISTS (SELECT 1 FROM valen.obra WHERE nome = 'Vértice Teste - Reforma Comercial' AND id_construtora = @seed_construtora);

SET @obra = (SELECT MIN(id_obra) FROM valen.obra WHERE nome = 'Vértice Teste - Reforma Comercial' AND id_construtora = @seed_construtora);
INSERT INTO valen.cadastro_de_insumos (nome, quantidade_disponivel, valor_unitario, idobra)
SELECT 'Cimento CP II', 525, 50, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Cimento CP II');

SET @insumo_0 = (SELECT MIN(id_insumos) FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Cimento CP II');
INSERT INTO valen.cadastro_de_insumos (nome, quantidade_disponivel, valor_unitario, idobra)
SELECT 'Areia média', 615, 62, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Areia média');

SET @insumo_1 = (SELECT MIN(id_insumos) FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Areia média');
INSERT INTO valen.cadastro_de_insumos (nome, quantidade_disponivel, valor_unitario, idobra)
SELECT 'Brita 1', 705, 74, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Brita 1');

SET @insumo_2 = (SELECT MIN(id_insumos) FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Brita 1');
INSERT INTO valen.cadastro_de_insumos (nome, quantidade_disponivel, valor_unitario, idobra)
SELECT 'Bloco cerâmico', 795, 86, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Bloco cerâmico');

SET @insumo_3 = (SELECT MIN(id_insumos) FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Bloco cerâmico');
INSERT INTO valen.cadastro_de_insumos (nome, quantidade_disponivel, valor_unitario, idobra)
SELECT 'Vergalhão CA50', 885, 98, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Vergalhão CA50');

SET @insumo_4 = (SELECT MIN(id_insumos) FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Vergalhão CA50');
INSERT INTO valen.cadastro_de_equipes (nome_equipe, etapa_atuacao, quantidade_profissionais, custo_diario, custo_mensal, idobra)
SELECT 'Equipe de Fundação', 'Infraestrutura', 8, 1600, 35200, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_equipes WHERE idobra = @obra AND nome_equipe = 'Equipe de Fundação');

SET @equipe_0 = (SELECT MIN(id_cadastro_equipes) FROM valen.cadastro_de_equipes WHERE idobra = @obra AND nome_equipe = 'Equipe de Fundação');
INSERT INTO valen.cadastro_de_equipes (nome_equipe, etapa_atuacao, quantidade_profissionais, custo_diario, custo_mensal, idobra)
SELECT 'Equipe Estrutural', 'Supraestrutura e Alvenaria', 10, 1840, 40480, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_equipes WHERE idobra = @obra AND nome_equipe = 'Equipe Estrutural');

SET @equipe_1 = (SELECT MIN(id_cadastro_equipes) FROM valen.cadastro_de_equipes WHERE idobra = @obra AND nome_equipe = 'Equipe Estrutural');
INSERT INTO valen.cadastro_de_equipes (nome_equipe, etapa_atuacao, quantidade_profissionais, custo_diario, custo_mensal, idobra)
SELECT 'Equipe de Acabamentos', 'Acabamentos', 12, 2080, 45760, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_equipes WHERE idobra = @obra AND nome_equipe = 'Equipe de Acabamentos');

SET @equipe_2 = (SELECT MIN(id_cadastro_equipes) FROM valen.cadastro_de_equipes WHERE idobra = @obra AND nome_equipe = 'Equipe de Acabamentos');
INSERT INTO valen.cadastro_de_maquinario (nome, quantidade, etapa_atuacao, custo_diario, status, idobra)
SELECT 'Betoneira 400L', 2, 'Infraestrutura', 440, 'Ativo', @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_maquinario WHERE idobra = @obra AND nome = 'Betoneira 400L');

SET @maquina_0 = (SELECT MIN(id_maquina) FROM valen.cadastro_de_maquinario WHERE idobra = @obra AND nome = 'Betoneira 400L');
INSERT INTO valen.cadastro_de_maquinario (nome, quantidade, etapa_atuacao, custo_diario, status, idobra)
SELECT 'Retroescavadeira', 3, 'Mobilização', 620, 'Ativo', @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_maquinario WHERE idobra = @obra AND nome = 'Retroescavadeira');

SET @maquina_1 = (SELECT MIN(id_maquina) FROM valen.cadastro_de_maquinario WHERE idobra = @obra AND nome = 'Retroescavadeira');
INSERT INTO valen.cadastro_de_maquinario (nome, quantidade, etapa_atuacao, custo_diario, status, idobra)
SELECT 'Plataforma elevatória', 1, 'Acabamentos', 800, 'Ativo', @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_maquinario WHERE idobra = @obra AND nome = 'Plataforma elevatória');

SET @maquina_2 = (SELECT MIN(id_maquina) FROM valen.cadastro_de_maquinario WHERE idobra = @obra AND nome = 'Plataforma elevatória');
INSERT INTO valen.etapa (id_obra, nome_etapa, descricao)
SELECT @obra, 'Mobilização', 'Etapa de teste Analytics - Mobilização' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Mobilização');

SET @etapa_0 = (SELECT MIN(id_etapa) FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Mobilização');
INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Mobilização', 'Equipe', 22800, '2026-01-01', '2026-02-09' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Mobilização' AND origem_custo = 'Equipe' AND data_inicio_prevista = '2026-01-01' AND data_fim_prevista = '2026-02-09');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Mobilização', 'Insumo', 28200, '2026-01-01', '2026-02-09' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Mobilização' AND origem_custo = 'Insumo' AND data_inicio_prevista = '2026-01-01' AND data_fim_prevista = '2026-02-09');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Mobilização', 'Maquinário', 9000, '2026-01-01', '2026-02-09' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Mobilização' AND origem_custo = 'Maquinário' AND data_inicio_prevista = '2026-01-01' AND data_fim_prevista = '2026-02-09');

INSERT INTO valen.etapa (id_obra, nome_etapa, descricao)
SELECT @obra, 'Infraestrutura', 'Etapa de teste Analytics - Infraestrutura' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Infraestrutura');

SET @etapa_1 = (SELECT MIN(id_etapa) FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Infraestrutura');
INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Infraestrutura', 'Equipe', 91200, '2026-02-10', '2026-03-22' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Infraestrutura' AND origem_custo = 'Equipe' AND data_inicio_prevista = '2026-02-10' AND data_fim_prevista = '2026-03-22');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Infraestrutura', 'Insumo', 112800, '2026-02-10', '2026-03-22' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Infraestrutura' AND origem_custo = 'Insumo' AND data_inicio_prevista = '2026-02-10' AND data_fim_prevista = '2026-03-22');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Infraestrutura', 'Maquinário', 36000, '2026-02-10', '2026-03-22' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Infraestrutura' AND origem_custo = 'Maquinário' AND data_inicio_prevista = '2026-02-10' AND data_fim_prevista = '2026-03-22');

INSERT INTO valen.etapa (id_obra, nome_etapa, descricao)
SELECT @obra, 'Supraestrutura e Alvenaria', 'Etapa de teste Analytics - Supraestrutura e Alvenaria' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Supraestrutura e Alvenaria');

SET @etapa_2 = (SELECT MIN(id_etapa) FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Supraestrutura e Alvenaria');
INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Supraestrutura e Alvenaria', 'Equipe', 136800, '2026-03-23', '2026-05-01' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Supraestrutura e Alvenaria' AND origem_custo = 'Equipe' AND data_inicio_prevista = '2026-03-23' AND data_fim_prevista = '2026-05-01');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Supraestrutura e Alvenaria', 'Insumo', 169200, '2026-03-23', '2026-05-01' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Supraestrutura e Alvenaria' AND origem_custo = 'Insumo' AND data_inicio_prevista = '2026-03-23' AND data_fim_prevista = '2026-05-01');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Supraestrutura e Alvenaria', 'Maquinário', 54000, '2026-03-23', '2026-05-01' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Supraestrutura e Alvenaria' AND origem_custo = 'Maquinário' AND data_inicio_prevista = '2026-03-23' AND data_fim_prevista = '2026-05-01');

INSERT INTO valen.etapa (id_obra, nome_etapa, descricao)
SELECT @obra, 'Instalações', 'Etapa de teste Analytics - Instalações' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Instalações');

SET @etapa_3 = (SELECT MIN(id_etapa) FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Instalações');
INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Instalações', 'Equipe', 91200, '2026-05-02', '2026-06-11' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Instalações' AND origem_custo = 'Equipe' AND data_inicio_prevista = '2026-05-02' AND data_fim_prevista = '2026-06-11');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Instalações', 'Insumo', 112800, '2026-05-02', '2026-06-11' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Instalações' AND origem_custo = 'Insumo' AND data_inicio_prevista = '2026-05-02' AND data_fim_prevista = '2026-06-11');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Instalações', 'Maquinário', 36000, '2026-05-02', '2026-06-11' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Instalações' AND origem_custo = 'Maquinário' AND data_inicio_prevista = '2026-05-02' AND data_fim_prevista = '2026-06-11');

INSERT INTO valen.etapa (id_obra, nome_etapa, descricao)
SELECT @obra, 'Revestimentos', 'Etapa de teste Analytics - Revestimentos' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Revestimentos');

SET @etapa_4 = (SELECT MIN(id_etapa) FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Revestimentos');
INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Revestimentos', 'Equipe', 68400, '2026-06-12', '2026-07-21' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Revestimentos' AND origem_custo = 'Equipe' AND data_inicio_prevista = '2026-06-12' AND data_fim_prevista = '2026-07-21');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Revestimentos', 'Insumo', 84600, '2026-06-12', '2026-07-21' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Revestimentos' AND origem_custo = 'Insumo' AND data_inicio_prevista = '2026-06-12' AND data_fim_prevista = '2026-07-21');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Revestimentos', 'Maquinário', 27000, '2026-06-12', '2026-07-21' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Revestimentos' AND origem_custo = 'Maquinário' AND data_inicio_prevista = '2026-06-12' AND data_fim_prevista = '2026-07-21');

INSERT INTO valen.etapa (id_obra, nome_etapa, descricao)
SELECT @obra, 'Acabamento', 'Etapa de teste Analytics - Acabamento' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Acabamento');

SET @etapa_5 = (SELECT MIN(id_etapa) FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Acabamento');
INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Acabamento', 'Equipe', 45600, '2026-07-22', '2026-08-31' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Acabamento' AND origem_custo = 'Equipe' AND data_inicio_prevista = '2026-07-22' AND data_fim_prevista = '2026-08-31');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Acabamento', 'Insumo', 56400, '2026-07-22', '2026-08-31' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Acabamento' AND origem_custo = 'Insumo' AND data_inicio_prevista = '2026-07-22' AND data_fim_prevista = '2026-08-31');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Acabamento', 'Maquinário', 18000, '2026-07-22', '2026-08-31' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Acabamento' AND origem_custo = 'Maquinário' AND data_inicio_prevista = '2026-07-22' AND data_fim_prevista = '2026-08-31');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-01-14', 'Integral', 'Nublado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-01-14' AND turno = 'Integral');

SET @rdo_0 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-01-14' AND turno = 'Integral');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_0, @rdo_0, 'Equipe', @equipe_0, '2026-01-14', 10, 5301 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_0 AND id_rdo = @rdo_0 AND origem_custo = 'Equipe' AND id_origem = @equipe_0 AND data = '2026-01-14');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_0, @rdo_0, 'Insumo', @insumo_0, '2026-01-14', 100, 655.65 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_0 AND id_rdo = @rdo_0 AND origem_custo = 'Insumo' AND id_origem = @insumo_0 AND data = '2026-01-14');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_0, @rdo_0, 'Maquinário', @maquina_0, '2026-01-14', 10, 2092.5 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_0 AND id_rdo = @rdo_0 AND origem_custo = 'Maquinário' AND id_origem = @maquina_0 AND data = '2026-01-14');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-02-15', 'Manhã', 'Ensolarado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-02-15' AND turno = 'Manhã');

SET @rdo_1 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-02-15' AND turno = 'Manhã');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_0, @rdo_1, 'Equipe', @equipe_1, '2026-02-15', 10, 5301 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_0 AND id_rdo = @rdo_1 AND origem_custo = 'Equipe' AND id_origem = @equipe_1 AND data = '2026-02-15');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_0, @rdo_1, 'Insumo', @insumo_1, '2026-02-15', 100, 655.65 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_0 AND id_rdo = @rdo_1 AND origem_custo = 'Insumo' AND id_origem = @insumo_1 AND data = '2026-02-15');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_0, @rdo_1, 'Maquinário', @maquina_1, '2026-02-15', 10, 2092.5 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_0 AND id_rdo = @rdo_1 AND origem_custo = 'Maquinário' AND id_origem = @maquina_1 AND data = '2026-02-15');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-03-16', 'Integral', 'Ensolarado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-03-16' AND turno = 'Integral');

SET @rdo_2 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-03-16' AND turno = 'Integral');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_1, @rdo_2, 'Equipe', @equipe_2, '2026-03-16', 10, 5301 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_1 AND id_rdo = @rdo_2 AND origem_custo = 'Equipe' AND id_origem = @equipe_2 AND data = '2026-03-16');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_1, @rdo_2, 'Insumo', @insumo_2, '2026-03-16', 100, 655.65 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_1 AND id_rdo = @rdo_2 AND origem_custo = 'Insumo' AND id_origem = @insumo_2 AND data = '2026-03-16');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_1, @rdo_2, 'Maquinário', @maquina_2, '2026-03-16', 10, 2092.5 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_1 AND id_rdo = @rdo_2 AND origem_custo = 'Maquinário' AND id_origem = @maquina_2 AND data = '2026-03-16');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-04-17', 'Manhã', 'Nublado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-04-17' AND turno = 'Manhã');

SET @rdo_3 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-04-17' AND turno = 'Manhã');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_2, @rdo_3, 'Equipe', @equipe_0, '2026-04-17', 10, 5301 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_2 AND id_rdo = @rdo_3 AND origem_custo = 'Equipe' AND id_origem = @equipe_0 AND data = '2026-04-17');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_2, @rdo_3, 'Insumo', @insumo_3, '2026-04-17', 100, 655.65 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_2 AND id_rdo = @rdo_3 AND origem_custo = 'Insumo' AND id_origem = @insumo_3 AND data = '2026-04-17');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_2, @rdo_3, 'Maquinário', @maquina_0, '2026-04-17', 10, 2092.5 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_2 AND id_rdo = @rdo_3 AND origem_custo = 'Maquinário' AND id_origem = @maquina_0 AND data = '2026-04-17');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-05-18', 'Integral', 'Ensolarado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-05-18' AND turno = 'Integral');

SET @rdo_4 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-05-18' AND turno = 'Integral');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_3, @rdo_4, 'Equipe', @equipe_1, '2026-05-18', 10, 5301 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_3 AND id_rdo = @rdo_4 AND origem_custo = 'Equipe' AND id_origem = @equipe_1 AND data = '2026-05-18');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_3, @rdo_4, 'Insumo', @insumo_4, '2026-05-18', 100, 655.65 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_3 AND id_rdo = @rdo_4 AND origem_custo = 'Insumo' AND id_origem = @insumo_4 AND data = '2026-05-18');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_3, @rdo_4, 'Maquinário', @maquina_1, '2026-05-18', 10, 2092.5 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_3 AND id_rdo = @rdo_4 AND origem_custo = 'Maquinário' AND id_origem = @maquina_1 AND data = '2026-05-18');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-06-19', 'Manhã', 'Ensolarado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-06-19' AND turno = 'Manhã');

SET @rdo_5 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-06-19' AND turno = 'Manhã');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_3, @rdo_5, 'Equipe', @equipe_2, '2026-06-19', 10, 5301 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_3 AND id_rdo = @rdo_5 AND origem_custo = 'Equipe' AND id_origem = @equipe_2 AND data = '2026-06-19');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_3, @rdo_5, 'Insumo', @insumo_0, '2026-06-19', 100, 655.65 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_3 AND id_rdo = @rdo_5 AND origem_custo = 'Insumo' AND id_origem = @insumo_0 AND data = '2026-06-19');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_3, @rdo_5, 'Maquinário', @maquina_2, '2026-06-19', 10, 2092.5 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_3 AND id_rdo = @rdo_5 AND origem_custo = 'Maquinário' AND id_origem = @maquina_2 AND data = '2026-06-19');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-07-20', 'Integral', 'Nublado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-07-20' AND turno = 'Integral');

SET @rdo_6 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-07-20' AND turno = 'Integral');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_4, @rdo_6, 'Equipe', @equipe_0, '2026-07-20', 10, 5301 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_4 AND id_rdo = @rdo_6 AND origem_custo = 'Equipe' AND id_origem = @equipe_0 AND data = '2026-07-20');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_4, @rdo_6, 'Insumo', @insumo_1, '2026-07-20', 100, 655.65 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_4 AND id_rdo = @rdo_6 AND origem_custo = 'Insumo' AND id_origem = @insumo_1 AND data = '2026-07-20');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_4, @rdo_6, 'Maquinário', @maquina_0, '2026-07-20', 10, 2092.5 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_4 AND id_rdo = @rdo_6 AND origem_custo = 'Maquinário' AND id_origem = @maquina_0 AND data = '2026-07-20');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-08-21', 'Manhã', 'Ensolarado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-08-21' AND turno = 'Manhã');

SET @rdo_7 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-08-21' AND turno = 'Manhã');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_5, @rdo_7, 'Equipe', @equipe_1, '2026-08-21', 10, 5301 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_5 AND id_rdo = @rdo_7 AND origem_custo = 'Equipe' AND id_origem = @equipe_1 AND data = '2026-08-21');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_5, @rdo_7, 'Insumo', @insumo_2, '2026-08-21', 100, 655.65 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_5 AND id_rdo = @rdo_7 AND origem_custo = 'Insumo' AND id_origem = @insumo_2 AND data = '2026-08-21');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_5, @rdo_7, 'Maquinário', @maquina_1, '2026-08-21', 10, 2092.5 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_5 AND id_rdo = @rdo_7 AND origem_custo = 'Maquinário' AND id_origem = @maquina_1 AND data = '2026-08-21');

-- OBRA 6: Vértice Teste - Complexo Empresarial. Planejado 1600000, realizado aproximado 1088000.
INSERT INTO valen.obra (nome, status, id_construtora, categoria, numero_pavimentos, data_inicio_planejada, data_termino_planejada, orcamento_planejado)
SELECT 'Vértice Teste - Complexo Empresarial', 'Paralisada', 1, 'Comercial', 12, '2026-02-01', '2026-11-30', 1600000 FROM DUAL
WHERE @seed_pronto AND NOT EXISTS (SELECT 1 FROM valen.obra WHERE nome = 'Vértice Teste - Complexo Empresarial' AND id_construtora = @seed_construtora);

SET @obra = (SELECT MIN(id_obra) FROM valen.obra WHERE nome = 'Vértice Teste - Complexo Empresarial' AND id_construtora = @seed_construtora);
INSERT INTO valen.cadastro_de_insumos (nome, quantidade_disponivel, valor_unitario, idobra)
SELECT 'Cimento CP II', 600, 57, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Cimento CP II');

SET @insumo_0 = (SELECT MIN(id_insumos) FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Cimento CP II');
INSERT INTO valen.cadastro_de_insumos (nome, quantidade_disponivel, valor_unitario, idobra)
SELECT 'Areia média', 690, 69, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Areia média');

SET @insumo_1 = (SELECT MIN(id_insumos) FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Areia média');
INSERT INTO valen.cadastro_de_insumos (nome, quantidade_disponivel, valor_unitario, idobra)
SELECT 'Brita 1', 780, 81, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Brita 1');

SET @insumo_2 = (SELECT MIN(id_insumos) FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Brita 1');
INSERT INTO valen.cadastro_de_insumos (nome, quantidade_disponivel, valor_unitario, idobra)
SELECT 'Bloco cerâmico', 870, 93, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Bloco cerâmico');

SET @insumo_3 = (SELECT MIN(id_insumos) FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Bloco cerâmico');
INSERT INTO valen.cadastro_de_insumos (nome, quantidade_disponivel, valor_unitario, idobra)
SELECT 'Vergalhão CA50', 960, 105, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Vergalhão CA50');

SET @insumo_4 = (SELECT MIN(id_insumos) FROM valen.cadastro_de_insumos WHERE idobra = @obra AND nome = 'Vergalhão CA50');
INSERT INTO valen.cadastro_de_equipes (nome_equipe, etapa_atuacao, quantidade_profissionais, custo_diario, custo_mensal, idobra)
SELECT 'Equipe de Fundação', 'Infraestrutura', 9, 1775, 39050, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_equipes WHERE idobra = @obra AND nome_equipe = 'Equipe de Fundação');

SET @equipe_0 = (SELECT MIN(id_cadastro_equipes) FROM valen.cadastro_de_equipes WHERE idobra = @obra AND nome_equipe = 'Equipe de Fundação');
INSERT INTO valen.cadastro_de_equipes (nome_equipe, etapa_atuacao, quantidade_profissionais, custo_diario, custo_mensal, idobra)
SELECT 'Equipe Estrutural', 'Supraestrutura e Alvenaria', 11, 2015, 44330, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_equipes WHERE idobra = @obra AND nome_equipe = 'Equipe Estrutural');

SET @equipe_1 = (SELECT MIN(id_cadastro_equipes) FROM valen.cadastro_de_equipes WHERE idobra = @obra AND nome_equipe = 'Equipe Estrutural');
INSERT INTO valen.cadastro_de_equipes (nome_equipe, etapa_atuacao, quantidade_profissionais, custo_diario, custo_mensal, idobra)
SELECT 'Equipe de Acabamentos', 'Acabamentos', 13, 2255, 49610, @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_equipes WHERE idobra = @obra AND nome_equipe = 'Equipe de Acabamentos');

SET @equipe_2 = (SELECT MIN(id_cadastro_equipes) FROM valen.cadastro_de_equipes WHERE idobra = @obra AND nome_equipe = 'Equipe de Acabamentos');
INSERT INTO valen.cadastro_de_maquinario (nome, quantidade, etapa_atuacao, custo_diario, status, idobra)
SELECT 'Betoneira 400L', 3, 'Infraestrutura', 505, 'Ativo', @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_maquinario WHERE idobra = @obra AND nome = 'Betoneira 400L');

SET @maquina_0 = (SELECT MIN(id_maquina) FROM valen.cadastro_de_maquinario WHERE idobra = @obra AND nome = 'Betoneira 400L');
INSERT INTO valen.cadastro_de_maquinario (nome, quantidade, etapa_atuacao, custo_diario, status, idobra)
SELECT 'Retroescavadeira', 1, 'Mobilização', 685, 'Ativo', @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_maquinario WHERE idobra = @obra AND nome = 'Retroescavadeira');

SET @maquina_1 = (SELECT MIN(id_maquina) FROM valen.cadastro_de_maquinario WHERE idobra = @obra AND nome = 'Retroescavadeira');
INSERT INTO valen.cadastro_de_maquinario (nome, quantidade, etapa_atuacao, custo_diario, status, idobra)
SELECT 'Plataforma elevatória', 2, 'Acabamentos', 865, 'Inativo', @obra FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.cadastro_de_maquinario WHERE idobra = @obra AND nome = 'Plataforma elevatória');

SET @maquina_2 = (SELECT MIN(id_maquina) FROM valen.cadastro_de_maquinario WHERE idobra = @obra AND nome = 'Plataforma elevatória');
INSERT INTO valen.etapa (id_obra, nome_etapa, descricao)
SELECT @obra, 'Mobilização', 'Etapa de teste Analytics - Mobilização' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Mobilização');

SET @etapa_0 = (SELECT MIN(id_etapa) FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Mobilização');
INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Mobilização', 'Equipe', 30400, '2026-02-01', '2026-03-22' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Mobilização' AND origem_custo = 'Equipe' AND data_inicio_prevista = '2026-02-01' AND data_fim_prevista = '2026-03-22');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Mobilização', 'Insumo', 37600, '2026-02-01', '2026-03-22' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Mobilização' AND origem_custo = 'Insumo' AND data_inicio_prevista = '2026-02-01' AND data_fim_prevista = '2026-03-22');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Mobilização', 'Maquinário', 12000, '2026-02-01', '2026-03-22' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Mobilização' AND origem_custo = 'Maquinário' AND data_inicio_prevista = '2026-02-01' AND data_fim_prevista = '2026-03-22');

INSERT INTO valen.etapa (id_obra, nome_etapa, descricao)
SELECT @obra, 'Infraestrutura', 'Etapa de teste Analytics - Infraestrutura' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Infraestrutura');

SET @etapa_1 = (SELECT MIN(id_etapa) FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Infraestrutura');
INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Infraestrutura', 'Equipe', 121600, '2026-03-23', '2026-05-12' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Infraestrutura' AND origem_custo = 'Equipe' AND data_inicio_prevista = '2026-03-23' AND data_fim_prevista = '2026-05-12');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Infraestrutura', 'Insumo', 150400, '2026-03-23', '2026-05-12' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Infraestrutura' AND origem_custo = 'Insumo' AND data_inicio_prevista = '2026-03-23' AND data_fim_prevista = '2026-05-12');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Infraestrutura', 'Maquinário', 48000, '2026-03-23', '2026-05-12' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Infraestrutura' AND origem_custo = 'Maquinário' AND data_inicio_prevista = '2026-03-23' AND data_fim_prevista = '2026-05-12');

INSERT INTO valen.etapa (id_obra, nome_etapa, descricao)
SELECT @obra, 'Supraestrutura e Alvenaria', 'Etapa de teste Analytics - Supraestrutura e Alvenaria' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Supraestrutura e Alvenaria');

SET @etapa_2 = (SELECT MIN(id_etapa) FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Supraestrutura e Alvenaria');
INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Supraestrutura e Alvenaria', 'Equipe', 182400, '2026-05-13', '2026-07-01' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Supraestrutura e Alvenaria' AND origem_custo = 'Equipe' AND data_inicio_prevista = '2026-05-13' AND data_fim_prevista = '2026-07-01');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Supraestrutura e Alvenaria', 'Insumo', 225600, '2026-05-13', '2026-07-01' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Supraestrutura e Alvenaria' AND origem_custo = 'Insumo' AND data_inicio_prevista = '2026-05-13' AND data_fim_prevista = '2026-07-01');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Supraestrutura e Alvenaria', 'Maquinário', 72000, '2026-05-13', '2026-07-01' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Supraestrutura e Alvenaria' AND origem_custo = 'Maquinário' AND data_inicio_prevista = '2026-05-13' AND data_fim_prevista = '2026-07-01');

INSERT INTO valen.etapa (id_obra, nome_etapa, descricao)
SELECT @obra, 'Instalações', 'Etapa de teste Analytics - Instalações' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Instalações');

SET @etapa_3 = (SELECT MIN(id_etapa) FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Instalações');
INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Instalações', 'Equipe', 121600, '2026-07-02', '2026-08-21' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Instalações' AND origem_custo = 'Equipe' AND data_inicio_prevista = '2026-07-02' AND data_fim_prevista = '2026-08-21');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Instalações', 'Insumo', 150400, '2026-07-02', '2026-08-21' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Instalações' AND origem_custo = 'Insumo' AND data_inicio_prevista = '2026-07-02' AND data_fim_prevista = '2026-08-21');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Instalações', 'Maquinário', 48000, '2026-07-02', '2026-08-21' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Instalações' AND origem_custo = 'Maquinário' AND data_inicio_prevista = '2026-07-02' AND data_fim_prevista = '2026-08-21');

INSERT INTO valen.etapa (id_obra, nome_etapa, descricao)
SELECT @obra, 'Revestimentos', 'Etapa de teste Analytics - Revestimentos' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Revestimentos');

SET @etapa_4 = (SELECT MIN(id_etapa) FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Revestimentos');
INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Revestimentos', 'Equipe', 91200, '2026-08-22', '2026-10-10' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Revestimentos' AND origem_custo = 'Equipe' AND data_inicio_prevista = '2026-08-22' AND data_fim_prevista = '2026-10-10');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Revestimentos', 'Insumo', 112800, '2026-08-22', '2026-10-10' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Revestimentos' AND origem_custo = 'Insumo' AND data_inicio_prevista = '2026-08-22' AND data_fim_prevista = '2026-10-10');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Revestimentos', 'Maquinário', 36000, '2026-08-22', '2026-10-10' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Revestimentos' AND origem_custo = 'Maquinário' AND data_inicio_prevista = '2026-08-22' AND data_fim_prevista = '2026-10-10');

INSERT INTO valen.etapa (id_obra, nome_etapa, descricao)
SELECT @obra, 'Acabamento', 'Etapa de teste Analytics - Acabamento' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Acabamento');

SET @etapa_5 = (SELECT MIN(id_etapa) FROM valen.etapa WHERE id_obra = @obra AND nome_etapa = 'Acabamento');
INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Acabamento', 'Equipe', 60800, '2026-10-11', '2026-11-30' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Acabamento' AND origem_custo = 'Equipe' AND data_inicio_prevista = '2026-10-11' AND data_fim_prevista = '2026-11-30');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Acabamento', 'Insumo', 75200, '2026-10-11', '2026-11-30' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Acabamento' AND origem_custo = 'Insumo' AND data_inicio_prevista = '2026-10-11' AND data_fim_prevista = '2026-11-30');

INSERT INTO valen.custo_planejado (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista)
SELECT @obra, 'Acabamento', 'Maquinário', 24000, '2026-10-11', '2026-11-30' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_planejado WHERE id_obra = @obra AND etapa = 'Acabamento' AND origem_custo = 'Maquinário' AND data_inicio_prevista = '2026-10-11' AND data_fim_prevista = '2026-11-30');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-02-15', 'Integral', 'Nublado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-02-15' AND turno = 'Integral');

SET @rdo_0 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-02-15' AND turno = 'Integral');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_0, @rdo_0, 'Equipe', @equipe_0, '2026-02-15', 10, 6890.67 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_0 AND id_rdo = @rdo_0 AND origem_custo = 'Equipe' AND id_origem = @equipe_0 AND data = '2026-02-15');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_0, @rdo_0, 'Insumo', @insumo_0, '2026-02-15', 100, 852.27 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_0 AND id_rdo = @rdo_0 AND origem_custo = 'Insumo' AND id_origem = @insumo_0 AND data = '2026-02-15');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_0, @rdo_0, 'Maquinário', @maquina_0, '2026-02-15', 10, 2720 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_0 AND id_rdo = @rdo_0 AND origem_custo = 'Maquinário' AND id_origem = @maquina_0 AND data = '2026-02-15');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-03-16', 'Manhã', 'Ensolarado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-03-16' AND turno = 'Manhã');

SET @rdo_1 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-03-16' AND turno = 'Manhã');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_1, @rdo_1, 'Equipe', @equipe_1, '2026-03-16', 10, 6890.67 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_1 AND id_rdo = @rdo_1 AND origem_custo = 'Equipe' AND id_origem = @equipe_1 AND data = '2026-03-16');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_1, @rdo_1, 'Insumo', @insumo_1, '2026-03-16', 100, 852.27 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_1 AND id_rdo = @rdo_1 AND origem_custo = 'Insumo' AND id_origem = @insumo_1 AND data = '2026-03-16');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_1, @rdo_1, 'Maquinário', @maquina_1, '2026-03-16', 10, 2720 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_1 AND id_rdo = @rdo_1 AND origem_custo = 'Maquinário' AND id_origem = @maquina_1 AND data = '2026-03-16');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-04-17', 'Integral', 'Ensolarado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-04-17' AND turno = 'Integral');

SET @rdo_2 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-04-17' AND turno = 'Integral');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_2, @rdo_2, 'Equipe', @equipe_2, '2026-04-17', 10, 6890.67 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_2 AND id_rdo = @rdo_2 AND origem_custo = 'Equipe' AND id_origem = @equipe_2 AND data = '2026-04-17');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_2, @rdo_2, 'Insumo', @insumo_2, '2026-04-17', 100, 852.27 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_2 AND id_rdo = @rdo_2 AND origem_custo = 'Insumo' AND id_origem = @insumo_2 AND data = '2026-04-17');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_2, @rdo_2, 'Maquinário', @maquina_2, '2026-04-17', 10, 2720 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_2 AND id_rdo = @rdo_2 AND origem_custo = 'Maquinário' AND id_origem = @maquina_2 AND data = '2026-04-17');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-05-18', 'Manhã', 'Nublado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-05-18' AND turno = 'Manhã');

SET @rdo_3 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-05-18' AND turno = 'Manhã');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_3, @rdo_3, 'Equipe', @equipe_0, '2026-05-18', 10, 6890.67 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_3 AND id_rdo = @rdo_3 AND origem_custo = 'Equipe' AND id_origem = @equipe_0 AND data = '2026-05-18');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_3, @rdo_3, 'Insumo', @insumo_3, '2026-05-18', 100, 852.27 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_3 AND id_rdo = @rdo_3 AND origem_custo = 'Insumo' AND id_origem = @insumo_3 AND data = '2026-05-18');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_3, @rdo_3, 'Maquinário', @maquina_0, '2026-05-18', 10, 2720 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_3 AND id_rdo = @rdo_3 AND origem_custo = 'Maquinário' AND id_origem = @maquina_0 AND data = '2026-05-18');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-06-19', 'Integral', 'Ensolarado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-06-19' AND turno = 'Integral');

SET @rdo_4 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-06-19' AND turno = 'Integral');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_4, @rdo_4, 'Equipe', @equipe_1, '2026-06-19', 10, 6890.67 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_4 AND id_rdo = @rdo_4 AND origem_custo = 'Equipe' AND id_origem = @equipe_1 AND data = '2026-06-19');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_4, @rdo_4, 'Insumo', @insumo_4, '2026-06-19', 100, 852.27 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_4 AND id_rdo = @rdo_4 AND origem_custo = 'Insumo' AND id_origem = @insumo_4 AND data = '2026-06-19');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_4, @rdo_4, 'Maquinário', @maquina_1, '2026-06-19', 10, 2720 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_4 AND id_rdo = @rdo_4 AND origem_custo = 'Maquinário' AND id_origem = @maquina_1 AND data = '2026-06-19');

INSERT INTO valen.rdo (id_obra, data_rdo, turno, clima)
SELECT @obra, '2026-07-20', 'Manhã', 'Ensolarado' FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-07-20' AND turno = 'Manhã');

SET @rdo_5 = (SELECT MIN(id_rdo) FROM valen.rdo WHERE id_obra = @obra AND data_rdo = '2026-07-20' AND turno = 'Manhã');
INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_5, @rdo_5, 'Equipe', @equipe_2, '2026-07-20', 10, 6890.67 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_5 AND id_rdo = @rdo_5 AND origem_custo = 'Equipe' AND id_origem = @equipe_2 AND data = '2026-07-20');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_5, @rdo_5, 'Insumo', @insumo_0, '2026-07-20', 100, 852.27 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_5 AND id_rdo = @rdo_5 AND origem_custo = 'Insumo' AND id_origem = @insumo_0 AND data = '2026-07-20');

INSERT INTO valen.custo_realizado (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
SELECT @obra, @etapa_5, @rdo_5, 'Maquinário', @maquina_2, '2026-07-20', 10, 2720 FROM DUAL
WHERE @seed_pronto AND @obra IS NOT NULL AND NOT EXISTS (SELECT 1 FROM valen.custo_realizado WHERE id_obra = @obra AND id_etapa = @etapa_5 AND id_rdo = @rdo_5 AND origem_custo = 'Maquinário' AND id_origem = @maquina_2 AND data = '2026-07-20');

-- Conferência: somente obras de teste da construtora existente.
SELECT o.id_obra, o.nome, o.status, o.categoria, o.orcamento_planejado,
  (SELECT SUM(p.valor_planejado) FROM valen.custo_planejado p WHERE p.id_obra = o.id_obra) AS planejado,
  (SELECT SUM(c.valor_total) FROM valen.custo_realizado c WHERE c.id_obra = o.id_obra) AS realizado
FROM valen.obra o WHERE o.id_construtora = @seed_construtora AND o.nome LIKE 'Vértice Teste -%' ORDER BY o.id_obra;
SELECT 'obras' AS entidade, COUNT(*) AS quantidade FROM valen.obra o WHERE o.id_construtora = @seed_construtora AND o.nome LIKE 'Vértice Teste -%'
UNION ALL
SELECT 'equipes' AS entidade, COUNT(*) AS quantidade FROM valen.cadastro_de_equipes x JOIN valen.obra o ON o.id_obra = x.idobra WHERE o.id_construtora = @seed_construtora AND o.nome LIKE 'Vértice Teste -%'
UNION ALL
SELECT 'insumos' AS entidade, COUNT(*) AS quantidade FROM valen.cadastro_de_insumos x JOIN valen.obra o ON o.id_obra = x.idobra WHERE o.id_construtora = @seed_construtora AND o.nome LIKE 'Vértice Teste -%'
UNION ALL
SELECT 'maquinarios' AS entidade, COUNT(*) AS quantidade FROM valen.cadastro_de_maquinario x JOIN valen.obra o ON o.id_obra = x.idobra WHERE o.id_construtora = @seed_construtora AND o.nome LIKE 'Vértice Teste -%'
UNION ALL
SELECT 'etapas' AS entidade, COUNT(*) AS quantidade FROM valen.etapa x JOIN valen.obra o ON o.id_obra = x.id_obra WHERE o.id_construtora = @seed_construtora AND o.nome LIKE 'Vértice Teste -%'
UNION ALL
SELECT 'custos_planejados' AS entidade, COUNT(*) AS quantidade FROM valen.custo_planejado x JOIN valen.obra o ON o.id_obra = x.id_obra WHERE o.id_construtora = @seed_construtora AND o.nome LIKE 'Vértice Teste -%'
UNION ALL
SELECT 'custos_realizados' AS entidade, COUNT(*) AS quantidade FROM valen.custo_realizado x JOIN valen.obra o ON o.id_obra = x.id_obra WHERE o.id_construtora = @seed_construtora AND o.nome LIKE 'Vértice Teste -%'
UNION ALL
SELECT 'rdos' AS entidade, COUNT(*) AS quantidade FROM valen.rdo x JOIN valen.obra o ON o.id_obra = x.id_obra WHERE o.id_construtora = @seed_construtora AND o.nome LIKE 'Vértice Teste -%';
-- Esta consulta deve retornar zero vínculos inconsistentes.
SELECT COUNT(*) AS vinculos_inconsistentes FROM valen.custo_realizado c
JOIN valen.obra o ON o.id_obra = c.id_obra
LEFT JOIN valen.etapa e ON e.id_etapa = c.id_etapa AND e.id_obra = c.id_obra
LEFT JOIN valen.rdo r ON r.id_rdo = c.id_rdo AND r.id_obra = c.id_obra
LEFT JOIN valen.cadastro_de_equipes eq ON c.origem_custo = 'Equipe' AND eq.id_cadastro_equipes = c.id_origem AND eq.idobra = c.id_obra
LEFT JOIN valen.cadastro_de_insumos i ON c.origem_custo = 'Insumo' AND i.id_insumos = c.id_origem AND i.idobra = c.id_obra
LEFT JOIN valen.cadastro_de_maquinario m ON c.origem_custo = 'Maquinário' AND m.id_maquina = c.id_origem AND m.idobra = c.id_obra
WHERE o.id_construtora = @seed_construtora AND o.nome LIKE 'Vértice Teste -%' AND (e.id_etapa IS NULL OR r.id_rdo IS NULL OR
  (c.origem_custo = 'Equipe' AND eq.id_cadastro_equipes IS NULL) OR
  (c.origem_custo = 'Insumo' AND i.id_insumos IS NULL) OR
  (c.origem_custo = 'Maquinário' AND m.id_maquina IS NULL));
SELECT RELEASE_LOCK('vertice_seed_analytics_teste') AS lock_liberado;
