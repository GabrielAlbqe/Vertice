# Melhorias e demonstração — 28/10/2026

A página Inteligência Operacional recebeu filtros principais compactos, opções avançadas recolhidas, períodos rápidos, botões estilizados, indicação de alterações pendentes, seleção de obra persistida por usuário, indicadores resumidos e navegação entre análises. O botão **Abrir demonstração** seleciona uma obra identificada e exibe aviso de dados sintéticos.

## Carga autorizada na Valen

Foram adicionados 1.100 registros relacionados em 24 tabelas, sem substituir registros anteriores. Três obras novas, vinculadas à construtora 1:

| ID | Obra | Orçamento | Custos realizados |
|---|---|---:|---:|
| 18 | [DEMO] Residencial Aurora | R$ 900.000,00 | R$ 62.842,00 |
| 19 | [DEMO] Centro Empresarial | R$ 1.400.000,00 | R$ 84.837,60 |
| 20 | [DEMO] Parque Logístico | R$ 650.000,00 | R$ 50.273,60 |

Cada obra tem 24 dias úteis de registros entre 24/09 e 27/10/2026. A carga inclui etapas, EAP, orçamentos, custos planejados e realizados, equipes, máquinas, insumos, terceirizadas, diários, RDOs, consumo, apropriações, apontamentos físicos, atrasos, paralisações, histórico, relatórios, projeções e cenários manuais de EVA. Não foram criados usuários nem alteradas suas senhas.

As obras 18 e 19 têm 15 ocorrências cada; a obra 20 tem 20. Diário e RDO representam fontes alternativas: não somar suas ocorrências como eventos independentes. Os valores de EVA são exemplos manuais, não uma nova fórmula oficial. A imagem de registro é uma ilustração explicitamente identificada.

Os painéis gerais da Valen passam a incluir essas obras demonstrativas. Os recursos continuam sem associação causal inventada às ocorrências. Impacto financeiro estimado permanece indisponível quando faltam vínculos e unidades necessários; duração do RDO não é convertida para horas sem especificação.

## Segurança e reprodução

Script: backend/scripts/popular-demonstracao.js. Sem argumentos, apresenta uma prévia sem inserir dados. Aplicação explícita, a partir de backend:

    node scripts/popular-demonstracao.js --apply --database=valen

A carga usa backup prévio, bloqueio nomeado e transação. Uma carga completa existente é reconhecida para evitar duplicação; carga parcial interrompe a operação. Não executa DDL. DEMO_FRONTEND_URL configura a origem da imagem; padrão http://localhost:5173.

Backup:
C:/Users/labredes.cisss/.codex/backups/vertice/valen-antes-demo-2026-10-28T14-16-54-131Z.sql

Manifesto com IDs inseridos:
C:/Users/labredes.cisss/.codex/backups/vertice/demonstracao-valen-v1-2026-10-28T14-16-54-131Z.json

## Verificação

- Backend: 333 testes aprovados.
- Frontend: 31 testes aprovados, incluindo DOM e períodos rápidos.
- Build de produção do frontend concluído.
- Seis consultas autenticadas reais, diário e RDO das três obras, retornaram HTTP 200, 24 registros por fonte e totais esperados.
- Imagem ilustrativa retornou HTTP 200; links dos 72 apontamentos novos foram ajustados.
- Navegador automatizado permanece bloqueado pela política Sophos do ambiente; não houve validação visual automatizada. Testes DOM cobrem os fluxos da página.

Para explorar, atualize a página e clique em **Abrir demonstração** ou escolha uma obra [DEMO] no filtro.
