# Auditoria Backend Vértice

## Escopo confirmado

- 27 módulos de rotas CRUD.
- 135 operações CRUD (27 x 5).
- 1 operação de login (`POST /api/usuarios/login`).
- 1 operação de health (`GET /api/health`).
- Total: **137 operações/endpoints**.

## Problemas corrigidos nesta cópia

1. `backend/routes/cargoRoutes.js`
   - Corrigido uso indevido de `construtoraController`.
   - Rotas agora usam `cargoController`.

2. `backend/routes/construtoraRoutes.js`
   - Corrigido `const router = Router = express.Router();` para `const router = express.Router();`.

3. `backend/bd.sql`
   - Corrigida linha inválida do cabeçalho (`n 8.0.43`).
   - Removido `//teste` inválido dentro de `CREATE TABLE`.
   - Corrigida FK de `apropriacao.id_insumo` para `cadastro_de_insumos(id_insumos)`.
   - Adicionada tabela `cargo`, que era usada pela API, mas não existia no dump.
   - Verificação estática final: nenhuma FK aponta para tabela/coluna inexistente.

4. Colunas geradas pelo MySQL
   - `consumo_insumo.custo_total` não é mais escrito manualmente.
   - `custo_realizado.valor_total` não é mais escrito manualmente.
   - `projecao_financeira.custo_final_projetado` não é mais escrito manualmente.

5. Tratamento de erros de banco
   - Adicionado `backend/utils/dbError.js`.
   - Erros de entrada/constraint conhecidos do MySQL passam a retornar `400` em vez de serem mascarados como erro interno `500`.
   - Erros realmente internos continuam como `500`.

6. `cargoController.js`
   - CREATE retorna `insertId`.
   - UPDATE/DELETE retornam `404` quando o ID não existe.

7. Configuração do banco
   - `backend/config/connection.js` agora aceita `DB_HOST`, `DB_USER`, `DB_PASSWORD` e `DB_NAME` por variáveis de ambiente, mantendo os valores antigos como fallback.

8. Testes
   - O teste antigo permissivo foi preservado como `backend/tests/api.legacy.js` (não executado pelo Jest).
   - Criado `backend/tests/api.complete.test.js`.
   - A nova suíte não aceita `500` como sucesso.
   - Ela cobre as 137 operações e adiciona testes de 404, filtros obrigatórios, login, atualização com confirmação por GET, exclusão com confirmação e FKs inválidas representativas.

## Verificações realizadas nesta cópia

- Todos os arquivos JavaScript do backend passaram em `node --check`.
- O mapa estático confirmou 137 operações.
- Todas as rotas apontam para controllers e funções existentes após as correções.
- Nenhuma das 3 colunas `GENERATED ALWAYS` continua sendo escrita pelos models.
- Todas as Foreign Keys presentes no dump corrigido apontam para tabelas/colunas existentes.

## Limitação desta execução

A suíte integrada depende de um servidor MySQL acessível. Este ambiente não possui o MySQL local do computador do projeto, portanto não é correto afirmar que todos os testes passaram em runtime.

No computador do projeto, execute a partir da raiz:

```bash
npm install
npm test
```

Se quiser isolar os testes em outro banco:

```cmd
set DB_NAME=valen_test
npm test
```

Antes disso, importe `backend/bd.sql` no banco de teste.

## Critério atual

- [x] Rotas mapeadas estaticamente
- [x] 137 operações identificadas
- [x] Teste antigo permissivo retirado da execução
- [x] Correções estruturais objetivas aplicadas
- [x] Suite completa criada
- [x] JavaScript validado sintaticamente
- [x] FKs do dump validadas estaticamente
- [ ] Execução integrada contra MySQL local
- [ ] Correção de falhas que só aparecerem em runtime
- [ ] Regressão final com 0 falhas

**STATUS: PENDENTE DE EXECUÇÃO NO MYSQL LOCAL**
