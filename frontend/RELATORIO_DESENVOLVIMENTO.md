# Desenvolvimento do frontend Vértice — 01/10/2026

## 1. Estado inicial

O workspace já continha um único React/Vite, login, layouts separados, páginas do Escritório, Analytics e registros do Canteiro. Foram reaproveitados. Não havia página Recursos nem tema global. `Registrar` era o diário; `HistoricoObras` listava somente diários. O Dashboard gravava `abrir_cadastro_obra`, mas Obras não consumia essa intenção. O catálogo consultava insumos e máquinas sem o `idobra` obrigatório. A listagem de equipes por obra podia incluir equipes de outras obras.

O backend foi consultado somente para conferir rotas, modelos e esquema. Não foi alterado por este trabalho. Surgiu uma alteração concorrente em `backend/config/connection.js`, preservada. Não houve commit ou push.

## 2. Arquivos criados

- `src/pages/escritorio/Recursos.jsx`: visão geral e formulários de insumos e maquinários.
- `src/pages/canteiro/DiarioObra.jsx`: diário reaproveitado da antiga tela Registrar.
- `src/pages/canteiro/RegistrosObra.jsx`: consulta de diários e apontamentos reaproveitada do antigo histórico.
- `src/componentes/canteiro/RegistrosOperacionais.jsx`: atividades, fotos publicadas, consumos e RDOs.
- `src/componentes/shared/ThemeToggle.jsx` e `src/theme.css`: tema global e ajustes responsivos.
- `.env.example`: endereço configurável da API.
- `tests/frontend.test.mjs`: testes de contratos, isolamento de consultas, perfis e cálculos.
- Capturas adicionais em `tests/screenshots/` e este relatório.

## 3. Arquivos alterados

- Aplicação: `src/App.jsx`, `src/main.jsx`, `src/styles.css`, `src/pages/Login.jsx`.
- APIs: `src/api/api.js`, `obras.js`, `recursos.js`, `analyticsCalculos.js`.
- Escritório: `Dashboard.jsx`, `Obras.jsx`, `Equipes.jsx`, `ObraDetalhes.jsx`; componentes `Sidebar.jsx`, `Modal.jsx`, `ModalNovaObra.jsx`.
- Canteiro: `CanteiroApp.jsx`, `sessao.js`, `dados.js`, `useRegistro.js`, `canteiro.css`, `layouts/CanteiroLayout.jsx`; componentes `BottomNav.jsx`, `ObraCard.jsx`; páginas `HomeCanteiro.jsx`, `HistoricoObras.jsx`, `Registrar.jsx`, `RegistrarOcorrencia.jsx`, `DetalheObra.jsx`.
- Testes: `tests/canteiro.browser.mjs`, relatório JSON e capturas produzidas pelo teste.

## 4. Escritório

- Recursos na Sidebar, depois de Analytics; visão geral filtrada por obra e busca, com encaminhamento aos detalhes para atribuição.
- Insumos: cadastro, edição, exclusão, quantidade e valor unitário conforme os tipos aceitos pelo esquema atual.
- Maquinários: cadastro, edição, exclusão, quantidade, etapa, custo e status Ativo/Inativo.
- Dashboard: obras iniciadas incluídas no contador de ativas; pausadas/paralisadas consideradas; loading da listagem corrigido.
- Nova obra do Dashboard abre o cadastro existente. O modal fecha depois do sucesso, atualiza a listagem e exibe erros dentro do formulário.
- Obras: normalização de status, trava de escrita para cadastro/status/exclusão e foco de teclado nos modais.
- Equipes: preservado CRUD existente; filtro real por obra corrigido na API compartilhada e labels de campos associados.
- Atribuição: consultas reais, atualização após transferência e bloqueio das ações enquanto a escrita está em andamento. Exclusão continua explicitamente identificada como exclusão definitiva.
- Analytics: cálculos existentes preservados; gráfico sem lançamentos permanece vazio, sem série artificial de zeros.

## 5. Canteiro

- Central Registrar com Atividade, Material, Foto e Ocorrência; acesso separado ao diário.
- Histórico de Obras com busca, categoria, status e abertura de detalhes; consulta dos diários mantida em RegistrosObra.
- Cards com categoria, localização, responsável e progresso quando presentes na resposta, com indicação explícita de ausência.
- Home com resumo diário, registros, pendências locais e ação de câmera.
- Detalhes com consultas de atividades executadas, fotos publicadas, consumos e RDOs, além dos recursos já existentes.
- Ocorrência simples: tipo, descrição, origem e data; obra e responsável preenchidos automaticamente; persistência nos campos reais do diário. Clima, turno e etapa permanecem nulos quando não informados.
- Diário consulta equipes reais da obra. As opções fictícias A/B/C foram retiradas da seleção; não há conversão inventada de equipe real para esse enum.
- Rascunhos existentes preservados, incluindo restauração de ocorrência. Sem sincronização automática. Falhas mantêm o formulário e mensagens distinguem rejeição da API de envio cuja confirmação foi perdida.

## 6. Integração

`api.js` aceita `VITE_API_URL`, mantendo o endereço anterior como padrão. Todos os ambientes usam o mesmo transporte e os mesmos cadastros.

O catálogo consulta `/insumos?idobra=...` e `/maquinarios?idobra=...` por obra, com concorrência limitada. Consulta vazia de obras retorna catálogo vazio, sem expor recursos globais. Equipes são filtradas e deduplicadas. Falhas de consulta propagam erro, sem fallback de sucesso.

Rotas de navegador `/escritorio/...` e `/canteiro/...` respeitam o ambiente da sessão; o campo `ambiente` prevalece e `Operacional` serve de alternativa somente se o ambiente estiver ausente. O botão voltar do navegador é tratado. Em hospedagem de produção, os caminhos da SPA precisam retornar `index.html`.

## 7. Workarounds removidos

- Fallback que substituía erro na consulta de obras por `[obra]` nos detalhes.
- Comentário antigo sobre contornar `Obra.getAll` e helpers vazios de lembrar/esquecer IDs.
- Helper opcional sem uso que absorvia erros da API.
- ID gerado com `Date.now()` no componente legado ModalNovaObra.
- Opções de equipes fictícias no diário.
- Consultas globais incompatíveis com as rotas de insumos e máquinas.

Não foram adicionados dados fictícios ao aplicativo. As respostas controladas existem exclusivamente nos testes e não são importadas pelo código de produção.

## 8. Tema e responsividade

Preferência em `localStorage.vertice_tema`, valores `light`/`dark`, aplicada antes da renderização. CSS usa variáveis compartilhadas para superfícies, texto, bordas e estados. Login, Cadastro, Escritório, Canteiro, modais, formulários e navegação compartilham o tema.

Ajustes de navegação do Escritório em telas pequenas, tabelas com rolagem interna, limites de tamanho dos modais e preservação da navegação inferior do Canteiro. Modais compartilhados e de Obras tratam Escape, ciclo de Tab e retorno de foco.

## 9. Testes

`node --test tests/frontend.test.mjs`: quatro testes de perfis, contratos de recursos, transferências e Analytics, incluindo ausência de lançamentos e respostas inválidas.

`node tests/canteiro.browser.mjs`: Chrome sem janela, com respostas de API controladas. Cobre login, seleção da obra, separação de ambientes, navegação, larguras 375/430/768/1024, tema persistente, rascunho offline com envio manual, atividade, falha e nova tentativa de material, ocorrência simples, preview/remoção de foto, recuperação de consultas, cadastro de obra, CRUD de insumos, edição de máquina e fluxos de equipes/atribuição. O JSON de execução registra os resultados efetivamente aprovados e as requisições POST.

A chamada real de leitura a `http://localhost:3000/api/obras` não encontrou servidor disponível durante a verificação. Portanto os testes de navegador não comprovam persistência no banco real; nenhuma escrita foi realizada em banco real por este trabalho.

## 10. Build

Executado em `frontend/` usando `npm.cmd run build` (equivalente Windows de `npm run build`). As dependências existentes foram instaladas com `npm.cmd ci`; não houve nova dependência de produção. A execução do esbuild exigiu sair do sandbox por restrição de acesso do ambiente.

## 11. Pendências que o frontend não consegue resolver sozinho

Estas limitações foram identificadas nos arquivos reais do backend e do esquema; não são todas simples ausências de dados:

- **Upload de foto:** não há rota de upload ou armazenamento de arquivos. Seleção, câmera, preview e remoção são locais. O apontamento aceita somente `url_foto` de imagem já publicada.
- **Desatribuição sem destino:** `idobra`/`id_obra` é obrigatório nos cadastros de recursos. Transferência para outra obra funciona pelo PUT existente; deixar o recurso sem obra não é suportado. Não foi usada exclusão para simular desatribuição.
- **Equipe independente de obra, status e dias de atuação:** o cadastro de equipes exige obra e não grava status/dias. Dias existem em usos de RDO, não como propriedade editável da equipe.
- **Equipe real no diário/apontamento:** diário contém enum A/B/C, sem vínculo com IDs do cadastro; apontamento físico não tem campo de equipe. As equipes reais são consultadas, mas não se afirma persistência de uma seleção que a API não suporta.
- **Ocorrência:** gravidade, local, horário e estado de resolução não possuem campos próprios no diário. São utilizados somente os campos existentes de atraso/paralisação, origem, data, obra e responsável.
- **Progresso global, endereço e responsável da obra:** ausentes no esquema atual de obra. Só aparecem preenchidos se a API fornecer esses dados; não são inferidos pela soma de percentuais de atividades.
- **Materiais:** apropriação não grava data/hora, fornecedor, nota fiscal nem altera estoque. Insumos usam quantidade e valor unitário inteiros no esquema fornecido.
- **Autorização:** a interface limita a navegação por ambiente e filtra obras por construtora. O backend consultado não fornece permissões por obra/usuário nem autenticação/autorização de endpoints suficiente para garantir isolamento no servidor; o frontend não substitui essa proteção.
- **Analytics sem lançamentos:** requer custos planejados/realizados ou usos de RDO e respectivas referências. A tela não inventa custos a partir da existência de estoque ou cadastro de recursos.

Nenhuma dessas limitações foi contornada com mocks, persistência fictícia ou alteração no backend.
