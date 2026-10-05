import Toast from "../../componentes/shared/Toast";
import useUnsavedChanges, { confirmarSaida } from "../../componentes/shared/useUnsavedChanges";
import {
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";

import { listarObras } from "../../api/obras.js";

import Layout from "../../componentes/escritorio/Layout";

import {
  requisitar,
} from "../../api/api.js";

import {
  atualizarEquipe,
  criarEquipe,
  excluirEquipe,
  listarEquipesEmpresa,
  obterIdEquipe,
} from "../../api/recursos.js";

const AREAS_ATUACAO = [
  "Mobilização",
  "Infraestrutura",
  "Supraestrutura e Alvenaria",
  "Instalações",
  "Revestimentos",
  "Acabamentos",
];

const FORMULARIO_VAZIO = {
  nome_equipe: "",
  etapa_atuacao: "",
  quantidade_profissionais: "",
  custo_diario: "",
  custo_mensal: "",
  idobra: "",
};

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

function Equipes({
  onNavegar,
}) {
  const trava = useRef(false);
  const [filtroObra, setFiltroObra] = useState("");
  const [obras, setObras] = useState([]);
  const [aviso, setAviso] = useState("");
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

  const baseline = useRef(JSON.stringify(FORMULARIO_VAZIO));
  useUnsavedChanges(formularioAberto && JSON.stringify(formulario) !== baseline.current, salvando);
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

      const projetos = await listarObras(id);
      setObras(projetos);
      setAviso([lista.aviso, projetos.aviso].filter(Boolean).join(" "));
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
    if (!confirmarSaida()) return;
    baseline.current = JSON.stringify(FORMULARIO_VAZIO);
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
    if (!confirmarSaida()) return;
    setEquipeEditando(
      equipe
    );

    const inicial = {
      ...equipe,
      nome_equipe:
        equipe?.nome_equipe ??
        "",

      etapa_atuacao:
        equipe?.etapa_atuacao ??
        "",

      quantidade_profissionais:
        equipe?.quantidade_profissionais ??
        "",

      custo_diario:
        equipe?.custo_diario ??
        "",
    };
    baseline.current = JSON.stringify(inicial); setFormulario(inicial);

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
    if (trava.current) return;
    trava.current = true;

    try {
      setSalvando(
        true
      );

      setErro("");
      setSucesso("");

      const idConstrutora =
        await obterConstrutora();

      const dados = {
        ...formulario,
        nome_equipe:
          String(
            formulario.nome_equipe ??
            ""
          ).trim(),

        etapa_atuacao:
          formulario.etapa_atuacao ??
          "",

        quantidade_profissionais:
          Number(
            formulario.quantidade_profissionais ??
            0
          ),

        custo_diario:
          Number(
            formulario.custo_diario ??
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
        !dados.etapa_atuacao
      ) {
        throw new Error(
          "Selecione a área de atuação."
        );
      }

      if (
        !Number.isInteger(dados.quantidade_profissionais) || dados.quantidade_profissionais <=
        0
      ) {
        throw new Error(
          "Informe a quantidade de profissionais."
        );
      }

      if (!obras.some(o => String(o.id_obra) === String(dados.idobra))) throw new Error("Selecione uma obra disponível para sua construtora.");
      for (const campo of ["custo_diario", "custo_mensal"]) {
        if (formulario[campo] === "" || !Number.isFinite(Number(formulario[campo])) || Number(formulario[campo]) < 0) throw new Error("Informe custos válidos, maiores ou iguais a zero.");
      }
      if (equipeEditando) {
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
      trava.current = false;
      setSalvando(
        false
      );
    }
  }

  async function remover(equipe) {
    if (trava.current) return;
    if (
      !window.confirm(
        `Excluir "${equipe.nome_equipe}"? Esta ação excluirá definitivamente o cadastro.`
      )
    ) {
      return;
    }

    trava.current = true; setSalvando(true);
    setErro("");
    setSucesso("");
    try {
      await excluirEquipe(equipe);
      if (obterIdEquipe(equipeEditando) === obterIdEquipe(equipe)) cancelar();
      await carregarEquipes();
      setSucesso("Equipe excluída.");
    } catch (error) {
      setErro(error.message || "Não foi possível excluir a equipe.");
    } finally { trava.current = false; setSalvando(false); }
  }

  const equipesFiltradas =
    useMemo(() => {
      const termo =
        String(
          pesquisa || ""
        )
          .trim()
          .toLowerCase();

      return equipes.filter(e => !filtroObra || String(e.idobra) === filtroObra).filter(
        (equipe) => {
          const nome =
            String(
              equipe.nome_equipe ||
              ""
            ).toLowerCase();

          const area =
            String(
              equipe.etapa_atuacao ||
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
              equipe.etapa_atuacao ===
                filtroArea
            )
          );
        }
      );
    }, [
      equipes,
      pesquisa,
      filtroArea, filtroObra,
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
          equipe.custo_diario ||
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
              Cadastre e edite equipes. Uma obra é obrigatória no cadastro atual.
              Transfira equipes nos detalhes da obra de destino.
            </p>

          </div>

          <div className="dashboard-header-actions">

            <button
              type="button"
              disabled={salvando}
              className="secondary-button"
              onClick={
                carregarEquipes
              }
            >
              Atualizar
            </button>

            <button
              type="button"
              disabled={salvando}
              className="button"
              onClick={
                abrirCadastro
              }
            >
              + Nova Equipe
            </button>

          </div>

        </section>

        {aviso && <p role="status">{aviso}</p>}
        {erro && (
          <div className="auth-error" role="alert">
            {erro}
          </div>
        )}

        <Toast message={sucesso} />

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

              <fieldset disabled={salvando} className="obra-form-grid" style={{ border: 0, padding: 0 }}>
                <div className="form-group">
                  <label htmlFor="obra-equipe">Obra</label>
                  <select id="obra-equipe" name="idobra" value={formulario.idobra ?? ""} onChange={alterarCampo} required>
                    <option value="">Selecione uma obra</option>
                    {obras.map(item => <option key={item.id_obra} value={item.id_obra}>{item.nome || item.obra}</option>)}
                    {formulario.idobra && !obras.some(item => Number(item.id_obra) === Number(formulario.idobra)) && <option value={formulario.idobra}>Obra {formulario.idobra}</option>}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="custo-mensal">Custo mensal</label>
                  <input id="custo-mensal" type="number" min="0" step="0.01" name="custo_mensal" value={formulario.custo_mensal ?? ""} onChange={alterarCampo} required />
                </div>

                <div className="form-group">

                  <label htmlFor="equipe-nome">Nome</label>

                  <input
                    id="equipe-nome" name="nome_equipe"
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

                  <label htmlFor="equipe-etapa">Área</label>

                  <select
                    id="equipe-etapa" name="etapa_atuacao"
                    value={
                      formulario.etapa_atuacao ??
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

                  <label htmlFor="equipe-profissionais">Profissionais</label>

                  <input
                    type="number"
                    min="1"
                    id="equipe-profissionais" name="quantidade_profissionais"
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

                  <label htmlFor="equipe-custo">Custo diário total</label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    id="equipe-custo" name="custo_diario"
                    value={
                      formulario.custo_diario ??
                      ""
                    }
                    onChange={
                      alterarCampo
                    }
                    required
                  />

                </div>

              </fieldset>

              <div className="modal-actions">

                <button
                  type="button"
              disabled={salvando}
                  className="cancel-button"
                  onClick={() => { if (confirmarSaida()) cancelar(); }}
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

          <div className="filtros-equipes"><label className="form-group">Obra<select value={filtroObra} onChange={e => setFiltroObra(e.target.value)}><option value="">Todas as obras</option>{obras.map(o => <option key={o.id_obra} value={o.id_obra}>{o.nome}</option>)}</select></label>

            <div className="filtro-pesquisa">

              <label htmlFor="pesquisa-equipe">Pesquisar
              </label>

              <input id="pesquisa-equipe" value={pesquisa ?? ""
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

              <label htmlFor="filtro-area-equipe">Área
              </label>

              <select id="filtro-area-equipe" value={filtroArea ?? ""
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

          <div className="filter-results"><button type="button" className="secondary-button" onClick={() => { setPesquisa(""); setFiltroArea(""); setFiltroObra(""); }}>Limpar filtros</button>{!carregando && !erro && <p role="status">{equipesFiltradas.length} {equipesFiltradas.length === 1 ? "equipe encontrada" : "equipes encontradas"}</p>}</div>
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
                            {equipe.nome_equipe}<small style={{ display: "block" }}>{obras.find(o => String(o.id_obra) === String(equipe.idobra))?.nome || "Obra não informada"}</small>
                          </td>

                          <td>
                            {equipe.etapa_atuacao}
                          </td>

                          <td>
                            {equipe.quantidade_profissionais}
                          </td>

                          <td>
                            {formatarReal(
                              equipe.custo_diario
                            )}
                          </td>

                          <td>

                            <div className="acoes-inline">

                              <button
                                type="button"
              disabled={salvando}
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
              disabled={salvando}
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
