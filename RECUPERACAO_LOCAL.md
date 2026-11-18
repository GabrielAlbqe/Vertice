# Recuperação local Vértice — 11/11/2026

Branch: chore/cloud-readiness. Commit: df1cee0. Código, layout e lockfiles preservados.

## Alterações locais

- Criado backend/.env antes ausente, sem sobrescrever configuração existente.
- Configurados DB_HOST=localhost, DB_PORT=3306, DB_USER=root, DB_NAME=valen e PORT=3000.
- DB_PASSWORD recebido do usuário e gravado somente no arquivo ignorado; valor omitido.
- JWT_SECRET gerado com crypto.randomBytes(48), sem exposição.
- NODE_ENV=development, SESSION_SAME_SITE=lax e PHOTO_STORAGE_DRIVER=local.
- Instaladas dependências do lockfile na raiz e no frontend. Backend já possui dotenv e demais dependências diretas. Dois pacotes opcionais/transitivos aparecem como extraneous; preservados.
- Node 24.22.1 obtido no cache npm. Node global 22.17.0 e políticas do Windows preservados.
- npm.ps1 é bloqueado pela política do PowerShell; usar npm.cmd/npx.cmd.
- Nenhum gerenciador nvm/fnm/volta foi encontrado no PATH nem nos locais de nvm verificados.
- .env e frontend/dist estão ignorados pelo Git; nenhum arquivo de credencial está rastreado. Não executar git add -f nesses arquivos.

## Validações executadas

- Node usado nas validações: v24.22.1; npm disponível: 10.9.2.
- Backend: 84 testes passaram em production, deploy, historicoPreditivo.unit e inteligenciaOperacional.unit.
- Frontend: todos os 53 testes do script test passaram; build Vite passou (129 módulos).
- API real iniciada temporariamente na porta 3000; GET /api/health retornou 200, banco conectado.
- Frontend Vite iniciado temporariamente na porta 5173; /, /escritorio e /canteiro retornaram HTML 200. Isso verifica entrega da SPA, não os fluxos autenticados.
- Vite transformou /src/main.jsx e /src/App.jsx com HTTP 200.
- /api/health pelo proxy do Vite retornou 200 e banco conectado.
- CORS para http://localhost:5173 retornou origem exata e credentials=true.
- GET /api/obras sem sessão retornou 401.
- Navegação real com Chrome foi tentada e bloqueada pelo aviso corporativo Sophos para 127.0.0.1; proteção não alterada.
- Login com conta real, operações de escrita e navegação autenticada não validados.
- A suíte completa de backend foi tentada antes do recebimento da senha e parou na autenticação MySQL. Após inspeção, não foi repetida: inclui DROP TRIGGER, DROP FOREIGN KEY e migrações com DROP PROCEDURE, incompatíveis com a restrição de não executar DROP. Os testes unitários acima foram executados separadamente.
- Backend não possui etapa de compilação/build; executa JavaScript diretamente.
- Servidores temporários encerrados após validação.
- Na primeira verificação HTTP, encerrar Vite enquanto o scan ainda rodava gerou avisos de fechamento. A transformação foi repetida aguardando o scan, com sucesso.

## Banco atual e pendências (somente SELECT/metadados)

MySQL Server 8.0 instalado; serviço MySQL80 ativo. Conexão root autenticada. Banco valen existe, com 37 tabelas e 6 contas existentes. Nenhuma conta foi modificada.
Todas as tabelas do arquivo database/valen_atualizado.sql estão presentes. FK apropriacao.id_insumo aponta corretamente para cadastro_de_insumos.id_insumos. Presença de tabelas não comprova equivalência completa de índices, tipos e constraints das migrações 001–003.

Pendências confirmadas por ausência de estruturas:

- 004_security_state.sql: falta vertice_security_state.
- 005_profissionais.sql: falta profissional.
- 006_gestao_integrada.sql: faltam gestao_auditoria, estoque_config, estoque_movimento, etapa_planejamento, maquina_evento, custo_detalhe e notificacao_leitura.
- 007_disponibilidade_equipes.sql: falta equipe_transferencia; em cadastro_de_equipes faltam ativo e versao; em cadastro_de_equipes_terceirizadas faltam id_construtora, ativo e versao.

Não foram executados CREATE/ALTER/DROP/TRUNCATE, migrações, seeds ou alterações de dados durante a recuperação. A API inicia com o armazenamento de sessões em memória padrão de desenvolvimento, que perde sessões ao reiniciar. Não configurar SECURITY_STORE=mysql antes de revisar e autorizar a migração 004.

Próximo passo para recuperar todos os módulos: obter e verificar backup, revisar as migrações 004–007 e suas pré-condições em cópia isolada, preparar um plano que respeite a proibição de DROP e solicitar autorização específica antes de alterar valen. Não executar migrate:isolated contra valen: o script bloqueia o banco principal por projeto.

## Variáveis identificadas no código

Obrigatórias para conectar ao banco: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD (a chave é obrigatória; o validador admite vazio em desenvolvimento), DB_NAME.
Obrigatória para login, JWT, CSRF e sessões funcionarem: JWT_SECRET.

Produção exige adicionalmente NODE_ENV=production, DB_SSL=true, usuário dedicado com senha não vazia e DB_HOST DNS; PUBLIC_FRONTEND_URL, PUBLIC_API_URL, ORIGIN_SECRET forte, SECURITY_STORE=mysql, REGISTRATION_MODE=office, PHOTO_STORAGE_DRIVER=s3, S3_BUCKET e S3_REGION. JWT_SECRET também deve passar a validação de força. A produção não foi ativada.

Opcionais/condicionais do servidor: PORT (3000), CORS_ORIGINS, TRUST_PROXY_HOPS, SESSION_SAME_SITE, REGISTRATION_MODE, SECURITY_STORE, PASSWORD_RESET_BASE_URL, PHOTO_STORAGE_DRIVER, PHOTO_STORAGE_PATH, DB_SSL, DB_SSL_CA_BASE64 e DB_SSL_CA_PATH. SameSite=None requer produção HTTPS. Cookies locais usam HttpOnly, SameSite=Lax, duração de 8h; Secure e prefixo __Host são usados em produção. O transporte do frontend usa cookies e token CSRF.

S3: S3_PREFIX, S3_ENDPOINT (HTTPS), S3_FORCE_PATH_STYLE; credenciais do SDK por identidade de serviço ou AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY e, quando aplicável, AWS_SESSION_TOKEN. Não são exigidas para fotos locais.

Provisionamento/backup/testes: DB_ACCOUNT_HOST é obrigatório apenas para provisionar usuário dedicado; MYSQLDUMP_PATH é opcional; VERTICE_BACKUP_ARTIFACTS, VERTICE_BROWSER_ARTIFACTS, VERTICE_BROWSER_EXECUTABLE/CHROME_BIN/CHROME_PATH e VERTICE_LOGIN_PREVIEW são opções de ferramentas. VERTICE_DEMO_EMAIL e VERTICE_DEMO_PASSWORD são exigidos somente pelo seed-demo-local, que não foi executado. Variáveis padrão do sistema também são usadas para localizar navegador e aplicar ACLs.

Frontend: VITE_API_URL é opcional; sem frontend/.env, usa /api e o proxy Vite encaminha para http://127.0.0.1:3000. Não é necessário criar frontend/.env. VERTICE_DEPLOY_TARGET=cloud ativa validações de produção e requer PUBLIC_FRONTEND_URL, PUBLIC_API_URL e ORIGIN_SECRET no build cloud; não usado nesta recuperação. Nunca colocar segredos em variáveis VITE_.

## Iniciar agora (dois terminais PowerShell)

Terminal 1:

```powershell
Set-Location 'C:\Users\labredes.cisss\Documents\Vallen\Vertice'
npx.cmd --yes --package=node@24.22.1 -- node backend/server.js
```

Terminal 2:

```powershell
Set-Location 'C:\Users\labredes.cisss\Documents\Vallen\Vertice\frontend'
npx.cmd --yes --package=node@24.22.1 -- node node_modules/vite/bin/vite.js --host localhost --port 5173 --strictPort
```

Abrir http://localhost:5173. Usar localhost de forma consistente para cookies. Parar com Ctrl+C. Esses comandos usam Node do cache npm, sem atualização global. O cache precisa permanecer disponível; o npx pode precisar de rede se removido.

Para atualização permanente, aprovar separadamente a instalação de Node 24.22.1 ou um gerenciador de versões e depois reinstalar/verificar dependências com essa versão. .nvmrc exige 24.22.1; os três package.json exigem 24.x.

Scripts disponíveis: raiz test, test:frontend, build, check; backend start, test, migrate:isolated; frontend test, test:browser, dev, build, preview, build:cloud, test:navigation. Não executar scripts de migração ou testes de escrita no principal.
