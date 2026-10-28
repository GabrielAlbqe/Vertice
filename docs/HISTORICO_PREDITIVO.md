# Histórico Preditivo — primeira versão sem alterações no banco

Implementado em 28/10/2026. Rota da interface: /escritorio/historico-preditivo. Acesso no menu Análises. Endpoint GET /api/historico-preditivo?id_obra=...&fonte=diario|rdo&inicio=...&fim=....

## Escopo entregue
- Consulta por obra, fonte operacional e período.
- Séries de custos diários e acumulados, com gráfico e tabela.
- Histórico dos registros existentes de IDC, IDP e EAC, explicitamente sem certificação de fórmula ou autoria; gráfico de EAC e tabela.
- Dias observados, documentos e ocorrências por fonte, mantendo diário separado do RDO.
- Comparação da recorrência entre duas janelas com igual quantidade de dias documentados. Mínimo: seis dias. Se o total for ímpar, o dia central não entra na comparação. Não há preenchimento de lacunas com zeros.
- Sinais de aumento observado da recorrência, IDC/IDP registrados abaixo de 1 e custos acumulados superiores ao orçamento.
- Auditoria de valores ausentes/inválidos e múltiplos indicadores na mesma data. Duplicados permanecem na tabela, sem eleger um registro oficial.
- Simulação local: custo acumulado + custo restante informado pelo gestor × (1 + variação / 100). Nenhum POST ou armazenamento de cenário.
- Identificação explícita de obras [DEMO]. Não há treinamento de modelo nem combinação entre obras.

## Banco preservado
Nenhuma migração, tabela, coluna, índice, registro, usuário ou senha foi alterado nesta entrega. O módulo contém apenas SELECT parametrizado, com escopo de construtora e obra. O backend foi reiniciado para carregar o código novo.

Histórico é reconstruído das tabelas existentes; não equivale a snapshots imutáveis. Edições futuras nos registros originais afetam consultas posteriores. A data inicial limita a exibição dos custos, mantendo o acumulado desde o início; a data final limita as consultas financeiras. Os indicadores EVA e a operação respeitam o período selecionado.

Sem custos registrados, a soma dos lançamentos é zero; isso não certifica que a obra não teve despesas não registradas. RUP não é calculada com dias de atuação: faltam homens-hora e volumes por unidade de serviço.

## Segurança e verificação
A autorização reutiliza o controle da Inteligência Operacional: usuário e construtora ativos, perfil de gerência no Escritório e vínculo atualizado compatível com o token. Obra não autorizada é rejeitada antes da consulta de indicadores. Métodos de escrita são bloqueados; respostas não são armazenadas em cache HTTP.

Testes automatizados usam objetos e banco simulado, sem acesso ao MySQL produtivo. Incluem autenticação, vínculo antigo, isolamento, filtros inválidos, ausência de dados, duplicidade EVA, custo acumulado, cenários e fluxos DOM.

Verificação real somente por GET na obra demo 18: 24 dias, 15 ocorrências, três registros EVA e R$ 62.842,00 de custos acumulados, em ambas as fontes. Build do frontend aprovado. Navegador visual automatizado permanece limitado pela política Sophos do ambiente; validação da interface feita por DOM.

## Requisitos ainda dependentes de estrutura ou regras
Esta versão atende parcialmente ao BI temporal e à detecção de tendências observadas. Não certifica o motor preditivo completo.
- Snapshots imutáveis, alertas persistentes e execução diária exigem estratégia de armazenamento e agendamento.
- EVA automático exige definição e rastreio de valor agregado e valor planejado por data.
- RUP exige homens-hora, quantidade executada e unidade por serviço.
- Índice consolidado exige fórmula e pesos aprovados.
- Previsões de prazo, probabilidades de risco, limiares por projeto, validação de erro máximo de 15% e taxa de falsos positivos exigem regras, dados reais e avaliação retrospectiva.
- Cenários de prazo e produtividade não são inferidos de uma variação financeira.
- Offline, inspeções, retrabalho, fornecedores, infraestrutura de nuvem, disponibilidade e backups automáticos continuam sendo escopos próprios; não são implementados por esta página.
