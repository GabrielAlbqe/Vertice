# Revisão do frontend Vértice — 04/10/2026

Backend não foi alterado.

A revisão começou pela estrutura do projeto, navegação, componentes, integrações, contratos das rotas/modelos e esquema SQL existente, antes das alterações. O backend foi consultado somente para conferir contratos. Não houve alteração de banco, criação de endpoint, instalação de dependências, commit ou push.

## 1. Arquivos criados

- `frontend/RELATORIO_REVISAO_FRONTEND.md`: este relatório.
- Nenhum componente, endpoint ou dependência nova.

## 2. Arquivos alterados e removidos

Todos os caminhos abaixo pertencem ao frontend.

| Área | Arquivos alterados |
| --- | --- |
| Entrada e navegação | `src/main.jsx`, `src/App.jsx` |
| Transporte e contratos | `src/api/api.js`, `src/api/obras.js`, `src/api/recursos.js` |
| Sessão e registros | `src/canteiro/sessao.js`, `src/canteiro/useRegistro.js` |
| Componentes do Canteiro | `src/componentes/canteiro/EstadoObra.jsx`, `ObraCard.jsx`, `RegistrosOperacionais.jsx` |
| Componentes do Escritório | `src/componentes/escritorio/Header.jsx`, `Layout.jsx`, `Modal.jsx`, `Sidebar.jsx` |
| Tema | `src/componentes/shared/ThemeToggle.jsx`, `src/theme.css` |
| Autenticação | `src/pages/Login.jsx`, `src/pages/escritorio/Cadastro.jsx` |
| Páginas do Canteiro | `src/pages/canteiro/CanteiroPerfil.jsx`, `HomeCanteiro.jsx`, `DetalheObra.jsx`, `RegistrosObra.jsx`, `CanteiroPendencias.jsx` |
| Páginas do Escritório | `src/pages/escritorio/Perfil.jsx`, `Dashboard.jsx`, `Equipes.jsx`, `ObraDetalhes.jsx`, `Obras.jsx`, `Recursos.jsx` |
| Testes | `tests/frontend.test.mjs`, `tests/canteiro.browser.mjs` |
| Evidências atualizadas | `tests/canteiro-browser-result.json`, `tests/screenshots/canteiro-375.png`, `canteiro-1024.png`, `canteiro-dark.png`, `escritorio-dark.png` |

Removido: `src/componentes/escritorio/ModalNovaObra.jsx`, componente sem importações nem uso, com um segundo formulário e nomes antigos de campos. O cadastro ativo continua exclusivamente em Obras, aberto pelo Dashboard.

## 3. Funcionalidades corrigidas

- Retirada do botão flutuante global. O tema mantém `localStorage.vertice_tema`, com `light`/`dark`, aplicação imediata e persistência após recarga. A inicialização permanece global para Login, Cadastro, Escritório, Canteiro e modais.
- Perfis organizados em informações pessoais, aparência/preferências e conta. O Escritório ganhou acesso explícito ao Perfil no menu.
- Cadastro direto sem sessão, normalização de URLs desconhecidas e proteção da navegação por ambiente. Detalhes do Escritório sem obra selecionada redirecionam para Obras.
- Verificação de que a obra consultada no Escritório pertence à construtora da sessão.
- Estados de carregamento no Canteiro, evitando mostrar formulários e estados vazios antes da consulta terminar. Falhas de diários, recursos, apontamentos e consumos têm mensagens distintas da ausência de registros.
- Identificação dos apontamentos por diário e registro, evitando chaves repetidas na lista agregada.
- Validação de IDs de obra/usuário e impedimento de envio enquanto os dados carregam. A resposta de um envio anterior não limpa o formulário de outra obra selecionada durante a requisição.
- Proteção contra envio repetido em Login, Cadastro, Equipes e operações dos detalhes da obra; preservadas as travas existentes em Obras, Recursos e registros do Canteiro.
- Validação de pavimentos, datas, orçamento, custos das equipes e obra disponível. Insumos respeitam os campos inteiros do esquema atual.
- Confirmações explícitas de exclusão definitiva e feedback após exclusão de obra. Transferência continua usando atualização do recurso e confirmação, sem DELETE para desatribuir.
- Orçamento/pavimentos ausentes deixam de ser normalizados como zero. Indicadores do Dashboard distinguem carregamento e consulta indisponível.
- Transporte com limite de 15 segundos, preservando cancelamento. Respostas HTML inesperadas com HTTP 200 não são tratadas como confirmação de sucesso; listas fora do contrato geram erro.
- Labels do Cadastro e filtros de Equipes, `aria-current` no menu, `aria-label` do Perfil, mensagens acessíveis e foco no conteúdo do Escritório.
- Modal mantém foco, trata TAB/ESC e devolve foco ao elemento de abertura; campos dentro de fieldsets desabilitados ficam fora do ciclo de foco.
- Sessão passou a armazenar somente campos permitidos do usuário. Senha, token e campos extras retornados pela API são descartados, inclusive em sessões antigas. Respostas pendentes do cabeçalho não recriam a sessão após logout.

## 4. Funcionalidades adicionadas e integrações preservadas

- Controle segmentado Claro/Escuro compartilhado entre os dois Perfis, com `aria-pressed`, foco visível e área de toque de 44 px.
- Home do Canteiro com quantidades consultadas de equipes, insumos e maquinários; em falha de consulta, exibe informação indisponível.
- Minha Obra organizada em visão geral, equipes, materiais/insumos, maquinários e até cinco diários recentes, além dos registros operacionais existentes.
- Dashboard com total de obras, planejamento e concluídas, preservando os demais indicadores. Obras ativas excluem planejamento.
- Filtro por obra em Equipes e indicação da obra no cadastro listado.
- Recuperação por Tentar novamente nos detalhes do Escritório.

Foram revisados e preservados os contratos existentes de apontamento físico, apropriação de insumos, diário, ocorrências registradas como atraso/paralisação do diário, RDO, histórico, rascunhos, CRUD de recursos/equipes/obras e transferência. O estoque não sofre baixa visual inventada. Equipes do diário continuam somente para consulta, sem IDs fictícios ou seleção declarada como salva. Fotos permanecem prévias locais com seleção, câmera, remoção e validação; URLs existentes continuam acessíveis nos registros.

Analytics Financeiro foi preservado, incluindo filtros, cálculos e gráfico sem série fictícia quando não existem lançamentos. Seus testes de cálculos reais, ausência de dados e valores inválidos passaram.

## 5. Testes executados

Executados dentro de `frontend/`:

```text
node --test tests/frontend.test.mjs
node tests/canteiro.browser.mjs
```

Resultado final: **7 testes unitários aprovados, 0 falhas**; **28 cenários registrados pela suíte de navegador, sem exceções nem avisos React**.

Além dos testes existentes, foram adicionadas verificações de descarte de credenciais, informação ausente e resposta HTML inválida. A suíte existente de Chrome headless foi adaptada para o tema no Perfil e ampliada para:

- 375, 430, 768, 1024 e 1366 px, com verificação de overflow nas telas percorridas dos dois ambientes e nos Perfis;
- todas as URLs solicitadas do Escritório e Canteiro, abertura direta e recarga;
- Cadastro direto e recarga sem sessão; logout e novo login;
- voltar/avançar no navegador, seleção de obra restaurada e bloqueio de acesso cruzado entre ambientes;
- tema persistente e ausência do controle fora dos Perfis, inclusive no Login/Cadastro;
- rascunho offline, restauração e remoção após envio confirmado;
- contratos dos registros, falha de envio preservando formulário e dois submits simultâneos produzindo apenas uma requisição;
- seleção/câmera/remoção de foto local, falha de consulta e recuperação;
- cadastro de obra pelo Dashboard, CRUD de insumos/equipes, edição de status de máquina e transferência de insumo;
- foco no modal, TAB, ESC e retorno ao botão que abriu o diálogo.

**Limite da validação:** a suíte de navegador existente intercepta a API com respostas controladas exclusivamente nos testes. Ela valida interface e contratos, sem escrever no banco real. Não foi realizada homologação com MySQL/API de produção. Não foram adicionados mocks ao código de produção nem instalado Playwright.

## 6. Resultado do build

```text
npm.cmd run build
vite v7.3.6
83 módulos transformados
build concluído em 1,82 s
```

Comando equivalente a `npm run build` no Windows. Resultado: **aprovado, código de saída 0**.

## 7. Erros encontrados

- Estados vazios/zeros apresentados antes de consultas concluídas ou após falha; corrigidos nos pontos descritos acima.
- Possível persistência de senha do objeto de usuário retornado pela API; corrigida no frontend.
- Requisições sem prazo, HTML de sucesso aparente, controles sem associação explícita de label e campos desabilitados no ciclo de foco; corrigidos.
- Chaves repetidas de apontamentos de diários distintos detectadas pela suíte ampliada; corrigidas e testes repetidos.
- Teste antigo procurava o botão global de tema; atualizado para o comportamento solicitado, mantendo suas verificações anteriores.
- PowerShell bloqueou `npm.ps1`; utilizado `npm.cmd`. O sandbox bloqueou o esbuild e a comunicação inicial com Chrome; execuções necessárias repetidas com a permissão solicitada. A suíte e o build finais passaram.

## 8. Limitações que dependem do backend ou hospedagem

- Não existe upload real de imagens. Nenhum arquivo é enviado ou declarado como salvo.
- Diário não possui vínculo correto com equipes cadastradas; os campos legados A/B/C não são usados para simular esse vínculo.
- Ocorrências simples usam campos reais de atraso/paralisação do diário. Não há persistência implementada de gravidade, localização ou resolução.
- Cadastro de recursos exige obra; não há desatribuição que deixe o vínculo vazio. DELETE continua significando exclusão definitiva.
- Cadastro de obra usa os quatro status do enum atual: Planejamento, Em Andamento, Concluida e Paralisada. Iniciada/Pausada não foram adicionadas ao banco nem às opções de cadastro.
- Apropriação não implementa baixa de estoque; após envio o frontend consulta novamente os dados.
- Estimativas financeiras continuam sujeitas às limitações dos registros existentes, incluindo unidade de duração e histórico de tarifas. Não foram inventados lançamentos ou números.
- Recarga de URLs foi validada no Vite. Hospedagem de produção precisa servir o documento inicial para rotas da aplicação; configuração de servidor não foi alterada.

## 9. Segurança

O anexo relata senha literal em `backend/config/connection.js`. **Na cópia atual analisada, esse arquivo usa `process.env` para a senha e não foi encontrada senha literal nessa configuração.** Ele não foi alterado. Caso a senha relatada esteja em outra alteração, ambiente ou versão do histórico, precisa ser corrigida separadamente, com rotação da credencial exposta.

Foi identificado armazenamento do objeto inteiro de usuário no frontend. O backend consulta/retorna registros de usuário completos, potencialmente incluindo senha. Agora somente campos permitidos são armazenados; os testes verificam a ausência de senha/token na sessão.

O backend ainda precisa revisar respostas de usuário, tratamento de senha e autenticação/autorização das rotas. A restrição de ambiente do frontend organiza a navegação, mas não substitui autorização do servidor: dados de sessão no navegador podem ser alterados pelo usuário. Nenhum segredo foi acrescentado ao frontend.

## 10. Conferência final

- `git diff --check`: sem erros de whitespace.
- `git diff -- backend`: vazio.
- `git status --short -- backend`: vazio.
- Alterações restritas ao frontend; build e evidências gerados nessa pasta.
- Nenhum commit ou push realizado.

**Backend não foi alterado.**
