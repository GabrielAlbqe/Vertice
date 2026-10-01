# Vértice — Canteiro de Obras

A interface é escolhida pelo campo `ambiente` retornado pelo login: `Canteiro` ou `Canteiro de Obras` abre o Canteiro; os demais valores preservam o Escritório. A largura da tela controla apenas a apresentação. As rotas internas existentes do Escritório e seus componentes foram preservados. O Canteiro utiliza páginas `canteiro-*` na navegação central existente.

## Organização
- `src/canteiro`: sessão, contratos confirmados, rascunhos, hook de formulários e CSS isolado.
- `src/layouts/CanteiroLayout.jsx`: contexto compartilhado, seleção da obra, carregamento e navegação.
- `src/componentes/canteiro`: header, navegação inferior, cards, formulários e prévia de foto.
- `src/pages/canteiro`: início, obra, diário, ocorrências, atividade, material, histórico, pendências e perfil.
- `src/App.jsx`: restauração de sessão e escolha da interface.
- Os arquivos existentes de `src/api` e o backend não foram modificados.

## APIs reutilizadas
Todas as requisições passam por `requisitar` de `src/api/api.js`.
- `listarObras(idConstrutora)`: GET /obras?id_construtora=…
- `buscarRecursosDaObra(idObra)`: GET /equipes?idobra=…, /insumos?idobra=…, /maquinarios?idobra=…, /equipes-terceirizadas?id_obra=…
- GET /diarios-obra?obrax_id=…; POST /diarios-obra/insert
- GET /atividades-eap?idx_obra=…
- GET /apontamentos-fisicos?diario_id=…; POST /apontamentos-fisicos/insert
- POST /apropriacoes/insert
- GET /usuarios/:id

Os parâmetros foram conferidos no app, routes, controllers, models e esquema SQL existentes. `diario_obra` e `rdo` são entidades diferentes; o formulário usa diário_obra, que suporta os campos solicitados. Não cria RDOs financeiros como efeito colateral.

## Comportamento
A obra é selecionada explicitamente dentre as obras da construtora, reutilizando `obra_selecionada`. Não há vínculo de usuário a obra no contrato do login; não se presume que a primeira obra seja a obra do usuário.
O diário respeita os enums de clima, turno, etapa e equipes A/B/C do esquema existente. Ocorrências são registradas nos campos de paralisações e atrasos do diário.
Atividades usam apontamentos físicos vinculados a um diário e a uma atividade da mesma obra. Aceitam percentual do dia e URL HTTP(S) opcional de foto já publicada. Materiais usam apropriações vinculadas ao insumo, atividade e usuário; não alteram estoque.
Histórico lista diários, filtra busca, período, ocorrência e autor; os detalhes consultam apontamentos sob demanda.
Pendências distinguem rascunhos locais de ocorrências históricas sem status de resolução.
Rascunhos ficam no localStorage em `vertice:canteiro:rascunhos:<id_usuario>`, identificados por obra e tipo. Não armazenam senha ou arquivo de foto. O usuário restaura, revisa e envia manualmente; não há sincronização automática ou reenvio automático de POST. Após falha ambígua de rede, confira o histórico antes de repetir um envio.
Logout limpa a sessão e obra selecionada e mantém os rascunhos separados por usuário.

## Limitações do backend existente
- Não existe upload: câmera/seleção/preview funcionam apenas localmente, acessíveis no Perfil. A Home não oferece envio de foto.
- Apontamentos não têm campo de observação; observações de ocorrência ficam no diário.
- Ocorrências não possuem status de resolução; não são rotuladas como abertas/fechadas.
- Apropriações não têm data ou vínculo direto com diário; não se inventa cronologia de materiais.
- Não há endpoint de sincronização, idempotência ou permissões do usuário por obra. A separação no frontend não substitui autorização no servidor.
- Sem conexão, o formulário pode salvar rascunhos, mas não há cache completo de obras nem funcionamento offline após recarregar sem acesso às APIs.

## Validação
Execute `npm.cmd run build` e `npm.cmd run dev -- --host 127.0.0.1` em frontend.
A validação no navegador deve usar dados de teste isolados para não criar registros no banco de produção.

## Arquivos entregues
Criados:
- src/canteiro/CanteiroApp.jsx, sessao.js, dados.js, rascunhos.js, useRegistro.js, canteiro.css
- src/layouts/CanteiroLayout.jsx
- src/componentes/canteiro/EstadoObra.jsx, Icone.jsx, RegistroCard.jsx, PendenciaCard.jsx, FotoPreview.jsx, FormularioBase.jsx
- src/pages/canteiro/CanteiroPendencias.jsx, CanteiroPerfil.jsx
- CANTEIRO.md; tests/canteiro.browser.mjs; relatório e capturas em tests/

Preenchidos (arquivos que já existiam vazios):
- src/componentes/canteiro/BottomNav.jsx, HeaderCanteiro.jsx, ObraCard.jsx, ProgressBar.jsx, StatusBadge.jsx
- src/pages/canteiro/HomeCanteiro.jsx, DetalheObra.jsx, Registrar.jsx, RegistrarAtividade.jsx, RegistrarMaterial.jsx, RegistrarOcorrencia.jsx, RegistrarFoto.jsx, HistoricoObras.jsx

Alterado: src/App.jsx.
A reorganização prévia do Escritório, as alterações prévias em Login.jsx e backend/config/connection.js foram preservadas.

## Resultados da verificação
- Build Vite concluído.
- Todas as telas verificadas a 360, 390, 430, 768, 1024 e 1440px, sem scroll horizontal.
- Login Canteiro, seleção de obra e filtro de construtora verificados.
- Diário, atividade e material: payloads conferidos; falha de POST preserva o formulário.
- Offline emulado no Chrome: salvamento, restauração, envio manual e remoção do rascunho verificados.
- Histórico, consulta de apontamentos, foto local, falha de GET com recuperação, restauração de sessão e logout verificados.
- Escritório verificado no desktop e celular.
- Sem exceções JavaScript ou erros React nos fluxos testados. Os testes de falha geram os logs técnicos esperados.
- Relatório: tests/canteiro-browser-result.json. Capturas: tests/screenshots/canteiro-390.png e canteiro-1024.png.

Para repetir: execute o Vite na porta 5174 e rode `node tests/canteiro.browser.mjs` a partir de frontend. O teste requer Node com WebSocket global e Chrome no caminho padrão do Windows; todas as chamadas ao backend são interceptadas com dados de teste. Não foi realizada gravação ou validação ponta a ponta no banco real. A confirmação com usuários e dados reais pode ser feita no ambiente da aplicação.
