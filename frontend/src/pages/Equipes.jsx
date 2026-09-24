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
  atualizarEquipe,
  criarEquipe,
  excluirEquipe,
  listarEquipesEmpresa,
  obterIdEquipe,
} from "../api/recursos.js";

const AREAS_ATUACAO = [
  "Mobilização",
  "Infraestrutura",
  "Supraestrutura e Alvenaria",
  "Instalações",
  "Revestimentos",
  "Acabamento",
];

const FORMULARIO_VAZIO = {
  nome_equipe: "",
  area_atuacao: "",
  quantidade_profissionais: "",
  custo_diario_total: "",
};

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

function Equipes({
  onNavegar,
}) {
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
  ] = useState({
    ...FORMULARIO_VAZIO,
  });

  useEffect(() => {
    localStorage.setItem(
      "pagina_atual",
      "equipes"
    );

    carregarEquipes();
  }, []);

  async function obterConstrutora() {
    let id =
      localStorage.getItem(
        "idconstrutora"
      ) ||
      localStorage.getItem(
        "id_construtora"
      );

    if (id) {
      return Number(id);
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

    const dados =
      await requisitar(
        `/usuarios/${idUsuario}`
      );

    const usuario =
      dados?.usuario ??
      dados;

    id =
      usuario?.idconstrutora ??
      usuario?.id_construtora;

    if (!id) {
      throw new Error(
        "Construtora não identificada."
      );
    }

    localStorage.setItem(
      "idconstrutora",
      String(id)
    );

    return Number(id);
  }

  async function carregarEquipes() {
    try {
      setCarregando(
        true
      );

      setErro("");

      const id =
        await obterConstrutora();

      const lista =
        await listarEquipesEmpresa(
          id
        );

      setEquipes(
        Array.isArray(lista)
          ? lista
          : []
      );
    } catch (error) {
      setErro(
        error?.message ||
        "Erro ao carregar equipes."
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
    setEquipeEditando(
      null
    );

    setFormulario({
      ...FORMULARIO_VAZIO,
    });

    setErro("");
    setSucesso("");

    setFormularioAberto(
      true
    );
  }

  function abrirEdicao(
    equipe
  ) {
    setEquipeEditando(
      equipe
    );

    setFormulario({
      nome_equipe:
        equipe?.nome_equipe ??
        "",

      area_atuacao:
        equipe?.area_atuacao ??
        "",

      quantidade_profissionais:
        equipe?.quantidade_profissionais ??
        "",

      custo_diario_total:
        equipe?.custo_diario_total ??
        "",
    });

    setErro("");
    setSucesso("");

    setFormularioAberto(
      true
    );
  }

  function cancelar() {
    setFormularioAberto(
      false
    );

    setEquipeEditando(
      null
    );

    setFormulario({
      ...FORMULARIO_VAZIO,
    });
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

      const dados = {
        nome_equipe:
          String(
            formulario.nome_equipe ??
            ""
          ).trim(),

        area_atuacao:
          formulario.area_atuacao ??
          "",

        quantidade_profissionais:
          Number(
            formulario.quantidade_profissionais ??
            0
          ),

        custo_diario_total:
          Number(
            formulario.custo_diario_total ??
            0
          ),

        id_construtora:
          idConstrutora,
      };

      if (
        !dados.nome_equipe
      ) {
        throw new Error(
          "Informe o nome da equipe."
        );
      }

      if (
        !dados.area_atuacao
      ) {
        throw new Error(
          "Selecione a área de atuação."
        );
      }

      if (
        dados.quantidade_profissionais <=
        0
      ) {
        throw new Error(
          "Informe a quantidade de profissionais."
        );
      }

      if (
        equipeEditando
      ) {
        await atualizarEquipe(
          obterIdEquipe(
            equipeEditando
          ),
          dados
        );

        setSucesso(
          "Equipe atualizada."
        );
      } else {
        await criarEquipe(
          dados
        );

        setSucesso(
          "Equipe cadastrada."
        );
      }

      cancelar();

      await carregarEquipes();
    } catch (error) {
      setErro(
        error?.message ||
        "Erro ao salvar equipe."
      );
    } finally {
      setSalvando(
        false
      );
    }
  }

  async function remover(
    equipe
  ) {
    if (
      !window.confirm(
        `Excluir "${equipe.nome_equipe}"?`
      )
    ) {
      return;
    }

    await excluirEquipe(
      equipe
    );

    setSucesso(
      "Equipe excluída."
    );

    await carregarEquipes();
  }

  const equipesFiltradas =
    useMemo(() => {
      const termo =
        String(
          pesquisa || ""
        )
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

          return (
            (
              !termo ||
              nome.includes(
                termo
              ) ||
              area.includes(
                termo
              )
            ) &&
            (
              !filtroArea ||
              equipe.area_atuacao ===
                filtroArea
            )
          );
        }
      );
    }, [
      equipes,
      pesquisa,
      filtroArea,
    ]);

  const profissionais =
    equipes.reduce(
      (total, equipe) =>
        total +
        Number(
          equipe.quantidade_profissionais ||
          0
        ),
      0
    );

  const custo =
    equipes.reduce(
      (total, equipe) =>
        total +
        Number(
          equipe.custo_diario_total ||
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
              RECURSOS HUMANOS
            </span>

            <h1>
              Equipes
            </h1>

            <p>
              Equipes pertencem à empresa.
              A atribuição é feita em Obras.
            </p>

          </div>

          <div className="dashboard-header-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={
                carregarEquipes
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

        {formularioAberto && (

          <section className="dashboard-section">

            <div className="section-header">

              <div>

                <span className="section-label">
                  EQUIPE
                </span>

                <h2>
                  {equipeEditando
                    ? "Editar equipe"
                    : "Cadastrar equipe"}
                </h2>

              </div>

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
                    name="nome_equipe"
                    value={
                      formulario.nome_equipe ??
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
                    Área
                  </label>

                  <select
                    name="area_atuacao"
                    value={
                      formulario.area_atuacao ??
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

                    {AREAS_ATUACAO.map(
                      (area) => (

                        <option
                          key={area}
                          value={area}
                        >
                          {area}
                        </option>

                      )
                    )}

                  </select>

                </div>

                <div className="form-group">

                  <label>
                    Profissionais
                  </label>

                  <input
                    type="number"
                    min="1"
                    name="quantidade_profissionais"
                    value={
                      formulario.quantidade_profissionais ??
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
                    Custo diário total
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="custo_diario_total"
                    value={
                      formulario.custo_diario_total ??
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
                    cancelar
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

          </section>

        )}

        <section className="cards-grid">

          <div className="dashboard-section">
            <span className="section-label">
              EQUIPES
            </span>
            <h2>{equipes.length}</h2>
            <p>Cadastradas</p>
          </div>

          <div className="dashboard-section">
            <span className="section-label">
              PROFISSIONAIS
            </span>
            <h2>{profissionais}</h2>
            <p>Total</p>
          </div>

          <div className="dashboard-section">
            <span className="section-label">
              CUSTO/DIA
            </span>
            <h2>
              {formatarReal(
                custo
              )}
            </h2>
            <p>Total</p>
          </div>

        </section>

        <section className="dashboard-section">

          <div className="filtros-equipes">

            <div className="filtro-pesquisa">

              <label>
                Pesquisar
              </label>

              <input
                value={
                  pesquisa ?? ""
                }
                onChange={(event) =>
                  setPesquisa(
                    event.target.value
                  )
                }
                placeholder="Nome ou área..."
              />

            </div>

            <div className="filtro-area">

              <label>
                Área
              </label>

              <select
                value={
                  filtroArea ?? ""
                }
                onChange={(event) =>
                  setFiltroArea(
                    event.target.value
                  )
                }
              >

                <option value="">
                  Todas
                </option>

                {AREAS_ATUACAO.map(
                  (area) => (

                    <option
                      key={area}
                      value={area}
                    >
                      {area}
                    </option>

                  )
                )}

              </select>

            </div>

          </div>

          <div className="tabela-container">

            <table>

              <thead>
                <tr>
                  <th>Equipe</th>
                  <th>Área</th>
                  <th>Profissionais</th>
                  <th>Custo diário</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>

                {carregando ? (

                  <tr>
                    <td
                      colSpan="5"
                      className="tabela-vazia"
                    >
                      Carregando...
                    </td>
                  </tr>

                ) : equipesFiltradas.length ===
                  0 ? (

                  <tr>
                    <td
                      colSpan="5"
                      className="tabela-vazia"
                    >
                      Nenhuma equipe encontrada.
                    </td>
                  </tr>

                ) : (

                  equipesFiltradas.map(
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
                              ? `equipe-${id}`
                              : `equipe-${index}`
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

                            <div className="acoes-inline">

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
                                className="cancel-button"
                                onClick={() =>
                                  remover(
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