-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: valen
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `apontamento_fisico`
--

DROP TABLE IF EXISTS `apontamento_fisico`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `apontamento_fisico` (  //teste
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `apontamento_fisico`
--

LOCK TABLES `apontamento_fisico` WRITE;
/*!40000 ALTER TABLE `apontamento_fisico` DISABLE KEYS */;
INSERT INTO `apontamento_fisico` VALUES (1,15.50,'https://valen.com/fotos/obra123.jpg',1,1);
/*!40000 ALTER TABLE `apontamento_fisico` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `apropriacao`
--

DROP TABLE IF EXISTS `apropriacao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  CONSTRAINT `id_insumo` FOREIGN KEY (`id_insumo`) REFERENCES `cadastro de insumos` (`id_Insumos`),
  CONSTRAINT `id_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `apropriacao`
--

LOCK TABLES `apropriacao` WRITE;
/*!40000 ALTER TABLE `apropriacao` DISABLE KEYS */;
/*!40000 ALTER TABLE `apropriacao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `atividade_eap`
--

DROP TABLE IF EXISTS `atividade_eap`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `atividade_eap` (
  `id_atividade` int NOT NULL AUTO_INCREMENT,
  `descricao` varchar(45) NOT NULL,
  `idx_obra` int NOT NULL,
  PRIMARY KEY (`id_atividade`),
  KEY `idobra_idx` (`idx_obra`),
  CONSTRAINT `idx_obra` FOREIGN KEY (`idx_obra`) REFERENCES `obra` (`id_obra`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `atividade_eap`
--

LOCK TABLES `atividade_eap` WRITE;
/*!40000 ALTER TABLE `atividade_eap` DISABLE KEYS */;
INSERT INTO `atividade_eap` VALUES (1,'Concretagem de Laje',1);
/*!40000 ALTER TABLE `atividade_eap` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `atraso`
--

DROP TABLE IF EXISTS `atraso`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `atraso`
--

LOCK TABLES `atraso` WRITE;
/*!40000 ALTER TABLE `atraso` DISABLE KEYS */;
/*!40000 ALTER TABLE `atraso` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cadastro_de_equipes`
--

DROP TABLE IF EXISTS `cadastro_de_equipes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cadastro_de_equipes`
--

LOCK TABLES `cadastro_de_equipes` WRITE;
/*!40000 ALTER TABLE `cadastro_de_equipes` DISABLE KEYS */;
INSERT INTO `cadastro_de_equipes` VALUES (1,'Equipe de Estruturas','Instalações',6,900.00,19800.00,1);
/*!40000 ALTER TABLE `cadastro_de_equipes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cadastro_de_equipes_terceirizadas`
--

DROP TABLE IF EXISTS `cadastro_de_equipes_terceirizadas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cadastro_de_equipes_terceirizadas` (
  `id_equipe_terceirizada` int NOT NULL AUTO_INCREMENT,
  `nome_equipe` varchar(255) NOT NULL,
  `custo_diario_total` decimal(10,2) NOT NULL,
  `id_obra` int NOT NULL,
  PRIMARY KEY (`id_equipe_terceirizada`),
  KEY `fk_equipes_terceirizadas_obra` (`id_obra`),
  CONSTRAINT `fk_equipes_terceirizadas_obra` FOREIGN KEY (`id_obra`) REFERENCES `obra` (`id_obra`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cadastro_de_equipes_terceirizadas`
--

LOCK TABLES `cadastro_de_equipes_terceirizadas` WRITE;
/*!40000 ALTER TABLE `cadastro_de_equipes_terceirizadas` DISABLE KEYS */;
/*!40000 ALTER TABLE `cadastro_de_equipes_terceirizadas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cadastro_de_insumos`
--

DROP TABLE IF EXISTS `cadastro_de_insumos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cadastro_de_insumos`
--

LOCK TABLES `cadastro_de_insumos` WRITE;
/*!40000 ALTER TABLE `cadastro_de_insumos` DISABLE KEYS */;
/*!40000 ALTER TABLE `cadastro_de_insumos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cadastro_de_maquinario`
--

DROP TABLE IF EXISTS `cadastro_de_maquinario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cadastro_de_maquinario`
--

LOCK TABLES `cadastro_de_maquinario` WRITE;
/*!40000 ALTER TABLE `cadastro_de_maquinario` DISABLE KEYS */;
INSERT INTO `cadastro_de_maquinario` VALUES (1,'Betoneira 400L',2,'Infraestrutura',120.00,'Ativo',1);
/*!40000 ALTER TABLE `cadastro_de_maquinario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `construtora`
--

DROP TABLE IF EXISTS `construtora`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `construtora` (
  `id_construtora` int NOT NULL AUTO_INCREMENT,
  `cnpj` varchar(14) DEFAULT NULL,
  `razao_social` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id_construtora`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `construtora`
--

LOCK TABLES `construtora` WRITE;
/*!40000 ALTER TABLE `construtora` DISABLE KEYS */;
INSERT INTO `construtora` VALUES (1,'12345678000199','Construtora Valen LTDA');
/*!40000 ALTER TABLE `construtora` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consumo_insumo`
--

DROP TABLE IF EXISTS `consumo_insumo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consumo_insumo`
--

LOCK TABLES `consumo_insumo` WRITE;
/*!40000 ALTER TABLE `consumo_insumo` DISABLE KEYS */;
/*!40000 ALTER TABLE `consumo_insumo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `custo_planejado`
--

DROP TABLE IF EXISTS `custo_planejado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `custo_planejado`
--

LOCK TABLES `custo_planejado` WRITE;
/*!40000 ALTER TABLE `custo_planejado` DISABLE KEYS */;
/*!40000 ALTER TABLE `custo_planejado` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `custo_realizado`
--

DROP TABLE IF EXISTS `custo_realizado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `custo_realizado`
--

LOCK TABLES `custo_realizado` WRITE;
/*!40000 ALTER TABLE `custo_realizado` DISABLE KEYS */;
/*!40000 ALTER TABLE `custo_realizado` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `diario_obra`
--

DROP TABLE IF EXISTS `diario_obra`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `diario_obra`
--

LOCK TABLES `diario_obra` WRITE;
/*!40000 ALTER TABLE `diario_obra` DISABLE KEYS */;
INSERT INTO `diario_obra` VALUES (1,'2026-09-09','Ensolarado','Manhã','Infraestrutura','A','B','Nenhuma','N/A','Nenhum','N/A',1,1);
/*!40000 ALTER TABLE `diario_obra` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `equipe_etapa`
--

DROP TABLE IF EXISTS `equipe_etapa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `equipe_etapa`
--

LOCK TABLES `equipe_etapa` WRITE;
/*!40000 ALTER TABLE `equipe_etapa` DISABLE KEYS */;
/*!40000 ALTER TABLE `equipe_etapa` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `etapa`
--

DROP TABLE IF EXISTS `etapa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `etapa` (
  `id_etapa` int NOT NULL AUTO_INCREMENT,
  `id_obra` int NOT NULL,
  `nome_etapa` enum('Mobilização','Infraestrutura','Supraestrutura e Alvenaria','Instalações','Revestimentos','Acabamento') NOT NULL,
  `descricao` text,
  PRIMARY KEY (`id_etapa`),
  KEY `fk_etapa_obra` (`id_obra`),
  CONSTRAINT `fk_etapa_obra` FOREIGN KEY (`id_obra`) REFERENCES `obra` (`id_obra`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `etapa`
--

LOCK TABLES `etapa` WRITE;
/*!40000 ALTER TABLE `etapa` DISABLE KEYS */;
/*!40000 ALTER TABLE `etapa` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historico_obras`
--

DROP TABLE IF EXISTS `historico_obras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historico_obras`
--

LOCK TABLES `historico_obras` WRITE;
/*!40000 ALTER TABLE `historico_obras` DISABLE KEYS */;
INSERT INTO `historico_obras` VALUES (1,1,1,'em andamento','2026-09-10 14:48:00',NULL);
/*!40000 ALTER TABLE `historico_obras` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `metricas_eva`
--

DROP TABLE IF EXISTS `metricas_eva`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `metricas_eva`
--

LOCK TABLES `metricas_eva` WRITE;
/*!40000 ALTER TABLE `metricas_eva` DISABLE KEYS */;
INSERT INTO `metricas_eva` VALUES (1,'2026-09-09',1.0500,0.9800,480000.00,1);
/*!40000 ALTER TABLE `metricas_eva` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `obra`
--

DROP TABLE IF EXISTS `obra`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `obra`
--

LOCK TABLES `obra` WRITE;
/*!40000 ALTER TABLE `obra` DISABLE KEYS */;
INSERT INTO `obra` VALUES (1,'Residencial Valen Tower','Em Andamento',1,'Residencial',12,'2026-01-10','2026-12-20',500000.00);
/*!40000 ALTER TABLE `obra` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orcamento_previsto`
--

DROP TABLE IF EXISTS `orcamento_previsto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orcamento_previsto` (
  `id_orcamento` int NOT NULL,
  `valor_planejado` decimal(15,2) NOT NULL,
  `id_atividade_eap` int NOT NULL,
  PRIMARY KEY (`id_orcamento`),
  KEY `id_atividade_eap_idx` (`id_atividade_eap`),
  CONSTRAINT `id_atividade_eap` FOREIGN KEY (`id_atividade_eap`) REFERENCES `atividade_eap` (`id_atividade`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orcamento_previsto`
--

LOCK TABLES `orcamento_previsto` WRITE;
/*!40000 ALTER TABLE `orcamento_previsto` DISABLE KEYS */;
/*!40000 ALTER TABLE `orcamento_previsto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `paralisacao`
--

DROP TABLE IF EXISTS `paralisacao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `paralisacao`
--

LOCK TABLES `paralisacao` WRITE;
/*!40000 ALTER TABLE `paralisacao` DISABLE KEYS */;
/*!40000 ALTER TABLE `paralisacao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projecao_financeira`
--

DROP TABLE IF EXISTS `projecao_financeira`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projecao_financeira`
--

LOCK TABLES `projecao_financeira` WRITE;
/*!40000 ALTER TABLE `projecao_financeira` DISABLE KEYS */;
/*!40000 ALTER TABLE `projecao_financeira` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rdo`
--

DROP TABLE IF EXISTS `rdo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rdo`
--

LOCK TABLES `rdo` WRITE;
/*!40000 ALTER TABLE `rdo` DISABLE KEYS */;
/*!40000 ALTER TABLE `rdo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rdo_equipe`
--

DROP TABLE IF EXISTS `rdo_equipe`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rdo_equipe`
--

LOCK TABLES `rdo_equipe` WRITE;
/*!40000 ALTER TABLE `rdo_equipe` DISABLE KEYS */;
/*!40000 ALTER TABLE `rdo_equipe` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rdo_maquinario`
--

DROP TABLE IF EXISTS `rdo_maquinario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rdo_maquinario`
--

LOCK TABLES `rdo_maquinario` WRITE;
/*!40000 ALTER TABLE `rdo_maquinario` DISABLE KEYS */;
/*!40000 ALTER TABLE `rdo_maquinario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `registro_relatorios`
--

DROP TABLE IF EXISTS `registro_relatorios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `registro_relatorios`
--

LOCK TABLES `registro_relatorios` WRITE;
/*!40000 ALTER TABLE `registro_relatorios` DISABLE KEYS */;
INSERT INTO `registro_relatorios` VALUES (1,1,1,'2026-09-10 14:48:00');
/*!40000 ALTER TABLE `registro_relatorios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES (1,'Engenheiro Teste','eng_1789051679644@valen.com',NULL,NULL,'Ativo','2026-09-23 17:25:39','hash_senha_123',1);
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-23 17:49:03
