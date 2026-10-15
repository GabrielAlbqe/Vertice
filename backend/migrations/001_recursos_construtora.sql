
-- VÉRTICE
-- Migração 001: propriedade dos recursos
--
-- Executar somente após backup.
-- Aplicar uma vez por banco de dados.
-- Não altera automaticamente registros antigos
-- que não possuem construtora identificada.

ALTER TABLE cadastro_de_equipes
ADD COLUMN id_construtora INT NULL,
ADD INDEX idx_equipes_construtora (id_construtora),
ADD CONSTRAINT fk_equipes_construtora
FOREIGN KEY (id_construtora)
REFERENCES construtora(id_construtora);

ALTER TABLE cadastro_de_insumos
ADD COLUMN id_construtora INT NULL,
ADD INDEX idx_insumos_construtora (id_construtora),
ADD CONSTRAINT fk_insumos_construtora
FOREIGN KEY (id_construtora)
REFERENCES construtora(id_construtora);

ALTER TABLE cadastro_de_maquinario
ADD COLUMN id_construtora INT NULL,
ADD INDEX idx_maquinario_construtora (id_construtora),
ADD CONSTRAINT fk_maquinario_construtora
FOREIGN KEY (id_construtora)
REFERENCES construtora(id_construtora);

-- Associar apenas recursos cuja construtora
-- possa ser identificada pela obra vinculada.

UPDATE cadastro_de_equipes e
JOIN obra o ON o.id_obra = e.idobra
SET e.id_construtora = o.id_construtora
WHERE e.id_construtora IS NULL;

UPDATE cadastro_de_insumos i
JOIN obra o ON o.id_obra = i.idobra
SET i.id_construtora = o.id_construtora
WHERE i.id_construtora IS NULL;

UPDATE cadastro_de_maquinario m
JOIN obra o ON o.id_obra = m.idobra
SET m.id_construtora = o.id_construtora
WHERE m.id_construtora IS NULL;
