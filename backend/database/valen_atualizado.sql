-- Estrutura completa do Vértice, sem dados. Instalar somente em banco novo.
-- Base: backend/bd.sql e esquema local comparado em 2026-10-29.
-- Preserva vínculos obrigatórios locais; inclui cargo, FK corrigida e operação do Canteiro.
SET NAMES utf8mb4;
SET @VERTICE_OLD_FK = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE `apontamento_fisico` (
  `id_apontamento` int NOT NULL AUTO_INCREMENT,
  `percentual_dia` decimal(5,2) NOT NULL,
  `url_foto` varchar(512) NOT NULL,
  `diario_id` int NOT NULL,
  `atividade_eap_id` int NOT NULL,
  PRIMARY KEY (`id_apontamento`),
  KEY `diario_id_idx` (`diario_id`),
  KEY `atividade_eap_id_idx` (`atividade_eap_id`),
  CONSTRAINT `atividade_eap_id` FOREIGN KEY (`atividade_eap_id`) REFERENCES `atividade_eap` (`id_atividade`),
  CONSTRAINT `diario_id` FOREIGN KEY (`diario_id`) REFERENCES `diario_obra` (`id_diario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `apropriacao` (
  `id_apropriacao` int NOT NULL AUTO_INCREMENT,
  `quantidade_consumida` float DEFAULT NULL,
  `tipo_compra` enum('Planejada','Emergencial') DEFAULT NULL,
  `id_insumo` int NOT NULL,
  `id_atividade` int NOT NULL,
  `id_usuario` int NOT NULL,
  PRIMARY KEY (`id_apropriacao`),
  KEY `id_insumo_idx` (`id_insumo`) /*!80000 INVISIBLE */,
  KEY `id_atividade_idx` (`id_atividade`),
  KEY `id_usuario_idx` (`id_usuario`),
  CONSTRAINT `id_atividade` FOREIGN KEY (`id_atividade`) REFERENCES `atividade_eap` (`id_atividade`),
  CONSTRAINT `fk_apropriacao_insumo` FOREIGN KEY (`id_insumo`) REFERENCES `cadastro_de_insumos` (`id_insumos`),
  CONSTRAINT `id_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `atividade_eap` (
  `id_atividade` int NOT NULL AUTO_INCREMENT,
  `descricao` varchar(45) NOT NULL,
  `idx_obra` int NOT NULL,
  PRIMARY KEY (`id_atividade`),
  KEY `idobra_idx` (`idx_obra`),
  CONSTRAINT `idx_obra` FOREIGN KEY (`idx_obra`) REFERENCES `obra` (`id_obra`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `atraso` (
  `id_atraso` int NOT NULL AUTO_INCREMENT,
  `id_rdo` int NOT NULL,
  `etapa` enum('Mobilização','Infraestrutura','Supraestrutura e Alvenaria','Instalações','Revestimentos','Acabamento') NOT NULL,
  `origem_atraso` enum('Equipes','Insumos','Maquinários') NOT NULL,
  `duracao` decimal(5,2) NOT NULL,
  `descricao` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_atraso`),
  KEY `fk_atraso_rdo` (`id_rdo`),
  CONSTRAINT `fk_atraso_rdo` FOREIGN KEY (`id_rdo`) REFERENCES `rdo` (`id_rdo`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `cadastro_de_equipes` (
  `id_cadastro_equipes` int NOT NULL AUTO_INCREMENT,
  `nome_equipe` varchar(45) DEFAULT NULL,
  `etapa_atuacao` enum('Mobilização','Infraestrutura','Supraestrutura e Alvenaria','Instalações','Revestimentos','Acabamentos') NOT NULL,
  `quantidade_profissionais` int NOT NULL,
  `custo_diario` decimal(10,2) NOT NULL,
  `custo_mensal` decimal(10,2) NOT NULL,
  `idobra` int NOT NULL,
  PRIMARY KEY (`id_cadastro_equipes`),
  KEY `idobra_idx` (`idobra`),
  CONSTRAINT `idobra` FOREIGN KEY (`idobra`) REFERENCES `obra` (`id_obra`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `cadastro_de_equipes_terceirizadas` (
  `id_equipe_terceirizada` int NOT NULL AUTO_INCREMENT,
  `nome_equipe` varchar(255) NOT NULL,
  `custo_diario_total` decimal(10,2) NOT NULL,
  `id_obra` int NOT NULL,
  PRIMARY KEY (`id_equipe_terceirizada`),
  KEY `fk_equipes_terceirizadas_obra` (`id_obra`),
  CONSTRAINT `fk_equipes_terceirizadas_obra` FOREIGN KEY (`id_obra`) REFERENCES `obra` (`id_obra`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `cadastro_de_insumos` (
  `id_insumos` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(45) DEFAULT NULL,
  `quantidade_disponivel` int DEFAULT NULL,
  `valor_unitario` int DEFAULT NULL,
  `idobra` int NOT NULL,
  PRIMARY KEY (`id_insumos`),
  KEY `idobra_idx` (`idobra`),
  CONSTRAINT `id_obra` FOREIGN KEY (`idobra`) REFERENCES `obra` (`id_obra`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `cadastro_de_maquinario` (
  `id_maquina` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(45) NOT NULL,
  `quantidade` int DEFAULT NULL,
  `etapa_atuacao` enum('Mobilização','Infraestrutura','Supraestrutura e Alvenaria','Instalações','Revestimentos','Acabamentos') DEFAULT NULL,
  `custo_diario` decimal(10,2) DEFAULT NULL,
  `status` enum('Ativo','Inativo') DEFAULT NULL,
  `idobra` int NOT NULL,
  PRIMARY KEY (`id_maquina`),
  KEY `obra_id` (`idobra`),
  CONSTRAINT `obra_id` FOREIGN KEY (`idobra`) REFERENCES `obra` (`id_obra`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `cargo` (
  `id_cargo` int NOT NULL AUTO_INCREMENT,
  `nome_cargo` varchar(100) NOT NULL,
  `descricao` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_cargo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `construtora` (
  `id_construtora` int NOT NULL AUTO_INCREMENT,
  `cnpj` varchar(14) DEFAULT NULL,
  `razao_social` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_construtora`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `consumo_insumo` (
  `id_consumo` int NOT NULL AUTO_INCREMENT,
  `id_rdo` int NOT NULL,
  `id_insumo` int NOT NULL,
  `etapa` enum('Mobilização','Infraestrutura','Supraestrutura e Alvenaria','Instalações','Revestimentos','Acabamento') NOT NULL,
  `quantidade_consumida` decimal(10,2) NOT NULL,
  `custo_unitario` decimal(10,2) NOT NULL,
  `custo_total` decimal(12,2) GENERATED ALWAYS AS ((`quantidade_consumida` * `custo_unitario`)) STORED,
  PRIMARY KEY (`id_consumo`),
  KEY `fk_consumo_insumo_rdo` (`id_rdo`),
  KEY `fk_consumo_insumo_insumo` (`id_insumo`),
  CONSTRAINT `fk_consumo_insumo_insumo` FOREIGN KEY (`id_insumo`) REFERENCES `cadastro_de_insumos` (`id_insumos`),
  CONSTRAINT `fk_consumo_insumo_rdo` FOREIGN KEY (`id_rdo`) REFERENCES `rdo` (`id_rdo`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `custo_planejado` (
  `id_custo_planejado` int NOT NULL AUTO_INCREMENT,
  `id_obra` int NOT NULL,
  `etapa` enum('Mobilização','Infraestrutura','Supraestrutura e Alvenaria','Instalações','Revestimentos','Acabamento') NOT NULL,
  `origem_custo` enum('Equipe','Insumo','Maquinário') NOT NULL,
  `valor_planejado` decimal(10,2) NOT NULL,
  `data_inicio_prevista` date NOT NULL,
  `data_fim_prevista` date NOT NULL,
  PRIMARY KEY (`id_custo_planejado`),
  KEY `fk_custo_planejado_obra` (`id_obra`),
  CONSTRAINT `fk_custo_planejado_obra` FOREIGN KEY (`id_obra`) REFERENCES `obra` (`id_obra`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `custo_realizado` (
  `id_custo_realizado` int NOT NULL AUTO_INCREMENT,
  `id_obra` int NOT NULL,
  `id_etapa` int NOT NULL,
  `id_rdo` int NOT NULL,
  `origem_custo` enum('Equipe','Insumo','Maquinário') NOT NULL,
  `id_origem` int NOT NULL,
  `data` date NOT NULL,
  `quantidade` decimal(10,2) NOT NULL,
  `custo_unitario` decimal(10,2) NOT NULL,
  `valor_total` decimal(12,2) GENERATED ALWAYS AS ((`quantidade` * `custo_unitario`)) STORED,
  PRIMARY KEY (`id_custo_realizado`),
  KEY `fk_custo_realizado_obra` (`id_obra`),
  KEY `fk_custo_realizado_etapa` (`id_etapa`),
  KEY `fk_custo_realizado_rdo` (`id_rdo`),
  CONSTRAINT `fk_custo_realizado_etapa` FOREIGN KEY (`id_etapa`) REFERENCES `etapa` (`id_etapa`),
  CONSTRAINT `fk_custo_realizado_obra` FOREIGN KEY (`id_obra`) REFERENCES `obra` (`id_obra`),
  CONSTRAINT `fk_custo_realizado_rdo` FOREIGN KEY (`id_rdo`) REFERENCES `rdo` (`id_rdo`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `diario_obra` (
  `id_diario` int NOT NULL AUTO_INCREMENT,
  `data` date NOT NULL,
  `clima` enum('Ensolarado','Chuvoso') DEFAULT NULL,
  `turno` enum('Manhã','Tarde','Noite') DEFAULT NULL,
  `etapa_atuacao` enum('Mobilização','Infraestrutura','Supraestrutura e Alvenaria','Instalações','Revestimentos','Acabamentos') DEFAULT NULL,
  `equipe_interna` enum('A','B','C') DEFAULT NULL,
  `equipe_terceirizada` enum('A','B','C') DEFAULT NULL,
  `paralisacoes` text,
  `origem_paralisacoes` varchar(255) DEFAULT NULL,
  `atrasos` text,
  `origem_atrasos` varchar(255) DEFAULT NULL,
  `obrax_id` int NOT NULL,
  `usuario_id` int NOT NULL,
  PRIMARY KEY (`id_diario`),
  KEY `id_obra_idx` (`obrax_id`),
  KEY `id_usuario_idx` (`usuario_id`),
  CONSTRAINT `obrax_id` FOREIGN KEY (`obrax_id`) REFERENCES `obra` (`id_obra`),
  CONSTRAINT `usuario_id` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `equipe_etapa` (
  `id_equipe_etapa` int NOT NULL AUTO_INCREMENT,
  `id_equipe` int NOT NULL,
  `etapa` enum('Mobilização','Infraestrutura','Supraestrutura e Alvenaria','Instalações','Revestimentos','Acabamento') NOT NULL,
  `data_inicio` date NOT NULL,
  `data_fim` date NOT NULL,
  PRIMARY KEY (`id_equipe_etapa`),
  KEY `fk_equipe_etapa_equipe` (`id_equipe`),
  CONSTRAINT `fk_equipe_etapa_equipe` FOREIGN KEY (`id_equipe`) REFERENCES `cadastro_de_equipes` (`id_cadastro_equipes`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `etapa` (
  `id_etapa` int NOT NULL AUTO_INCREMENT,
  `id_obra` int NOT NULL,
  `nome_etapa` enum('Mobilização','Infraestrutura','Supraestrutura e Alvenaria','Instalações','Revestimentos','Acabamento') NOT NULL,
  `descricao` text,
  PRIMARY KEY (`id_etapa`),
  KEY `fk_etapa_obra` (`id_obra`),
  CONSTRAINT `fk_etapa_obra` FOREIGN KEY (`id_obra`) REFERENCES `obra` (`id_obra`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `historico_obras` (
  `id_historico` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `id_obra` int NOT NULL,
  `status` enum('iniciada','em andamento','concluida','pausada') NOT NULL DEFAULT 'em andamento',
  `data_atribuicao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `data_fim` date DEFAULT NULL,
  PRIMARY KEY (`id_historico`),
  KEY `usuario_id` (`usuario_id`),
  KEY `id_obra` (`id_obra`),
  CONSTRAINT `historico_obras_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE,
  CONSTRAINT `historico_obras_ibfk_2` FOREIGN KEY (`id_obra`) REFERENCES `obra` (`id_obra`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `metricas_eva` (
  `id_metrica` int NOT NULL AUTO_INCREMENT,
  `data_calculo` date NOT NULL,
  `idc` decimal(6,4) NOT NULL,
  `idp` decimal(6,4) NOT NULL,
  `eac` decimal(15,2) NOT NULL,
  `obra_idxx` int DEFAULT NULL,
  PRIMARY KEY (`id_metrica`),
  KEY `obra_idxx_idx` (`obra_idxx`),
  CONSTRAINT `obra_idxx` FOREIGN KEY (`obra_idxx`) REFERENCES `obra` (`id_obra`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `obra` (
  `id_obra` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(150) NOT NULL,
  `status` enum('Planejamento','Em Andamento','Concluida','Paralisada') DEFAULT NULL,
  `id_construtora` int NOT NULL,
  `categoria` enum('Residencial','Comercial','Industrial','Reforma') DEFAULT NULL,
  `numero_pavimentos` int NOT NULL,
  `data_inicio_planejada` date NOT NULL,
  `data_termino_planejada` date NOT NULL,
  `orcamento_planejado` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id_obra`),
  KEY `idconstrutora_idx` (`id_construtora`),
  CONSTRAINT `id_construtora` FOREIGN KEY (`id_construtora`) REFERENCES `construtora` (`id_construtora`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `orcamento_previsto` (
  `id_orcamento` int NOT NULL,
  `valor_planejado` decimal(15,2) NOT NULL,
  `id_atividade_eap` int NOT NULL,
  PRIMARY KEY (`id_orcamento`),
  KEY `id_atividade_eap_idx` (`id_atividade_eap`),
  CONSTRAINT `id_atividade_eap` FOREIGN KEY (`id_atividade_eap`) REFERENCES `atividade_eap` (`id_atividade`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `paralisacao` (
  `id_paralisacao` int NOT NULL AUTO_INCREMENT,
  `id_rdo` int NOT NULL,
  `etapa` enum('Mobilização','Infraestrutura','Supraestrutura e Alvenaria','Instalações','Revestimentos','Acabamento') NOT NULL,
  `origem_paralisacao` enum('Condições Climáticas','Acidente no Trabalho') NOT NULL,
  `duracao` decimal(5,2) NOT NULL,
  `descricao` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_paralisacao`),
  KEY `fk_paralisacao_rdo` (`id_rdo`),
  CONSTRAINT `fk_paralisacao_rdo` FOREIGN KEY (`id_rdo`) REFERENCES `rdo` (`id_rdo`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `projecao_financeira` (
  `id_projecao` int NOT NULL AUTO_INCREMENT,
  `id_obra` int NOT NULL,
  `etapa` enum('Mobilização','Infraestrutura','Supraestrutura e Alvenaria','Instalações','Revestimentos','Acabamento','Nenhum') DEFAULT 'Nenhum',
  `data_projecao` date NOT NULL,
  `custo_realizado` decimal(12,2) NOT NULL DEFAULT '0.00',
  `custo_restante_estimado` decimal(12,2) NOT NULL DEFAULT '0.00',
  `custo_final_projetado` decimal(12,2) GENERATED ALWAYS AS ((`custo_realizado` + `custo_restante_estimado`)) STORED,
  `desvio_projetado` decimal(12,2) DEFAULT NULL,
  `desvio_projetado_percentual` decimal(5,2) DEFAULT NULL,
  PRIMARY KEY (`id_projecao`),
  KEY `fk_projecao_financeira_obra` (`id_obra`),
  CONSTRAINT `fk_projecao_financeira_obra` FOREIGN KEY (`id_obra`) REFERENCES `obra` (`id_obra`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `rdo` (
  `id_rdo` int NOT NULL AUTO_INCREMENT,
  `id_obra` int NOT NULL,
  `data_rdo` date NOT NULL,
  `turno` enum('Manhã','Tarde','Noite','Integral') NOT NULL,
  `clima` enum('Ensolarado','Nublado','Chuvoso','Impraticável') NOT NULL,
  PRIMARY KEY (`id_rdo`),
  KEY `fk_rdo_obra` (`id_obra`),
  CONSTRAINT `fk_rdo_obra` FOREIGN KEY (`id_obra`) REFERENCES `obra` (`id_obra`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `rdo_equipe` (
  `id_rdo_equipe` int NOT NULL AUTO_INCREMENT,
  `id_rdo` int NOT NULL,
  `id_equipe` int NOT NULL,
  `etapa` enum('Mobilização','Infraestrutura','Supraestrutura e Alvenaria','Instalações','Revestimentos','Acabamento') NOT NULL,
  `dias_atuacao` decimal(5,2) NOT NULL,
  PRIMARY KEY (`id_rdo_equipe`),
  KEY `fk_rdo_equipe_rdo` (`id_rdo`),
  KEY `fk_rdo_equipe_equipe` (`id_equipe`),
  CONSTRAINT `fk_rdo_equipe_equipe` FOREIGN KEY (`id_equipe`) REFERENCES `cadastro_de_equipes` (`id_cadastro_equipes`),
  CONSTRAINT `fk_rdo_equipe_rdo` FOREIGN KEY (`id_rdo`) REFERENCES `rdo` (`id_rdo`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `rdo_maquinario` (
  `id_rdo_maquinario` int NOT NULL AUTO_INCREMENT,
  `id_rdo` int NOT NULL,
  `id_maquinario` int NOT NULL,
  `etapa` enum('Mobilização','Infraestrutura','Supraestrutura e Alvenaria','Instalações','Revestimentos','Acabamento') NOT NULL,
  `quantidade_utilizada` decimal(10,2) NOT NULL,
  `tempo_utilizacao` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id_rdo_maquinario`),
  KEY `fk_rdo_maquinario_rdo` (`id_rdo`),
  KEY `fk_rdo_maquinario_maquinario` (`id_maquinario`),
  CONSTRAINT `fk_rdo_maquinario_maquinario` FOREIGN KEY (`id_maquinario`) REFERENCES `cadastro_de_maquinario` (`id_maquina`),
  CONSTRAINT `fk_rdo_maquinario_rdo` FOREIGN KEY (`id_rdo`) REFERENCES `rdo` (`id_rdo`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `registro_relatorios` (
  `id_registro_relatorio` int NOT NULL AUTO_INCREMENT,
  `id_diario` int NOT NULL,
  `id_obra` int NOT NULL,
  `data_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_registro_relatorio`),
  KEY `id_diario` (`id_diario`),
  KEY `id_obra` (`id_obra`),
  CONSTRAINT `registro_relatorios_ibfk_1` FOREIGN KEY (`id_diario`) REFERENCES `diario_obra` (`id_diario`) ON DELETE CASCADE,
  CONSTRAINT `registro_relatorios_ibfk_2` FOREIGN KEY (`id_obra`) REFERENCES `obra` (`id_obra`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `usuario` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(150) NOT NULL,
  `email` varchar(191) NOT NULL,
  `ocupacao` varchar(100) DEFAULT NULL,
  `ambiente` varchar(100) DEFAULT NULL,
  `status` enum('Ativo','Inativo') NOT NULL DEFAULT 'Ativo',
  `data_cadastro` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `senha` varchar(255) NOT NULL,
  `idconstrutora` int NOT NULL,
  PRIMARY KEY (`id_usuario`),
  KEY `idconstrutora_idx` (`idconstrutora`),
  CONSTRAINT `idconstrutora` FOREIGN KEY (`idconstrutora`) REFERENCES `construtora` (`id_construtora`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS = @VERTICE_OLD_FK;

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
  atividade_id INT NULL,
  excluido_em DATETIME NULL,
  excluido_por INT NULL,
  CONSTRAINT fk_foto_atividade FOREIGN KEY(atividade_id) REFERENCES atividade_eap(id_atividade),
  CONSTRAINT fk_foto_exclusao FOREIGN KEY(excluido_por) REFERENCES usuario(id_usuario),
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
  classificacao VARCHAR(100) NULL,
  responsavel_id INT NULL,
  prazo_previsto DATE NULL,
  CONSTRAINT fk_ocorrencia_designado FOREIGN KEY(responsavel_id) REFERENCES usuario(id_usuario),
  KEY idx_ocorrencia_obra_status(obra_id,status),
  CONSTRAINT fk_ocorrencia_obra FOREIGN KEY(obra_id) REFERENCES obra(id_obra),
  CONSTRAINT fk_ocorrencia_autor FOREIGN KEY(usuario_id) REFERENCES usuario(id_usuario),
  CONSTRAINT fk_ocorrencia_responsavel FOREIGN KEY(resolvido_por) REFERENCES usuario(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE IF NOT EXISTS ocorrencia_historico (
  id_historico INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  ocorrencia_id INT NOT NULL,
  usuario_id INT NOT NULL,
  acao ENUM('Criada','Resolvida','Atualizada') NOT NULL,
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
