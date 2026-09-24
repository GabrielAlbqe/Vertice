import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Layout from "../componentes/Layout";

import {
  requisitar,
} from "../api/api.js";

import {
  listarObras,
} from "../api/obras.js";

import {
  atualizarEquipe,
  criarEquipe,
  excluirEquipe,
  listarEquipesTerceirizadas,
  obterIdEquipe,
} from "../api/recursos.js";

// =====================================================
// ÁREAS DE ATUAÇÃO
// =====================================================

const AREAS_ATUACAO = [
  "Mobilização",
  "Infraestrutura",
  "Supraestrutura e Alvenaria",
  "Instalações",
  "Revestimentos",
  "Acabamento",
];

// =====================================================
// FORMULÁRIO VAZIO
// =====================================================

const FORMULARIO_VAZIO = {
  nome_equipe: "",
  area_atuacao: "",
  quantidade_profissionais: "",
  custo_diario_total: "",
  id_obra: "",
};

// =====================================================
// FORMATAR DINHEIRO
// =====================================================

function formatarReal(valor) {
  return Number(valor || 0).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );
}

// =====================================================
// COMPONENTE
// =====================================================

function Equipes({
  onNavegar,
}) {
  // ===================================================
  // ESTADOS
  // ===================================================

  const [
    equipes,
    setEquipes,
  ] = useState([]);

  const [
    obras,
    setObras,
  ] = useState([]);

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    sucesso,
    setSucesso,
  ] = useState("");

  const [
    pesquisa,
    setPesquisa,
  ] = useState("");

  const [
    filtroArea,
    setFiltroArea,
  ] = useState("");

  const [
    formularioAberto,
    setFormularioAberto,
  ] = useState(false);

  const [
    equipeEditando,
    setEquipeEditando,
  ] = useState(null);

  const [
    formulario,
    setFormulario,
  ] = useState(
    FORMULARIO_VAZIO
  );

  // ===================================================
  // CARREGAR PÁGINA
  // ===================================================

  useEffect(() => {
    carregarPagina();
  }, []);

  // ===================================================
  // DESCOBRIR CONSTRUTORA
  // ===================================================

  async function buscarIdConstrutora() {
    let idConstrutora =
      localStorage.getItem(
        "idconstrutora"
      ) ||
      localStorage.getItem(
        "id_construtora"
      );

    if (idConstrutora) {
      return idConstrutora;
    }

    const idUsuario =
      localStorage.getItem(
        "id_usuario"
      );

    if (!idUsuario) {
      throw new Error(
        "Usuário não identificado."
      );
    }

    const dadosUsuario =
      await requisitar(
        `/usuarios/${idUsuario}`
      );

    const usuario =
      dadosUsuario?.usuario ||
      dadosUsuario;

    idConstrutora =
      usuario?.idconstrutora ??
      usuario?.id_construtora;

    if (!idConstrutora) {
      throw new Error(
        "Construtora não identificada."
      );
    }

    localStorage.setItem(
      "idconstrutora",
      String(idConstrutora)
    );

    return idConstrutora;
  }

  // ===================================================
  // CARREGAR OBRAS + EQUIPES
  // ===================================================

  async function carregarPagina() {
    try {
      setCarregando(true);
      setErro("");

      const idConstrutora =
        await buscarIdConstrutora();

      const [
        listaObras,
        listaEquipes,
      ] = await Promise.all([
        listarObras(
          idConstrutora
        ),

        listarEquipesTerceirizadas(),
      ]);

      const obrasValidas =
        Array.isArray(
          listaObras
        )
          ? listaObras
          : [];

      setObras(
        obrasValidas
      );

      const idsObras =
        new Set(
          obrasValidas
            .map(
              (obra) =>
                Number(
                  obra.id_obra
                )
            )
            .filter(Boolean)
        );

      const equipesValidas =
        idsObras.size > 0
          ? listaEquipes.filter(
              (equipe) =>
                idsObras.has(
                  Number(
                    equipe.id_obra ??
                    equipe.idobra
                  )
                )
            )
          : listaEquipes;

      setEquipes(
        equipesValidas
      );
    } catch (error) {
      console.error(
        "Erro ao carregar equipes:",
        error
      );

      setErro(
        error.message ||
          "Erro ao carregar equipes."
      );
    } finally {
      setCarregando(false);
    }
  }

  // ===================================================
  // ALTERAR FORMULÁRIO
  // ===================================================

  function alterarCampo(
    event
  ) {
    const {
      name,
      value,
    } = event.target;

    setFormulario(
      (anterior) => ({
        ...anterior,
        [name]: value,
      })
    );
  }

  // ===================================================
  // ABRIR CADASTRO
  // ===================================================

  function abrirCadastro() {
    setEquipeEditando(
      null
    );

    setFormulario(
      FORMULARIO_VAZIO
    );

    setErro("");
    setSucesso("");

    setFormularioAberto(
      true
    );
  }

  // ===================================================
  // ABRIR EDIÇÃO
  // ===================================================

  function abrirEdicao(
    equipe
  ) {
    setEquipeEditando(
      equipe
    );

    setFormulario({
      nome_equipe:
        equipe.nome_equipe ||
        "",

      area_atuacao:
        equipe.area_atuacao ||
        "",

      quantidade_profissionais:
        equipe.quantidade_profissionais ??
        "",

      custo_diario_total:
        equipe.custo_diario_total ??
        "",

      id_obra:
        String(
          equipe.id_obra ??
          equipe.idobra ??
          ""
        ),
    });

    setErro("");
    setSucesso("");

    setFormularioAberto(
      true
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // ===================================================
  // CANCELAR FORMULÁRIO
  // ===================================================

  function cancelarFormulario() {
    if (salvando) {
      return;
    }

    setFormularioAberto(
      false
    );

    setEquipeEditando(
      null
    );

    setFormulario(
      FORMULARIO_VAZIO
    );

    setErro("");
  }

  // ===================================================
  // SALVAR EQUIPE
  // ===================================================

  async function salvarEquipe(
    event
  ) {
    event.preventDefault();

    try {
      setSalvando(true);

      setErro("");
      setSucesso("");

      const payload = {
        nome_equipe:
          formulario.nome_equipe.trim(),

        area_atuacao:
          formulario.area_atuacao,

        quantidade_profissionais:
          Number(
            formulario
              .quantidade_profissionais
          ),

        custo_diario_total:
          Number(
            formulario
              .custo_diario_total ||
              0
          ),

        id_obra:
          Number(
            formulario.id_obra
          ),
      };

      // =================================================
      // VALIDAÇÕES
      // =================================================

      if (
        !payload.nome_equipe
      ) {
        throw new Error(
          "Informe o nome da equipe."
        );
      }

      if (
        !payload.area_atuacao
      ) {
        throw new Error(
          "Selecione a área de atuação."
        );
      }

      if (
        !Number.isInteger(
          payload
            .quantidade_profissionais
        ) ||
        payload
          .quantidade_profissionais <=
          0
      ) {
        throw new Error(
          "Informe uma quantidade de profissionais válida."
        );
      }

      if (
        Number.isNaN(
          payload
            .custo_diario_total
        ) ||
        payload
          .custo_diario_total <
          0
      ) {
        throw new Error(
          "Informe um custo diário válido."
        );
      }

      if (
        !payload.id_obra
      ) {
        throw new Error(
          "Selecione uma obra."
        );
      }

      // =================================================
      // EDITAR
      // =================================================

      if (equipeEditando) {
        const id =
          obterIdEquipe(
            equipeEditando
          );

        if (!id) {
          throw new Error(
            "Equipe não identificada."
          );
        }

        await atualizarEquipe(
          id,
          payload
        );

        setSucesso(
          "Equipe atualizada com sucesso."
        );
      }

      // =================================================
      // CADASTRAR
      // =================================================

      else {
        await criarEquipe(
          payload
        );

        setSucesso(
          "Equipe cadastrada com sucesso."
        );
      }

      setFormularioAberto(
        false
      );

      setEquipeEditando(
        null
      );

      setFormulario(
        FORMULARIO_VAZIO
      );

      await carregarPagina();
    } catch (error) {
      console.error(
        "Erro ao salvar equipe:",
        error
      );

      setErro(
        error.message ||
          "Erro ao salvar equipe."
      );
    } finally {
      setSalvando(false);
    }
  }

  // ===================================================
  // EXCLUIR EQUIPE
  // ===================================================

  async function removerEquipe(
    equipe
  ) {
    const confirmar =
      window.confirm(
        `Deseja realmente excluir a equipe "${equipe.nome_equipe}"?`
      );

    if (!confirmar) {
      return;
    }

    try {
      setErro("");
      setSucesso("");

      await excluirEquipe(
        equipe
      );

      setSucesso(
        "Equipe excluída com sucesso."
      );

      await carregarPagina();
    } catch (error) {
      console.error(
        "Erro ao excluir equipe:",
        error
      );

      setErro(
        error.message ||
          "Erro ao excluir equipe."
      );
    }
  }

  // ===================================================
  // MAPA DE OBRAS
  // ===================================================

  const nomeObraPorId =
    useMemo(() => {
      const mapa = {};

      obras.forEach(
        (obra) => {
          mapa[
            String(
              obra.id_obra
            )
          ] =
            obra.nome ||
            obra.obra ||
            `Obra ${obra.id_obra}`;
        }
      );

      return mapa;
    }, [obras]);

  // ===================================================
  // FILTRAR EQUIPES
  // ===================================================

  const equipesFiltradas =
    useMemo(() => {
      const termo =
        pesquisa
          .trim()
          .toLowerCase();

      return equipes.filter(
        (equipe) => {
          const nome =
            String(
              equipe.nome_equipe ||
                ""
            ).toLowerCase();

          const area =
            String(
              equipe.area_atuacao ||
                ""
            ).toLowerCase();

          const idObra =
            equipe.id_obra ??
            equipe.idobra;

          const obra =
            String(
              nomeObraPorId[
                String(idObra)
              ] || ""
            ).toLowerCase();

          const correspondePesquisa =
            !termo ||
            nome.includes(
              termo
            ) ||
            area.includes(
              termo
            ) ||
            obra.includes(
              termo
            );

          const correspondeArea =
            !filtroArea ||
            equipe.area_atuacao ===
              filtroArea;

          return (
            correspondePesquisa &&
            correspondeArea
          );
        }
      );
    }, [
      equipes,
      pesquisa,
      filtroArea,
      nomeObraPorId,
    ]);

  // ===================================================
  // INDICADORES
  // ===================================================

  const totalProfissionais =
    equipes.reduce(
      (
        total,
        equipe
      ) =>
        total +
        Number(
          equipe
            .quantidade_profissionais ||
            0
        ),
      0
    );

  const custoTotal =
    equipes.reduce(
      (
        total,
        equipe
      ) =>
        total +
        Number(
          equipe
            .custo_diario_total ||
            0
        ),
      0
    );

  const totalAreas =
    new Set(
      equipes
        .map(
          (equipe) =>
            equipe.area_atuacao
        )
        .filter(Boolean)
    ).size;

  const obrasAtendidas =
    new Set(
      equipes
        .map(
          (equipe) =>
            Number(
              equipe.id_obra ??
                equipe.idobra
            )
        )
        .filter(Boolean)
    ).size;

  // ===================================================
  // JSX
  // ===================================================

  return (
    <Layout
      onNavegar={
        onNavegar
      }
    >
      <div className="dashboard">

        {/* ============================================
            CABEÇALHO
        ============================================ */}

        <section className="dashboard-header">

          <div>

            <span className="dashboard-eyebrow">
              RECURSOS HUMANOS
            </span>

            <h1>
              Equipes
            </h1>

            <p>
              Cadastre, organize e consulte
              as equipes por área de atuação.
            </p>

          </div>

          <div className="dashboard-header-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={
                carregarPagina
              }
            >
              Atualizar
            </button>

            <button
              type="button"
              className="button"
              onClick={
                abrirCadastro
              }
            >
              + Nova Equipe
            </button>

          </div>

        </section>

        {/* ============================================
            MENSAGENS
        ============================================ */}

        {erro && (
          <div className="auth-error">
            {erro}
          </div>
        )}

        {sucesso && (
          <div
            style={{
              padding:
                "14px 18px",

              marginBottom:
                "20px",

              background:
                "#e8f7ed",

              borderRadius:
                "10px",
            }}
          >
            {sucesso}
          </div>
        )}

        {/* ============================================
            FORMULÁRIO
        ============================================ */}

        {formularioAberto && (

          <section className="dashboard-section">

            <div className="section-header">

              <div>

                <span className="section-label">

                  {equipeEditando
                    ? "EDIÇÃO"
                    : "CADASTRO"}

                </span>

                <h2>

                  {equipeEditando
                    ? "Editar equipe"
                    : "Cadastrar equipe"}

                </h2>

                <p>
                  Informe os dados da equipe.
                </p>

              </div>

            </div>

            <form
              className="obra-form"
              onSubmit={
                salvarEquipe
              }
            >

              <div className="obra-form-grid">

                {/* NOME */}

                <div className="form-group">

                  <label>
                    Nome da equipe
                  </label>

                  <input
                    type="text"
                    name="nome_equipe"
                    value={
                      formulario
                        .nome_equipe
                    }
                    onChange={
                      alterarCampo
                    }
                    placeholder="Ex.: Equipe Estrutura Norte"
                    required
                  />

                </div>

                {/* ÁREA */}

                <div className="form-group">

                  <label>
                    Área de atuação
                  </label>

                  <select
                    name="area_atuacao"
                    value={
                      formulario
                        .area_atuacao
                    }
                    onChange={
                      alterarCampo
                    }
                    required
                  >

                    <option value="">
                      Selecione uma área
                    </option>

                    {AREAS_ATUACAO.map(
                      (area) => (

                        <option
                          key={
                            area
                          }
                          value={
                            area
                          }
                        >
                          {area}
                        </option>

                      )
                    )}

                  </select>

                </div>

                {/* PROFISSIONAIS */}

                <div className="form-group">

                  <label>
                    Quantidade de profissionais
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    name="quantidade_profissionais"
                    value={
                      formulario
                        .quantidade_profissionais
                    }
                    onChange={
                      alterarCampo
                    }
                    placeholder="Ex.: 12"
                    required
                  />

                </div>

                {/* CUSTO */}

                <div className="form-group">

                  <label>
                    Custo diário total
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="custo_diario_total"
                    value={
                      formulario
                        .custo_diario_total
                    }
                    onChange={
                      alterarCampo
                    }
                    placeholder="Ex.: 2400"
                    required
                  />

                </div>

                {/* OBRA */}

                <div className="form-group">

                  <label>
                    Obra
                  </label>

                  <select
                    name="id_obra"
                    value={
                      formulario.id_obra
                    }
                    onChange={
                      alterarCampo
                    }
                    required
                  >

                    <option value="">
                      Selecione uma obra
                    </option>

                    {obras.map(
                      (obra) => (

                        <option
                          key={
                            obra.id_obra
                          }
                          value={
                            obra.id_obra
                          }
                        >
                          {obra.nome ||
                            obra.obra ||
                            `Obra ${obra.id_obra}`}
                        </option>

                      )
                    )}

                  </select>

                </div>

              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    cancelarFormulario
                  }
                  disabled={
                    salvando
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="button"
                  disabled={
                    salvando
                  }
                >

                  {salvando
                    ? "Salvando..."
                    : equipeEditando
                      ? "Salvar alterações"
                      : "Cadastrar equipe"}

                </button>

              </div>

            </form>

          </section>

        )}

        {/* ============================================
            INDICADORES
        ============================================ */}

        <section className="cards-grid">

          <div className="dashboard-section">

            <span className="section-label">
              EQUIPES
            </span>

            <h2>
              {carregando
                ? "..."
                : equipes.length}
            </h2>

            <p>
              Equipes cadastradas
            </p>

          </div>

          <div className="dashboard-section">

            <span className="section-label">
              PROFISSIONAIS
            </span>

            <h2>
              {carregando
                ? "..."
                : totalProfissionais}
            </h2>

            <p>
              Pessoas nas equipes
            </p>

          </div>

          <div className="dashboard-section">

            <span className="section-label">
              ÁREAS
            </span>

            <h2>
              {carregando
                ? "..."
                : totalAreas}
            </h2>

            <p>
              Áreas de atuação
            </p>

          </div>

          <div className="dashboard-section">

            <span className="section-label">
              OBRAS
            </span>

            <h2>
              {carregando
                ? "..."
                : obrasAtendidas}
            </h2>

            <p>
              Obras atendidas
            </p>

          </div>

          <div className="dashboard-section">

            <span className="section-label">
              CUSTO DIÁRIO
            </span>

            <h2>
              {carregando
                ? "..."
                : formatarReal(
                    custoTotal
                  )}
            </h2>

            <p>
              Total das equipes
            </p>

          </div>

        </section>

        {/* ============================================
            LISTAGEM
        ============================================ */}

        <section className="dashboard-section">

          <div className="section-header">

            <div>

              <span className="section-label">
                EQUIPES
              </span>

              <h2>
                Equipes cadastradas
              </h2>

              <p>
                Consulte equipes por nome,
                área ou obra.
              </p>

            </div>

          </div>

          {/* ==========================================
              FILTROS
          ========================================== */}

          <div className="filtros-equipes">

            <div className="filtro-pesquisa">

              <label>
                Pesquisar
              </label>

              <input
                type="text"
                placeholder="Pesquisar por nome, área ou obra..."
                value={
                  pesquisa
                }
                onChange={(
                  event
                ) =>
                  setPesquisa(
                    event.target.value
                  )
                }
              />

            </div>

            <div className="filtro-area">

              <label>
                Área de atuação
              </label>

              <select
                value={
                  filtroArea
                }
                onChange={(
                  event
                ) =>
                  setFiltroArea(
                    event.target.value
                  )
                }
              >

                <option value="">
                  Todas as áreas
                </option>

                {AREAS_ATUACAO.map(
                  (area) => (

                    <option
                      key={
                        area
                      }
                      value={
                        area
                      }
                    >
                      {area}
                    </option>

                  )
                )}

              </select>

            </div>

          </div>

          {/* ==========================================
              TABELA
          ========================================== */}

          <div className="tabela-container">

            <table>

              <thead>

                <tr>

                  <th>
                    Equipe
                  </th>

                  <th>
                    Área
                  </th>

                  <th>
                    Profissionais
                  </th>

                  <th>
                    Obra
                  </th>

                  <th>
                    Custo diário
                  </th>

                  <th>
                    Ações
                  </th>

                </tr>

              </thead>

              <tbody>

                {carregando ? (

                  <tr>

                    <td
                      colSpan="6"
                      className="tabela-vazia"
                    >
                      Carregando equipes...
                    </td>

                  </tr>

                ) : equipesFiltradas.length ===
                  0 ? (

                  <tr>

                    <td
                      colSpan="6"
                      className="tabela-vazia"
                    >
                      Nenhuma equipe encontrada.
                    </td>

                  </tr>

                ) : (

                  equipesFiltradas.map(
                    (equipe) => {

                      const id =
                        obterIdEquipe(
                          equipe
                        );

                      const idObra =
                        equipe.id_obra ??
                        equipe.idobra;

                      return (

                        <tr
                          key={
                            id
                          }
                        >

                          <td>

                            <strong>
                              {equipe.nome_equipe}
                            </strong>

                          </td>

                          <td>

                            {equipe.area_atuacao ||
                              "Não definida"}

                          </td>

                          <td>

                            {equipe.quantidade_profissionais ||
                              0}

                          </td>

                          <td>

                            {nomeObraPorId[
                              String(
                                idObra
                              )
                            ] ||
                              `Obra ${idObra}`}

                          </td>

                          <td>

                            {formatarReal(
                              equipe
                                .custo_diario_total
                            )}

                          </td>

                          <td>

                            <div
                              style={{
                                display:
                                  "flex",

                                gap:
                                  "8px",

                                flexWrap:
                                  "wrap",
                              }}
                            >

                              <button
                                type="button"
                                className="secondary-button"
                                onClick={() =>
                                  abrirEdicao(
                                    equipe
                                  )
                                }
                              >
                                Editar
                              </button>

                              <button
                                type="button"
                                className="secondary-button"
                                onClick={() =>
                                  removerEquipe(
                                    equipe
                                  )
                                }
                              >
                                Excluir
                              </button>

                            </div>

                          </td>

                        </tr>

                      );
                    }
                  )

                )}

              </tbody>

            </table>

          </div>

        </section>

      </div>
    </Layout>
  );
}

export default Equipes;