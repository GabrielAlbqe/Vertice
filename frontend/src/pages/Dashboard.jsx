import { useEffect, useState } from "react";

import Layout from "../componentes/Layout";
import Card from "../componentes/Card";
import Table from "../componentes/Table";
import { requisitar } from "../api/api";

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function extrairLista(dados, chaves = []) {
  if (Array.isArray(dados)) {
    return dados;
  }

  for (const chave of chaves) {
    if (Array.isArray(dados?.[chave])) {
      return dados[chave];
    }
  }

  if (Array.isArray(dados?.dados)) {
    return dados.dados;
  }

  if (Array.isArray(dados?.resultado)) {
    return dados.resultado;
  }

  return [];
}

function normalizarObra(obra) {
  return {
    ...obra,

    id_obra:
      obra.id_obra ??
      obra.id,

    obra:
      obra.obra ??
      obra.nome ??
      "Obra sem nome",

    pavimentos:
      obra.pavimentos ??
      obra.numero_pavimentos ??
      0,

    data_inicial_planejada:
      obra.data_inicial_planejada ??
      obra.data_inicio_planejada ??
      "",

    data_final_planejada:
      obra.data_final_planejada ??
      obra.data_termino_planejada ??
      "",

    orcamento_planejado:
      Number(
        obra.orcamento_planejado || 0
      ),
  };
}

function formatarReal(valor) {
  return Number(valor || 0).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );
}

function obterIdEquipe(equipe) {
  return (
    equipe?.id_cadastro_equipes ??
    equipe?.id_equipe_terceirizad ??
    equipe?.id_equipe ??
    equipe?.id
  );
}

function numeroAvanco(obra) {
  const valor =
    obra.avanco ??
    obra.percentual_executado ??
    obra.avanco_fisico ??
    null;

  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const numero = Number(
    String(valor)
      .replace("%", "")
      .replace(",", ".")
  );

  return Number.isFinite(numero)
    ? numero
    : null;
}

// =====================================================
// DASHBOARD
// =====================================================

function Dashboard({ onNavegar }) {
  const [obras, setObras] =
    useState([]);

  const [usuarios, setUsuarios] =
    useState([]);

  const [
    usuarioLogado,
    setUsuarioLogado,
  ] = useState(null);

  const [
    ultimaAtualizacao,
    setUltimaAtualizacao,
  ] = useState("");

  const [
    atribuicoesEquipesLocais,
    setAtribuicoesEquipesLocais,
  ] = useState(() => {
    try {
      const salvo =
        localStorage.getItem(
          "vertice_atribuicoes_equipes_obras_v1"
        );

      return salvo
        ? JSON.parse(salvo)
        : {};
    } catch {
      return {};
    }
  });

  const [
    equipesTerceirizadas,
    setEquipesTerceirizadas,
  ] = useState([]);

  const [insumos, setInsumos] =
    useState([]);

  const [maquinarios, setMaquinarios] =
    useState([]);

  const [atividadesEap, setAtividadesEap] =
    useState([]);

  const [
    orcamentosPrevistos,
    setOrcamentosPrevistos,
  ] = useState([]);

  const [
    idConstrutora,
    setIdConstrutora,
  ] = useState(null);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState("");

  const [
    modalNovaObra,
    setModalNovaObra,
  ] = useState(false);

  const [
    salvandoObra,
    setSalvandoObra,
  ] = useState(false);

  const [novaObra, setNovaObra] =
    useState({
      nome_obra: "",
      status: "",
      categoria: "",
      numero_pavimento: "",
      data_inicial_planejada: "",
      data_final_planejada: "",
      orcamento_planejado: "",
    });

  // =====================================================
  // CARREGAR DADOS REAIS
  // =====================================================

  useEffect(() => {
    carregarDashboard();
  }, []);

  async function requisicaoOpcional(
    caminho,
    opcoes = {}
  ) {
    try {
      return await requisitar(
        caminho,
        opcoes
      );
    } catch (erro) {
      console.warn(
        `Falha ao carregar ${caminho}:`,
        erro
      );

      return [];
    }
  }

  async function carregarDashboard() {
    try {
      setCarregando(true);
      setErro("");

      const idUsuario =
        localStorage.getItem(
          "id_usuario"
        );

      if (!idUsuario) {
        throw new Error(
          "Usuário não identificado. Faça login novamente."
        );
      }

      // Primeiro descobrimos a construtora do usuário logado.
      const usuarioAtual =
        await requisitar(
          `/usuarios/${idUsuario}`
        );

      setUsuarioLogado(
        usuarioAtual
      );

      const construtora =
        usuarioAtual?.idconstrutora ??
        usuarioAtual?.id_construtora ??
        localStorage.getItem(
          "idconstrutora"
        ) ??
        localStorage.getItem(
          "id_construtora"
        );

      if (!construtora) {
        throw new Error(
          "Não foi possível identificar a construtora do usuário."
        );
      }

      setIdConstrutora(
        Number(construtora)
      );

      // Enviamos as duas grafias para ficar compatível
      // com os models/controllers que já existem no projeto.
      const parametrosConstrutora =
        `idconstrutora=${construtora}` +
        `&id_construtora=${construtora}`;

      const headersConstrutora = {
        idconstrutora:
          String(construtora),

        id_construtora:
          String(construtora),
      };

      const [
        respostaObras,
        respostaUsuarios,
      ] = await Promise.all([
        requisitar(
          `/obras?${parametrosConstrutora}`,
          {
            headers:
              headersConstrutora,
          }
        ),

        requisicaoOpcional(
          `/usuarios?${parametrosConstrutora}`,
          {
            headers:
              headersConstrutora,
          }
        ),
      ]);

      const listaObras =
        extrairLista(
          respostaObras,
          ["obras"]
        ).map(normalizarObra);

      const listaUsuarios =
        extrairLista(
          respostaUsuarios,
          ["usuarios"]
        );

      setObras(listaObras);
      setUsuarios(listaUsuarios);

      // Busca equipes, insumos, maquinários, EAP e orçamento previsto de TODAS as obras.
      const recursosPorObra =
        await Promise.all(
          listaObras.map(
            async (obra) => {
              const idObra =
                obra.id_obra;

              if (!idObra) {
                return {
                  equipes: [],
                  insumos: [],
                  maquinarios: [],
                  atividades: [],
                  orcamentos: [],
                };
              }

              const [
                respostaEquipes,
                respostaInsumos,
                respostaMaquinarios,
                respostaAtividades,
              ] = await Promise.all([
                requisicaoOpcional(
                  `/equipes/?idobra=${idObra}`
                ),

                requisicaoOpcional(
                  `/insumos/?idobra=${idObra}`
                ),

                requisicaoOpcional(
                  `/maquinarios/?idobra=${idObra}`
                ),

                requisicaoOpcional(
                  `/atividades-eap/?idx_obra=${idObra}`
                ),
              ]);

              const equipes =
                extrairLista(
                  respostaEquipes,
                  ["equipes"]
                ).map(
                  (equipe) => ({
                    ...equipe,
                    idobra:
                      equipe.idobra ??
                      idObra,
                    nome_obra:
                      obra.obra,
                  })
                );

              const listaInsumos =
                extrairLista(
                  respostaInsumos,
                  ["insumos"]
                ).map(
                  (insumo) => ({
                    ...insumo,
                    idobra:
                      insumo.idobra ??
                      idObra,
                    nome_obra:
                      obra.obra,
                  })
                );

              const listaMaquinarios =
                extrairLista(
                  respostaMaquinarios,
                  ["maquinarios"]
                ).map(
                  (maquinario) => ({
                    ...maquinario,
                    idobra:
                      maquinario.idobra ??
                      idObra,
                    nome_obra:
                      obra.obra,
                  })
                );

              const atividades =
                extrairLista(
                  respostaAtividades,
                  ["atividades"]
                ).map(
                  (atividade) => ({
                    ...atividade,
                    idobra: idObra,
                    nome_obra:
                      obra.obra,
                  })
                );

              const respostasOrcamentos =
                await Promise.all(
                  atividades.map(
                    async (atividade) => {
                      const idAtividade =
                        atividade.id_atividade;

                      if (!idAtividade) {
                        return [];
                      }

                      const resposta =
                        await requisicaoOpcional(
                          `/orcamentos-previstos/?id_atividade_eap=${idAtividade}`
                        );

                      return extrairLista(
                        resposta,
                        ["orcamentos"]
                      ).map(
                        (orcamento) => ({
                          ...orcamento,
                          idobra:
                            idObra,
                          nome_obra:
                            obra.obra,
                          id_atividade:
                            idAtividade,
                          descricao_atividade:
                            atividade.descricao,
                        })
                      );
                    }
                  )
                );

              const orcamentos =
                respostasOrcamentos.flat();

              return {
                equipes,
                insumos:
                  listaInsumos,
                maquinarios:
                  listaMaquinarios,
                atividades,
                orcamentos,
              };
            }
          )
        );

      setEquipesTerceirizadas(
        recursosPorObra.flatMap(
          (item) =>
            item.equipes
        )
      );

      setInsumos(
        recursosPorObra.flatMap(
          (item) =>
            item.insumos
        )
      );

      setMaquinarios(
        recursosPorObra.flatMap(
          (item) =>
            item.maquinarios
        )
      );

      setAtividadesEap(
        recursosPorObra.flatMap(
          (item) =>
            item.atividades
        )
      );

      setOrcamentosPrevistos(
        recursosPorObra.flatMap(
          (item) =>
            item.orcamentos
        )
      );

      try {
        const atribuicoesSalvas =
          localStorage.getItem(
            "vertice_atribuicoes_equipes_obras_v1"
          );

        setAtribuicoesEquipesLocais(
          atribuicoesSalvas
            ? JSON.parse(
                atribuicoesSalvas
              )
            : {}
        );
      } catch {
        setAtribuicoesEquipesLocais(
          {}
        );
      }

      setUltimaAtualizacao(
        new Date().toLocaleTimeString(
          "pt-BR",
          {
            hour: "2-digit",
            minute: "2-digit",
          }
        )
      );

    } catch (erro) {
      console.error(
        "Erro ao carregar dashboard:",
        erro
      );

      setErro(
        erro.message ||
          "Não foi possível carregar o dashboard."
      );

    } finally {
      setCarregando(false);
    }
  }

  // =====================================================
  // NOVA OBRA
  // =====================================================

  function handleNovaObraChange(
    event
  ) {
    const { name, value } =
      event.target;

    setNovaObra({
      ...novaObra,
      [name]: value,
    });
  }

  function fecharModalNovaObra() {
    setModalNovaObra(false);

    setNovaObra({
      nome_obra: "",
      status: "",
      categoria: "",
      numero_pavimento: "",
      data_inicial_planejada: "",
      data_final_planejada: "",
      orcamento_planejado: "",
    });
  }

  async function cadastrarNovaObra(
    event
  ) {
    event.preventDefault();

    if (
      novaObra.data_final_planejada <
      novaObra.data_inicial_planejada
    ) {
      setErro(
        "A data final planejada não pode ser anterior à data inicial."
      );

      return;
    }

    if (!idConstrutora) {
      setErro(
        "Não foi possível identificar a construtora."
      );

      return;
    }

    try {
      setSalvandoObra(true);
      setErro("");

      await requisitar(
        "/obras/insert",
        {
          method: "POST",

          body:
            JSON.stringify({
              nome:
                novaObra.nome_obra,

              status:
                novaObra.status,

              id_construtora:
                idConstrutora,

              categoria:
                novaObra.categoria,

              numero_pavimentos:
                Number(
                  novaObra.numero_pavimento
                ),

              data_inicio_planejada:
                novaObra
                  .data_inicial_planejada,

              data_termino_planejada:
                novaObra
                  .data_final_planejada,

              orcamento_planejado:
                Number(
                  novaObra
                    .orcamento_planejado
                ),
            }),
        }
      );

      fecharModalNovaObra();

      await carregarDashboard();

    } catch (erro) {
      console.error(
        "Erro ao cadastrar obra:",
        erro
      );

      setErro(
        erro.message ||
          "Não foi possível cadastrar a obra."
      );

    } finally {
      setSalvandoObra(false);
    }
  }

  // =====================================================
  // INDICADORES
  // =====================================================

  function statusNormalizado(status) {
    return String(status || "")
      .trim()
      .toLowerCase();
  }

  function obraEstaAtiva(obra) {
    const status =
      statusNormalizado(
        obra.status
      );

    return [
      "planejamento",
      "ativa",
      "ativo",
      "iniciada",
      "iniciado",
      "em andamento",
    ].includes(status);
  }

  const obrasAtivas =
    obras.filter(
      obraEstaAtiva
    ).length;

  const obrasPlanejamento =
    obras.filter(
      (obra) =>
        statusNormalizado(
          obra.status
        ) === "planejamento"
    ).length;

  const obrasEmAndamento =
    obras.filter(
      (obra) => {
        const status =
          statusNormalizado(
            obra.status
          );

        return (
          status === "em andamento" ||
          status === "ativa" ||
          status === "ativo" ||
          status === "iniciada" ||
          status === "iniciado"
        );
      }
    ).length;

  const obrasParalisadas =
    obras.filter(
      (obra) =>
        statusNormalizado(
          obra.status
        ) === "paralisada"
    ).length;

  const obrasConcluidas =
    obras.filter(
      (obra) =>
        [
          "concluída",
          "concluida",
        ].includes(
          statusNormalizado(
            obra.status
          )
        )
    ).length;

  const usuariosAtivos =
    usuarios.filter(
      (usuario) =>
        usuario.status === "Ativo"
    ).length;

  const usuariosEscritorio =
    usuarios.filter(
      (usuario) =>
        usuario.ambiente ===
        "Escritório"
    ).length;

  const usuariosCanteiro =
    usuarios.filter(
      (usuario) =>
        usuario.ambiente ===
          "Canteiro" ||
        usuario.ambiente ===
          "Canteiro de Obras"
    ).length;

  const orcamentoPlanejado =
    obras.reduce(
      (total, obra) =>
        total +
        Number(
          obra.orcamento_planejado ||
            0
        ),
      0
    );

  const custoPlanejadoEap =
    orcamentosPrevistos.reduce(
      (total, item) =>
        total +
        Number(
          item.valor_planejado ||
            0
        ),
      0
    );

  const obrasComEap =
    new Set(
      atividadesEap
        .map(
          (atividade) =>
            atividade.idobra
        )
        .filter(Boolean)
    ).size;

  const orcamentoExibido =
    orcamentosPrevistos.length > 0
      ? custoPlanejadoEap
      : orcamentoPlanejado;

  const idsEquipesAtribuidas =
    new Set(
      Object.values(
        atribuicoesEquipesLocais
      )
        .flat()
        .map(
          (item) =>
            item?.id_equipe
        )
        .filter(
          (id) =>
            id !== undefined &&
            id !== null
        )
        .map(String)
    );

  const equipesAtribuidasLocais =
    equipesTerceirizadas.filter(
      (equipe) => {
        const id =
          obterIdEquipe(
            equipe
          );

        return (
          id !== undefined &&
          id !== null &&
          idsEquipesAtribuidas.has(
            String(id)
          )
        );
      }
    );

  // Enquanto a rota definitiva obra-equipe não existe,
  // usa as atribuições locais quando houver.
  // Se não houver nenhuma, mantém compatibilidade com o
  // relacionamento antigo vindo do backend.
  const equipesParaResumo =
    idsEquipesAtribuidas.size > 0
      ? equipesAtribuidasLocais
      : equipesTerceirizadas;

  const totalProfissionais =
    equipesParaResumo.reduce(
      (total, equipe) =>
        total +
        Number(
          equipe
            .quantidade_profissionais ||
            0
        ),
      0
    );

  const custoMensalTerceirizadas =
    equipesParaResumo.reduce(
      (total, equipe) =>
        total +
        Number(
          equipe.custo_mensal ||
            0
        ),
      0
    );

  const valorEstoque =
    insumos.reduce(
      (total, insumo) =>
        total +
        Number(
          insumo
            .quantidade_disponivel ||
            0
        ) *
          Number(
            insumo.valor_unitario ||
              0
          ),
      0
    );

  const quantidadeMaquinarios =
    maquinarios.reduce(
      (total, item) =>
        total +
        Number(
          item.quantidade || 0
        ),
      0
    );

  const maquinariosAtivos =
    maquinarios.filter(
      (item) =>
        String(
          item.status || ""
        )
          .trim()
          .toLowerCase() ===
        "ativo"
    );

  const custoDiarioMaquinarios =
    maquinarios.reduce(
      (total, item) =>
        total +
        Number(
          item.quantidade || 0
        ) *
          Number(
            item.custo_diario ??
              item
                .custo_diario_maquinario ??
              0
          ),
      0
    );

  const avancosDisponiveis =
    obras
      .map(numeroAvanco)
      .filter(
        (valor) =>
          valor !== null
      );

  const avancoFisicoMedio =
    avancosDisponiveis.length > 0
      ? avancosDisponiveis.reduce(
          (total, valor) =>
            total + valor,
          0
        ) /
        avancosDisponiveis.length
      : null;

  // =====================================================
  // ALERTAS REAIS A PARTIR DOS DADOS DISPONÍVEIS
  // =====================================================

  const alertas = [];

  obras
    .filter(
      (obra) =>
        statusNormalizado(
          obra.status
        ) === "paralisada"
    )
    .forEach((obra) => {
      alertas.push({
        id:
          `obra-${obra.id_obra}`,

        tipo: "danger",

        titulo:
          "Obra paralisada",

        descricao:
          `${obra.obra} está com status Paralisada.`,
      });
    });

  maquinarios
    .filter(
      (item) =>
        String(
          item.status || ""
        )
          .trim()
          .toLowerCase() ===
        "inativo"
    )
    .slice(0, 3)
    .forEach(
      (item, indice) => {
        alertas.push({
          id:
            `maq-${item.id_maquina ?? indice}`,

          tipo: "warning",

          titulo:
            "Maquinário inativo",

          descricao:
            `${item.nome} está inativo em ${item.nome_obra || "uma obra"}.`,
        });
      }
    );

  if (
    alertas.length === 0 &&
    obras.length > 0
  ) {
    alertas.push({
      id: "sem-alertas",
      tipo: "success",
      titulo:
        "Sem alertas críticos",
      descricao:
        "Nenhuma obra paralisada ou maquinário inativo foi identificado.",
    });
  }

  // =====================================================
  // PLANEJAMENTO EAP POR OBRA
  // =====================================================

  const planejamentoEapTabela =
    obras.map((obra) => {
      const atividadesDaObra =
        atividadesEap.filter(
          (atividade) =>
            String(
              atividade.idobra
            ) ===
            String(
              obra.id_obra
            )
        );

      const orcamentosDaObra =
        orcamentosPrevistos.filter(
          (orcamento) =>
            String(
              orcamento.idobra
            ) ===
            String(
              obra.id_obra
            )
        );

      const totalPlanejado =
        orcamentosDaObra.reduce(
          (total, item) =>
            total +
            Number(
              item.valor_planejado ||
                0
            ),
          0
        );

      return {
        id_obra:
          obra.id_obra,

        obra:
          obra.obra,

        atividades:
          atividadesDaObra.length,

        custo_planejado:
          formatarReal(
            totalPlanejado
          ),
      };
    });

  const colunasPlanejamentoEap = [
    {
      key: "obra",
      label: "Obra",
    },
    {
      key: "atividades",
      label: "Atividades EAP",
    },
    {
      key: "custo_planejado",
      label: "Custo planejado",
    },
  ];

  // =====================================================
  // TABELA DE OBRAS
  // =====================================================

  const obrasTabela =
    obras.map((obra) => ({
      ...obra,

      pavimentos:
        obra.pavimentos || "-",

      orcamento:
        formatarReal(
          obra.orcamento_planejado
        ),

      situacao:
        statusNormalizado(
          obra.status
        ) === "paralisada"
          ? "Atenção"
          : [
              "concluída",
              "concluida",
            ].includes(
              statusNormalizado(
                obra.status
              )
            )
            ? "Concluída"
            : obraEstaAtiva(obra)
              ? "Ativa"
              : "Em acompanhamento",
    }));

  const colunasObras = [
    {
      key: "obra",
      label: "Obra",
    },
    {
      key: "status",
      label: "Status",
    },
    {
      key: "categoria",
      label: "Categoria",
    },
    {
      key: "pavimentos",
      label: "Pavimentos",
    },
    {
      key: "orcamento",
      label: "Orçamento",
    },
    {
      key: "situacao",
      label: "Situação",
    },
  ];

  // =====================================================
  // CARREGANDO
  // =====================================================

  if (carregando) {
    return (
      <Layout
        onNavegar={onNavegar}
      >
        <div className="dashboard">

          <section className="dashboard-section">

            <span className="section-label">
              VÉRTICE
            </span>

            <h2>
              Carregando Dashboard...
            </h2>

            <p>
              Buscando obras, usuários,
              equipes, insumos, maquinários,
              planejamento EAP e orçamento.
            </p>

          </section>

        </div>
      </Layout>
    );
  }

  // =====================================================
  // JSX
  // =====================================================

  return (
    <Layout onNavegar={onNavegar}>

      <div className="dashboard">

        {/* CABEÇALHO */}

        <section className="dashboard-header">

          <div>

            <span className="dashboard-eyebrow">
              VISÃO GERAL
            </span>

            <h1>
              Dashboard
            </h1>

            <p>
              {usuarioLogado?.nome
                ? `Olá, ${usuarioLogado.nome}. `
                : ""}
              Acompanhe obras, pessoas,
              recursos e custos com dados
              vindos do sistema.
            </p>

            {ultimaAtualizacao && (
              <small
                style={{
                  display: "block",
                  marginTop: "8px",
                  color: "#64748b",
                }}
              >
                Dados atualizados às{" "}
                {ultimaAtualizacao}
              </small>
            )}

          </div>

          <div className="dashboard-header-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={
                carregarDashboard
              }
            >
              Atualizar dados
            </button>

            <button
              type="button"
              className="button"
              onClick={() =>
                setModalNovaObra(
                  true
                )
              }
            >
              + Nova obra
            </button>

          </div>

        </section>

        {erro && (
          <div className="auth-error">
            {erro}
          </div>
        )}

        {/* KPIs */}

        <section className="cards-grid">

          <Card
            title="Obras ativas"
            value={obrasAtivas}
            description={`${obras.length} obras cadastradas`}
          />

          <Card
            title="Avanço físico médio"
            value={
              avancoFisicoMedio !==
              null
                ? `${avancoFisicoMedio.toFixed(1)}%`
                : "—"
            }
            description={
              avancoFisicoMedio !==
              null
                ? "Média dos registros disponíveis"
                : "Aguardando apontamento físico"
            }
          />

          <Card
            title="Orçamento planejado"
            value={
              orcamentoExibido >=
              1000000
                ? `R$ ${(
                    orcamentoExibido /
                    1000000
                  ).toFixed(2)} mi`
                : formatarReal(
                    orcamentoExibido
                  )
            }
            description={
              orcamentosPrevistos.length > 0
                ? "Somatório dos orçamentos das atividades EAP"
                : "Total cadastrado nas obras"
            }
          />

          <Card
            title="Alertas"
            value={
              alertas.filter(
                (item) =>
                  item.tipo !==
                  "success"
              ).length
            }
            description="Situações que exigem atenção"
          />

        </section>

        {/* PLANEJAMENTO EAP */}

        <section className="dashboard-section">

          <div className="section-header">

            <div>

              <span className="section-label">
                PLANEJAMENTO
              </span>

              <h2>
                Planejamento por EAP
              </h2>

              <p>
                Orçamento previsto vinculado às
                atividades de cada obra.
              </p>

            </div>

          </div>

          <div className="planning-grid">

            <div className="planning-card">

              <span>
                Atividades EAP
              </span>

              <strong>
                {atividadesEap.length}
              </strong>

              <small>
                Atividades cadastradas
              </small>

            </div>

            <div className="planning-card">

              <span>
                Obras com EAP
              </span>

              <strong>
                {obrasComEap}
              </strong>

              <small>
                De {obras.length} obras
              </small>

            </div>

            <div className="planning-card">

              <span>
                Registros de orçamento
              </span>

              <strong>
                {orcamentosPrevistos.length}
              </strong>

              <small>
                Orçamentos vinculados às atividades
              </small>

            </div>

            <div className="planning-card">

              <span>
                Custo planejado EAP
              </span>

              <strong>
                {formatarReal(
                  custoPlanejadoEap
                )}
              </strong>

              <small>
                Soma de valor_planejado
              </small>

            </div>

          </div>

          <div
            className="dashboard-table"
            style={{ marginTop: "24px" }}
          >

            <Table
              columns={
                colunasPlanejamentoEap
              }
              data={
                planejamentoEapTabela
              }
            />

          </div>

        </section>

        {/* RECURSOS CONSOLIDADOS */}

        <section className="dashboard-section">

          <div className="section-header">

            <div>

              <span className="section-label">
                RECURSOS
              </span>

              <h2>
                Recursos consolidados
              </h2>

              <p>
                Dados reais cadastrados nas
                obras da construtora.
              </p>

            </div>

          </div>

          <div className="planning-grid">

            <div className="planning-card">

              <span>
                Profissionais terceirizados
              </span>

              <strong>
                {totalProfissionais}
              </strong>

              <small>
                Em {equipesParaResumo.length} equipes
              </small>

            </div>

            <div className="planning-card">

              <span>
                Custo mensal das equipes
              </span>

              <strong>
                {formatarReal(
                  custoMensalTerceirizadas
                )}
              </strong>

              <small>
                Equipes terceirizadas
              </small>

            </div>

            <div className="planning-card">

              <span>
                Valor dos insumos em estoque
              </span>

              <strong>
                {formatarReal(
                  valorEstoque
                )}
              </strong>

              <small>
                {insumos.length} tipos cadastrados
              </small>

            </div>

            <div className="planning-card">

              <span>
                Maquinários / dia
              </span>

              <strong>
                {formatarReal(
                  custoDiarioMaquinarios
                )}
              </strong>

              <small>
                {quantidadeMaquinarios} unidades • {maquinariosAtivos.length} registros ativos
              </small>

            </div>

          </div>

        </section>

        {/* OBRAS */}

        <section className="dashboard-section">

          <div className="section-header">

            <div>

              <span className="section-label">
                PORTFÓLIO
              </span>

              <h2>
                Obras em acompanhamento
              </h2>

              <p>
                Obras cadastradas para a
                construtora do usuário.
              </p>

            </div>

            <div className="section-actions">

              <button
                className="button"
                onClick={() =>
                  setModalNovaObra(
                    true
                  )
                }
              >
                + Nova obra
              </button>

              <button
                className="secondary-button"
                onClick={() =>
                  onNavegar("obras")
                }
              >
                Ver todas
              </button>

            </div>

          </div>

          <div className="dashboard-table">

            <Table
              columns={
                colunasObras
              }
              data={
                obrasTabela
              }
            />

          </div>

        </section>

        {/* SITUAÇÃO DAS OBRAS */}

        <section className="dashboard-section">

          <div className="section-header">

            <div>

              <span className="section-label">
                PLANEJAMENTO
              </span>

              <h2>
                Situação das obras
              </h2>

              <p>
                Distribuição de acordo com o
                status cadastrado.
              </p>

            </div>

          </div>

          <div className="indicators">

            <div className="indicator">

              <div className="indicator-top">

                <span>
                  Planejamento
                </span>

                <span className="indicator-status positive">
                  Planejado
                </span>

              </div>

              <strong>
                {obrasPlanejamento}
              </strong>

              <small>
                Obras em planejamento
              </small>

            </div>

            <div className="indicator">

              <div className="indicator-top">

                <span>
                  Em andamento
                </span>

                <span className="indicator-status positive">
                  Ativo
                </span>

              </div>

              <strong>
                {obrasEmAndamento}
              </strong>

              <small>
                Obras em execução
              </small>

            </div>

            <div className="indicator">

              <div className="indicator-top">

                <span>
                  Paralisadas
                </span>

                <span className="indicator-status danger">
                  Atenção
                </span>

              </div>

              <strong>
                {obrasParalisadas}
              </strong>

              <small>
                Necessitam acompanhamento
              </small>

            </div>

            <div className="indicator">

              <div className="indicator-top">

                <span>
                  Concluídas
                </span>

                <span className="indicator-status positive">
                  Finalizado
                </span>

              </div>

              <strong>
                {obrasConcluidas}
              </strong>

              <small>
                Obras finalizadas
              </small>

            </div>

          </div>

        </section>

        {/* ALERTAS */}

        <section className="dashboard-section">

          <div className="section-header">

            <div>

              <span className="section-label">
                MONITORAMENTO
              </span>

              <h2>
                Alertas
              </h2>

              <p>
                Alertas gerados a partir dos
                registros disponíveis.
              </p>

            </div>

          </div>

          <div className="alert-list">

            {alertas.length === 0 ? (

              <div className="alert alert-success">

                <div className="alert-icon">
                  ✓
                </div>

                <div>

                  <strong>
                    Nenhum alerta
                  </strong>

                  <span>
                    Ainda não há dados suficientes
                    para gerar alertas.
                  </span>

                </div>

              </div>

            ) : (

              alertas.map(
                (alerta) => (

                  <div
                    key={alerta.id}
                    className={`alert alert-${alerta.tipo}`}
                  >

                    <div className="alert-icon">

                      {alerta.tipo ===
                      "success"
                        ? "✓"
                        : "!"}

                    </div>

                    <div>

                      <strong>
                        {alerta.titulo}
                      </strong>

                      <span>
                        {alerta.descricao}
                      </span>

                    </div>

                  </div>

                )
              )

            )}

          </div>

        </section>

        {/* USUÁRIOS */}

        <section className="dashboard-section">

          <div className="section-header">

            <div>

              <span className="section-label">
                GESTÃO DE PESSOAS
              </span>

              <h2>
                Usuários
              </h2>

              <p>
                Distribuição dos usuários
                vinculados à construtora.
              </p>

            </div>

          </div>

          <div className="people-distribution-grid">

            <div className="distribution-card">

              <div className="distribution-card-header">

                <span>
                  Usuários ativos
                </span>

                <span className="indicator-status positive">
                  Ativo
                </span>

              </div>

              <strong>
                {usuariosAtivos}
              </strong>

              <p>
                Total de usuários ativos
              </p>

            </div>

            <div className="distribution-card">

              <div className="distribution-card-header">

                <span>
                  Escritório
                </span>

                <span className="indicator-status positive">
                  Gestão
                </span>

              </div>

              <strong>
                {usuariosEscritorio}
              </strong>

              <p>
                Gerência e financeiro
              </p>

            </div>

            <div className="distribution-card">

              <div className="distribution-card-header">

                <span>
                  Canteiro de Obras
                </span>

                <span className="indicator-status positive">
                  Operacional
                </span>

              </div>

              <strong>
                {usuariosCanteiro}
              </strong>

              <p>
                Usuários operacionais
              </p>

            </div>

          </div>

        </section>

        {/* EQUIPES E MAQUINÁRIOS */}

        <section className="dashboard-section">

          <div className="section-header">

            <div>

              <span className="section-label">
                RECURSOS OPERACIONAIS
              </span>

              <h2>
                Equipes e equipamentos
              </h2>

              <p>
                Visão consolidada dos recursos
                cadastrados nas obras.
              </p>

            </div>

            <button
              className="secondary-button"
              onClick={() =>
                onNavegar("equipes")
              }
            >
              Ver equipes
            </button>

          </div>

          <div className="resource-summary-grid">

            <div className="resource-summary-card">

              <span>
                Equipes terceirizadas
              </span>

              <strong>
                {equipesParaResumo.length}
              </strong>

              <p>
                Custo mensal total
              </p>

              <b>
                {formatarReal(
                  custoMensalTerceirizadas
                )}
              </b>

            </div>

            <div className="resource-summary-card">

              <span>
                Maquinários
              </span>

              <strong>
                {quantidadeMaquinarios}
              </strong>

              <p>
                Custo diário estimado
              </p>

              <b>
                {formatarReal(
                  custoDiarioMaquinarios
                )}
              </b>

            </div>

            <div className="resource-summary-card">

              <span>
                Insumos
              </span>

              <strong>
                {insumos.length}
              </strong>

              <p>
                Valor em estoque
              </p>

              <b>
                {formatarReal(
                  valorEstoque
                )}
              </b>

            </div>

          </div>

        </section>

        {/* FINANCEIRO */}

        <section className="dashboard-section">

          <div className="section-header">

            <div>

              <span className="section-label">
                FINANCEIRO
              </span>

              <h2>
                Resumo financeiro
              </h2>

              <p>
                Valores consolidados que já
                possuem dados reais no sistema.
              </p>

            </div>

          </div>

          <div className="financial-summary-grid">

            <div className="financial-summary-card">

              <span>
                Planejado pela EAP
              </span>

              <strong>
                {formatarReal(
                  custoPlanejadoEap
                )}
              </strong>

            </div>

            <div className="financial-summary-card">

              <span>
                Orçamento das obras
              </span>

              <strong>
                {formatarReal(
                  orcamentoPlanejado
                )}
              </strong>

            </div>

            <div className="financial-summary-card">

              <span>
                Equipes / mês
              </span>

              <strong>
                {formatarReal(
                  custoMensalTerceirizadas
                )}
              </strong>

            </div>

            <div className="financial-summary-card">

              <span>
                Estoque de materiais
              </span>

              <strong>
                {formatarReal(
                  valorEstoque
                )}
              </strong>

            </div>

            <div className="financial-summary-card">

              <span>
                Maquinários / dia
              </span>

              <strong>
                {formatarReal(
                  custoDiarioMaquinarios
                )}
              </strong>

            </div>

          </div>

        </section>

        {/* MODAL NOVA OBRA */}

        {modalNovaObra && (

          <div className="modal-overlay">

            <div className="modal-container modal-obra">

              <div className="modal-header">

                <div>

                  <span className="section-label">
                    PLANEJAMENTO
                  </span>

                  <h2>
                    Nova obra
                  </h2>

                  <p>
                    Preencha os dados para
                    cadastrar uma nova obra.
                  </p>

                </div>

                <button
                  type="button"
                  className="modal-close"
                  onClick={
                    fecharModalNovaObra
                  }
                >
                  ×
                </button>

              </div>

              <form
                className="obra-form"
                onSubmit={
                  cadastrarNovaObra
                }
              >

                <div className="form-group">

                  <label>
                    Nome da obra
                  </label>

                  <input
                    type="text"
                    name="nome_obra"
                    placeholder="Ex: Residencial Aurora"
                    value={
                      novaObra.nome_obra
                    }
                    onChange={
                      handleNovaObraChange
                    }
                    required
                  />

                </div>

                <div className="obra-form-grid">

                  <div className="form-group">

                    <label>
                      Status
                    </label>

                    <select
                      name="status"
                      value={
                        novaObra.status
                      }
                      onChange={
                        handleNovaObraChange
                      }
                      required
                    >

                      <option value="">
                        Selecione
                      </option>

                      <option value="Planejamento">
                        Planejamento
                      </option>

                      <option value="Em Andamento">
                        Em Andamento
                      </option>

                      <option value="Paralisada">
                        Paralisada
                      </option>

                      <option value="Concluída">
                        Concluída
                      </option>

                    </select>

                  </div>

                  <div className="form-group">

                    <label>
                      Categoria
                    </label>

                    <select
                      name="categoria"
                      value={
                        novaObra.categoria
                      }
                      onChange={
                        handleNovaObraChange
                      }
                      required
                    >

                      <option value="">
                        Selecione
                      </option>

                      <option value="Residencial">
                        Residencial
                      </option>

                      <option value="Comercial">
                        Comercial
                      </option>

                      <option value="Industrial">
                        Industrial
                      </option>

                      <option value="Reforma">
                        Reforma
                      </option>

                    </select>

                  </div>

                </div>

                <div className="form-group">

                  <label>
                    Número de pavimentos
                  </label>

                  <input
                    type="number"
                    name="numero_pavimento"
                    min="1"
                    value={
                      novaObra.numero_pavimento
                    }
                    onChange={
                      handleNovaObraChange
                    }
                    required
                  />

                </div>

                <div className="obra-form-grid">

                  <div className="form-group">

                    <label>
                      Data inicial planejada
                    </label>

                    <input
                      type="date"
                      name="data_inicial_planejada"
                      value={
                        novaObra
                          .data_inicial_planejada
                      }
                      onChange={
                        handleNovaObraChange
                      }
                      required
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Data final planejada
                    </label>

                    <input
                      type="date"
                      name="data_final_planejada"
                      value={
                        novaObra
                          .data_final_planejada
                      }
                      onChange={
                        handleNovaObraChange
                      }
                      required
                    />

                  </div>

                </div>

                <div className="form-group">

                  <label>
                    Orçamento planejado
                  </label>

                  <input
                    type="number"
                    name="orcamento_planejado"
                    min="0"
                    step="0.01"
                    value={
                      novaObra
                        .orcamento_planejado
                    }
                    onChange={
                      handleNovaObraChange
                    }
                    required
                  />

                </div>

                <div className="modal-actions">

                  <button
                    type="button"
                    className="cancel-button"
                    onClick={
                      fecharModalNovaObra
                    }
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="button"
                    disabled={
                      salvandoObra
                    }
                  >
                    {salvandoObra
                      ? "Cadastrando..."
                      : "Cadastrar obra"}
                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

      </div>

    </Layout>
  );
}

export default Dashboard;
