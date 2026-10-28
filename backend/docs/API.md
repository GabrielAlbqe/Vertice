# Referência da API VÉRTICE

Prefixo /api. JSON e Bearer nas rotas privadas. Valores nos filtros são parametrizados; listagens sempre têm escopo da construtora autenticada, exceto o catálogo global de cargos.

| Método | Caminho relativo ao recurso | Resultado |
|---|---|---|
| GET | / | Array; filtros abaixo |
| GET | /:id | Objeto ou 404 |
| POST | /insert | 201; mensagem e ID quando fornecido pelo controller |
| PUT | /insert/:id | 200; atualização com campos enviados e preservação dos demais |
| DELETE | /del/:id | 200; desativação para usuários/construtoras, exclusão para demais |

Cargos: somente GET. Construtoras: POST restrito ao provisionamento administrativo, retorna 403 na API empresarial. Usuários: POST público restrito a contas inativas, ou cadastro gerenciado com Bearer. POST /usuarios/login e GET /health são públicos. Recursos equipes, insumos e maquinarios também aceitam PATCH /:id/obra com idobra ou null.

## /api/usuarios

Tabela: usuario. Chave: id_usuario.

Filtro obrigatório de listagem: nenhum. Outros campos persistidos podem ser usados como filtros exatos.

| Campo | Definição SQL e obrigatoriedade |
|---|---|
| id_usuario | int NOT NULL AUTO_INCREMENT |
| nome | varchar(150) NOT NULL |
| email | varchar(191) NOT NULL |
| ocupacao | varchar(100) DEFAULT NULL |
| ambiente | varchar(100) DEFAULT NULL |
| status | enum('Ativo','Inativo') NOT NULL DEFAULT 'Ativo' |
| data_cadastro | datetime NOT NULL DEFAULT CURRENT_TIMESTAMP |
| senha | varchar(255) NOT NULL |
| idconstrutora | int DEFAULT NULL |

Campos AUTO_INCREMENT e GENERATED são gerados pelo banco e não precisam ser enviados. NOT NULL sem DEFAULT exige valor no cadastro. Campos gerados são somente leitura. Em usuários, senha só é aceita em escrita e nunca aparece nas respostas.

## /api/construtoras

Tabela: construtora. Chave: id_construtora.

Filtro obrigatório de listagem: nenhum. Outros campos persistidos podem ser usados como filtros exatos.

| Campo | Definição SQL e obrigatoriedade |
|---|---|
| id_construtora | int NOT NULL AUTO_INCREMENT |
| cnpj | varchar(14) DEFAULT NULL |
| razao_social | varchar(255) DEFAULT NULL |
| status | enum('Ativo','Inativo') NOT NULL DEFAULT 'Ativo' |

Campos AUTO_INCREMENT e GENERATED são gerados pelo banco e não precisam ser enviados. NOT NULL sem DEFAULT exige valor no cadastro. Campos gerados são somente leitura. Em usuários, senha só é aceita em escrita e nunca aparece nas respostas.

## /api/cargos

Tabela: cargo. Chave: id_cargo.

Filtro obrigatório de listagem: nenhum. Outros campos persistidos podem ser usados como filtros exatos.

| Campo | Definição SQL e obrigatoriedade |
|---|---|
| id_cargo | int NOT NULL AUTO_INCREMENT |
| nome_cargo | varchar(100) NOT NULL |
| descricao | varchar(255) DEFAULT NULL |

Campos AUTO_INCREMENT e GENERATED são gerados pelo banco e não precisam ser enviados. NOT NULL sem DEFAULT exige valor no cadastro. Campos gerados são somente leitura. Em usuários, senha só é aceita em escrita e nunca aparece nas respostas.

## /api/obras

Tabela: obra. Chave: id_obra.

Filtro obrigatório de listagem: nenhum. Outros campos persistidos podem ser usados como filtros exatos.

| Campo | Definição SQL e obrigatoriedade |
|---|---|
| id_obra | int NOT NULL AUTO_INCREMENT |
| nome | varchar(150) NOT NULL |
| status | enum('Planejamento','Em Andamento','Concluida','Paralisada') DEFAULT NULL |
| id_construtora | int NOT NULL |
| categoria | enum('Residencial','Comercial','Industrial','Reforma') DEFAULT NULL |
| numero_pavimentos | int NOT NULL |
| data_inicio_planejada | date NOT NULL |
| data_termino_planejada | date NOT NULL |
| orcamento_planejado | decimal(10,2) NOT NULL |

Campos AUTO_INCREMENT e GENERATED são gerados pelo banco e não precisam ser enviados. NOT NULL sem DEFAULT exige valor no cadastro. Campos gerados são somente leitura. Em usuários, senha só é aceita em escrita e nunca aparece nas respostas.

## /api/equipes

Tabela: cadastro_de_equipes. Chave: id_cadastro_equipes.

Filtro obrigatório de listagem: nenhum. Outros campos persistidos podem ser usados como filtros exatos.

| Campo | Definição SQL e obrigatoriedade |
|---|---|
| id_cadastro_equipes | int NOT NULL AUTO_INCREMENT |
| nome_equipe | varchar(45) DEFAULT NULL |
| etapa_atuacao | enum('Mobilização','Infraestrutura','Supraestrutura e Alvenaria','Instalações','Revestimentos','Acabamentos') NOT NULL |
| quantidade_profissionais | int NOT NULL |
| custo_diario | decimal(10,2) NOT NULL |
| custo_mensal | decimal(10,2) NOT NULL |
| idobra | int DEFAULT NULL |
| id_construtora | INT; derivado da sessão, exige migração 001 |

Campos AUTO_INCREMENT e GENERATED são gerados pelo banco e não precisam ser enviados. NOT NULL sem DEFAULT exige valor no cadastro. Campos gerados são somente leitura. Em usuários, senha só é aceita em escrita e nunca aparece nas respostas.

## /api/insumos

Tabela: cadastro_de_insumos. Chave: id_insumos.

Filtro obrigatório de listagem: nenhum. Outros campos persistidos podem ser usados como filtros exatos.

| Campo | Definição SQL e obrigatoriedade |
|---|---|
| id_insumos | int NOT NULL AUTO_INCREMENT |
| nome | varchar(45) DEFAULT NULL |
| quantidade_disponivel | int DEFAULT NULL |
| valor_unitario | decimal(12,2) DEFAULT NULL |
| idobra | int DEFAULT NULL |
| id_construtora | INT; derivado da sessão, exige migração 001 |

Campos AUTO_INCREMENT e GENERATED são gerados pelo banco e não precisam ser enviados. NOT NULL sem DEFAULT exige valor no cadastro. Campos gerados são somente leitura. Em usuários, senha só é aceita em escrita e nunca aparece nas respostas.

## /api/maquinarios

Tabela: cadastro_de_maquinario. Chave: id_maquina.

Filtro obrigatório de listagem: nenhum. Outros campos persistidos podem ser usados como filtros exatos.

| Campo | Definição SQL e obrigatoriedade |
|---|---|
| id_maquina | int NOT NULL AUTO_INCREMENT |
| nome | varchar(45) NOT NULL |
| quantidade | int DEFAULT NULL |
| etapa_atuacao | enum('Mobilização','Infraestrutura','Supraestrutura e Alvenaria','Instalações','Revestimentos','Acabamentos') DEFAULT NULL |
| custo_diario | decimal(10,2) DEFAULT NULL |
| status | enum('Ativo','Inativo') DEFAULT NULL |
| idobra | int DEFAULT NULL |
| id_construtora | INT; derivado da sessão, exige migração 001 |

Campos AUTO_INCREMENT e GENERATED são gerados pelo banco e não precisam ser enviados. NOT NULL sem DEFAULT exige valor no cadastro. Campos gerados são somente leitura. Em usuários, senha só é aceita em escrita e nunca aparece nas respostas.

## /api/equipes-terceirizadas

Tabela: cadastro_de_equipes_terceirizadas. Chave: id_equipe_terceirizada.

Filtro obrigatório de listagem: nenhum. Outros campos persistidos podem ser usados como filtros exatos.

| Campo | Definição SQL e obrigatoriedade |
|---|---|
| id_equipe_terceirizada | int NOT NULL AUTO_INCREMENT |
| nome_equipe | varchar(255) NOT NULL |
| custo_diario_total | decimal(10,2) NOT NULL |
| id_obra | int NOT NULL |

Campos AUTO_INCREMENT e GENERATED são gerados pelo banco e não precisam ser enviados. NOT NULL sem DEFAULT exige valor no cadastro. Campos gerados são somente leitura. Em usuários, senha só é aceita em escrita e nunca aparece nas respostas.

## /api/etapas

Tabela: etapa. Chave: id_etapa.

Filtro obrigatório de listagem: nenhum. Outros campos persistidos podem ser usados como filtros exatos.

| Campo | Definição SQL e obrigatoriedade |
|---|---|
| id_etapa | int NOT NULL AUTO_INCREMENT |
| id_obra | int NOT NULL |
| nome_etapa | enum('Mobilização','Infraestrutura','Supraestrutura e Alvenaria','Instalações','Revestimentos','Acabamento') NOT NULL |
| descricao | text |

Campos AUTO_INCREMENT e GENERATED são gerados pelo banco e não precisam ser enviados. NOT NULL sem DEFAULT exige valor no cadastro. Campos gerados são somente leitura. Em usuários, senha só é aceita em escrita e nunca aparece nas respostas.

## /api/atividades-eap

Tabela: atividade_eap. Chave: id_atividade.

Filtro obrigatório de listagem: idx_obra. Outros campos persistidos podem ser usados como filtros exatos.

| Campo | Definição SQL e obrigatoriedade |
|---|---|
| id_atividade | int NOT NULL AUTO_INCREMENT |
| descricao | varchar(45) NOT NULL |
| idx_obra | int NOT NULL |

Campos AUTO_INCREMENT e GENERATED são gerados pelo banco e não precisam ser enviados. NOT NULL sem DEFAULT exige valor no cadastro. Campos gerados são somente leitura. Em usuários, senha só é aceita em escrita e nunca aparece nas respostas.

## /api/rdo

Tabela: rdo. Chave: id_rdo.

Filtro obrigatório de listagem: id_obra. Outros campos persistidos podem ser usados como filtros exatos.

| Campo | Definição SQL e obrigatoriedade |
|---|---|
| id_rdo | int NOT NULL AUTO_INCREMENT |
| id_obra | int NOT NULL |
| data_rdo | date NOT NULL |
| turno | enum('Manhã','Tarde','Noite','Integral') NOT NULL |
| clima | enum('Ensolarado','Nublado','Chuvoso','Impraticável') NOT NULL |

Campos AUTO_INCREMENT e GENERATED são gerados pelo banco e não precisam ser enviados. NOT NULL sem DEFAULT exige valor no cadastro. Campos gerados são somente leitura. Em usuários, senha só é aceita em escrita e nunca aparece nas respostas.

## /api/diarios-obra

Tabela: diario_obra. Chave: id_diario.

Filtro obrigatório de listagem: obrax_id. Outros campos persistidos podem ser usados como filtros exatos.

| Campo | Definição SQL e obrigatoriedade |
|---|---|
| id_diario | int NOT NULL AUTO_INCREMENT |
| data | date NOT NULL |
| clima | enum('Ensolarado','Chuvoso') DEFAULT NULL |
| turno | enum('Manhã','Tarde','Noite') DEFAULT NULL |
| etapa_atuacao | enum('Mobilização','Infraestrutura','Supraestrutura e Alvenaria','Instalações','Revestimentos','Acabamentos') DEFAULT NULL |
| equipe_interna | enum('A','B','C') DEFAULT NULL |
| equipe_terceirizada | enum('A','B','C') DEFAULT NULL |
| paralisacoes | text |
| origem_paralisacoes | varchar(255) DEFAULT NULL |
| atrasos | text |
| origem_atrasos | varchar(255) DEFAULT NULL |
| obrax_id | int NOT NULL |
| usuario_id | int NOT NULL |

Campos AUTO_INCREMENT e GENERATED são gerados pelo banco e não precisam ser enviados. NOT NULL sem DEFAULT exige valor no cadastro. Campos gerados são somente leitura. Em usuários, senha só é aceita em escrita e nunca aparece nas respostas.

## /api/apontamentos-fisicos

Tabela: apontamento_fisico. Chave: id_apontamento.

Filtro obrigatório de listagem: diario_id. Outros campos persistidos podem ser usados como filtros exatos.

| Campo | Definição SQL e obrigatoriedade |
|---|---|
| id_apontamento | int NOT NULL AUTO_INCREMENT |
| percentual_dia | decimal(5,2) NOT NULL |
| url_foto | varchar(512) NOT NULL |
| diario_id | int NOT NULL |
| atividade_eap_id | int NOT NULL |

Campos AUTO_INCREMENT e GENERATED são gerados pelo banco e não precisam ser enviados. NOT NULL sem DEFAULT exige valor no cadastro. Campos gerados são somente leitura. Em usuários, senha só é aceita em escrita e nunca aparece nas respostas.

## /api/apropriacoes

Tabela: apropriacao. Chave: id_apropriacao.

Filtro obrigatório de listagem: nenhum. Outros campos persistidos podem ser usados como filtros exatos.

| Campo | Definição SQL e obrigatoriedade |
|---|---|
| id_apropriacao | int NOT NULL AUTO_INCREMENT |
| quantidade_consumida | float DEFAULT NULL |
| tipo_compra | enum('Planejada','Emergencial') DEFAULT NULL |
| id_insumo | int NOT NULL |
| id_atividade | int NOT NULL |
| id_usuario | int NOT NULL |

Campos AUTO_INCREMENT e GENERATED são gerados pelo banco e não precisam ser enviados. NOT NULL sem DEFAULT exige valor no cadastro. Campos gerados são somente leitura. Em usuários, senha só é aceita em escrita e nunca aparece nas respostas.

## /api/orcamentos-previstos

Tabela: orcamento_previsto. Chave: id_orcamento.

Filtro obrigatório de listagem: id_atividade_eap. Outros campos persistidos podem ser usados como filtros exatos.

| Campo | Definição SQL e obrigatoriedade |
|---|---|
| id_orcamento | int NOT NULL |
| valor_planejado | decimal(15,2) NOT NULL |
| id_atividade_eap | int NOT NULL |

Campos AUTO_INCREMENT e GENERATED são gerados pelo banco e não precisam ser enviados. NOT NULL sem DEFAULT exige valor no cadastro. Campos gerados são somente leitura. Em usuários, senha só é aceita em escrita e nunca aparece nas respostas.

## /api/historico-obras

Tabela: historico_obras. Chave: id_historico.

Filtro obrigatório de listagem: id_obra. Outros campos persistidos podem ser usados como filtros exatos.

| Campo | Definição SQL e obrigatoriedade |
|---|---|
| id_historico | int NOT NULL AUTO_INCREMENT |
| usuario_id | int NOT NULL |
| id_obra | int NOT NULL |
| status | enum('iniciada','em andamento','concluida','pausada') NOT NULL DEFAULT 'em andamento' |
| data_atribuicao | timestamp NULL DEFAULT CURRENT_TIMESTAMP |
| data_fim | date DEFAULT NULL |

Campos AUTO_INCREMENT e GENERATED são gerados pelo banco e não precisam ser enviados. NOT NULL sem DEFAULT exige valor no cadastro. Campos gerados são somente leitura. Em usuários, senha só é aceita em escrita e nunca aparece nas respostas.

## /api/metricas-eva

Tabela: metricas_eva. Chave: id_metrica.

Filtro obrigatório de listagem: obra_idxx. Outros campos persistidos podem ser usados como filtros exatos.

| Campo | Definição SQL e obrigatoriedade |
|---|---|
| id_metrica | int NOT NULL AUTO_INCREMENT |
| data_calculo | date NOT NULL |
| idc | decimal(6,4) NOT NULL |
| idp | decimal(6,4) NOT NULL |
| eac | decimal(15,2) NOT NULL |
| obra_idxx | int DEFAULT NULL |

Campos AUTO_INCREMENT e GENERATED são gerados pelo banco e não precisam ser enviados. NOT NULL sem DEFAULT exige valor no cadastro. Campos gerados são somente leitura. Em usuários, senha só é aceita em escrita e nunca aparece nas respostas.

## /api/registro-relatorios

Tabela: registro_relatorios. Chave: id_registro_relatorio.

Filtro obrigatório de listagem: id_obra. Outros campos persistidos podem ser usados como filtros exatos.

| Campo | Definição SQL e obrigatoriedade |
|---|---|
| id_registro_relatorio | int NOT NULL AUTO_INCREMENT |
| id_diario | int NOT NULL |
| id_obra | int NOT NULL |
| data_registro | timestamp NULL DEFAULT CURRENT_TIMESTAMP |

Campos AUTO_INCREMENT e GENERATED são gerados pelo banco e não precisam ser enviados. NOT NULL sem DEFAULT exige valor no cadastro. Campos gerados são somente leitura. Em usuários, senha só é aceita em escrita e nunca aparece nas respostas.

## /api/custos-planejados

Tabela: custo_planejado. Chave: id_custo_planejado.

Filtro obrigatório de listagem: id_obra. Outros campos persistidos podem ser usados como filtros exatos.

| Campo | Definição SQL e obrigatoriedade |
|---|---|
| id_custo_planejado | int NOT NULL AUTO_INCREMENT |
| id_obra | int NOT NULL |
| etapa | enum('Mobilização','Infraestrutura','Supraestrutura e Alvenaria','Instalações','Revestimentos','Acabamento') NOT NULL |
| origem_custo | enum('Equipe','Insumo','Maquinário') NOT NULL |
| valor_planejado | decimal(10,2) NOT NULL |
| data_inicio_prevista | date NOT NULL |
| data_fim_prevista | date NOT NULL |

Campos AUTO_INCREMENT e GENERATED são gerados pelo banco e não precisam ser enviados. NOT NULL sem DEFAULT exige valor no cadastro. Campos gerados são somente leitura. Em usuários, senha só é aceita em escrita e nunca aparece nas respostas.

## /api/custos-realizados

Tabela: custo_realizado. Chave: id_custo_realizado.

Filtro obrigatório de listagem: id_obra ou id_rdo. Outros campos persistidos podem ser usados como filtros exatos.

| Campo | Definição SQL e obrigatoriedade |
|---|---|
| id_custo_realizado | int NOT NULL AUTO_INCREMENT |
| id_obra | int NOT NULL |
| id_etapa | int NOT NULL |
| id_rdo | int NOT NULL |
| origem_custo | enum('Equipe','Insumo','Maquinário') NOT NULL |
| id_origem | int NOT NULL |
| data | date NOT NULL |
| quantidade | decimal(10,2) NOT NULL |
| custo_unitario | decimal(10,2) NOT NULL |
| valor_total | decimal(12,2) GENERATED ALWAYS AS ((`quantidade` * `custo_unitario`)) STORED |

Campos AUTO_INCREMENT e GENERATED são gerados pelo banco e não precisam ser enviados. NOT NULL sem DEFAULT exige valor no cadastro. Campos gerados são somente leitura. Em usuários, senha só é aceita em escrita e nunca aparece nas respostas.

## /api/projecoes-financeiras

Tabela: projecao_financeira. Chave: id_projecao.

Filtro obrigatório de listagem: id_obra. Outros campos persistidos podem ser usados como filtros exatos.

| Campo | Definição SQL e obrigatoriedade |
|---|---|
| id_projecao | int NOT NULL AUTO_INCREMENT |
| id_obra | int NOT NULL |
| etapa | enum('Mobilização','Infraestrutura','Supraestrutura e Alvenaria','Instalações','Revestimentos','Acabamento','Nenhum') DEFAULT 'Nenhum' |
| data_projecao | date NOT NULL |
| custo_realizado | decimal(12,2) NOT NULL DEFAULT '0.00' |
| custo_restante_estimado | decimal(12,2) NOT NULL DEFAULT '0.00' |
| custo_final_projetado | decimal(12,2) GENERATED ALWAYS AS ((`custo_realizado` + `custo_restante_estimado`)) STORED |
| desvio_projetado | decimal(12,2) DEFAULT NULL |
| desvio_projetado_percentual | decimal(5,2) DEFAULT NULL |

Campos AUTO_INCREMENT e GENERATED são gerados pelo banco e não precisam ser enviados. NOT NULL sem DEFAULT exige valor no cadastro. Campos gerados são somente leitura. Em usuários, senha só é aceita em escrita e nunca aparece nas respostas.

## /api/rdo-equipes

Tabela: rdo_equipe. Chave: id_rdo_equipe.

Filtro obrigatório de listagem: id_rdo. Outros campos persistidos podem ser usados como filtros exatos.

| Campo | Definição SQL e obrigatoriedade |
|---|---|
| id_rdo_equipe | int NOT NULL AUTO_INCREMENT |
| id_rdo | int NOT NULL |
| id_equipe | int NOT NULL |
| etapa | enum('Mobilização','Infraestrutura','Supraestrutura e Alvenaria','Instalações','Revestimentos','Acabamento') NOT NULL |
| dias_atuacao | decimal(5,2) NOT NULL |

Campos AUTO_INCREMENT e GENERATED são gerados pelo banco e não precisam ser enviados. NOT NULL sem DEFAULT exige valor no cadastro. Campos gerados são somente leitura. Em usuários, senha só é aceita em escrita e nunca aparece nas respostas.

## /api/rdo-maquinarios

Tabela: rdo_maquinario. Chave: id_rdo_maquinario.

Filtro obrigatório de listagem: id_rdo. Outros campos persistidos podem ser usados como filtros exatos.

| Campo | Definição SQL e obrigatoriedade |
|---|---|
| id_rdo_maquinario | int NOT NULL AUTO_INCREMENT |
| id_rdo | int NOT NULL |
| id_maquinario | int NOT NULL |
| etapa | enum('Mobilização','Infraestrutura','Supraestrutura e Alvenaria','Instalações','Revestimentos','Acabamento') NOT NULL |
| quantidade_utilizada | decimal(10,2) NOT NULL |
| tempo_utilizacao | decimal(10,2) NOT NULL |

Campos AUTO_INCREMENT e GENERATED são gerados pelo banco e não precisam ser enviados. NOT NULL sem DEFAULT exige valor no cadastro. Campos gerados são somente leitura. Em usuários, senha só é aceita em escrita e nunca aparece nas respostas.

## /api/consumos-insumos

Tabela: consumo_insumo. Chave: id_consumo.

Filtro obrigatório de listagem: id_rdo. Outros campos persistidos podem ser usados como filtros exatos.

| Campo | Definição SQL e obrigatoriedade |
|---|---|
| id_consumo | int NOT NULL AUTO_INCREMENT |
| id_rdo | int NOT NULL |
| id_insumo | int NOT NULL |
| etapa | enum('Mobilização','Infraestrutura','Supraestrutura e Alvenaria','Instalações','Revestimentos','Acabamento') NOT NULL |
| quantidade_consumida | decimal(10,2) NOT NULL |
| custo_unitario | decimal(10,2) NOT NULL |
| custo_total | decimal(12,2) GENERATED ALWAYS AS ((`quantidade_consumida` * `custo_unitario`)) STORED |

Campos AUTO_INCREMENT e GENERATED são gerados pelo banco e não precisam ser enviados. NOT NULL sem DEFAULT exige valor no cadastro. Campos gerados são somente leitura. Em usuários, senha só é aceita em escrita e nunca aparece nas respostas.

## /api/atrasos

Tabela: atraso. Chave: id_atraso.

Filtro obrigatório de listagem: id_rdo. Outros campos persistidos podem ser usados como filtros exatos.

| Campo | Definição SQL e obrigatoriedade |
|---|---|
| id_atraso | int NOT NULL AUTO_INCREMENT |
| id_rdo | int NOT NULL |
| etapa | enum('Mobilização','Infraestrutura','Supraestrutura e Alvenaria','Instalações','Revestimentos','Acabamento') NOT NULL |
| origem_atraso | enum('Equipes','Insumos','Maquinários') NOT NULL |
| duracao | decimal(5,2) NOT NULL |
| descricao | varchar(255) DEFAULT NULL |

Campos AUTO_INCREMENT e GENERATED são gerados pelo banco e não precisam ser enviados. NOT NULL sem DEFAULT exige valor no cadastro. Campos gerados são somente leitura. Em usuários, senha só é aceita em escrita e nunca aparece nas respostas.

## /api/paralisacoes

Tabela: paralisacao. Chave: id_paralisacao.

Filtro obrigatório de listagem: id_rdo. Outros campos persistidos podem ser usados como filtros exatos.

| Campo | Definição SQL e obrigatoriedade |
|---|---|
| id_paralisacao | int NOT NULL AUTO_INCREMENT |
| id_rdo | int NOT NULL |
| etapa | enum('Mobilização','Infraestrutura','Supraestrutura e Alvenaria','Instalações','Revestimentos','Acabamento') NOT NULL |
| origem_paralisacao | enum('Condições Climáticas','Acidente no Trabalho') NOT NULL |
| duracao | decimal(5,2) NOT NULL |
| descricao | varchar(255) DEFAULT NULL |

Campos AUTO_INCREMENT e GENERATED são gerados pelo banco e não precisam ser enviados. NOT NULL sem DEFAULT exige valor no cadastro. Campos gerados são somente leitura. Em usuários, senha só é aceita em escrita e nunca aparece nas respostas.

## /api/equipes-etapas

Tabela: equipe_etapa. Chave: id_equipe_etapa.

Filtro obrigatório de listagem: nenhum. Outros campos persistidos podem ser usados como filtros exatos.

| Campo | Definição SQL e obrigatoriedade |
|---|---|
| id_equipe_etapa | int NOT NULL AUTO_INCREMENT |
| id_equipe | int NOT NULL |
| etapa | enum('Mobilização','Infraestrutura','Supraestrutura e Alvenaria','Instalações','Revestimentos','Acabamento') NOT NULL |
| data_inicio | date NOT NULL |
| data_fim | date NOT NULL |

Campos AUTO_INCREMENT e GENERATED são gerados pelo banco e não precisam ser enviados. NOT NULL sem DEFAULT exige valor no cadastro. Campos gerados são somente leitura. Em usuários, senha só é aceita em escrita e nunca aparece nas respostas.

## Aliases e particularidades

Obras aceita idconstrutora como alias de id_construtora na listagem. EAP aceita id_obra como alias de idx_obra. Diário aceita id_obra como alias de obrax_id no corpo e filtro. Filtros também aceitam os cabeçalhos legados correspondentes com hífen no lugar de underscore. Recursos aceitam idobra=null no filtro para listar os não atribuídos.

Em projeções, custo_realizado e desvios são recalculados; envie id_obra, data_projecao, custo_restante_estimado e etapa opcional. custo_final_projetado é gerado. Em construtoras, PUT atualiza cnpj/razao_social; DELETE desativa. Orçamento previsto exige id_orcamento positivo escolhido pelo cliente. O campo etapa usa os enums específicos de cada tabela; há diferença histórica entre Acabamento e Acabamentos.


## Inteligência Operacional — Escritório

- GET /api/inteligencia-operacional/filtros: opções reais da empresa autenticada; id_obra opcional, fonte=diario|rdo.
- GET /api/inteligencia-operacional: id_obra obrigatório; fonte=diario|rdo, inicio/fim, etapa, turno, clima, tipo=atraso|paralisacao, origem_atraso ou origem_paralisacao, agrupamento=dia|semana|mes.

Ambos exigem JWT, usuário/empresa ativos, perfil de gerência e ambiente Escritório, confirmados no banco. A resposta agregada fornece resumo, padroes, associacoes, impactos, tendencias e avisos. Filtros por id_equipe, id_maquinario ou id_insumo retornam 422, porque o esquema não comprova vínculo com a ocorrência. Impactos financeiros não determináveis são null. Métodos de escrita não são permitidos. Consulte ../../docs/IMPLEMENTACAO_INTELIGENCIA_OPERACIONAL.md.
