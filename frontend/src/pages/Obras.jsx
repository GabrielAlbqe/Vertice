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
  listarObras,
} from "../api/obras.js";

import {
  atribuirEquipe,
  desatribuirEquipe,
  listarEquipesEmpresa,
  obterIdEquipe,
  obterIdsEquipesDaObra,
} from "../api/recursos.js";

const FORMULARIO_VAZIO = {
  nome: "",
  status: "Planejamento",
  categoria: "Residencial",
  numero_pavimentos: "",
  data_inicio_planejada: "",
  data_termino_planejada: "",
  orcamento_planejado: "",
};

const STATUS = [
  "Planejamento",
  "Em Andamento",
  "Paralisada",
  "Concluída",
];

function formatarReal(
  valor
) {
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

function limparData(
  data
) {
  if (!data) {
    return "";
  }

  return String(data)
    .split("T")[0];
}

function formatarData(
  data
) {
  const limpa =
    limparData(data);

  if (!limpa) {
    return "-";
  }

  const [
    ano,
    mes,
    dia,
  ] =
    limpa.split("-");

  if (
    !ano ||
    !mes ||
    !dia
  ) {
    return limpa;
  }

  return `${dia}/${mes}/${ano}`;
}

function normalizarStatus(
  status
) {
  return String(
    status || ""
  )
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .replaceAll(
      " ",
      "-"
    );
}

function Obras({
  onNavegar,
  onAbrirObra,
}) {
  const [
    obras,
    setObras,
  ] = useState([]);

  const [
    equipes,
    setEquipes,
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
    statusSalvando,
    setStatusSalvando,
  ] = useState(null);

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    sucesso,
    setSucesso,
  ] = useState("");

  const [
    modalAberto,
    setModalAberto,
  ] = useState(false);

  const [
    obraEditando,
    setObraEditando,
  ] = useState(null);

  const [
    formulario,
    setFormulario,
  ] = useState({
    ...FORMULARIO_VAZIO,
  });

  const [
    modalRecursos,
    setModalRecursos,
  ] = useState(false);

  const [
    obraRecursos,
    setObraRecursos,
  ] = useState(null);

  const [
    idEquipeSelecionada,
    setIdEquipeSelecionada,
  ] = useState("");

  const [
    versaoAtribuicoes,
    setVersaoAtribuicoes,
  ] = useState(0);

  useEffect(() => {
    localStorage.setItem(
      "pagina_atual",
      "obras"
    );

    carregar();

    const abrir =
      localStorage.getItem(
        "abrir_cadastro_obra"
      );

    if (abrir === "1") {
      localStorage.removeItem(
        "abrir_cadastro_obra"
      );

      abrirCadastro();
    }
  }, []);

  async function obterConstrutora() {
    const id =
      localStorage.getItem(
        "idconstrutora"
      ) ||
      localStorage.getItem(
        "id_construtora"
      );

    if (!id) {
      throw new Error(
        "Construtora não identificada."
      );
    }

    return Number(id);
  }

  async function carregar() {
    try {
      setCarregando(
        true
      );

      setErro("");

      const id =
        await obterConstrutora();

      const [
        listaObras,
        listaEquipes,
      ] =
        await Promise.all([
          listarObras(id),
          listarEquipesEmpresa(
            id
          ),
        ]);

      setObras(
        Array.isArray(
          listaObras
        )
          ? listaObras
          : []
      );

      setEquipes(
        Array.isArray(
          listaEquipes
        )
          ? listaEquipes
          : []
      );
    } catch (error) {
      setErro(
        error?.message ||
        "Erro ao carregar obras."
      );
    } finally {
      setCarregando(
        false
      );
    }
  }

  function alterarCampo(
    event
  ) {
    const {
      name,
      value,
    } =
      event.target;

    setFormulario(
      (anterior) => ({
        ...anterior,

        [name]:
          value ?? "",
      })
    );
  }

  function abrirCadastro() {
    setObraEditando(
      null
    );

    setFormulario({
      ...FORMULARIO_VAZIO,
    });

    setErro("");

    setModalAberto(
      true
    );
  }

  function editarObra(
    obra
  ) {
    setObraEditando(
      obra
    );

    setFormulario({
      nome:
        obra?.nome ??
        obra?.obra ??
        "",

      status:
        obra?.status ??
        "Planejamento",

      categoria:
        obra?.categoria ??
        "",

      numero_pavimentos:
        obra?.numero_pavimentos ??
        obra?.pavimentos ??
        "",

      data_inicio_planejada:
        limparData(
          obra?.data_inicio_planejada
        ),

      data_termino_planejada:
        limparData(
          obra?.data_termino_planejada
        ),

      orcamento_planejado:
        obra?.orcamento_planejado ??
        "",
    });

    setModalAberto(
      true
    );
  }

  function fecharModal() {
    setModalAberto(
      false
    );

    setObraEditando(
      null
    );

    setFormulario({
      ...FORMULARIO_VAZIO,
    });
  }

  function montarDados(
    obra,
    alteracoes = {}
  ) {
    return {
      nome:
        alteracoes.nome ??
        obra?.nome ??
        obra?.obra ??
        "",

      status:
        alteracoes.status ??
        obra?.status ??
        "Planejamento",

      id_construtora:
        Number(
          obra?.id_construtora ??
          localStorage.getItem(
            "idconstrutora"
          ) ??
          localStorage.getItem(
            "id_construtora"
          )
        ),

      categoria:
        alteracoes.categoria ??
        obra?.categoria ??
        "",

      numero_pavimentos:
        Number(
          alteracoes.numero_pavimentos ??
          obra?.numero_pavimentos ??
          obra?.pavimentos ??
          0
        ),

      data_inicio_planejada:
        limparData(
          alteracoes.data_inicio_planejada ??
          obra?.data_inicio_planejada
        ),

      data_termino_planejada:
        limparData(
          alteracoes.data_termino_planejada ??
          obra?.data_termino_planejada
        ),

      orcamento_planejado:
        Number(
          alteracoes.orcamento_planejado ??
          obra?.orcamento_planejado ??
          0
        ),
    };
  }

  async function salvar(
    event
  ) {
    event.preventDefault();

    try {
      setSalvando(
        true
      );

      setErro("");
      setSucesso("");

      const idConstrutora =
        await obterConstrutora();

      if (
        formulario.data_inicio_planejada &&
        formulario.data_termino_planejada &&
        formulario.data_termino_planejada <
          formulario.data_inicio_planejada
      ) {
        throw new Error(
          "A data final não pode ser anterior à inicial."
        );
      }

      const dados = {
        nome:
          String(
            formulario.nome ??
            ""
          ).trim(),

        status:
          formulario.status ??
          "Planejamento",

        id_construtora:
          idConstrutora,

        categoria:
          formulario.categoria ??
          "",

        numero_pavimentos:
          Number(
            formulario.numero_pavimentos ??
            0
          ),

        data_inicio_planejada:
          formulario.data_inicio_planejada ??
          "",

        data_termino_planejada:
          formulario.data_termino_planejada ??
          "",

        orcamento_planejado:
          Number(
            formulario.orcamento_planejado ??
            0
          ),
      };

      if (
        obraEditando
      ) {
        await atualizarObra(
          obraEditando.id_obra,
          dados
        );

        setSucesso(
          "Obra atualizada."
        );
      } else {
        await criarObra(
          dados
        );

        setSucesso(
          "Obra cadastrada."
        );
      }

      fecharModal();

      await carregar();
    } catch (error) {
      setErro(
        error?.message ||
        "Erro ao salvar obra."
      );
    } finally {
      setSalvando(
        false
      );
    }
  }

  async function alterarStatus(
    obra,
    novoStatus
  ) {
    const anterior =
      obra.status;

    try {
      setStatusSalvando(
        obra.id_obra
      );

      setErro("");

      setObras(
        (lista) =>
          lista.map(
            (item) =>
              item.id_obra ===
              obra.id_obra
                ? {
                    ...item,
                    status:
                      novoStatus,
                  }
                : item
          )
      );

      await atualizarObra(
        obra.id_obra,
        montarDados(
          obra,
          {
            status:
              novoStatus,
          }
        )
      );

      setSucesso(
        "Status atualizado."
      );
    } catch (error) {
      setObras(
        (lista) =>
          lista.map(
            (item) =>
              item.id_obra ===
              obra.id_obra
                ? {
                    ...item,
                    status:
                      anterior,
                  }
                : item
          )
      );

      setErro(
        error?.message ||
        "Erro ao atualizar status."
      );
    } finally {
      setStatusSalvando(
        null
      );
    }
  }

  function tentarExcluir() {
    setErro(
      "A exclusão de obras está temporariamente indisponível porque a rota do backend está retornando erro 500."
    );
  }

  function abrirRecursos(
    obra
  ) {
    setObraRecursos(
      obra
    );

    setIdEquipeSelecionada(
      ""
    );

    setModalRecursos(
      true
    );
  }

  const idsEquipes =
    useMemo(() => {
      if (!obraRecursos) {
        return [];
      }

      return obterIdsEquipesDaObra(
        obraRecursos.id_obra
      );
    }, [
      obraRecursos,
      versaoAtribuicoes,
    ]);

  const equipesDaObra =
    useMemo(
      () =>
        equipes.filter(
          (equipe) =>
            idsEquipes.some(
              (id) =>
                String(id) ===
                String(
                  obterIdEquipe(
                    equipe
                  )
                )
            )
        ),
      [
        equipes,
        idsEquipes,
      ]
    );

  const equipesDisponiveis =
    useMemo(
      () =>
        equipes.filter(
          (equipe) =>
            !idsEquipes.some(
              (id) =>
                String(id) ===
                String(
                  obterIdEquipe(
                    equipe
                  )
                )
            )
        ),
      [
        equipes,
        idsEquipes,
      ]
    );

  async function adicionarEquipe(
    event
  ) {
    event.preventDefault();

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

    if (
      !equipe ||
      !obraRecursos
    ) {
      return;
    }

    await atribuirEquipe(
      equipe,
      obraRecursos.id_obra
    );

    setVersaoAtribuicoes(
      (valor) =>
        valor + 1
    );

    setIdEquipeSelecionada(
      ""
    );
  }

  async function removerEquipe(
    equipe
  ) {
    if (!obraRecursos) {
      return;
    }

    await desatribuirEquipe(
      equipe,
      obraRecursos.id_obra
    );

    setVersaoAtribuicoes(
      (valor) =>
        valor + 1
    );
  }

  function qtdEquipes(
    idObra
  ) {
    return obterIdsEquipesDaObra(
      idObra
    ).length;
  }

  const obrasAtivas =
    obras.filter(
      (obra) =>
        [
          "Planejamento",
          "Em Andamento",
        ].includes(
          obra.status
        )
    ).length;

  const paralisadas =
    obras.filter(
      (obra) =>
        obra.status ===
        "Paralisada"
    ).length;

  const orcamento =
    obras.reduce(
      (total, obra) =>
        total +
        Number(
          obra.orcamento_planejado ||
          0
        ),
      0
    );

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
              Cadastre obras e atribua
              equipes aos projetos.
            </p>

          </div>

          <button
            type="button"
            className="button"
            onClick={
              abrirCadastro
            }
          >
            + Nova obra
          </button>

        </section>

        {erro && (
          <div className="auth-error">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="mensagem-sucesso">
            {sucesso}
          </div>
        )}

        <section className="cards-grid">

          <Card
            title="Total"
            value={obras.length}
            description="Obras"
          />

          <Card
            title="Ativas"
            value={obrasAtivas}
            description="Em acompanhamento"
          />

          <Card
            title="Paralisadas"
            value={paralisadas}
            description="Atenção"
          />

          <Card
            title="Orçamento"
            value={
              formatarReal(
                orcamento
              )
            }
            description="Planejado"
          />

        </section>

        <section className="dashboard-section obras-listagem">

          <div className="section-header">

            <div>

              <span className="section-label">
                PORTFÓLIO
              </span>

              <h2>
                Obras cadastradas
              </h2>

              <p>
                Altere o status diretamente
                na tabela.
              </p>

            </div>

          </div>

          <div className="obras-table-wrapper">

            <table className="obras-table">

              <thead>

                <tr>
                  <th>Obra</th>
                  <th>Status</th>
                  <th>Categoria</th>
                  <th>Pav.</th>
                  <th>Prazo</th>
                  <th>Orçamento</th>
                  <th>Equipe</th>
                  <th>Ações</th>
                </tr>

              </thead>

              <tbody>

                {carregando ? (

                  <tr>
                    <td
                      colSpan="8"
                      className="tabela-vazia"
                    >
                      Carregando...
                    </td>
                  </tr>

                ) : obras.length ===
                  0 ? (

                  <tr>
                    <td
                      colSpan="8"
                      className="tabela-vazia"
                    >
                      Nenhuma obra cadastrada.
                    </td>
                  </tr>

                ) : (

                  obras.map(
                    (obra) => (

                      <tr
                        key={
                          `obra-${obra.id_obra}`
                        }
                      >

                        <td
                          data-label="Obra"
                          className="obra-nome"
                        >
                          {obra.nome ||
                            obra.obra ||
                            "-"}
                        </td>

                        <td data-label="Status">

                          <select
                            className={`status-select status-${normalizarStatus(
                              obra.status
                            )}`}
                            value={
                              obra.status ??
                              "Planejamento"
                            }
                            disabled={
                              statusSalvando ===
                              obra.id_obra
                            }
                            onChange={(event) =>
                              alterarStatus(
                                obra,
                                event.target.value
                              )
                            }
                          >

                            {STATUS.map(
                              (status) => (

                                <option
                                  key={status}
                                  value={status}
                                >
                                  {status}
                                </option>

                              )
                            )}

                          </select>

                        </td>

                        <td data-label="Categoria">
                          {obra.categoria ||
                            "-"}
                        </td>

                        <td data-label="Pav.">
                          {obra.numero_pavimentos ??
                            "-"}
                        </td>

                        <td
                          data-label="Prazo"
                          className="prazo-obra"
                        >
                          <span>
                            {formatarData(
                              obra.data_inicio_planejada
                            )}
                          </span>

                          <small>
                            até
                          </small>

                          <span>
                            {formatarData(
                              obra.data_termino_planejada
                            )}
                          </span>
                        </td>

                        <td data-label="Orçamento">
                          {formatarReal(
                            obra.orcamento_planejado
                          )}
                        </td>

                        <td data-label="Equipe">
                          {qtdEquipes(
                            obra.id_obra
                          )}
                        </td>

                        <td data-label="Ações">

                          <div className="acoes-obras">

                            <button
                              type="button"
                              className="button acao-obra"
                              onClick={() =>
                                onAbrirObra?.(
                                  obra
                                )
                              }
                            >
                              Abrir
                            </button>

                            <button
                              type="button"
                              className="secondary-button acao-obra"
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
                              className="secondary-button acao-obra"
                              onClick={() =>
                                editarObra(
                                  obra
                                )
                              }
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              className="cancel-button acao-obra"
                              onClick={
                                tentarExcluir
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

        {modalAberto && (

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
                    fecharModal
                  }
                >
                  ×
                </button>

              </div>

              <form
                className="obra-form"
                onSubmit={
                  salvar
                }
              >

                <div className="obra-form-grid">

                  <div className="form-group">

                    <label>
                      Nome
                    </label>

                    <input
                      name="nome"
                      value={
                        formulario.nome ??
                        ""
                      }
                      onChange={
                        alterarCampo
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
                        formulario.status ??
                        "Planejamento"
                      }
                      onChange={
                        alterarCampo
                      }
                    >

                      {STATUS.map(
                        (status) => (

                          <option
                            key={status}
                            value={status}
                          >
                            {status}
                          </option>

                        )
                      )}

                    </select>

                  </div>

                  <div className="form-group">

                    <label>
                      Categoria
                    </label>

                    <select
                      name="categoria"
                      value={
                        formulario.categoria ??
                        ""
                      }
                      onChange={
                        alterarCampo
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

                  <div className="form-group">

                    <label>
                      Pavimentos
                    </label>

                    <input
                      type="number"
                      min="1"
                      name="numero_pavimentos"
                      value={
                        formulario.numero_pavimentos ??
                        ""
                      }
                      onChange={
                        alterarCampo
                      }
                      required
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Início
                    </label>

                    <input
                      type="date"
                      name="data_inicio_planejada"
                      value={
                        formulario.data_inicio_planejada ??
                        ""
                      }
                      onChange={
                        alterarCampo
                      }
                      required
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Término
                    </label>

                    <input
                      type="date"
                      name="data_termino_planejada"
                      value={
                        formulario.data_termino_planejada ??
                        ""
                      }
                      onChange={
                        alterarCampo
                      }
                      required
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Orçamento
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      name="orcamento_planejado"
                      value={
                        formulario.orcamento_planejado ??
                        ""
                      }
                      onChange={
                        alterarCampo
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
                      fecharModal
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
                      : "Salvar"}
                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

        {modalRecursos &&
          obraRecursos && (

          <div className="modal-overlay">

            <div className="modal-container modal-recursos">

              <div className="modal-header">

                <div>

                  <span className="section-label">
                    EQUIPES
                  </span>

                  <h2>
                    {obraRecursos.nome ||
                      obraRecursos.obra}
                  </h2>

                  <p>
                    Atribua equipes já cadastradas
                    para a empresa.
                  </p>

                </div>

                <button
                  type="button"
                  className="modal-close"
                  onClick={() =>
                    setModalRecursos(
                      false
                    )
                  }
                >
                  ×
                </button>

              </div>

              <form
                className="obra-form"
                onSubmit={
                  adicionarEquipe
                }
              >

                <div className="form-group">

                  <label>
                    Equipe disponível
                  </label>

                  <select
                    value={
                      idEquipeSelecionada ??
                      ""
                    }
                    onChange={(event) =>
                      setIdEquipeSelecionada(
                        event.target.value
                      )
                    }
                  >

                    <option value="">
                      Selecione
                    </option>

                    {equipesDisponiveis.map(
                      (equipe) => {

                        const id =
                          obterIdEquipe(
                            equipe
                          );

                        return (

                          <option
                            key={
                              `opcao-${id}`
                            }
                            value={id}
                          >
                            {equipe.nome_equipe}
                            {" — "}
                            {equipe.area_atuacao}
                          </option>

                        );
                      }
                    )}

                  </select>

                </div>

                <div className="modal-actions">

                  <button
                    type="submit"
                    className="button"
                    disabled={
                      !idEquipeSelecionada
                    }
                  >
                    + Atribuir equipe
                  </button>

                </div>

              </form>

              <div className="tabela-container">

                <table>

                  <thead>

                    <tr>
                      <th>Equipe</th>
                      <th>Área</th>
                      <th>Profissionais</th>
                      <th>Custo/dia</th>
                      <th>Ações</th>
                    </tr>

                  </thead>

                  <tbody>

                    {equipesDaObra.length ===
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

                      equipesDaObra.map(
                        (
                          equipe,
                          index
                        ) => {

                          const id =
                            obterIdEquipe(
                              equipe
                            );

                          return (

                            <tr
                              key={
                                id != null
                                  ? `atribuida-${obraRecursos.id_obra}-${id}`
                                  : `atribuida-${index}`
                              }
                            >

                              <td>
                                {equipe.nome_equipe}
                              </td>

                              <td>
                                {equipe.area_atuacao}
                              </td>

                              <td>
                                {equipe.quantidade_profissionais}
                              </td>

                              <td>
                                {formatarReal(
                                  equipe.custo_diario_total
                                )}
                              </td>

                              <td>

                                <button
                                  type="button"
                                  className="cancel-button"
                                  onClick={() =>
                                    removerEquipe(
                                      equipe
                                    )
                                  }
                                >
                                  Remover
                                </button>

                              </td>

                            </tr>

                          );
                        }
                      )

                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </div>

        )}

      </div>

    </Layout>
  );
}

export default Obras;