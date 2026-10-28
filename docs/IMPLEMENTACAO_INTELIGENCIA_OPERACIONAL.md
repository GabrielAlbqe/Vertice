# Inteligência Operacional — implementação e validação

Data: 28/10/2026. Área: Escritório. A especificação usada foi a missão completa fornecida nesta conversa. O arquivo adicional docs/InteligenciaOperacional.md não estava presente na auditoria; o usuário autorizou expressamente seguir as fórmulas e restrições da missão.

## Entrega efetiva

A opção **Inteligência Operacional**, ao lado de Analytics Financeiro no menu do Escritório, abre /escritorio/inteligencia-operacional. A página usa Layout, Sidebar, Card, sessão JWT, componentes e variáveis de tema existentes. Não utiliza dados fictícios em produção, biblioteca nova de gráficos ou gravações analíticas no banco.

Foram implementadas as quatro áreas:

1. Padrões de improdutividade: grupos por obra, etapa-padrão, origem, tipo e turno; quantidade, frequência relativa, recorrência, duração acumulada e média, com ordenação por quantidade, recorrência ou duração.
2. Associação operacional: fatores diretamente registrados — turno, clima, etapa e período — associados aos eventos do padrão, com contagem e taxa. A interface não transforma presença de recurso no RDO em associação ou causalidade.
3. Impacto operacional: duração total, duração de atrasos/paralisações e distribuição por etapa. Impactos financeiros e participação no impacto ficam explicitamente indisponíveis nas condições atuais do esquema.
4. Tendências: série observada por dia, semana ou mês, quantidades de cada tipo, duração, recorrência, variações e classificação descritiva. Gráfico de contagens empilhadas ou duração; as tabelas permitem consultar padrões e associações além da primeira página.

Inclui carregamento, ausência de obras, ausência de documentos, ausência de ocorrências, erro de rede/API, permissão negada, recuperação por nova tentativa, validação de combinações incompatíveis, cancelamento de requisições e proteção contra respostas antigas. O erro de metadados é separado do erro da análise para uma resposta tardia não esconder falhas.

## Auditoria do modelo e das fontes

O banco foi inspecionado somente por leitura. As tabelas existentes já atendem às análises que têm base factual:

- obra: identifica a construtora proprietária.
- rdo: obra, data, turno e clima.
- atraso/paralisacao: vínculo direto ao RDO, etapa, origem e duração.
- diario_obra: obra, data, turno, clima, etapa e campos textuais de ocorrências.
- rdo_equipe: equipe, etapa e dias de atuação.
- rdo_maquinario: máquina, etapa, quantidade utilizada e tempo de utilização.
- consumo_insumo: insumo utilizado no RDO.
- cadastro_de_equipes, cadastro_de_maquinario, cadastro_de_insumos: proprietário e obra atual.
- custo_planejado, custo_realizado e etapa: disponíveis no sistema, mas não demonstram vínculo causal entre uma ocorrência e um recurso.

O Canteiro atual salva ocorrências textuais no diário. Por isso a fonte inicial é **Diário de obra (Canteiro)**. O usuário também pode escolher **RDO estruturado**. As fontes são mutuamente exclusivas em cada análise: não há chave entre uma ocorrência textual do diário e uma ocorrência de RDO que permita deduplicação segura.

No diário, campos nulos/vazios e marcadores de ausência como Nenhum, Nenhuma, Sem atrasos, Sem paralisações, N/A, zero e hífen não geram eventos. Prosa registrada é preservada como ocorrência, sem NLP ou suposição de causa. Uma linha do diário pode registrar um atraso e uma paralisação distintos. Seus IDs analíticos incluem fonte e tipo, evitando colisões com IDs de outras tabelas.

Registros estruturados em atraso/paralisacao existem independentemente de sua descrição estar vazia. A variante histórica Acabamentos, no diário, é apresentada como a etapa-padrão Acabamento; os registros persistidos não são modificados.

O helper antigo frontend/src/api/produtividade.js não tinha consumidores e calculava frequência sobre todos os tipos juntos e recorrência por quantidade de RDOs. Ele não foi incorporado na nova página: os novos indicadores são calculados no backend com os denominadores declarados abaixo. Nenhum consumidor existente foi removido ou redirecionado.

## API, autorização e filtros

Somente dois endpoints foram necessários, evitando seis requisições redundantes para o mesmo recorte:

| Método | Rota | Finalidade |
|---|---|---|
| GET | /api/inteligencia-operacional/filtros | Obras e opções reais da empresa; capacidades e limitações dos filtros |
| GET | /api/inteligencia-operacional | Resumo, padrões, associações, impactos, tendências, qualidade e avisos |

Os dois exigem Bearer JWT, usuário ativo, construtora ativa, vínculo atual compatível com o token, perfil de gerência reconhecido e ambiente Escritório. O servidor relê ambiente e perfil do banco; não confia no localStorage ou em parâmetros de empresa. Obra fora da empresa retorna 404. O perfil Canteiro não recebe esses dados. Métodos de escrita não têm handlers analíticos e retornam 405 após autenticação/autorização.

Parâmetros:

| Campo | Valores e regras |
|---|---|
| id_obra | Inteiro positivo; obrigatório para análise, opcional para metadados |
| fonte | diario, padrão, ou rdo |
| inicio, fim | AAAA-MM-DD real; final igual ou posterior à inicial; limites opcionais |
| agrupamento | dia, padrão; semana; mes |
| etapa | Etapa-padrão existente |
| turno, clima | Valores do catálogo ou Não informado |
| tipo | atraso ou paralisacao |
| origem_atraso | Texto real da fonte selecionada, até 255 caracteres |
| origem_paralisacao | Texto real da fonte selecionada, até 255 caracteres |
| id_equipe, id_maquinario, id_insumo | Não aplicáveis no esquema atual; o servidor responde 422 com o motivo |

Parâmetros desconhecidos, repetidos, malformados ou incompatíveis retornam 400. Selecionar as duas origens ao mesmo tempo é recusado; origem de paralisação com tipo atraso, ou o inverso, também é recusado.

A página oferece obra, período, etapa, equipe, máquina, insumo, turno, clima, origens e tipo. Os três filtros de recurso ficam desabilitados, com explicação acessível e opções restritas à própria empresa. Isso impede simular uma filtragem que o banco não sustenta. Fonte e obra atualizam o recorte; demais filtros são aplicados pelo botão. Limpar preserva apenas a obra e a fonte selecionadas.

Exemplo:

~~~http
GET /api/inteligencia-operacional?id_obra=1&fonte=rdo&inicio=2026-10-01&fim=2026-10-28&agrupamento=semana&tipo=atraso
Authorization: Bearer TOKEN_DA_SESSAO
~~~

A resposta contém obra, filtros, resumo, padroes, associacoes, impactos, tendencias, etapas, origens, qualidade e avisos. Valores não determináveis são null, nunca um custo zero inventado.

Há limite técnico de 50.000 documentos ou eventos por análise. Acima disso, a API retorna 422 pedindo redução do período. As agregações usam mapas e conjuntos para contagens e identificação de períodos. O gráfico mostra até os 120 períodos observados mais recentes, com indicação explícita dessa janela; a resposta da API mantém toda a série.

## Fórmulas e interpretação

- Quantidade: número de eventos únicos pertencentes ao grupo.
- Frequência relativa: eventos do grupo / total de eventos do **mesmo tipo** no recorte × 100.
- Recorrência do resumo/padrão: períodos agrupados com evento / períodos agrupados com documento na fonte e no recorte temporal/turno/clima × 100. Filtros de evento restringem o numerador; não são evidência de exposição a recursos.
- Duração acumulada: soma das durações válidas, somente quando todas as durações do conjunto estão disponíveis. Duração média: acumulada / quantidade. Com dados incompletos, acumulada/média ficam null; a soma parcial conhecida e a quantidade de durações ausentes são informadas separadamente.
- Associação: eventos únicos do padrão com o fator registrado / total de eventos daquele padrão × 100. Um evento pode aparecer em mais de um fator; essas porcentagens não constituem categorias exclusivas.
- Taxa por exposição: ocorrências comprovadamente associadas / exposição compatível e de unidade conhecida. A função de cálculo foi testada; a API atual retorna null por não haver vínculo ocorrência/recurso.
- Impacto de equipe: dias improdutivos comprovados × custo diário.
- Impacto de máquina: tempo improdutivo convertido para dias de custo × quantidade × custo diário unitário.
- Conversão de horas para dias: exige jornada conhecida e positiva. Não há jornada padrão inserida pelo código.
- Participação no impacto: impacto da etapa / impacto total × 100, apenas com impactos conhecidos e total positivo. O esquema atual não fornece esses valores; a apresentação é Dados insuficientes.
- Variação absoluta: atual − anterior.
- Variação percentual: (atual − anterior) / anterior × 100, somente com anterior maior que zero.
- Recorrência **dentro de um ponto da série**: dias documentados com evento / dias documentados naquele período × 100. A comparação dessa porcentagem tem variação absoluta em pontos percentuais. A interface declara essa base.

Sem documento não é gerado ponto zero. A semana começa na segunda-feira, identificada pela data dessa segunda; o mês pela data de seu primeiro dia. Não se usa a quantidade de RDOs como se fossem dias distintos.

A comparação usa os dois últimos períodos observados somente se forem consecutivos. Classificação descritiva exige três períodos consecutivos e valores completos: estritamente crescentes, estritamente decrescentes, iguais ou oscilantes. Não há previsão, inferência causal ou teste de significância. Mudanças de cobertura documental podem afetar contagens e devem ser consideradas pelo gestor.

O helper financeiro exige vínculo comprovado e unidade conhecida, usa centavos para custo e arredondamento final, mas não é alimentado com inferências na aplicação de produção.

## Consultas SQL e relacionamentos

As consultas são somente SELECT, com valores parametrizados. Os identificadores SQL variáveis vêm de listas fixas internas. Não há concatenação de parâmetros do usuário em nomes de tabelas/colunas.

Documentos:

~~~sql
SELECT CONCAT('rdo:', r.id_rdo) AS id_registro,
       r.id_obra, r.data_rdo AS data, r.turno, r.clima
FROM rdo r
JOIN obra o ON o.id_obra = r.id_obra
WHERE o.id_construtora = ? AND o.id_obra = ?;
~~~

Ocorrências RDO: UNION ALL de duas consultas independentes, cada uma com seu próprio escopo de empresa/obra; os filtros temporais e de evento são aplicados no resultado. Cada ocorrência entra uma vez:

~~~sql
SELECT CONCAT('atraso:', a.id_atraso) AS id,
       CONCAT('rdo:', r.id_rdo) AS id_registro,
       r.id_obra, r.data_rdo AS data, r.turno, r.clima,
       a.etapa, 'atraso' AS tipo, a.origem_atraso AS origem,
       a.duracao, a.descricao
FROM atraso a
JOIN rdo r ON r.id_rdo = a.id_rdo
JOIN obra o ON o.id_obra = r.id_obra
WHERE o.id_construtora = ? AND o.id_obra = ?
UNION ALL
SELECT CONCAT('paralisacao:', a.id_paralisacao),
       CONCAT('rdo:', r.id_rdo),
       r.id_obra, r.data_rdo, r.turno, r.clima,
       a.etapa, 'paralisacao', a.origem_paralisacao,
       a.duracao, a.descricao
FROM paralisacao a
JOIN rdo r ON r.id_rdo = a.id_rdo
JOIN obra o ON o.id_obra = r.id_obra
WHERE o.id_construtora = ? AND o.id_obra = ?;
~~~

Diário: diario_obra.obrax_id → obra.id_obra, duas projeções independentes dos campos atrasos e paralisacoes, com duracao NULL. Não se faz join por coincidência de datas entre diário e RDO.

Opções: SELECT DISTINCT das origens reais da fonte, com escopo empresarial. Obras e catálogos de recursos também usam id_construtora da sessão.

Não são agregadas ocorrências por JOIN simultâneo com rdo_equipe, rdo_maquinario e consumo_insumo. Isso evitaria tanto atribuição indevida como multiplicação cartesiana de contagens.

Nenhuma migração foi necessária ou aplicada nesta tarefa. As FKs e índices existentes sustentam as consultas por obra e documento. Não foram criadas tabelas, colunas, dados de exemplo ou vínculos artificiais.

## Testes e evidências

| Verificação final | Resultado |
|---|---|
| Backend, npm.cmd test | 328 aprovados, 0 reprovados |
| Frontend, npm.cmd test | 27 aprovados, 0 reprovados; inclui 12 testes DOM |
| Frontend, npm.cmd run build | Compilação aprovada |
| API + MySQL reais, somente leitura | 14 análises verificadas, diário/RDO nas sete obras, totais conferidos contra SQL direto |
| Segurança real | Gerência 200; Canteiro 403; data inválida 400; obra inexistente 404 |
| Integração histórica, npm.cmd run test:integration | Bloqueada antes das suítes: valen_testes inexistente, ER_BAD_DB_ERROR |
| Novo teste de navegador e suíte antiga de Canteiro | Bloqueados pelo Sophos antes da página de login, inclusive usando localhost |

São **355 casos aprovados** nas suítes automatizadas finais de backend/frontend. Os bloqueios de infraestrutura acima são apresentados separadamente e não foram contados como aprovações.

A primeira execução identificou ausência do armazenamento simulado no teste antigo de frontend; foi acrescentado setup de localStorage, preservando suas asserções. Os testes DOM utilizam jsdom apenas em desenvolvimento e compilam uma cópia temporária em node_modules/.cache. Não substituem validação visual ou medição de layout em navegador real.

Cobertura: fórmulas, períodos e limites de calendário, distinção de fonte, ausência textual, duplicação de IDs, durações inválidas/nulas, custos com pré-condições, divisão por zero, comparação e lacunas, filtros combinados, SQL parametrizado, JWT, usuário/empresa inativos, vínculo antigo, perfil/ambiente sem permissão e acesso entre construtoras.

Os testes DOM verificam entrada pelo menu, URL direta, quatro áreas de análise, atualização/limpeza de filtros, incompatibilidades sem envio, gráfico, ordenação, recursos desabilitados, ausência de obras/documentos, erro e recuperação, tema e navegação para Analytics. Também verificam que metadados tardios não escondem erro da análise.

No banco real, as sete obras disponíveis não tinham ocorrências nessas fontes no momento da leitura. O estado vazio corresponde ao banco; não foram inseridos exemplos para produzir gráficos.

## Limites e decisões pendentes

1. Definir e registrar a unidade das durações. O information_schema não contém comentário ou coluna que a confirme. A unidade de tempo_utilizacao de máquina também não está especificada.
2. Definir vínculo explícito ocorrência/recurso e registro de tempo improdutivo, sem deduzir causa por participação no mesmo RDO.
3. Definir jornada, vigência de tarifas e regra de compartilhamento de impacto entre recursos/eventos, para evitar custos duplicados.
4. Definir vínculo ou identificador entre ocorrências de diário e RDO antes de combiná-las em um total deduplicado.
5. Disponibilizar valen_testes para testes de integração com fixtures. Nenhum banco foi criado automaticamente.
6. Validar layout responsivo e contraste em navegador quando o acesso local for liberado pela política corporativa. Há CSS responsivo e variáveis de tema, mas a medição visual automatizada não foi concluída devido ao Sophos.

Essas condições aparecem como Dados insuficientes ou como motivo de filtro indisponível na interface; não foram substituídas por números ou regras inventadas. Nenhum mecanismo de proteção corporativa foi desativado.

## Arquivos criados nesta tarefa

- backend/config/inteligenciaOperacional.js
- backend/controllers/inteligenciaOperacionalController.js
- backend/models/inteligenciaOperacionalModel.js
- backend/routes/inteligenciaOperacionalRoutes.js
- backend/services/inteligenciaOperacional.js
- backend/tests/unit/inteligenciaOperacional.test.js
- backend/tests/unit/inteligenciaOperacionalApi.test.js
- frontend/src/api/inteligenciaOperacional.js
- frontend/src/componentes/escritorio/GraficoOperacional.jsx
- frontend/src/pages/escritorio/InteligenciaOperacional.jsx
- frontend/src/pages/escritorio/inteligenciaOperacional.css
- frontend/tests/inteligenciaOperacional.test.mjs
- frontend/tests/inteligenciaOperacional.dom.test.mjs
- frontend/tests/inteligenciaOperacional.browser.mjs
- frontend/tests/setup.mjs
- docs/IMPLEMENTACAO_INTELIGENCIA_OPERACIONAL.md

## Arquivos alterados nesta tarefa

- backend/app.js — montagem das duas rotas analíticas; proteções existentes preservadas.
- backend/README.md — instruções de acesso à ferramenta.
- backend/docs/API.md — documentação dos endpoints.
- frontend/src/App.jsx — URL, restauração e renderização da página.
- frontend/src/componentes/escritorio/Sidebar.jsx — nova entrada ao lado do Analytics.
- frontend/package.json — comandos de testes e jsdom apenas como devDependency.
- frontend/package-lock.json — dependência de teste fixada.
- frontend/tests/frontend.test.mjs — inclusão do ambiente de armazenamento simulado.

As alterações anteriores do workspace foram preservadas. Não houve commit, push, reset, clean, troca de branch ou alteração do banco nesta implementação.

## Execução

~~~powershell
# Terminal 1, backend
cd backend
npm.cmd ci
npm.cmd start
npm.cmd test

# Terminal 2, frontend
cd frontend
npm.cmd ci
npm.cmd run dev
npm.cmd test
npm.cmd run build
~~~

Entre com uma conta ativa de gerência no ambiente Escritório e escolha Inteligência Operacional. A URL é /escritorio/inteligencia-operacional. O backend local foi reiniciado para carregar os novos endpoints.

Para repetir o navegador quando o acesso local estiver disponível:

~~~powershell
# Frontend em uma instância na porta 5174
npm.cmd run dev -- --host 127.0.0.1 --port 5174 --strictPort
npm.cmd run test:operacional:browser

# Suíte existente
node tests/canteiro.browser.mjs
~~~

A URL do novo teste pode ser configurada por VERTICE_BROWSER_URL; o padrão é http://localhost:5174. O script usa Chrome headless e respostas simuladas somente nos testes. Testes que precisem gravar fixtures devem usar exclusivamente valen_testes.
