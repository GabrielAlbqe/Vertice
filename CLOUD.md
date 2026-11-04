# Preparação para nuvem

Node 24.x (validado com a versão de `.nvmrc`). Instalar com `npm ci`,
`npm ci --prefix backend` e `npm ci --prefix frontend`.
No PowerShell com scripts bloqueados, usar `npm.cmd`.

Validação local: `npm run check`. O backend cria um banco vazio
`vertice_test_<timestamp>` usando apenas o schema e fixtures sintéticas;
não copia nem altera `valen`. Os bancos de teste ficam preservados.
A conta de teste precisa poder criar bancos, tabelas, procedimentos e triggers;
ela deve ser diferente da conta de execução em produção.
O workflow `.github/workflows/validate.yml` repete testes e builds com MySQL
efêmero, sem segredos reais e sem etapas de publicação.

## Frontend / Vercel

Configurar Root Directory `frontend`, instalar com `npm ci` e manter o comando
de `vercel.json`: `node scripts/build-cloud.mjs`.
A saída segue a [Build Output API](https://vercel.com/docs/build-output-api/configuration):
`.vercel/output/static` contém o build Vite e `.vercel/output/config.json`
contém o proxy e fallback SPA. Não sobrescrever o Output Directory com `dist`
na configuração da plataforma, pois isso descartaria as regras geradas.

Preencher `frontend/.env.production.example` no painel da Vercel:
`PUBLIC_FRONTEND_URL`, `PUBLIC_API_URL` e `ORIGIN_SECRET` (segredo aleatório
com pelo menos 32 bytes, igual ao backend). `VERTICE_DEPLOY_TARGET=cloud`
é definido pelo script. As URLs públicas devem ser origens HTTPS sem caminho.
O frontend usa `/api` no mesmo domínio; o proxy encaminha ao Render e
injeta o segredo exclusivamente no servidor. Não colocar segredos em `VITE_*`.
`VITE_API_URL` continua disponível para desenvolvimento local.

Os cookies HttpOnly/Secure com prefixo `__Host-` ficam associados ao domínio
do frontend, com SameSite=Lax e sem Domain. O navegador não acessa diretamente
o domínio Render. Isso evita depender de cookies de terceiros entre
`vercel.app` e `onrender.com`. Escritas autenticadas exigem Origin autorizado
e token CSRF. CORS usa origens exatas com credenciais; chamadas diretas ao
Render são bloqueadas pelo segredo do proxy, exceto GET `/api/health`.
Validar cookies, cabeçalhos do proxy, IP do visitante e logout na homologação
HTTPS real antes de liberar produção. Não habilitar domínios de preview por curinga.

## Backend / Render

Usar `render.yaml.example` como modelo para revisão, Root Directory `backend`,
build `npm ci`, start `npm start`, health check `/api/health`.
Não há migrações no startup. Porta vem de `PORT`; há encerramento por SIGTERM.
O modelo mantém [auto deploy desativado](https://render.com/docs/blueprint-spec#autodeploytrigger).
A Vercel também mantém deploy por Git desativado. Criar/importar serviços pode
iniciar uma primeira publicação: executar somente após autorização.

Preencher `backend/.env.production.example`: URLs e ORIGIN_SECRET iguais aos da
Vercel, JWT_SECRET independente e aleatório, SECURITY_STORE=mysql,
SESSION_SAME_SITE=lax, REGISTRATION_MODE=office, TRUST_PROXY_HOPS=1,
CORS_ORIGINS vazio (usa PUBLIC_FRONTEND_URL) ou lista exata autorizada.
Não reutilizar JWT_SECRET como ORIGIN_SECRET.

## MySQL e migrações

Configurar DB_HOST (DNS), DB_PORT, DB_USER dedicado, DB_PASSWORD, DB_NAME,
DB_SSL=true e, quando necessário, DB_SSL_CA_BASE64 ou DB_SSL_CA_PATH.
O cliente valida cadeia e hostname TLS; nunca usar rejectUnauthorized=false.
Pools têm limite de conexões e fila, keepalive e timeout de conexão.
A conta runtime deve ter apenas SELECT/INSERT/UPDATE/DELETE no seu banco.
`backend/deploy/mysql.cjs` prepara grants restritos; não foi provisionado.

Para ensaiar as migrações em banco isolado, importar somente
`backend/database/valen_atualizado.sql` em um banco vazio `vertice_test_*`,
configurar DB_NAME para esse banco e executar
`npm run migrate:isolated --prefix backend`.
Esse comando aplica 001–007 em ordem e recusa `valen` e nomes de produção.
O usuário de migração precisa de privilégios DDL/procedimentos, sem repassá-los
à aplicação. O schema exige MySQL 8 com suporte a CHECK e utf8mb4_0900_ai_ci.

A 007 depende das tabelas anteriores e habilita equipes disponíveis,
vínculos por construtora e histórico de transferências. Os testes verificam
preservação, isolamento e reexecução, além da cadeia completa 001–007.
Na inspeção somente de metadados do banco local principal (03/11/2026), os
marcadores estruturais de 001–006 estavam presentes. A 007 está pendente:
faltam `equipe_transferencia` e `id_construtora` nas duas tabelas de equipes.
Presença de marcadores não substitui auditoria integral nem prova histórico de
execução. Nenhuma migração ou escrita foi feita no banco principal.
Antes de migrar qualquer banco real: inventariar schema, revisar pendências,
validar backup/restauração e obter autorização. DDL MySQL pode fazer commit
implícito; não presumir rollback transacional de uma migração interrompida.

## Fotos privadas / S3

Configurar PHOTO_STORAGE_DRIVER=s3, S3_BUCKET, S3_REGION,
S3_PREFIX e AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY (ou identidade de serviço;
AWS_SESSION_TOKEN para credenciais temporárias). Para provedores compatíveis:
S3_ENDPOINT em HTTPS e S3_FORCE_PATH_STYLE quando exigido.
`backend/deploy/s3.cjs` prepara a política privada de acesso mínimo.
O provedor deve suportar a criptografia AES256 exigida pelo upload.
Arquivos são recodificados sem EXIF/GPS; leitura usa endpoint autenticado
com verificação da construtora. Nenhum objeto deve ser público.
Testes usam disco isolado e mocks S3; bucket e TLS remotos exigem homologação.
Fotos locais existentes permanecem no disco: a mudança para S3 não as transfere.
Inventariar e planejar sua cópia/verificação antes de uma troca real de driver,
com autorização separada, sem excluir originais.

## Pendências externas

Selecionar/provisionar os serviços, configurar domínios/DNS/HTTPS, segredos,
MySQL e CA, bucket privado e permissões, backup e restauração. Aplicar as
migrações revisadas somente com autorização e validar ponta a ponta em
homologação isolada. Configurar proteção da branch para exigir o workflow
antes de qualquer publicação manual. Nenhum deploy, push, merge ou uso de
dados reais na nuvem faz parte desta preparação local.
