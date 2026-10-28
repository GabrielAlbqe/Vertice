# Backend VÉRTICE

Node.js 22+, npm e MySQL 8. Arquitetura Express com controllers, models e routes existentes; entrada em app.js. Configuração em config; autenticação, autorização e transações em middlewares; migrações em migrations; testes HTTP e unitários em tests/unit.

## Instalação e configuração

No diretório backend:

~~~powershell
npm.cmd ci
Copy-Item .env.example .env
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
~~~

Preserve um .env existente. Configure DB_HOST, DB_USER, DB_PASSWORD, DB_NAME=valen e JWT_SECRET com o resultado do gerador. Não compartilhe a chave. JWT_SECRET deve ter ao menos 32 bytes; sua ausência impede a inicialização. A chave local deste workspace já foi gerada. O carregamento usa caminho absoluto relativo ao backend, independentemente do diretório de execução. Variáveis do processo têm precedência sobre o arquivo.

PORT usa 3000 por padrão. CORS_ORIGINS aceita origens separadas por vírgula; padrão http://localhost:5173 e http://127.0.0.1:5173. Acrescente a origem real do frontend quando necessário. NODE_ENV=test exige DB_NAME=valen_testes antes de construir qualquer conexão. Não há senha padrão no código. Use uma conta MySQL restrita às tabelas da aplicação.

## Migrações manuais

As migrações abaixo foram aplicadas ao valen deste workspace em 28/10/2026, após backup e autorização. Em outro banco, faça backup, confirme SELECT DATABASE() e verifique SHOW COLUMNS antes de aplicar cada arquivo uma única vez, em ordem:

1. migrations/001_recursos_construtora.sql: adiciona empresa a equipes, insumos e máquinas; preenche apenas vínculos identificáveis pela obra. Recursos órfãos permanecem sem proprietário e invisíveis até conciliação administrativa.
2. migrations/002_precisao_email.sql: índice único de e-mail e preço unitário decimal. Consulte as duplicidades com a query comentada no arquivo, resolva-as preservando dados e normalize e-mails legados antes do índice. O índice usa a collation já definida no banco.
3. migrations/003_status_construtora.sql: estado Ativo/Inativo das empresas; empresas existentes começam ativas. A desativação conserva os dados e bloqueia o acesso dos usuários vinculados.

Não execute bd.sql sobre um banco existente: é um dump histórico com DROP TABLE e dados, não uma migração. No valen local, as três migrações já foram aplicadas; não execute novamente os mesmos ALTER TABLE. ALTER TABLE pode bloquear escrita e executar commits implícitos; aplique em janela controlada. Não há rollback destrutivo automático.

~~~powershell
npm.cmd run db:check
npm.cmd start
~~~

O verificador consulta apenas information_schema. O pool usa consultas parametrizadas, datas como texto e DECIMAL como string, preservando precisão. Cada escrita autenticada usa conexão dedicada e transação, com bloqueio da empresa para serializar validação e gravação. Esse bloqueio favorece consistência e pode limitar concorrência por empresa. O health público indica que a API responde, sem afirmar conexão ao banco.

## Autenticação e perfis

POST /api/usuarios/login recebe e-mail e senha e retorna usuario sem hash e token HS256 válido por 8h. Envie Authorization: Bearer TOKEN nas rotas privadas. Estado, vínculo empresarial e perfil são relidos do banco; um token antigo não conserva acesso após desativação ou alteração do vínculo. A limitação de login permite 30 requisições POST por IP em 15 minutos, em memória por processo. Em múltiplas instâncias, configure uma solução compartilhada e o proxy de confiança antes de alterar req.ip.

Cadastro público em POST /api/usuarios/insert cria conta Inativo, sem construtora, ocupação ou ambiente, mesmo que o cliente tente definir esses campos. Retorna insertId para acompanhamento. Uma gerência autenticada pode criar diretamente contas da sua empresa no mesmo endpoint enviando Bearer; também pode aprovar um cadastro pendente por PUT /api/usuarios/insert/ID com status Ativo, idconstrutora da própria empresa e ocupacao/ambiente. O ID pendente deve ser recebido pelo processo administrativo; não existe listagem pública de contas pendentes. Verificação de identidade e convite por e-mail exigem definição externa.

O primeiro gestor e a primeira construtora devem ser provisionados de forma controlada por administrador do banco, com senha bcrypt gerada localmente. Uma gerência empresarial não pode criar outras construtoras. Cargos são catálogo global somente leitura na API; manutenção exige provisionamento administrativo. Essas restrições evitam conceder privilégios de plataforma a gestores empresariais.

Perfis reconhecidos em ocupacao:

- Gerência, gerente, administrador, administradora e admin: gestão da própria construtora.
- Operacional, engenheiro, engenheira e mestre de obras: criação e manutenção de RDO, vínculos do RDO, consumo, diário, apontamentos, atrasos, paralisações e registros de relatórios na própria empresa.
- Demais ocupações: leitura. Todo usuário ativo pode editar nome, e-mail e senha da própria conta.

Gerência ignora acentos e maiúsculas. Ambiente não concede privilégios. A ocupação é texto livre no esquema atual; ampliar os perfis exige revisar a matriz explicitamente. Senhas novas exigem 8 caracteres e no máximo 72 bytes, usando bcrypt custo 12. Senhas legadas são migradas após login correto. DELETE de usuário ou construtora desativa o registro; as outras exclusões seguem as FKs existentes.

## API e frontend

Consulte docs/API.md para todos os campos, filtros, tipos e métodos. Caminhos existentes foram preservados. Respostas são JSON: listagens retornam arrays, consultas retornam objeto e escritas retornam mensagem, eventualmente insertId. Erros usam {"message":"..."}, com HTTP 400, 401, 403, 404, 429 ou 500. Detalhes SQL e credenciais não são devolvidos. Recursos de outra empresa retornam 404; uma consulta filtrada por outra empresa pode retornar array vazio.

Exemplo de login (valores fictícios):

~~~http
POST /api/usuarios/login
Content-Type: application/json

{"email":"gestor@exemplo.local","senha":"SENHA_CONFIGURADA_LOCALMENTE"}
~~~

~~~json
{"message":"Login realizado com sucesso!","usuario":{"id_usuario":1,"nome":"Gestor","idconstrutora":1},"token":"TOKEN_DA_SESSAO"}
~~~

Exemplo de custo realizado:

~~~http
POST /api/custos-realizados/insert
Authorization: Bearer TOKEN_DA_SESSAO
Content-Type: application/json

{"id_obra":1,"id_etapa":1,"id_rdo":1,"origem_custo":"Insumo","id_origem":1,"data":"2026-10-28","quantidade":2,"custo_unitario":10.25}
~~~

~~~json
{"message":"Custo realizado registrado com sucesso!","insertId":123}
~~~

Os IDs devem existir na empresa autenticada; etapa, RDO e origem devem pertencer à mesma obra. valor_total é gerado pelo MySQL. Não se aceita preço negativo, data inexistente ou produto além do limite DECIMAL.

Exemplo de listagem: GET /api/custos-realizados?id_obra=1, com Bearer. Transferências de recursos usam PATCH /api/equipes/ID/obra (também insumos e maquinarios), com {"idobra":2} ou {"idobra":null}; empresa proprietária é definida pelo servidor e preservada. Históricos não são reescritos pela transferência.

O React não foi alterado. O wrapper de respostas transforma os textos legados em JSON, pois o cliente rejeita respostas de texto mesmo em sucesso. A tela de cadastro já envia Bearer quando há sessão de gerência. Cadastro anônimo não dá acesso imediato; a mensagem retornada informa aprovação pendente.

## Financeiro e decisões de domínio

Orçamentos previstos se vinculam à EAP; id_orcamento continua obrigatório porque a PK existente não é AUTO_INCREMENT. Custos planejados se vinculam à obra e ao nome enumerado da etapa. Custos realizados validam obra, etapa, RDO e recurso de origem; o total usa a coluna gerada existente.

Ao salvar projeção, custo_realizado é recalculado do livro custo_realizado até data_projecao, opcionalmente por etapa. custo_restante_estimado é informado pela gerência. custo_final_projetado é a soma gerada pelo MySQL. O desvio usa custo final menos soma do planejamento; sem etapa e sem planejamento detalhado usa orcamento_planejado da obra, conforme o contrato já existente no frontend. O percentual é desvio dividido pelo planejado vezes 100. Sem base válida, ou com base zero, o percentual é null. Percentuais além de DECIMAL(5,2) ficam null; valores monetários excedentes são rejeitados. A projeção é um retrato na data de gravação; alterações posteriores do livro não reescrevem retratos antigos.

A soma de apropriações e consumos não pode exceder quantidade_disponivel cadastrada; a quantidade é tratada como capacidade cadastrada, sem uma segunda baixa automática no campo. Se ambos os fluxos registram o MESMO consumo físico, é necessário definir a conciliação para evitar dupla contagem. Não há vínculo no esquema que permita deduplicá-los de forma confiável. O progresso físico acumulado por atividade não pode exceder 100%.

Métricas EVA existentes têm CRUD, isolamento e validação. Não foi inventado recálculo automático de IDC, IDP ou EAC: faltam definição da linha de base temporal, pesos físicos da EAP e política de previsão. Confirmar essas decisões é necessário para prometer indicadores EVA derivados e consistentes. Não foi criada hierarquia de dependências da EAP porque o esquema só registra descrição e obra.

## Testes

~~~powershell
npm.cmd test
npm.cmd run test:integration
~~~

Em shells sem bloqueio do PowerShell, npm pode substituir npm.cmd. npm test executa validações e HTTP com adaptador MySQL simulado, sem conexão a banco real. Resultado verificado: 251 aprovados, 0 reprovados. Inclui autenticação, cadastro público, perfis, todas as áreas privadas, tentativas de acesso entre empresas, vínculos, valores e projeções.

A integração usa exclusivamente valen_testes e confirma SELECT DATABASE() antes das fixtures. O comando faz uma verificação somente leitura antes de iniciar qualquer suíte. O banco valen_testes não existe neste ambiente: execução bloqueada com ER_BAD_DB_ERROR, sem criar banco nem rodar testes de integração. Um administrador deve disponibilizar esse banco com o esquema compatível e as três migrações. Não foi validado CRUD real com MySQL nem o comportamento das migrações aplicadas.

As suítes Node históricas da branch de segurança foram preservadas em tests/*.test.js; seus testes de cadastro gerenciado e desativação foram ajustados ao contrato seguro. Os dois arquivos Jest antigos foram preservados com bloqueio de ambiente e não fazem parte do runner Node: dependem de Jest e têm pressupostos antigos de autenticação/fixtures. A suíte api.complete ainda usa LAST_INSERT_ID de sessão, incompatível com pressupor conexão única no pool; precisa ser portada antes de voltar ao runner. Nenhum resultado dessas suítes legadas foi contado como aprovado.

Veja RELATORIO_BACKEND.md para auditoria, arquivos alterados e pendências de entrega.


## Inteligência Operacional

Disponível no menu do Escritório em /escritorio/inteligencia-operacional para gerência com vínculo ativo. Endpoints GET /api/inteligencia-operacional e GET /api/inteligencia-operacional/filtros. Consultas somente leitura, fontes diário/RDO separadas e indicadores calculados no servidor. Não exige migração adicional. Veja [implementação, fórmulas e validação](../docs/IMPLEMENTACAO_INTELIGENCIA_OPERACIONAL.md).
