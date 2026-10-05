# Melhorias finais do Vértice

Revisão de 04/10/2026, limitada ao frontend e à inserção autorizada de dados de teste.

## Interface e comportamento

- Refinamentos no CSS existente: superfícies discretas, menos arredondamento, títulos, espaçamentos, contraste nos dois temas e tabelas com rolagem horizontal contida.
- Dashboard preserva os sete indicadores, com navegação para Obras, Equipes e Analytics. Nenhuma biblioteca ou gráfico novo foi adicionado.
- Recursos usa tabela no desktop. Equipes, Recursos e históricos possuem limpeza de filtros e contagens; Analytics conserva seus filtros, gráficos e cálculos, com contagem do recorte.
- Toast compartilhado acessível, em fluxo para não cobrir ações, fechamento manual e desaparecimento após 6,5 segundos. Erros continuam visíveis até correção ou nova tentativa.
- Skeleton simples apenas em Dashboard, Obras, Recursos e Home do Canteiro.
- Visão Geral separa informações, recursos e prazo de calendário. Datas ausentes ou inválidas não produzem percentuais. Indicadores distinguem ausência de valores realmente iguais a zero.
- Canteiro mantém ações rápidas, pendências e diários. A obra apresenta uma timeline discreta de registros reais já carregados.
- Rascunhos recebem salvamento local após 700 ms sem digitação, sem envio à API. Preservados salvamento manual, restauração, separação por usuário/obra e remoção após envio confirmado. Saída, troca de obra e logout protegem alterações ainda não salvas. Perfil informa a quantidade local e mantém o controle de tema.

## Arquivos frontend

Alterados: `src/App.jsx`, `src/theme.css`, `src/canteiro/useRegistro.js`, `src/layouts/CanteiroLayout.jsx`; componentes `escritorio/{Card,Layout,Sidebar}.jsx` e `canteiro/{EstadoObra,FormularioBase}.jsx`; páginas de Escritório `Dashboard`, `Obras`, `Equipes`, `Recursos`, `ObraDetalhes`, `AnalyticsFinanceiro`; páginas de Canteiro `HomeCanteiro`, `DetalheObra`, `HistoricoObras`, `RegistrosObra`, `CanteiroPerfil`, `CanteiroPendencias`.

Criados: `src/api/obraIndicadores.js`, `src/componentes/shared/{Toast,Skeleton,PrazoObra}.jsx`, `src/componentes/shared/useUnsavedChanges.js`, `src/componentes/canteiro/TimelineObra.jsx` e `tests/analytics.real.mjs`. Ampliados `tests/frontend.test.mjs` e `tests/canteiro.browser.mjs`; evidências em `tests/screenshots/` e `tests/canteiro-browser-result.json`.

## Seed executado

Arquivo: `../seed_analytics_teste.sql`, na raiz do projeto. Executado no MySQL local, banco `valen`, usando a construtora existente de ID 1. Inseridos 384 registros no total. Segunda execução: zero inserções. Conferência: zero vínculos inconsistentes.

| Entidade | Quantidade |
| --- | ---: |
| Obras de teste | 6 |
| Insumos | 30 |
| Equipes | 18 |
| Maquinários | 18 |
| Etapas | 36 |
| Custos planejados | 108 |
| Custos realizados | 126 |
| RDOs | 42 |

O arquivo usa INSERT, variáveis MySQL e SELECT de conferência. Não modifica dados existentes. Nomes começam com `Vértice Teste -`; NOT EXISTS evita duplicações e reutiliza IDs reais. Datas distribuídas entre janeiro e outubro de 2026, com outubro limitado ao dia 2.

## Validação e limites

`node --test tests/frontend.test.mjs`: 9 testes aprovados. `npm.cmd run build`: aprovado. `node tests/analytics.real.mjs`: seis obras conferidas pela API real, incluindo totais, cenários, etapas, origens, evolução e filtros, somente por leitura.

A suíte `node tests/canteiro.browser.mjs --analytics-real` passou em 31 cenários, sem exceções ou avisos React. Inclui as larguras 375, 430, 768, 1024 e 1366, detalhes da obra, fluxo de rascunhos, formulários, CRUD com API simulada e Analytics no MySQL real. Foram registradas 438 consultas reais e nenhuma gravação pela API. Evidência: `tests/canteiro-browser-result.json`.

Após o último refinamento de CSS, `node tests/canteiro.browser.mjs --analytics-only` passou novamente nas seis obras reais e cinco larguras, verificando que valores financeiros não são cortados. Capturas nos temas claro e escuro em `tests/screenshots/analytics-real-1366.png` e `tests/screenshots/analytics-real-dark.png`; resultado em `tests/analytics-real-browser-result.json`. Build final aprovado e `git diff --check` sem erros.

Limites preservados: rascunhos dependem do armazenamento deste navegador; prazo é de calendário, sem estimativa física; projeção financeira mantém a metodologia existente baseada nos dias com lançamentos e pode variar bastante com histórico esparso. O seed não corrige registros preexistentes. A configuração atual de conexão possui uma senha literal de fallback no backend, que permaneceu intacto por restrição de escopo.

Nenhuma dependência instalada. Nenhum commit ou push realizado.

Backend não foi alterado.

Estrutura do banco de dados não foi alterada.
