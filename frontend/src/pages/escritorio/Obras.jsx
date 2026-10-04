import { useDialogFocus } from "../../componentes/escritorio/Modal";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Layout from "../../componentes/escritorio/Layout";
import Card from "../../componentes/escritorio/Card";

import {
  atualizarObra,
  criarObra,
  excluirObra,
  listarObras,
} from "../../api/obras";

import {
  buscarRecursosDaObra,
} from "../../api/recursos";

// =====================================================
// FORMULÁRIO
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

const recursosVazios = {
  equipes: [],
  insumos: [],
  maquinarios: [],
};

// =====================================================
// AUXILIARES
// =====================================================

function formatarReal(valor) {
  if (valor === null || valor === undefined || valor === "" || !Number.isFinite(Number(valor))) return "Não informado";
  return Number(
    valor || 0
  ).toLocaleString(
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

function statusParaBanco(status) {
  const chave = String(status || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  return ({ planejamento: "Planejamento", "em andamento": "Em Andamento", concluida: "Concluida", paralisada: "Paralisada" })[chave] || status || "";
}

function statusParaTela(status) {
  if (
    status === "Concluida"
  ) {
    return "Concluída";
  }

  return status || "";
}

function limparData(data) {
  if (!data) {
    return "";
  }

  return String(data).split("T")[0];
}

// =====================================================
// COMPONENTE
// =====================================================

function Obras({
  onNavegar,
  onAbrirObra,
}) {
  const trava = useRef(false);
  const [sucesso, setSucesso] = useState("");
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
  // MODAL RECURSOS - CONSULTA
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
  ] = useState("resumo");

  const [
    recursos,
    setRecursos,
  ] = useState(
    recursosVazios
  );

  const [
    carregandoRecursos,
    setCarregandoRecursos,
  ] = useState(false);

  const [
    erroRecursos,
    setErroRecursos,
  ] = useState("");

  const dialogRef = useRef(null);
  useDialogFocus(dialogRef, () => { if (!trava.current) { setModalObraAberto(false); setModalRecursos(false); } }, modalObraAberto || modalRecursos);

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
    if (localStorage.getItem("abrir_cadastro_obra") === "1") {
      localStorage.removeItem("abrir_cadastro_obra");
      setModalObraAberto(true);
    }
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

      setObras(
        Array.isArray(lista)
          ? lista
          : []
      );
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
  // CADASTRAR / EDITAR
  // ===================================================

  function abrirCadastroObra() {
    setObraEditando(null);
    setFormulario(
      formularioObraVazio
    );
    setErro("");
    setModalObraAberto(true);
  }

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
        statusParaBanco(
          obra.status ||
          "Planejamento"
        ),

      categoria:
        obra.categoria ||
        "Residencial",

      numero_pavimentos:
        obra.numero_pavimentos ??
        obra.pavimentos ??
        "",

      data_inicio_planejada:
        limparData(
          obra.data_inicio_planejada
        ),

      data_termino_planejada:
        limparData(
          obra.data_termino_planejada
        ),

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

  async function salvarObra(
    event
  ) {
    event.preventDefault();
    if (trava.current) return;
    trava.current = true;

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
          statusParaBanco(
            formulario.status
          ),

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

      if (!payload.nome || !Number.isInteger(payload.numero_pavimentos) || payload.numero_pavimentos < 1 || !Number.isFinite(payload.orcamento_planejado) || payload.orcamento_planejado < 0 || !payload.data_inicio_planejada || !payload.data_termino_planejada) throw new Error("Informe nome, pavimentos, datas e orçamento válidos.");
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

      setSucesso("Obra salva com sucesso.");
      setModalObraAberto(false);
      setObraEditando(null);
      setFormulario(formularioObraVazio);

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
      trava.current = false;
      setSalvando(false);
    }
  }

  async function alterarStatus(
    obra,
    novoStatus
  ) {
    if (trava.current) return;
    trava.current = true; setSalvando(true); setErro(""); setSucesso("");
    const statusAnterior =
      obra.status;

    setObras(
      (lista) =>
        lista.map(
          (item) =>
            Number(
              item.id_obra
            ) ===
            Number(
              obra.id_obra
            )
              ? {
                  ...item,
                  status:
                    novoStatus,
                }
              : item
        )
    );

    try {
      const payload = {
        nome:
          obra.nome ||
          obra.obra ||
          "",

        status:
          statusParaBanco(
            novoStatus
          ),

        id_construtora:
          Number(
            obra.id_construtora ??
            idConstrutora
          ),

        categoria:
          obra.categoria ||
          "",

        numero_pavimentos:
          Number(
            obra.numero_pavimentos ??
            obra.pavimentos ??
            0
          ),

        data_inicio_planejada:
          limparData(
            obra.data_inicio_planejada
          ),

        data_termino_planejada:
          limparData(
            obra.data_termino_planejada
          ),

        orcamento_planejado:
          Number(
            obra.orcamento_planejado ||
            0
          ),
      };

      await atualizarObra(
        obra.id_obra,
        payload
      );
    } catch (error) {
      console.error(
        "Erro ao alterar status:",
        error
      );

      setObras(
        (lista) =>
          lista.map(
            (item) =>
              Number(
                item.id_obra
              ) ===
              Number(
                obra.id_obra
              )
                ? {
                    ...item,
                    status:
                      statusAnterior,
                  }
                : item
          )
      );

      setErro(
        error.message ||
          "Não foi possível alterar o status."
      );
    } finally { trava.current = false; setSalvando(false); }
  }

  // ===================================================
  // EXCLUIR
  // ===================================================

  async function removerObra(
    obra
  ) {
    if (trava.current) return;
    const confirmar =
      window.confirm(
        `Deseja realmente excluir a obra "${obra.obra}"? Esta ação excluirá definitivamente o cadastro.`
      );

    if (!confirmar) {
      return;
    }
    trava.current = true; setSalvando(true); setSucesso("");

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
      setSucesso("Obra excluída com sucesso.");
    } catch (error) {
      console.error(
        "Erro ao excluir obra:",
        error
      );

      setErro(
        error.message ||
          "Não foi possível excluir a obra."
      );
    } finally { trava.current = false; setSalvando(false); }
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
  // RECURSOS - SOMENTE CONSULTA
  // ===================================================

  async function abrirRecursos(
    obra
  ) {
    setObraRecursos(obra);
    setAbaRecursos("resumo");
    setRecursos(
      recursosVazios
    );
    setErroRecursos("");
    setModalRecursos(true);

    try {
      setCarregandoRecursos(
        true
      );

      const dados =
        await buscarRecursosDaObra(
          obra.id_obra
        );

      setRecursos({
        equipes:
          dados?.equipes ||
          [],

        insumos:
          dados?.insumos ||
          [],

        maquinarios:
          dados?.maquinarios ||
          [],
      });
    } catch (error) {
      console.error(
        "Erro ao consultar recursos:",
        error
      );

      setErroRecursos(
        error.message ||
          "Não foi possível carregar os recursos desta obra."
      );
    } finally {
      setCarregandoRecursos(
        false
      );
    }
  }

  function fecharRecursos() {
    setModalRecursos(false);
    setObraRecursos(null);
    setRecursos(
      recursosVazios
    );
    setErroRecursos("");
  }

  function gerenciarNaObra() {
    if (!obraRecursos) {
      return;
    }

    const obra =
      obraRecursos;

    fecharRecursos();
    abrirObra(obra);
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
              "iniciada",
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

      const concluidas =
        obras.filter(
          (obra) =>
            [
              "concluida",
              "concluída",
            ].includes(
              String(
                obra.status ||
                  ""
              )
                .trim()
                .toLowerCase()
            )
        ).length;

      const orcamento =
        obras.reduce(
          (
            total,
            obra
          ) =>
            total +
            Number(
              obra.orcamento_planejado ||
                0
            ),
          0
        );

      return {
        ativas,
        paralisadas,
        concluidas,
        orcamento,
      };
    }, [obras]);

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

        {/* CABEÇALHO */}

        <section className="dashboard-header">
          <div>
            <span className="dashboard-eyebrow">
              PORTFÓLIO
            </span>

            <h1>
              Obras
            </h1>

            <p>
              Consulte as obras e abra cada projeto para gerenciar seus recursos.
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
          <div className="auth-error" role="alert">
            {erro}
          </div>
        )}

        {/* CARDS */}

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
              indicadores.paralisadas
            }
            description="Necessitam acompanhamento"
          />

          <Card
            title="Orçamento total"
            value={
              formatarReal(
                indicadores.orcamento
              )
            }
            description={`${indicadores.concluidas} obra(s) concluída(s)`}
          />
        </section>

        {/* TABELA */}

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
                Recursos serve somente para consulta rápida. Para atribuir ou alterar recursos, abra a obra.
              </p>
            </div>
          </div>

          <div className="tabela-container obras-table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Obra</th>
                  <th>Status</th>
                  <th>Categoria</th>
                  <th>Pav.</th>
                  <th>Prazo</th>
                  <th>Orçamento</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {carregando ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="tabela-vazia"
                    >
                      Carregando obras...
                    </td>
                  </tr>
                ) : obras.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
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
                          <strong className="obra-nome-tabela">
                            {obra.obra}
                          </strong>
                        </td>

                        <td>
                          <select
                            className="status-select-tabela" disabled={salvando} aria-label={`Status de ${obra.nome || obra.obra}`}
                            value={
                              statusParaBanco(
                                obra.status
                              )
                            }
                            onChange={
                              (
                                event
                              ) =>
                                alterarStatus(
                                  obra,
                                  event.target.value
                                )
                            }
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
                        </td>

                        <td>
                          {obra.categoria || "-"}
                        </td>

                        <td>
                          {obra.numero_pavimentos ?? 0}
                        </td>

                        <td>
                          <span className="obra-prazo">
                            {formatarData(
                              obra.data_inicio_planejada
                            )}
                            {" até "}
                            {formatarData(
                              obra.data_termino_planejada
                            )}
                          </span>
                        </td>

                        <td>
                          <span className="obra-orcamento">
                            {formatarReal(
                              obra.orcamento_planejado
                            )}
                          </span>
                        </td>

                        <td>
                          <div className="acoes-obras">
                            <button
                              type="button"
                              className="button"
                              onClick={
                                () =>
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
                              onClick={
                                () =>
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
                              onClick={
                                () =>
                                  abrirEdicaoObra(
                                    obra
                                  )
                              }
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              className="secondary-button"
                              onClick={
                                () =>
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

        {/* =================================================
            MODAL OBRA
        ================================================= */}

        {sucesso && <p className="mensagem-sucesso" role="status">{sucesso}</p>}
        {modalObraAberto && (
          <div className="modal-overlay">
            <div className="modal-container modal-obra" role="dialog" ref={dialogRef} tabIndex={-1} aria-modal="true" aria-label="Cadastro de obra">
              {erro && <p className="auth-error" role="alert">{erro}</p>}
              <div className="modal-header">
                <div>
                  <span className="section-label">
                    {obraEditando
                      ? "EDITAR OBRA"
                      : "NOVA OBRA"}
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

              <form aria-busy={salvando}
                  className="obra-form"
                onSubmit={
                  salvarObra
                }
              >
                <div className="obra-form-grid">

                  <div className="form-group">
                    <label>
                      Nome da obra
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
                        formulario.categoria
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
                      name="numero_pavimentos"
                      min="1"
                      value={
                        formulario.numero_pavimentos
                      }
                      onChange={
                        alterarFormulario
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Data de início planejada
                    </label>

                    <input
                      type="date"
                      name="data_inicio_planejada"
                      value={
                        formulario.data_inicio_planejada
                      }
                      onChange={
                        alterarFormulario
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Data de término planejada
                    </label>

                    <input
                      type="date"
                      name="data_termino_planejada"
                      value={
                        formulario.data_termino_planejada
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
                      name="orcamento_planejado"
                      min="0"
                      step="0.01"
                      value={
                        formulario.orcamento_planejado
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
                      : obraEditando
                        ? "Salvar alterações"
                        : "Cadastrar obra"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =================================================
            MODAL RECURSOS - CONSULTA
        ================================================= */}

        {modalRecursos &&
          obraRecursos && (
          <div className="modal-overlay">
            <div className="modal-container modal-recursos-consulta" role="dialog" aria-modal="true" aria-label="Recursos da obra">

              <div className="modal-header">
                <div>
                  <span className="section-label">
                    RECURSOS DA OBRA
                  </span>

                  <h2>
                    {obraRecursos.obra}
                  </h2>

                  <p>
                    Consulte os recursos atualmente utilizados. Nenhuma atribuição é feita nesta janela.
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
                <div className="auth-error" role="alert">
                  {erroRecursos}
                </div>
              )}

              {carregandoRecursos ? (
                <div className="recursos-carregando">
                  Carregando recursos...
                </div>
              ) : (
                <>
                  <div className="recursos-resumo-grid">
                    <div className="recurso-resumo-card">
                      <span>
                        Equipes
                      </span>

                      <strong>
                        {recursos.equipes.length}
                      </strong>

                      <small>
                        Equipes utilizadas
                      </small>
                    </div>

                    <div className="recurso-resumo-card">
                      <span>
                        Materiais
                      </span>

                      <strong>
                        {recursos.insumos.length}
                      </strong>

                      <small>
                        Materiais e insumos
                      </small>
                    </div>

                    <div className="recurso-resumo-card">
                      <span>
                        Maquinários
                      </span>

                      <strong>
                        {recursos.maquinarios.length}
                      </strong>

                      <small>
                        Equipamentos utilizados
                      </small>
                    </div>
                  </div>

                  <div className="recursos-tabs">
                    <button
                      type="button"
                      className={
                        abaRecursos === "resumo"
                          ? "button"
                          : "secondary-button"
                      }
                      onClick={
                        () =>
                          setAbaRecursos(
                            "resumo"
                          )
                      }
                    >
                      Visão geral
                    </button>

                    <button
                      type="button"
                      className={
                        abaRecursos === "equipes"
                          ? "button"
                          : "secondary-button"
                      }
                      onClick={
                        () =>
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
                        abaRecursos === "insumos"
                          ? "button"
                          : "secondary-button"
                      }
                      onClick={
                        () =>
                          setAbaRecursos(
                            "insumos"
                          )
                      }
                    >
                      Materiais
                    </button>

                    <button
                      type="button"
                      className={
                        abaRecursos === "maquinarios"
                          ? "button"
                          : "secondary-button"
                      }
                      onClick={
                        () =>
                          setAbaRecursos(
                            "maquinarios"
                          )
                      }
                    >
                      Maquinários
                    </button>
                  </div>

                  {abaRecursos === "resumo" && (
                    <div className="recursos-visao-geral">
                      <div className="consulta-info">
                        <strong>
                          Consulta rápida
                        </strong>

                        <p>
                          Para atribuir ou excluir recursos, use o botão "Gerenciar recursos na obra". Cadastre e edite equipes pelo menu Equipes.
                        </p>
                      </div>

                      <div className="recursos-lista-resumo">
                        <div>
                          <span>
                            Equipes utilizadas
                          </span>

                          <strong>
                            {recursos.equipes.length}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Materiais / insumos
                          </span>

                          <strong>
                            {recursos.insumos.length}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Maquinários
                          </span>

                          <strong>
                            {recursos.maquinarios.length}
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {abaRecursos === "equipes" && (
                    <div className="recursos-tabela">
                      {recursos.equipes.length === 0 ? (
                        <div className="recursos-vazio">
                          Nenhuma equipe vinculada a esta obra.
                        </div>
                      ) : (
                        <div className="table-container">
                          <table className="table">
                            <thead>
                              <tr>
                                <th>Equipe</th>
                                <th>Etapa</th>
                                <th>Profissionais</th>
                                <th>Custo diário</th>
                                <th>Custo mensal</th>
                              </tr>
                            </thead>

                            <tbody>
                              {recursos.equipes.map(
                                (
                                  equipe,
                                  index
                                ) => (
                                  <tr
                                    key={
                                      equipe.id_cadastro_equipes ??
                                      equipe.id_equipe_terceirizada ??
                                      equipe.id_equipe ??
                                      index
                                    }
                                  >
                                    <td>
                                      {equipe.nome_equipe || "-"}
                                    </td>

                                    <td>
                                      {equipe.etapa_atuacao || "-"}
                                    </td>

                                    <td>
                                      {equipe.quantidade_profissionais ?? "-"}
                                    </td>

                                    <td>
                                      {formatarReal(
                                        equipe.custo_diario ??
                                        equipe.custo_diario_total
                                      )}
                                    </td>

                                    <td>
                                      {equipe.custo_mensal !== undefined
                                        ? formatarReal(
                                            equipe.custo_mensal
                                          )
                                        : "-"}
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {abaRecursos === "insumos" && (
                    <div className="recursos-tabela">
                      {recursos.insumos.length === 0 ? (
                        <div className="recursos-vazio">
                          Nenhum material ou insumo vinculado a esta obra.
                        </div>
                      ) : (
                        <div className="table-container">
                          <table className="table">
                            <thead>
                              <tr>
                                <th>Material</th>
                                <th>Quantidade disponível</th>
                                <th>Valor unitário</th>
                                <th>Valor total</th>
                              </tr>
                            </thead>

                            <tbody>
                              {recursos.insumos.map(
                                (
                                  insumo,
                                  index
                                ) => {
                                  const quantidade =
                                    Number(
                                      insumo.quantidade_disponivel ||
                                      0
                                    );

                                  const valor =
                                    Number(
                                      insumo.valor_unitario ||
                                      0
                                    );

                                  return (
                                    <tr
                                      key={
                                        insumo.id_insumos ??
                                        insumo.id_insumo ??
                                        index
                                      }
                                    >
                                      <td>
                                        {insumo.nome || "-"}
                                      </td>

                                      <td>
                                        {quantidade}
                                      </td>

                                      <td>
                                        {formatarReal(
                                          valor
                                        )}
                                      </td>

                                      <td>
                                        {formatarReal(
                                          quantidade *
                                          valor
                                        )}
                                      </td>
                                    </tr>
                                  );
                                }
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {abaRecursos === "maquinarios" && (
                    <div className="recursos-tabela">
                      {recursos.maquinarios.length === 0 ? (
                        <div className="recursos-vazio">
                          Nenhum maquinário vinculado a esta obra.
                        </div>
                      ) : (
                        <div className="table-container">
                          <table className="table">
                            <thead>
                              <tr>
                                <th>Maquinário</th>
                                <th>Quantidade</th>
                                <th>Etapa</th>
                                <th>Custo diário</th>
                                <th>Status</th>
                              </tr>
                            </thead>

                            <tbody>
                              {recursos.maquinarios.map(
                                (
                                  item,
                                  index
                                ) => (
                                  <tr
                                    key={
                                      item.id_maquina ??
                                      item.id_maquinario ??
                                      index
                                    }
                                  >
                                    <td>
                                      {item.nome || "-"}
                                    </td>

                                    <td>
                                      {item.quantidade ?? "-"}
                                    </td>

                                    <td>
                                      {item.etapa_atuacao || "-"}
                                    </td>

                                    <td>
                                      {formatarReal(
                                        item.custo_diario
                                      )}
                                    </td>

                                    <td>
                                      {item.status || "-"}
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="modal-actions recursos-modal-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={
                        fecharRecursos
                      }
                    >
                      Fechar
                    </button>

                    <button
                      type="button"
                      className="button"
                      onClick={
                        gerenciarNaObra
                      }
                    >
                      Gerenciar recursos na obra
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Obras;
