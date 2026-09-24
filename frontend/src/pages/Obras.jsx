import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Layout from "../componentes/Layout";
import Card from "../componentes/Card";

import {
  atualizarObra,
  criarObra,
  excluirObra,
  listarObras,
} from "../api/obras";

import {
  atribuirEquipe,
  atribuirInsumo,
  atribuirMaquinario,
  buscarCatalogoRecursos,
  obterIdEquipe,
  obterIdInsumo,
  obterIdMaquinario,
} from "../api/recursos";

// =====================================================
// FORMULÁRIO DA OBRA
// =====================================================

const formularioObraVazio = {
  nome: "",
  status: "Planejamento",
  categoria: "Residencial",
  numero_pavimentos: "",
  data_inicio_planejada: "",
  data_termino_planejada: "",
  orcamento_planejado: "",
};

// =====================================================
// AUXILIARES
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

function formatarData(data) {
  if (!data) {
    return "-";
  }

  const limpa =
    String(data).split("T")[0];

  const [ano, mes, dia] =
    limpa.split("-");

  if (!ano || !mes || !dia) {
    return limpa;
  }

  return `${dia}/${mes}/${ano}`;
}

// =====================================================
// COMPONENTE
// =====================================================

function Obras({
  onNavegar,
  onAbrirObra,
}) {
  const [obras, setObras] =
    useState([]);

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [erro, setErro] =
    useState("");

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  // ===================================================
  // MODAL OBRA
  // ===================================================

  const [
    modalObraAberto,
    setModalObraAberto,
  ] = useState(false);

  const [
    obraEditando,
    setObraEditando,
  ] = useState(null);

  const [
    formulario,
    setFormulario,
  ] = useState(
    formularioObraVazio
  );

  // ===================================================
  // MODAL RECURSOS
  // ===================================================

  const [
    modalRecursos,
    setModalRecursos,
  ] = useState(false);

  const [
    obraRecursos,
    setObraRecursos,
  ] = useState(null);

  const [
    abaRecursos,
    setAbaRecursos,
  ] = useState("equipes");

  const [
    carregandoRecursos,
    setCarregandoRecursos,
  ] = useState(false);

  const [
    erroRecursos,
    setErroRecursos,
  ] = useState("");

  const [
    atribuindo,
    setAtribuindo,
  ] = useState(false);

  // ===================================================
  // CATÁLOGOS DE RECURSOS
  // ===================================================

  const [
    equipes,
    setEquipes,
  ] = useState([]);

  const [
    insumos,
    setInsumos,
  ] = useState([]);

  const [
    maquinarios,
    setMaquinarios,
  ] = useState([]);

  // ===================================================
  // RECURSOS SELECIONADOS
  // ===================================================

  const [
    idEquipeSelecionada,
    setIdEquipeSelecionada,
  ] = useState("");

  const [
    idInsumoSelecionado,
    setIdInsumoSelecionado,
  ] = useState("");

  const [
    idMaquinarioSelecionado,
    setIdMaquinarioSelecionado,
  ] = useState("");

  const idConstrutora =
    localStorage.getItem(
      "idconstrutora"
    ) ||
    localStorage.getItem(
      "id_construtora"
    );

  // ===================================================
  // CARREGAR OBRAS
  // ===================================================

  useEffect(() => {
    carregarObras();
  }, []);

  async function carregarObras() {
    try {
      setCarregando(true);
      setErro("");

      if (!idConstrutora) {
        throw new Error(
          "ID da construtora não encontrado. Faça login novamente."
        );
      }

      const lista =
        await listarObras(
          idConstrutora
        );

      setObras(lista);
    } catch (error) {
      console.error(
        "Erro ao carregar obras:",
        error
      );

      setErro(
        error.message ||
          "Não foi possível carregar as obras."
      );
    } finally {
      setCarregando(false);
    }
  }

  // ===================================================
  // CADASTRAR OBRA
  // ===================================================

  function abrirCadastroObra() {
    setObraEditando(null);

    setFormulario(
      formularioObraVazio
    );

    setErro("");

    setModalObraAberto(true);
  }

  // ===================================================
  // EDITAR OBRA
  // ===================================================

  function abrirEdicaoObra(
    obra
  ) {
    setObraEditando(obra);

    setFormulario({
      nome:
        obra.nome ||
        obra.obra ||
        "",

      status:
        obra.status ||
        "Planejamento",

      categoria:
        obra.categoria ||
        "Residencial",

      numero_pavimentos:
        obra.numero_pavimentos ??
        obra.pavimentos ??
        "",

      data_inicio_planejada:
        obra.data_inicio_planejada ||
        "",

      data_termino_planejada:
        obra.data_termino_planejada ||
        "",

      orcamento_planejado:
        obra.orcamento_planejado ??
        "",
    });

    setErro("");

    setModalObraAberto(true);
  }

  function fecharModalObra() {
    if (salvando) {
      return;
    }

    setModalObraAberto(false);

    setObraEditando(null);

    setFormulario(
      formularioObraVazio
    );
  }

  function alterarFormulario(
    event
  ) {
    const { name, value } =
      event.target;

    setFormulario(
      (anterior) => ({
        ...anterior,
        [name]: value,
      })
    );
  }

  // ===================================================
  // SALVAR OBRA
  // ===================================================

  async function salvarObra(
    event
  ) {
    event.preventDefault();

    try {
      setSalvando(true);
      setErro("");

      if (!idConstrutora) {
        throw new Error(
          "Construtora não identificada."
        );
      }

      if (
        formulario
          .data_termino_planejada <
        formulario
          .data_inicio_planejada
      ) {
        throw new Error(
          "A data de término não pode ser anterior à data de início."
        );
      }

      const payload = {
        nome:
          formulario.nome.trim(),

        status:
          formulario.status,

        id_construtora:
          Number(
            idConstrutora
          ),

        categoria:
          formulario.categoria,

        numero_pavimentos:
          Number(
            formulario
              .numero_pavimentos
          ),

        data_inicio_planejada:
          formulario
            .data_inicio_planejada,

        data_termino_planejada:
          formulario
            .data_termino_planejada,

        orcamento_planejado:
          Number(
            formulario
              .orcamento_planejado
          ),
      };

      if (obraEditando) {
        await atualizarObra(
          obraEditando.id_obra,
          payload
        );
      } else {
        await criarObra(
          payload
        );
      }

      setModalObraAberto(false);

      setObraEditando(null);

      setFormulario(
        formularioObraVazio
      );

      await carregarObras();
    } catch (error) {
      console.error(
        "Erro ao salvar obra:",
        error
      );

      setErro(
        error.message ||
          "Não foi possível salvar a obra."
      );
    } finally {
      setSalvando(false);
    }
  }

  // ===================================================
  // EXCLUIR OBRA
  // ===================================================

  async function removerObra(
    obra
  ) {
    const confirmar =
      window.confirm(
        `Deseja realmente excluir a obra "${obra.obra}"?`
      );

    if (!confirmar) {
      return;
    }

    try {
      setErro("");

      await excluirObra(
        obra.id_obra
      );

      const obraSelecionada =
        localStorage.getItem(
          "obra_selecionada"
        );

      if (obraSelecionada) {
        try {
          const dados =
            JSON.parse(
              obraSelecionada
            );

          if (
            Number(
              dados?.id_obra
            ) ===
            Number(
              obra.id_obra
            )
          ) {
            localStorage.removeItem(
              "obra_selecionada"
            );
          }
        } catch {
          localStorage.removeItem(
            "obra_selecionada"
          );
        }
      }

      await carregarObras();
    } catch (error) {
      console.error(
        "Erro ao excluir obra:",
        error
      );

      setErro(
        error.message ||
          "Não foi possível excluir a obra."
      );
    }
  }

  // ===================================================
  // ABRIR OBRA
  // ===================================================

  function abrirObra(
    obra
  ) {
    localStorage.setItem(
      "obra_selecionada",
      JSON.stringify(obra)
    );

    if (
      typeof onAbrirObra ===
      "function"
    ) {
      onAbrirObra(obra);
    }
  }

  // ===================================================
  // ABRIR RECURSOS
  // ===================================================

  async function abrirRecursos(
    obra
  ) {
    setObraRecursos(obra);

    setAbaRecursos(
      "equipes"
    );

    setIdEquipeSelecionada(
      ""
    );

    setIdInsumoSelecionado(
      ""
    );

    setIdMaquinarioSelecionado(
      ""
    );

    setErroRecursos("");

    setModalRecursos(true);

    await carregarCatalogoRecursos();
  }

  function fecharRecursos() {
    if (atribuindo) {
      return;
    }

    setModalRecursos(false);

    setObraRecursos(null);

    setErroRecursos("");
  }

  // ===================================================
  // CARREGAR RECURSOS CADASTRADOS
  // ===================================================

  async function carregarCatalogoRecursos() {
    try {
      setCarregandoRecursos(
        true
      );

      setErroRecursos("");

      const catalogo =
        await buscarCatalogoRecursos(
          obras
        );

      setEquipes(
        catalogo.equipes ||
          []
      );

      setInsumos(
        catalogo.insumos ||
          []
      );

      setMaquinarios(
        catalogo.maquinarios ||
          []
      );
    } catch (error) {
      console.error(
        "Erro ao carregar recursos:",
        error
      );

      setErroRecursos(
        error.message ||
          "Não foi possível carregar os recursos cadastrados."
      );
    } finally {
      setCarregandoRecursos(
        false
      );
    }
  }

  // ===================================================
  // OBRA ATUAL DO RECURSO
  // ===================================================

  function nomeObraDoRecurso(
    idObra
  ) {
    if (!idObra) {
      return "Sem obra";
    }

    const encontrada =
      obras.find(
        (obra) =>
          Number(
            obra.id_obra
          ) ===
          Number(idObra)
      );

    return (
      encontrada?.obra ||
      encontrada?.nome ||
      `Obra #${idObra}`
    );
  }

  // ===================================================
  // ATRIBUIR EQUIPE
  // ===================================================

  async function atribuirEquipeSelecionada(
    event
  ) {
    event.preventDefault();

    if (!obraRecursos) {
      return;
    }

    if (!idEquipeSelecionada) {
      setErroRecursos(
        "Selecione uma equipe para atribuir."
      );

      return;
    }

    const equipe =
      equipes.find(
        (item) =>
          String(
            obterIdEquipe(
              item
            )
          ) ===
          String(
            idEquipeSelecionada
          )
      );

    if (!equipe) {
      setErroRecursos(
        "Equipe selecionada não encontrada."
      );

      return;
    }

    try {
      setAtribuindo(true);

      setErroRecursos("");

      await atribuirEquipe(
        equipe,
        obraRecursos.id_obra
      );

      setIdEquipeSelecionada(
        ""
      );

      await carregarCatalogoRecursos();
    } catch (error) {
      console.error(
        "Erro ao atribuir equipe:",
        error
      );

      setErroRecursos(
        error.message ||
          "Não foi possível atribuir a equipe."
      );
    } finally {
      setAtribuindo(false);
    }
  }

  // ===================================================
  // ATRIBUIR INSUMO
  // ===================================================

  async function atribuirInsumoSelecionado(
    event
  ) {
    event.preventDefault();

    if (!obraRecursos) {
      return;
    }

    if (!idInsumoSelecionado) {
      setErroRecursos(
        "Selecione um insumo para atribuir."
      );

      return;
    }

    const insumo =
      insumos.find(
        (item) =>
          String(
            obterIdInsumo(
              item
            )
          ) ===
          String(
            idInsumoSelecionado
          )
      );

    if (!insumo) {
      setErroRecursos(
        "Insumo selecionado não encontrado."
      );

      return;
    }

    try {
      setAtribuindo(true);

      setErroRecursos("");

      await atribuirInsumo(
        insumo,
        obraRecursos.id_obra
      );

      setIdInsumoSelecionado(
        ""
      );

      await carregarCatalogoRecursos();
    } catch (error) {
      console.error(
        "Erro ao atribuir insumo:",
        error
      );

      setErroRecursos(
        error.message ||
          "Não foi possível atribuir o insumo."
      );
    } finally {
      setAtribuindo(false);
    }
  }

  // ===================================================
  // ATRIBUIR MAQUINÁRIO
  // ===================================================

  async function atribuirMaquinarioSelecionado(
    event
  ) {
    event.preventDefault();

    if (!obraRecursos) {
      return;
    }

    if (
      !idMaquinarioSelecionado
    ) {
      setErroRecursos(
        "Selecione um maquinário para atribuir."
      );

      return;
    }

    const maquinario =
      maquinarios.find(
        (item) =>
          String(
            obterIdMaquinario(
              item
            )
          ) ===
          String(
            idMaquinarioSelecionado
          )
      );

    if (!maquinario) {
      setErroRecursos(
        "Maquinário selecionado não encontrado."
      );

      return;
    }

    try {
      setAtribuindo(true);

      setErroRecursos("");

      await atribuirMaquinario(
        maquinario,
        obraRecursos.id_obra
      );

      setIdMaquinarioSelecionado(
        ""
      );

      await carregarCatalogoRecursos();
    } catch (error) {
      console.error(
        "Erro ao atribuir maquinário:",
        error
      );

      setErroRecursos(
        error.message ||
          "Não foi possível atribuir o maquinário."
      );
    } finally {
      setAtribuindo(false);
    }
  }

  // ===================================================
  // INDICADORES
  // ===================================================

  const indicadores =
    useMemo(() => {
      const ativas =
        obras.filter(
          (obra) => {
            const status =
              String(
                obra.status ||
                  ""
              )
                .trim()
                .toLowerCase();

            return [
              "planejamento",
              "em andamento",
            ].includes(
              status
            );
          }
        ).length;

      const paralisadas =
        obras.filter(
          (obra) =>
            String(
              obra.status ||
                ""
            )
              .trim()
              .toLowerCase() ===
            "paralisada"
        ).length;

      const orcamento =
        obras.reduce(
          (
            total,
            obra
          ) =>
            total +
            Number(
              obra
                .orcamento_planejado ||
                0
            ),
          0
        );

      return {
        ativas,
        paralisadas,
        orcamento,
      };
    }, [obras]);

  // ===================================================
  // RECURSOS ATRIBUÍDOS À OBRA
  // ===================================================

  const equipesAtribuidas =
    obraRecursos
      ? equipes.filter(
          (item) =>
            Number(
              item.idobra
            ) ===
            Number(
              obraRecursos.id_obra
            )
        )
      : [];

  const equipesParaAtribuir =
    obraRecursos
      ? equipes.filter(
          (item) =>
            Number(
              item.idobra
            ) !==
            Number(
              obraRecursos.id_obra
            )
        )
      : equipes;

  const insumosAtribuidos =
    obraRecursos
      ? insumos.filter(
          (item) =>
            Number(
              item.idobra
            ) ===
            Number(
              obraRecursos.id_obra
            )
        )
      : [];

  const insumosParaAtribuir =
    obraRecursos
      ? insumos.filter(
          (item) =>
            Number(
              item.idobra
            ) !==
            Number(
              obraRecursos.id_obra
            )
        )
      : insumos;

  const maquinariosAtribuidos =
    obraRecursos
      ? maquinarios.filter(
          (item) =>
            Number(
              item.idobra
            ) ===
            Number(
              obraRecursos.id_obra
            )
        )
      : [];

  const maquinariosParaAtribuir =
    obraRecursos
      ? maquinarios.filter(
          (item) =>
            Number(
              item.idobra
            ) !==
            Number(
              obraRecursos.id_obra
            )
        )
      : maquinarios;

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

        <section className="dashboard-header">

          <div>

            <span className="dashboard-eyebrow">
              PORTFÓLIO
            </span>

            <h1>
              Obras
            </h1>

            <p>
              Cadastre suas obras e atribua equipes,
              insumos e maquinários já cadastrados.
            </p>

          </div>

          <div className="dashboard-header-actions">

            <button
              type="button"
              className="button"
              onClick={
                abrirCadastroObra
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

        <section className="cards-grid">

          <Card
            title="Total de obras"
            value={
              obras.length
            }
            description="Obras cadastradas"
          />

          <Card
            title="Obras ativas"
            value={
              indicadores.ativas
            }
            description="Planejamento ou execução"
          />

          <Card
            title="Paralisadas"
            value={
              indicadores
                .paralisadas
            }
            description="Necessitam acompanhamento"
          />

          <Card
            title="Orçamento total"
            value={
              formatarReal(
                indicadores
                  .orcamento
              )
            }
            description="Orçamento planejado"
          />

        </section>

        <section className="dashboard-section">

          <div className="section-header">

            <div>

              <span className="section-label">
                PORTFÓLIO DE OBRAS
              </span>

              <h2>
                Obras cadastradas
              </h2>

              <p>
                Clique em Recursos para atribuir os recursos existentes.
              </p>

            </div>

          </div>

          <div className="tabela-container">

            <table>

              <thead>

                <tr>

                  <th>
                    Obra
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Categoria
                  </th>

                  <th>
                    Pavimentos
                  </th>

                  <th>
                    Início
                  </th>

                  <th>
                    Término
                  </th>

                  <th>
                    Orçamento
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
                      colSpan="8"
                      className="tabela-vazia"
                    >
                      Carregando obras...
                    </td>

                  </tr>

                ) : obras.length ===
                  0 ? (

                  <tr>

                    <td
                      colSpan="8"
                      className="tabela-vazia"
                    >
                      Nenhuma obra encontrada.
                    </td>

                  </tr>

                ) : (

                  obras.map(
                    (obra) => (

                      <tr
                        key={
                          obra.id_obra
                        }
                      >

                        <td>
                          {
                            obra.obra
                          }
                        </td>

                        <td>
                          {obra.status ||
                            "-"}
                        </td>

                        <td>
                          {obra.categoria ||
                            "-"}
                        </td>

                        <td>
                          {obra
                            .numero_pavimentos ??
                            "-"}
                        </td>

                        <td>
                          {formatarData(
                            obra
                              .data_inicio_planejada
                          )}
                        </td>

                        <td>
                          {formatarData(
                            obra
                              .data_termino_planejada
                          )}
                        </td>

                        <td>
                          {formatarReal(
                            obra
                              .orcamento_planejado
                          )}
                        </td>

                        <td>

                          <div className="section-actions">

                            <button
                              type="button"
                              className="button"
                              onClick={() =>
                                abrirObra(
                                  obra
                                )
                              }
                            >
                              Abrir
                            </button>

                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() =>
                                abrirRecursos(
                                  obra
                                )
                              }
                            >
                              Recursos
                            </button>

                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() =>
                                abrirEdicaoObra(
                                  obra
                                )
                              }
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              className="cancel-button"
                              onClick={() =>
                                removerObra(
                                  obra
                                )
                              }
                            >
                              Excluir
                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>

        </section>

      </div>

      {/* =================================================
          MODAL CADASTRO / EDIÇÃO
      ================================================= */}

      {modalObraAberto && (

        <div className="modal-overlay">

          <div className="modal-container modal-obra">

            <div className="modal-header">

              <div>

                <span className="section-label">
                  OBRA
                </span>

                <h2>
                  {obraEditando
                    ? "Editar obra"
                    : "Cadastrar obra"}
                </h2>

              </div>

              <button
                type="button"
                className="modal-close"
                onClick={
                  fecharModalObra
                }
              >
                ×
              </button>

            </div>

            <form
              className="obra-form"
              onSubmit={
                salvarObra
              }
            >

              <div className="obra-form-grid">

                <div className="form-group">

                  <label>
                    Nome
                  </label>

                  <input
                    type="text"
                    name="nome"
                    value={
                      formulario.nome
                    }
                    onChange={
                      alterarFormulario
                    }
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Status
                  </label>

                  <select
                    name="status"
                    value={
                      formulario.status
                    }
                    onChange={
                      alterarFormulario
                    }
                    required
                  >

                    <option value="Planejamento">
                      Planejamento
                    </option>

                    <option value="Em Andamento">
                      Em Andamento
                    </option>

                    <option value="Concluida">
                      Concluída
                    </option>

                    <option value="Paralisada">
                      Paralisada
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
                      formulario
                        .categoria
                    }
                    onChange={
                      alterarFormulario
                    }
                    required
                  >

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

                <div className="form-group">

                  <label>
                    Número de pavimentos
                  </label>

                  <input
                    type="number"
                    min="1"
                    name="numero_pavimentos"
                    value={
                      formulario
                        .numero_pavimentos
                    }
                    onChange={
                      alterarFormulario
                    }
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Início planejado
                  </label>

                  <input
                    type="date"
                    name="data_inicio_planejada"
                    value={
                      formulario
                        .data_inicio_planejada
                    }
                    onChange={
                      alterarFormulario
                    }
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Término planejado
                  </label>

                  <input
                    type="date"
                    name="data_termino_planejada"
                    value={
                      formulario
                        .data_termino_planejada
                    }
                    onChange={
                      alterarFormulario
                    }
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Orçamento planejado
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="orcamento_planejado"
                    value={
                      formulario
                        .orcamento_planejado
                    }
                    onChange={
                      alterarFormulario
                    }
                    required
                  />

                </div>

              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={
                    fecharModalObra
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
                    : "Salvar obra"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* =================================================
          MODAL DE RECURSOS
      ================================================= */}

      {modalRecursos &&
        obraRecursos && (

        <div className="modal-overlay">

          <div
            className="modal-container modal-obra"
            style={{
              maxWidth:
                "1050px",
            }}
          >

            <div className="modal-header">

              <div>

                <span className="section-label">
                  ATRIBUIÇÃO DE RECURSOS
                </span>

                <h2>
                  {
                    obraRecursos.obra
                  }
                </h2>

                <p>
                  Escolha os recursos já cadastrados que serão usados nesta obra.
                </p>

              </div>

              <button
                type="button"
                className="modal-close"
                onClick={
                  fecharRecursos
                }
              >
                ×
              </button>

            </div>

            {erroRecursos && (

              <div className="auth-error">
                {erroRecursos}
              </div>

            )}

            <div
              className="abas-obra"
              style={{
                marginBottom:
                  "22px",
              }}
            >

              <button
                type="button"
                className={
                  abaRecursos ===
                  "equipes"
                    ? "aba ativa"
                    : "aba"
                }
                onClick={() =>
                  setAbaRecursos(
                    "equipes"
                  )
                }
              >
                Equipes
              </button>

              <button
                type="button"
                className={
                  abaRecursos ===
                  "insumos"
                    ? "aba ativa"
                    : "aba"
                }
                onClick={() =>
                  setAbaRecursos(
                    "insumos"
                  )
                }
              >
                Insumos
              </button>

              <button
                type="button"
                className={
                  abaRecursos ===
                  "maquinarios"
                    ? "aba ativa"
                    : "aba"
                }
                onClick={() =>
                  setAbaRecursos(
                    "maquinarios"
                  )
                }
              >
                Maquinários
              </button>

            </div>

            {carregandoRecursos ? (

              <p>
                Carregando recursos cadastrados...
              </p>

            ) : (

              <>

                {/* =====================================
                    EQUIPES
                ===================================== */}

                {abaRecursos ===
                  "equipes" && (

                  <div>

                    <form
                      className="obra-form"
                      onSubmit={
                        atribuirEquipeSelecionada
                      }
                    >

                      <div className="obra-form-grid">

                        <div className="form-group">

                          <label>
                            Equipe cadastrada
                          </label>

                          <select
                            value={
                              idEquipeSelecionada
                            }
                            onChange={(event) =>
                              setIdEquipeSelecionada(
                                event.target.value
                              )
                            }
                            required
                          >

                            <option value="">
                              Selecione uma equipe
                            </option>

                            {equipesParaAtribuir.map(
                              (equipe) => (

                                <option
                                  key={
                                    obterIdEquipe(
                                      equipe
                                    )
                                  }
                                  value={
                                    obterIdEquipe(
                                      equipe
                                    )
                                  }
                                >
                                  {equipe.nome_equipe}
                                  {" — "}
                                  {nomeObraDoRecurso(
                                    equipe.idobra
                                  )}
                                </option>

                              )
                            )}

                          </select>

                        </div>

                      </div>

                      <button
                        type="submit"
                        className="button"
                        disabled={
                          atribuindo ||
                          !idEquipeSelecionada
                        }
                      >
                        {atribuindo
                          ? "Atribuindo..."
                          : "Atribuir equipe"}
                      </button>

                    </form>

                    <div
                      className="tabela-container"
                      style={{
                        marginTop:
                          "25px",
                      }}
                    >

                      <table>

                        <thead>

                          <tr>

                            <th>
                              Equipe
                            </th>

                            <th>
                              Etapa
                            </th>

                            <th>
                              Profissionais
                            </th>

                            <th>
                              Custo diário
                            </th>

                            <th>
                              Custo mensal
                            </th>

                          </tr>

                        </thead>

                        <tbody>

                          {equipesAtribuidas.length ===
                          0 ? (

                            <tr>

                              <td
                                colSpan="5"
                                className="tabela-vazia"
                              >
                                Nenhuma equipe atribuída.
                              </td>

                            </tr>

                          ) : (

                            equipesAtribuidas.map(
                              (equipe) => (

                                <tr
                                  key={
                                    obterIdEquipe(
                                      equipe
                                    )
                                  }
                                >

                                  <td>
                                    {
                                      equipe.nome_equipe
                                    }
                                  </td>

                                  <td>
                                    {equipe.etapa_atuacao ||
                                      "-"}
                                  </td>

                                  <td>
                                    {equipe.quantidade_profissionais ??
                                      "-"}
                                  </td>

                                  <td>
                                    {formatarReal(
                                      equipe.custo_diario
                                    )}
                                  </td>

                                  <td>
                                    {formatarReal(
                                      equipe.custo_mensal
                                    )}
                                  </td>

                                </tr>

                              )
                            )

                          )}

                        </tbody>

                      </table>

                    </div>

                  </div>

                )}

                {/* =====================================
                    INSUMOS
                ===================================== */}

                {abaRecursos ===
                  "insumos" && (

                  <div>

                    <form
                      className="obra-form"
                      onSubmit={
                        atribuirInsumoSelecionado
                      }
                    >

                      <div className="obra-form-grid">

                        <div className="form-group">

                          <label>
                            Insumo cadastrado
                          </label>

                          <select
                            value={
                              idInsumoSelecionado
                            }
                            onChange={(event) =>
                              setIdInsumoSelecionado(
                                event.target.value
                              )
                            }
                            required
                          >

                            <option value="">
                              Selecione um insumo
                            </option>

                            {insumosParaAtribuir.map(
                              (insumo) => (

                                <option
                                  key={
                                    obterIdInsumo(
                                      insumo
                                    )
                                  }
                                  value={
                                    obterIdInsumo(
                                      insumo
                                    )
                                  }
                                >
                                  {insumo.nome}
                                  {" — "}
                                  {nomeObraDoRecurso(
                                    insumo.idobra
                                  )}
                                </option>

                              )
                            )}

                          </select>

                        </div>

                      </div>

                      <button
                        type="submit"
                        className="button"
                        disabled={
                          atribuindo ||
                          !idInsumoSelecionado
                        }
                      >
                        {atribuindo
                          ? "Atribuindo..."
                          : "Atribuir insumo"}
                      </button>

                    </form>

                    <div
                      className="tabela-container"
                      style={{
                        marginTop:
                          "25px",
                      }}
                    >

                      <table>

                        <thead>

                          <tr>

                            <th>
                              Insumo
                            </th>

                            <th>
                              Quantidade
                            </th>

                            <th>
                              Valor unitário
                            </th>

                            <th>
                              Valor total
                            </th>

                          </tr>

                        </thead>

                        <tbody>

                          {insumosAtribuidos.length ===
                          0 ? (

                            <tr>

                              <td
                                colSpan="4"
                                className="tabela-vazia"
                              >
                                Nenhum insumo atribuído.
                              </td>

                            </tr>

                          ) : (

                            insumosAtribuidos.map(
                              (insumo) => (

                                <tr
                                  key={
                                    obterIdInsumo(
                                      insumo
                                    )
                                  }
                                >

                                  <td>
                                    {
                                      insumo.nome
                                    }
                                  </td>

                                  <td>
                                    {insumo.quantidade_disponivel ??
                                      0}
                                  </td>

                                  <td>
                                    {formatarReal(
                                      insumo.valor_unitario
                                    )}
                                  </td>

                                  <td>
                                    {formatarReal(
                                      Number(
                                        insumo.quantidade_disponivel ||
                                          0
                                      ) *
                                        Number(
                                          insumo.valor_unitario ||
                                            0
                                        )
                                    )}
                                  </td>

                                </tr>

                              )
                            )

                          )}

                        </tbody>

                      </table>

                    </div>

                  </div>

                )}

                {/* =====================================
                    MAQUINÁRIOS
                ===================================== */}

                {abaRecursos ===
                  "maquinarios" && (

                  <div>

                    <form
                      className="obra-form"
                      onSubmit={
                        atribuirMaquinarioSelecionado
                      }
                    >

                      <div className="obra-form-grid">

                        <div className="form-group">

                          <label>
                            Maquinário cadastrado
                          </label>

                          <select
                            value={
                              idMaquinarioSelecionado
                            }
                            onChange={(event) =>
                              setIdMaquinarioSelecionado(
                                event.target.value
                              )
                            }
                            required
                          >

                            <option value="">
                              Selecione um maquinário
                            </option>

                            {maquinariosParaAtribuir.map(
                              (maquinario) => (

                                <option
                                  key={
                                    obterIdMaquinario(
                                      maquinario
                                    )
                                  }
                                  value={
                                    obterIdMaquinario(
                                      maquinario
                                    )
                                  }
                                >
                                  {maquinario.nome}
                                  {" — "}
                                  {nomeObraDoRecurso(
                                    maquinario.idobra
                                  )}
                                </option>

                              )
                            )}

                          </select>

                        </div>

                      </div>

                      <button
                        type="submit"
                        className="button"
                        disabled={
                          atribuindo ||
                          !idMaquinarioSelecionado
                        }
                      >
                        {atribuindo
                          ? "Atribuindo..."
                          : "Atribuir maquinário"}
                      </button>

                    </form>

                    <div
                      className="tabela-container"
                      style={{
                        marginTop:
                          "25px",
                      }}
                    >

                      <table>

                        <thead>

                          <tr>

                            <th>
                              Maquinário
                            </th>

                            <th>
                              Quantidade
                            </th>

                            <th>
                              Etapa
                            </th>

                            <th>
                              Custo diário
                            </th>

                            <th>
                              Status
                            </th>

                          </tr>

                        </thead>

                        <tbody>

                          {maquinariosAtribuidos.length ===
                          0 ? (

                            <tr>

                              <td
                                colSpan="5"
                                className="tabela-vazia"
                              >
                                Nenhum maquinário atribuído.
                              </td>

                            </tr>

                          ) : (

                            maquinariosAtribuidos.map(
                              (maquinario) => (

                                <tr
                                  key={
                                    obterIdMaquinario(
                                      maquinario
                                    )
                                  }
                                >

                                  <td>
                                    {
                                      maquinario.nome
                                    }
                                  </td>

                                  <td>
                                    {maquinario.quantidade ??
                                      0}
                                  </td>

                                  <td>
                                    {maquinario.etapa_atuacao ||
                                      "-"}
                                  </td>

                                  <td>
                                    {formatarReal(
                                      maquinario.custo_diario
                                    )}
                                  </td>

                                  <td>
                                    {maquinario.status ||
                                      "-"}
                                  </td>

                                </tr>

                              )
                            )

                          )}

                        </tbody>

                      </table>

                    </div>

                  </div>

                )}

              </>

            )}

          </div>

        </div>

      )}

    </Layout>
  );
}

export default Obras;