# Atualização do banco — 28/10/2026

Após a solicitação para completar o banco e a confirmação de que as duas contas de teste não eram necessárias, as três migrações foram aplicadas ao valen, com backup prévio. As contas 13 e 14 foram preservadas e desativadas, com e-mails marcadores distintos. Não houve exclusão de registros nem criação de bancos.

Backup: C:/Users/labredes.cisss/.codex/backups/vertice/valen-2026-10-28T12-46-44-318Z.sql. Esse arquivo contém dados privados e deve permanecer fora do Git.

Verificação posterior: npm.cmd run db:check aprovado; zero grupos de e-mails duplicados; 39 chaves estrangeiras. Recursos: 13 equipes, 18 insumos e 13 máquinas. A equipe 1 e a máquina 1 continuam sem construtora: não há obra nem histórico que permita deduzir sua propriedade com segurança. Nenhuma empresa foi inventada para esses registros.

O banco valen_testes continua pendente. Não foram executados testes de escrita no valen. As pendências de migração e a afirmação de ausência de alterações no banco, nas seções históricas abaixo, referem-se à entrega anterior e foram superadas por esta atualização.

---

# Relatório de implementação e auditoria — 28/10/2026

## 1. Situação inicial confirmada

Workspace na main, sem alterações iniciais. Estrutura real em backend/controllers, models, routes, config e middlewares, sem backend/src. Todas as áreas citadas já tinham rotas e CRUD básico, incluindo finanças, mas vários handlers não verificavam empresa, relacionamentos ou valores. Já existiam bcrypt e emissão JWT. O dotenv era carregado cedo e pelo caminho correto; o problema real do login era ausência de JWT_SECRET no .env local. package.json não tinha npm test. Os testes da main dependiam de Jest/supertest sem configuração compatível com Node Test Runner.

Comparação somente leitura de main com origin/feature/seguranca-recursos identificou validações, modelos de recursos por empresa, migração e suítes Node ausentes da main. Foram aproveitados 39 arquivos pertinentes do backend, revisados e complementados. Não houve merge nem mudança de branch. Arquivos estranhos e mudanças do frontend da outra branch não foram incorporados.

## 2. Problemas encontrados

- JWT_SECRET inexistente, embora o .env fosse carregado corretamente.
- Credencial padrão no código de conexão; conexão única compartilhada, sem isolamento transacional por requisição.
- Listagens globais e consultas por ID sem verificação uniforme de propriedade.
- Cadastro público permitia solicitar empresa e perfil privilegiado.
- Custos realizados não validavam o recurso polimórfico id_origem.
- Fluxos de campo e finanças aceitavam vínculos incompatíveis e valores inválidos.
- Respostas de texto eram incompatíveis com o cliente React que exige JSON.
- Ausência de proteção uniforme para testes manuais e de comando npm test.
- Banco valen_testes ausente. Esquema valen sem as migrações de propriedade dos recursos, precisão de preço, e-mail único e estado da construtora.
- Logs de payload e erro SQL completo; CORS irrestrito; ausência de limite de login.

## 3. Correções realizadas e funcionalidades implementadas

- Chave JWT criptograficamente segura gerada no .env local ignorado pelo Git. O valor não foi exibido ou incluído na documentação. Configuração centralizada, sem segredo fixo e com falha antecipada quando a chave é inválida. Verificação restrita a HS256.
- Pool MySQL sem senha padrão. Escritas autenticadas usam transação e a mesma conexão via AsyncLocalStorage; bloqueio por construtora evita corrida entre validação de saldo e gravação.
- Autorização aplicada globalmente às 27 áreas, com estado e vínculo do usuário relidos do banco e bloqueio de construtora inativa. Listagens SQL restritas por empresa e consultas/escritas por ID autorizadas antes dos controllers existentes, inclusive em caminhos com maiúsculas.
- Cadastro público gera conta inativa sem empresa ou privilégios. Gerência pode cadastrar e aprovar usuários da sua própria empresa. Atualização parcial não reprocessa o hash existente. Usuários e construtoras são desativados sem apagar dados.
- Matriz de gerência, operação de campo e leitura, descrita no README. Catálogo global de cargos é somente leitura na API empresarial. Provisionamento de outras empresas permanece administrativo.
- CRUD e transferências de equipes, insumos e máquinas com propriedade preservada, atribuição/desatribuição e validação da obra destinatária.
- Validação de datas reais, intervalos, enums, textos, valores negativos, precisão e multiplicações financeiras; tipos derivados do esquema existente, sem extrair dados do dump.
- Verificação conjunta de obra, etapa, RDO e recurso de origem no custo realizado. Relacionamentos do diário, EAP, apropriação, relatórios e demais registros devem pertencer à mesma empresa/obra quando aplicável.
- Consumo e apropriação não podem superar a capacidade de estoque cadastrada; reduzir estoque abaixo do consumo é recusado. Uso de máquina verifica estado e quantidade. Progresso acumulado por atividade não pode ultrapassar 100%.
- Projeções usam o custo realizado do livro até a data escolhida, restante estimado informado e soma gerada pelo banco. Desvios seguem o sinal já usado pelo frontend. Valores indefinidos permanecem null.
- Respostas JSON e mensagens de erro uniformes, limite de corpo, CORS configurável e limitação de tentativas de login. Logs não incluem payloads nem erros SQL completos.
- Filtros obrigatórios e aliases usados pelo frontend foram preservados. Nenhum arquivo do React foi alterado.
- Scripts de testes separados por finalidade e verificador de esquema somente leitura. Documentação de configuração, endpoints, tipos, exemplos, migrações e decisões pendentes.

## 4. Checklist de revisão

- [x] Auditar código presente e comparar branches sem alterá-las.
- [x] Resolver configuração JWT local e validar importação da aplicação.
- [x] Revisar usuários, construtoras, obras, equipes, insumos e máquinas.
- [x] Proteger EAP, etapas, RDO, diário, vínculos, consumo e ocorrências.
- [x] Validar custos planejados/realizados, orçamentos e apropriações.
- [x] Implementar cálculo verificável de projeções e registrar limites de EVA.
- [x] Conferir contratos do React e padronizar JSON no backend.
- [x] Inspecionar colunas, índices necessários e FKs reais em modo somente leitura.
- [x] Criar migrações separadas, sem executá-las.
- [x] Executar testes automatizados sem banco real.
- [ ] Aplicar migrações após aprovação administrativa e backup.
- [ ] Disponibilizar valen_testes e validar CRUD, transações e SQL com MySQL real.
- [ ] Confirmar regras externas para EVA, conciliação de consumo e provisionamento.

## 5. Banco e migrações

A inspeção somente leitura encontrou 36 FKs no valen e nenhuma FK ausente em relação ao dump existente. As colunas originais conferem com o dump. O verificador adicional encontrou exatamente as seguintes pendências: construtora.status; id_construtora em cadastro_de_equipes, cadastro_de_insumos e cadastro_de_maquinario; valor_unitario decimal nos insumos; índice único de usuario.email.

Migrações preparadas: 001_recursos_construtora.sql, 002_precisao_email.sql e 003_status_construtora.sql. Leia as pré-condições no README. Não foram aplicadas; nenhum banco foi criado, apagado ou recriado. Não foram gravados dados no valen. Enquanto as migrações estiverem pendentes, rotas que dependem das novas colunas não estão prontas para uso nesse banco.

## 6. Evidências de validação

- npm.cmd ci --ignore-scripts --no-audit --no-fund: dependências instaladas a partir do lockfile.
- npm.cmd test: **251 testes aprovados, 0 reprovados, 0 ignorados**, na execução final.
- Os testes incluem HTTP com MySQL simulado e validações puras. Não comprovam execução real das consultas SQL nem substituem integração com MySQL.
- npm.cmd run test:integration: bloqueado antes das suítes por **ER_BAD_DB_ERROR**, pois valen_testes não existe. Zero testes de integração executados; esse bloqueio não foi contado como aprovação ou reprovação de casos.
- npm.cmd run db:check: executado em modo somente leitura; sinalizou as migrações pendentes descritas acima.
- Verificação de sintaxe dos arquivos JS das áreas alteradas: sem erros. Importação da aplicação confirmou carregamento de JWT_SECRET com tamanho suficiente, sem imprimir seu conteúdo.
- Suítes Node históricas foram mantidas para integração; testes de usuários/construtoras refletem aprovação e desativação. Arquivos Jest legados foram mantidos e protegidos, mas precisam ser portados antes de usar o runner Node e o pool. Não foram removidos para obter aprovação.

## 7. Pendências e limites

A entrega não pode ser declarada 100% validada com MySQL: faltam o banco de testes e a aplicação controlada das migrações. Os testes simulados cobrem a autorização e os fluxos da aplicação, mas erros de dialeto, restrições reais, deadlocks e desempenho precisam de integração.

EVA permanece como registro de métricas validadas e isoladas. Cálculo automático requer definir linha de base temporal, pesos da EAP e política de EAC. Não foram inventadas essas regras. Dependências hierárquicas de EAP não existem no esquema e não foram criadas sem requisito de negócio.

Apropriação e consumo são tratados como registros que comprometem o estoque cadastrado. Se representam o mesmo evento físico, a deduplicação exige vínculo ou política ainda ausente. Também faltam unidades inequívocas para duração de atrasos e uso de máquinas; não foi inventada conversão monetária dessas ocorrências.

A primeira empresa/gerência e manutenção do catálogo global precisam de provisionamento administrativo. Convites e verificação de identidade de cadastros pendentes não foram implementados sem definição de fluxo. A matriz de perfis usa a ocupação textual existente; novos perfis exigem uma decisão explícita.

O limite de login está em memória por processo. Transações serializam escritas da mesma construtora; concorrência e escala devem ser avaliadas no banco de testes. Os models legados dependem da fronteira global de segurança para autorização; novos pontos de entrada devem obrigatoriamente usar a mesma fronteira ou consultas próprias com escopo.

## 8. Arquivos criados

- backend/.env.example
- backend/README.md
- backend/config/env.js
- backend/config/filtros.js
- backend/config/recursos.js
- backend/config/schema.json
- backend/docs/API.md
- backend/middlewares/exigirConstrutora.js
- backend/middlewares/limitarLogin.js
- backend/middlewares/respostas.js
- backend/middlewares/seguranca.js
- backend/migrations/001_recursos_construtora.sql
- backend/migrations/002_precisao_email.sql
- backend/migrations/003_status_construtora.sql
- backend/scripts/check-schema.js
- backend/scripts/test-integration.js
- backend/tests/construtoras.test.js
- backend/tests/custosPlanejados.test.js
- backend/tests/diarioObra.test.js
- backend/tests/eap.test.js
- backend/tests/equipes.construtora.test.js
- backend/tests/maquinarios.construtora.test.js
- backend/tests/obras.test.js
- backend/tests/orcamentosPrevistos.test.js
- backend/tests/rdo.test.js
- backend/tests/rdoEquipes.test.js
- backend/tests/rdoMaquinarios.test.js
- backend/tests/recursos.test.js
- backend/tests/unit/api.test.js
- backend/tests/unit/validacao.test.js
- backend/tests/usuarios.test.js
- backend/utils/financeiro.js
- backend/utils/validar.js
- backend/RELATORIO_BACKEND.md

## 9. Arquivos modificados

- backend/app.js
- backend/config/connection.js
- backend/controllers/apontamentoFisicoController.js
- backend/controllers/atividadeEapController.js
- backend/controllers/construtoraController.js
- backend/controllers/custoPlanejadoController.js
- backend/controllers/custoRealizadoController.js
- backend/controllers/diarioObraController.js
- backend/controllers/equipeController.js
- backend/controllers/insumosController.js
- backend/controllers/maquinarioController.js
- backend/controllers/obraController.js
- backend/controllers/orcamentoPrevistoController.js
- backend/controllers/projecaoFinanceiraController.js
- backend/controllers/rdoController.js
- backend/controllers/rdoEquipeController.js
- backend/controllers/rdoMaquinarioController.js
- backend/controllers/registroRelatoriosController.js
- backend/controllers/usuarioController.js
- backend/middlewares/autenticar.js
- backend/models/construtoraModel.js
- backend/models/custoPlanejadoModel.js
- backend/models/custoRealizadoModel.js
- backend/models/equipeModel.js
- backend/models/insumosModel.js
- backend/models/maquinarioModel.js
- backend/models/usuarioModel.js
- backend/package-lock.json
- backend/package.json
- backend/routes/custoPlanejadoRoutes.js
- backend/routes/custoRealizadoRoutes.js
- backend/routes/equipeRoutes.js
- backend/routes/insumoRoutes.js
- backend/routes/maquinarioRoutes.js
- backend/tests/api.complete.test.js
- backend/tests/api.legacy.js

Além desses arquivos, backend/.env foi atualizado localmente com a chave JWT e continua ignorado pelo Git. Não há credenciais reais no .env.example.

## 10. Passos para executar

1. Conferir backend/.env e a origem do frontend em CORS_ORIGINS. As dependências já foram instaladas neste workspace.
2. Revisar e aplicar manualmente as migrações 001, 002 e 003 no banco alvo, após backup e verificação das pré-condições. Não executar o dump bd.sql sobre dados existentes.
3. Executar npm.cmd run db:check dentro de backend e resolver qualquer pendência.
4. Executar npm.cmd start; a API usa a porta 3000 por padrão.
5. Um administrador deve disponibilizar valen_testes com o esquema compatível. Executar npm.cmd test e npm.cmd run test:integration. Nunca apontar integração para valen.
6. Realizar a homologação com React, validar os perfis reais e confirmar as decisões de domínio pendentes.

Referências locais: README.md e docs/API.md. Não houve commit, push, merge, rebase, reset, clean nem alteração de branch.
