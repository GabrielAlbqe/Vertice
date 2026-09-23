import { useEffect, useState } from "react";
import Layout from "../componentes/Layout";

// =====================================================
// API DE INSUMOS
// =====================================================

const API_INSUMOS =
  "http://localhost:3000/api/insumos";

async function requisitarInsumos(caminho = "", opcoes = {}) {
  const resposta = await fetch(
    `${API_INSUMOS}${caminho}`,
    {
      ...opcoes,

      headers: {
        "Content-Type": "application/json",
        ...(opcoes.headers || {}),
      },
    }
  );

  const texto = await resposta.text();

  let dados = null;

  if (texto) {
    try {
      dados = JSON.parse(texto);
    } catch {
      dados = texto;
    }
  }

  if (!resposta.ok) {
    throw new Error(
      dados?.mensagem ||
        dados?.message ||
        `Erro ${resposta.status} ao acessar o servidor.`
    );
  }

  return dados;
}

// =====================================================
// API DE MAQUINÁRIOS
// =====================================================

const API_MAQUINARIOS =
  "http://localhost:3000/api/maquinarios";

async function requisitarMaquinarios(caminho = "", opcoes = {}) {
  const resposta = await fetch(
    `${API_MAQUINARIOS}${caminho}`,
    {
      ...opcoes,

      headers: {
        "Content-Type": "application/json",
        ...(opcoes.headers || {}),
      },
    }
  );

  const texto = await resposta.text();

  let dados = null;

  if (texto) {
    try {
      dados = JSON.parse(texto);
    } catch {
      dados = texto;
    }
  }

  if (!resposta.ok) {
    const mensagem =
      typeof dados === "string"
        ? dados
        : dados?.mensagem ||
          dados?.message ||
          `Erro ${resposta.status} ao acessar o servidor.`;

    throw new Error(mensagem);
  }

  return dados;
}

// =====================================================
// API DE EQUIPES
// =====================================================

const API_EQUIPES =
  "http://localhost:3000/api/equipes";

async function requisitarEquipes(caminho = "", opcoes = {}) {
  const resposta = await fetch(
    `${API_EQUIPES}${caminho}`,
    {
      ...opcoes,

      headers: {
        "Content-Type": "application/json",
        ...(opcoes.headers || {}),
      },
    }
  );

  const texto = await resposta.text();

  let dados = null;

  if (texto) {
    try {
      dados = JSON.parse(texto);
    } catch {
      dados = texto;
    }
  }

  if (!resposta.ok) {
    const mensagem =
      typeof dados === "string"
        ? dados
        : dados?.mensagem ||
          dados?.message ||
          `Erro ${resposta.status} ao acessar o servidor.`;

    throw new Error(mensagem);
  }

  return dados;
}

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function formatarReal(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data) {
  if (!data) {
    return "-";
  }

  // Funciona tanto para "2026-09-16"
  // quanto para datas retornadas pelo MySQL em ISO.
  const dataLimpa = String(data).split("T")[0];

  const partes = dataLimpa.split("-");

  if (partes.length !== 3) {
    return data;
  }

  const [ano, mes, dia] = partes;

  return `${dia}/${mes}/${ano}`;
}

function obterIdInsumo(insumo) {
  return (
    insumo?.id_insumos ??
    insumo?.id_insumo ??
    insumo?.id_cadastro_de_insumos ??
    insumo?.id
  );
}

function obterIdMaquinario(maquinario) {
  return (
    maquinario?.id_maquina ??
    maquinario?.id_maquinario ??
    maquinario?.id
  );
}

function obterIdEquipe(equipe) {
  return (
    equipe?.id_cadastro_equipes ??
    equipe?.id_equipe ??
    equipe?.id
  );
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

function ObraDetalhes({
  obra,
  onVoltar,
  onNavegar,
}) {
  const [abaAtiva, setAbaAtiva] =
    useState("visao-geral");

  const [equipes, setEquipes] =
    useState([]);

  const [insumos, setInsumos] =
    useState([]);

  const [maquinarios, setMaquinarios] =
    useState([]);

  if (!obra) {
    return (
      <Layout onNavegar={onNavegar}>
        <div className="dashboard">

          <section className="dashboard-section">

            <h2>
              Nenhuma obra selecionada
            </h2>

            <p>
              Volte para a página de obras e
              selecione uma obra.
            </p>

            <button
              type="button"
              className="button"
              onClick={onVoltar}
              style={{ marginTop: "20px" }}
            >
              Voltar para Obras
            </button>

          </section>

        </div>
      </Layout>
    );
  }

  return (
    <Layout onNavegar={onNavegar}>

      <div className="dashboard">

        {/* =============================================
            CABEÇALHO
        ============================================= */}

        <section className="dashboard-header">

          <div>

            <button
              type="button"
              className="botao-voltar"
              onClick={onVoltar}
            >
              ← Voltar para Obras
            </button>

            <span
              className="dashboard-eyebrow"
              style={{ marginTop: "14px" }}
            >
              PLANEJAMENTO DE OBRA
            </span>

            <h1>
              {obra.obra}
            </h1>

            <p>
              Gerencie os recursos e acompanhe
              os indicadores desta obra.
            </p>

          </div>

          <div className="status-obra">
            {obra.status || "Sem status"}
          </div>

        </section>

        {/* =============================================
            ÁREA PRINCIPAL
        ============================================= */}

        <section className="dashboard-section">

          {/* ABAS */}

          <div className="abas-obra">

            <button
              type="button"
              className={
                abaAtiva === "visao-geral"
                  ? "aba ativa"
                  : "aba"
              }
              onClick={() =>
                setAbaAtiva("visao-geral")
              }
            >
              Visão Geral
            </button>

            <button
              type="button"
              className={
                abaAtiva === "equipes"
                  ? "aba ativa"
                  : "aba"
              }
              onClick={() =>
                setAbaAtiva("equipes")
              }
            >
              Equipes Terceirizadas
            </button>

            <button
              type="button"
              className={
                abaAtiva === "insumos"
                  ? "aba ativa"
                  : "aba"
              }
              onClick={() =>
                setAbaAtiva("insumos")
              }
            >
              Materiais e Insumos
            </button>

            <button
              type="button"
              className={
                abaAtiva === "maquinarios"
                  ? "aba ativa"
                  : "aba"
              }
              onClick={() =>
                setAbaAtiva("maquinarios")
              }
            >
              Maquinários
            </button>

            <button
              type="button"
              className={
                abaAtiva === "indicadores"
                  ? "aba ativa"
                  : "aba"
              }
              onClick={() =>
                setAbaAtiva("indicadores")
              }
            >
              Indicadores
            </button>

          </div>

          {/* CONTEÚDO */}

          <div className="conteudo-aba">

            {abaAtiva === "visao-geral" && (
              <VisaoGeral
                obra={obra}
                equipes={equipes}
                insumos={insumos}
                maquinarios={maquinarios}
              />
            )}

            {abaAtiva === "equipes" && (
              <Equipes
                obra={obra}
                equipes={equipes}
                setEquipes={setEquipes}
              />
            )}

            {abaAtiva === "insumos" && (
              <Insumos
                obra={obra}
                insumos={insumos}
                setInsumos={setInsumos}
              />
            )}

            {abaAtiva === "maquinarios" && (
              <Maquinarios
                obra={obra}
                maquinarios={maquinarios}
                setMaquinarios={setMaquinarios}
              />
            )}

            {abaAtiva === "indicadores" && (
              <Indicadores
                obra={obra}
                equipes={equipes}
                insumos={insumos}
                maquinarios={maquinarios}
              />
            )}

          </div>

        </section>

      </div>

    </Layout>
  );
}

// =====================================================
// VISÃO GERAL
// =====================================================

function VisaoGeral({
  obra,
  equipes,
  insumos,
  maquinarios,
}) {
  const maquinariosAtivos =
    maquinarios.filter(
      (item) =>
        item.status === "Ativo"
    ).length;

  const valorEstoque =
    insumos.reduce(
      (total, insumo) =>
        total +
        Number(
          insumo.quantidade_disponivel || 0
        ) *
          Number(
            insumo.valor_unitario || 0
          ),
      0
    );

  return (
    <div>

      <div className="titulo-aba">

        <div>

          <span className="section-label">
            RESUMO
          </span>

          <h2>
            Visão Geral
          </h2>

          <p>
            Informações principais e recursos
            relacionados à obra.
          </p>

        </div>

      </div>

      <div className="cards-resumo">

        <div className="card-resumo">

          <span>
            Status
          </span>

          <strong>
            {obra.status || "-"}
          </strong>

        </div>

        <div className="card-resumo">

          <span>
            Categoria
          </span>

          <strong>
            {obra.categoria || "-"}
          </strong>

        </div>

        <div className="card-resumo">

          <span>
            Pavimentos
          </span>

          <strong>
            {obra.pavimentos || "-"}
          </strong>

        </div>

        <div className="card-resumo">

          <span>
            Orçamento planejado
          </span>

          <strong>
            {formatarReal(
              obra.orcamento_planejado
            )}
          </strong>

        </div>

      </div>

      <div
        className="cards-resumo"
        style={{
          marginTop: "20px",
        }}
      >

        <div className="card-resumo">

          <span>
            Início planejado
          </span>

          <strong>
            {formatarData(
              obra.data_inicial_planejada
            )}
          </strong>

        </div>

        <div className="card-resumo">

          <span>
            Final planejado
          </span>

          <strong>
            {formatarData(
              obra.data_final_planejada
            )}
          </strong>

        </div>

        <div className="card-resumo">

          <span>
            Equipes cadastradas
          </span>

          <strong>
            {equipes.length}
          </strong>

        </div>

        <div className="card-resumo">

          <span>
            Maquinários ativos
          </span>

          <strong>
            {maquinariosAtivos}
          </strong>

        </div>

      </div>

      <div
        className="cards-resumo"
        style={{
          marginTop: "20px",
        }}
      >

        <div className="card-resumo">

          <span>
            Tipos de insumos
          </span>

          <strong>
            {insumos.length}
          </strong>

        </div>

        <div className="card-resumo">

          <span>
            Valor do estoque
          </span>

          <strong>
            {formatarReal(
              valorEstoque
            )}
          </strong>

        </div>

      </div>

    </div>
  );
}

// =====================================================
// EQUIPES TERCEIRIZADAS - INTEGRADO AO BACKEND
// =====================================================

function Equipes({
  obra,
  equipes,
  setEquipes,
}) {
  const [modalAberto, setModalAberto] =
    useState(false);

  const [
    equipeEditando,
    setEquipeEditando,
  ] = useState(null);

  const [carregando, setCarregando] =
    useState(false);

  const [salvando, setSalvando] =
    useState(false);

  const [erro, setErro] =
    useState("");

  const [formulario, setFormulario] =
    useState({
      nome_equipe: "",
      etapa_atuacao: "",
      quantidade_profissionais: "",
      custo_diario: "",
      custo_mensal: "",
      dias_semana_atuacao: [],
    });

  const diasDisponiveis = [
    { valor: "seg", nome: "Seg" },
    { valor: "ter", nome: "Ter" },
    { valor: "qua", nome: "Qua" },
    { valor: "qui", nome: "Qui" },
    { valor: "sex", nome: "Sex" },
    { valor: "sab", nome: "Sáb" },
    { valor: "dom", nome: "Dom" },
  ];

  function alterarDia(dia) {
    const selecionado =
      formulario.dias_semana_atuacao.includes(dia);

    const novosDias = selecionado
      ? formulario.dias_semana_atuacao.filter(
          (item) => item !== dia
        )
      : [
          ...formulario.dias_semana_atuacao,
          dia,
        ];

    setFormulario({
      ...formulario,
      dias_semana_atuacao: novosDias,
    });
  }

  const custoMensalCalculado =
    Number(formulario.custo_diario || 0) *
    formulario.dias_semana_atuacao.length *
    4.33;

  useEffect(() => {
    if (obra?.id_obra) {
      buscarEquipes();
    }
  }, [obra?.id_obra]);

  async function buscarEquipes() {
    try {
      setCarregando(true);
      setErro("");

      const dados =
        await requisitarEquipes(
          `/?idobra=${obra.id_obra}`
        );

      let lista = [];

      if (Array.isArray(dados)) {
        lista = dados;
      } else if (Array.isArray(dados?.equipes)) {
        lista = dados.equipes;
      } else if (Array.isArray(dados?.dados)) {
        lista = dados.dados;
      } else if (Array.isArray(dados?.resultado)) {
        lista = dados.resultado;
      }

      setEquipes(lista);
    } catch (erro) {
      console.error(
        "Erro ao buscar equipes:",
        erro
      );

      setErro(
        erro.message ||
          "Não foi possível carregar as equipes."
      );
    } finally {
      setCarregando(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setFormulario({
      ...formulario,
      [name]: value,
    });
  }

  function limparFormulario() {
    setFormulario({
      nome_equipe: "",
      etapa_atuacao: "",
      quantidade_profissionais: "",
      custo_diario: "",
      custo_mensal: "",
      dias_semana_atuacao: [],
    });
  }

  function abrirCadastro() {
    setEquipeEditando(null);
    limparFormulario();
    setErro("");
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setEquipeEditando(null);
    limparFormulario();
  }

  async function salvarEquipe(event) {
    event.preventDefault();

    try {
      setSalvando(true);
      setErro("");

      if (
        formulario.dias_semana_atuacao.length === 0
      ) {
        throw new Error(
          "Selecione pelo menos um dia de atuação."
        );
      }

      const custoDiario =
        Number(formulario.custo_diario);

      const custoMensal =
        custoDiario *
        formulario.dias_semana_atuacao.length *
        4.33;

      const dadosEquipe = {
        nome_equipe:
          formulario.nome_equipe.trim(),

        etapa_atuacao:
          formulario.etapa_atuacao,

        quantidade_profissionais:
          Number(
            formulario.quantidade_profissionais
          ),

        custo_diario:
          custoDiario,

        custo_mensal:
          Number(custoMensal.toFixed(2)),

        idobra:
          obra.id_obra,
      };

      if (!dadosEquipe.nome_equipe) {
        throw new Error(
          "Informe o nome da equipe."
        );
      }

      if (
        dadosEquipe.quantidade_profissionais <= 0
      ) {
        throw new Error(
          "A quantidade de profissionais deve ser maior que zero."
        );
      }

      if (
        dadosEquipe.custo_diario < 0 ||
        dadosEquipe.custo_mensal < 0
      ) {
        throw new Error(
          "Os custos não podem ser negativos."
        );
      }

      if (equipeEditando) {
        const id =
          obterIdEquipe(equipeEditando);

        if (!id) {
          throw new Error(
            "Não foi possível identificar o ID da equipe."
          );
        }

        await requisitarEquipes(
          `/insert/${id}`,
          {
            method: "PUT",
            body:
              JSON.stringify(dadosEquipe),
          }
        );
      } else {
        await requisitarEquipes(
          "/insert",
          {
            method: "POST",
            body:
              JSON.stringify(dadosEquipe),
          }
        );
      }

      fecharModal();
      await buscarEquipes();
    } catch (erro) {
      console.error(
        "Erro ao salvar equipe:",
        erro
      );

      setErro(
        erro.message ||
          "Não foi possível salvar a equipe."
      );
    } finally {
      setSalvando(false);
    }
  }

  function editarEquipe(equipe) {
    setEquipeEditando(equipe);

    setFormulario({
      nome_equipe:
        equipe.nome_equipe || "",
      etapa_atuacao:
        equipe.etapa_atuacao || "",
      quantidade_profissionais:
        equipe.quantidade_profissionais ?? "",
      custo_diario:
        equipe.custo_diario ?? "",
      custo_mensal:
        equipe.custo_mensal ?? "",
      dias_semana_atuacao: [],
    });

    setErro("");
    setModalAberto(true);
  }

  async function excluirEquipe(equipe) {
    const confirmar =
      window.confirm(
        `Deseja realmente excluir "${equipe.nome_equipe}"?`
      );

    if (!confirmar) {
      return;
    }

    try {
      setErro("");

      const id = obterIdEquipe(equipe);

      if (!id) {
        throw new Error(
          "Não foi possível identificar o ID da equipe."
        );
      }

      await requisitarEquipes(
        `/del/${id}`,
        {
          method: "DELETE",
        }
      );

      await buscarEquipes();
    } catch (erro) {
      console.error(
        "Erro ao excluir equipe:",
        erro
      );

      setErro(
        erro.message ||
          "Não foi possível excluir a equipe."
      );
    }
  }

  const totalProfissionais =
    equipes.reduce(
      (total, equipe) =>
        total +
        Number(
          equipe.quantidade_profissionais || 0
        ),
      0
    );

  const custoDiarioTotal =
    equipes.reduce(
      (total, equipe) =>
        total +
        Number(equipe.custo_diario || 0),
      0
    );

  const custoMensalTotal =
    equipes.reduce(
      (total, equipe) =>
        total +
        Number(equipe.custo_mensal || 0),
      0
    );

  return (
    <div>
      <div className="titulo-aba">
        <div>
          <span className="section-label">
            RECURSOS HUMANOS
          </span>

          <h2>
            Equipes Terceirizadas
          </h2>

          <p>
            Controle as equipes contratadas
            para esta obra.
          </p>
        </div>

        <button
          type="button"
          className="button"
          onClick={abrirCadastro}
        >
          + Cadastrar Equipe
        </button>
      </div>

      {erro && (
        <div className="auth-error">
          {erro}
        </div>
      )}

      <div className="cards-resumo">
        <div className="card-resumo">
          <span>
            Equipes cadastradas
          </span>
          <strong>
            {equipes.length}
          </strong>
        </div>

        <div className="card-resumo">
          <span>
            Profissionais
          </span>
          <strong>
            {totalProfissionais}
          </strong>
        </div>

        <div className="card-resumo">
          <span>
            Custo diário
          </span>
          <strong>
            {formatarReal(custoDiarioTotal)}
          </strong>
        </div>

        <div className="card-resumo">
          <span>
            Custo mensal
          </span>
          <strong>
            {formatarReal(custoMensalTotal)}
          </strong>
        </div>
      </div>

      <div
        className="tabela-container"
        style={{ marginTop: "25px" }}
      >
        <table>
          <thead>
            <tr>
              <th>Equipe</th>
              <th>Etapa</th>
              <th>Profissionais</th>
              <th>Custo diário</th>
              <th>Custo mensal</th>
              <th>Ações</th>
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
            ) : equipes.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="tabela-vazia"
                >
                  Nenhuma equipe cadastrada.
                </td>
              </tr>
            ) : (
              equipes.map((equipe) => {
                const id = obterIdEquipe(equipe);

                return (
                  <tr
                    key={
                      id ||
                      `${equipe.nome_equipe}-${equipe.idobra}`
                    }
                  >
                    <td>
                      {equipe.nome_equipe}
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
                      {formatarReal(
                        equipe.custo_mensal
                      )}
                    </td>

                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                        }}
                      >
                        <button
                          type="button"
                          className="button"
                          onClick={() =>
                            editarEquipe(equipe)
                          }
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="cancel-button"
                          onClick={() =>
                            excluirEquipe(equipe)
                          }
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <div className="modal-overlay">
          <div className="modal-container modal-obra">
            <div className="modal-header">
              <div>
                <span className="section-label">
                  EQUIPE TERCEIRIZADA
                </span>

                <h2>
                  {equipeEditando
                    ? "Editar equipe"
                    : "Cadastrar equipe"}
                </h2>

                <p>
                  {obra.obra}
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={fecharModal}
              >
                ×
              </button>
            </div>

            <form
              className="obra-form"
              onSubmit={salvarEquipe}
            >
              <div className="form-group">
                <label>
                  Nome da equipe
                </label>

                <input
                  type="text"
                  name="nome_equipe"
                  placeholder="Ex: Equipe Alfa"
                  value={formulario.nome_equipe}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Etapa de atuação
                </label>

                <select
                  name="etapa_atuacao"
                  value={formulario.etapa_atuacao}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Selecione a etapa
                  </option>
                  <option value="Mobilização">
                    Mobilização
                  </option>
                  <option value="Infraestrutura">
                    Infraestrutura
                  </option>
                  <option value="Supraestrutura e alvenaria">
                    Supraestrutura e alvenaria
                  </option>
                  <option value="Instalações">
                    Instalações
                  </option>
                  <option value="Revestimentos">
                    Revestimentos
                  </option>
                  <option value="Acabamento">
                    Acabamento
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  Quantidade de profissionais
                </label>

                <input
                  type="number"
                  name="quantidade_profissionais"
                  min="1"
                  step="1"
                  placeholder="Ex: 8"
                  value={
                    formulario.quantidade_profissionais
                  }
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Custo diário
                </label>

                <input
                  type="number"
                  name="custo_diario"
                  min="0"
                  step="0.01"
                  placeholder="Ex: 1200"
                  value={formulario.custo_diario}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Dias de atuação na semana
                </label>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                    marginTop: "8px",
                  }}
                >
                  {diasDisponiveis.map((dia) => {
                    const marcado =
                      formulario.dias_semana_atuacao.includes(
                        dia.valor
                      );

                    return (
                      <label
                        key={dia.valor}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "8px 12px",
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={marcado}
                          onChange={() =>
                            alterarDia(dia.valor)
                          }
                        />

                        {dia.nome}
                      </label>
                    );
                  })}
                </div>

                {equipeEditando &&
                  formulario.dias_semana_atuacao.length === 0 && (
                    <small
                      style={{
                        display: "block",
                        marginTop: "8px",
                      }}
                    >
                      Os dias não ficam salvos no banco.
                      Selecione novamente os dias para
                      recalcular o custo mensal.
                    </small>
                  )}
              </div>

              <div className="form-group">
                <label>
                  Custo mensal calculado
                </label>

                <input
                  type="text"
                  value={formatarReal(
                    custoMensalCalculado
                  )}
                  readOnly
                />

                <small
                  style={{
                    display: "block",
                    marginTop: "8px",
                  }}
                >
                  Cálculo: custo diário × dias por
                  semana × 4,33 semanas.
                </small>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={fecharModal}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="button"
                  disabled={salvando}
                >
                  {salvando
                    ? "Salvando..."
                    : equipeEditando
                      ? "Salvar alterações"
                      : "Cadastrar equipe"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================================
// INSUMOS - INTEGRADO AO BACKEND
// =====================================================

function Insumos({
  obra,
  insumos,
  setInsumos,
}) {
  const [modalAberto, setModalAberto] =
    useState(false);

  const [
    insumoEditando,
    setInsumoEditando,
  ] = useState(null);

  const [
    carregando,
    setCarregando,
  ] = useState(false);

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [erro, setErro] =
    useState("");

  const [formulario, setFormulario] =
    useState({
      nome: "",
      quantidade_disponivel: "",
      valor_unitario: "",
    });

  // ===============================================
  // BUSCAR DO MYSQL
  // ===============================================

  useEffect(() => {
    if (obra?.id_obra) {
      buscarInsumos();
    }
  }, [obra?.id_obra]);

  async function buscarInsumos() {
    try {
      setCarregando(true);
      setErro("");

      const dados =
        await requisitarInsumos(
          `/?idobra=${obra.id_obra}`
        );

      console.log(
        "Insumos retornados:",
        dados
      );

      let lista = [];

      if (Array.isArray(dados)) {
        lista = dados;
      } else if (
        Array.isArray(
          dados?.insumos
        )
      ) {
        lista =
          dados.insumos;
      } else if (
        Array.isArray(
          dados?.dados
        )
      ) {
        lista =
          dados.dados;
      } else if (
        Array.isArray(
          dados?.resultado
        )
      ) {
        lista =
          dados.resultado;
      }

      const insumosDaObra =
        lista.filter(
          (insumo) =>
            String(
              insumo.idobra
            ) ===
            String(
              obra.id_obra
            )
        );

      setInsumos(
        insumosDaObra
      );

    } catch (erro) {
      console.error(
        "Erro ao buscar insumos:",
        erro
      );

      setErro(
        erro.message ||
          "Não foi possível carregar os insumos."
      );

    } finally {
      setCarregando(false);
    }
  }

  function handleChange(event) {
    const { name, value } =
      event.target;

    setFormulario({
      ...formulario,
      [name]: value,
    });
  }

  function abrirCadastro() {
    setInsumoEditando(null);

    setFormulario({
      nome: "",
      quantidade_disponivel: "",
      valor_unitario: "",
    });

    setErro("");

    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);

    setInsumoEditando(null);

    setFormulario({
      nome: "",
      quantidade_disponivel: "",
      valor_unitario: "",
    });
  }

  // ===============================================
  // POST / PUT
  // ===============================================

  async function salvarInsumo(event) {
    event.preventDefault();

    try {
      setSalvando(true);
      setErro("");

      const dadosInsumo = {
        nome:
          formulario.nome.trim(),

        quantidade_disponivel:
          Number(
            formulario
              .quantidade_disponivel
          ),

        valor_unitario:
          Number(
            formulario
              .valor_unitario
          ),

        idobra:
          obra.id_obra,
      };

      if (!dadosInsumo.nome) {
        throw new Error(
          "Informe o nome do material."
        );
      }

      if (
        dadosInsumo
          .quantidade_disponivel <
        0
      ) {
        throw new Error(
          "A quantidade não pode ser negativa."
        );
      }

      if (
        dadosInsumo.valor_unitario <
        0
      ) {
        throw new Error(
          "O valor unitário não pode ser negativo."
        );
      }

      if (insumoEditando) {

        const id =
          obterIdInsumo(
            insumoEditando
          );

        if (!id) {
          throw new Error(
            "Não foi possível identificar o ID do insumo."
          );
        }

        await requisitarInsumos(
          `/insert/${id}`,
          {
            method: "PUT",

            body:
              JSON.stringify(
                dadosInsumo
              ),
          }
        );

      } else {

        await requisitarInsumos(
          "/insert",
          {
            method: "POST",

            body:
              JSON.stringify(
                dadosInsumo
              ),
          }
        );

      }

      fecharModal();

      await buscarInsumos();

    } catch (erro) {
      console.error(
        "Erro ao salvar insumo:",
        erro
      );

      setErro(
        erro.message ||
          "Não foi possível salvar o insumo."
      );

    } finally {
      setSalvando(false);
    }
  }

  // ===============================================
  // EDITAR
  // ===============================================

  function editarInsumo(
    insumo
  ) {
    setInsumoEditando(
      insumo
    );

    setFormulario({
      nome:
        insumo.nome || "",

      quantidade_disponivel:
        insumo
          .quantidade_disponivel ??
        "",

      valor_unitario:
        insumo
          .valor_unitario ??
        "",
    });

    setErro("");

    setModalAberto(true);
  }

  // ===============================================
  // DELETE
  // ===============================================

  async function excluirInsumo(
    insumo
  ) {
    const confirmar =
      window.confirm(
        `Deseja realmente excluir "${insumo.nome}"?`
      );

    if (!confirmar) {
      return;
    }

    try {
      setErro("");

      const id =
        obterIdInsumo(
          insumo
        );

      if (!id) {
        throw new Error(
          "Não foi possível identificar o ID do insumo."
        );
      }

      await requisitarInsumos(
        `/del/${id}`,
        {
          method:
            "DELETE",
        }
      );

      await buscarInsumos();

    } catch (erro) {
      console.error(
        "Erro ao excluir insumo:",
        erro
      );

      setErro(
        erro.message ||
          "Não foi possível excluir o insumo."
      );
    }
  }

  // ===============================================
  // CÁLCULOS
  // ===============================================

  const quantidadeTotal =
    insumos.reduce(
      (total, insumo) =>
        total +
        Number(
          insumo
            .quantidade_disponivel ||
            0
        ),
      0
    );

  const valorTotalEstoque =
    insumos.reduce(
      (total, insumo) =>
        total +
        Number(
          insumo
            .quantidade_disponivel ||
            0
        ) *
          Number(
            insumo
              .valor_unitario ||
              0
          ),
      0
    );

  return (
    <div>

      <div className="titulo-aba">

        <div>

          <span className="section-label">
            MATERIAIS
          </span>

          <h2>
            Materiais e Insumos
          </h2>

          <p>
            Controle os materiais
            utilizados em {obra.obra}.
          </p>

        </div>

        <button
          type="button"
          className="button"
          onClick={abrirCadastro}
        >
          + Cadastrar Insumo
        </button>

      </div>

      {erro && (
        <div className="auth-error">
          {erro}
        </div>
      )}

      <div className="cards-resumo">

        <div className="card-resumo">

          <span>
            Tipos de insumos
          </span>

          <strong>
            {insumos.length}
          </strong>

        </div>

        <div className="card-resumo">

          <span>
            Quantidade disponível
          </span>

          <strong>
            {quantidadeTotal}
          </strong>

        </div>

        <div className="card-resumo">

          <span>
            Valor do estoque
          </span>

          <strong>
            {formatarReal(
              valorTotalEstoque
            )}
          </strong>

        </div>

      </div>

      <div
        className="tabela-container"
        style={{
          marginTop: "25px",
        }}
      >

        <table>

          <thead>

            <tr>

              <th>
                Material
              </th>

              <th>
                Quantidade disponível
              </th>

              <th>
                Valor unitário
              </th>

              <th>
                Valor total
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
                  colSpan="5"
                  className="tabela-vazia"
                >
                  Carregando insumos...
                </td>

              </tr>

            ) : insumos.length === 0 ? (

              <tr>

                <td
                  colSpan="5"
                  className="tabela-vazia"
                >
                  Nenhum insumo cadastrado
                  nesta obra.
                </td>

              </tr>

            ) : (

              insumos.map(
                (insumo) => {

                  const id =
                    obterIdInsumo(
                      insumo
                    );

                  return (
                    <tr
                      key={
                        id ||
                        `${insumo.nome}-${insumo.idobra}`
                      }
                    >

                      <td>
                        {insumo.nome}
                      </td>

                      <td>
                        {
                          insumo
                            .quantidade_disponivel
                        }
                      </td>

                      <td>
                        {formatarReal(
                          insumo
                            .valor_unitario
                        )}
                      </td>

                      <td>
                        {formatarReal(
                          Number(
                            insumo
                              .quantidade_disponivel ||
                              0
                          ) *
                            Number(
                              insumo
                                .valor_unitario ||
                                0
                            )
                        )}
                      </td>

                      <td>

                        <div
                          style={{
                            display:
                              "flex",
                            gap:
                              "8px",
                          }}
                        >

                          <button
                            type="button"
                            className="button"
                            onClick={() =>
                              editarInsumo(
                                insumo
                              )
                            }
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className="cancel-button"
                            onClick={() =>
                              excluirInsumo(
                                insumo
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

      {/* MODAL INSUMO */}

      {modalAberto && (

        <div className="modal-overlay">

          <div className="modal-container modal-obra">

            <div className="modal-header">

              <div>

                <span className="section-label">
                  MATERIAL / INSUMO
                </span>

                <h2>
                  {insumoEditando
                    ? "Editar insumo"
                    : "Cadastrar insumo"}
                </h2>

                <p>
                  {obra.obra}
                </p>

              </div>

              <button
                type="button"
                className="modal-close"
                onClick={fecharModal}
              >
                ×
              </button>

            </div>

            <form
              className="obra-form"
              onSubmit={salvarInsumo}
            >

              <div className="form-group">

                <label>
                  Nome do material
                </label>

                <input
                  type="text"
                  name="nome"
                  placeholder="Ex: Cimento CP-II"
                  value={
                    formulario.nome
                  }
                  onChange={handleChange}
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Quantidade disponível
                </label>

                <input
                  type="number"
                  name="quantidade_disponivel"
                  min="0"
                  step="1"
                  placeholder="Ex: 100"
                  value={
                    formulario
                      .quantidade_disponivel
                  }
                  onChange={handleChange}
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Valor unitário
                </label>

                <input
                  type="number"
                  name="valor_unitario"
                  min="0"
                  step="0.01"
                  placeholder="Ex: 38.90"
                  value={
                    formulario
                      .valor_unitario
                  }
                  onChange={handleChange}
                  required
                />

              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={fecharModal}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="button"
                  disabled={salvando}
                >
                  {salvando
                    ? "Salvando..."
                    : insumoEditando
                      ? "Salvar alterações"
                      : "Cadastrar insumo"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

// =====================================================
// MAQUINÁRIOS - INTEGRADO AO BACKEND
// =====================================================

function Maquinarios({
  obra,
  maquinarios,
  setMaquinarios,
}) {
  const [modalAberto, setModalAberto] =
    useState(false);

  const [
    maquinarioEditando,
    setMaquinarioEditando,
  ] = useState(null);

  const [
    carregando,
    setCarregando,
  ] = useState(false);

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [erro, setErro] =
    useState("");

  const [formulario, setFormulario] =
    useState({
      nome: "",
      quantidade: "",
      etapa_atuacao: "",
      custo_diario: "",
      status: "",
    });

  // =====================================================
  // BUSCAR MAQUINÁRIOS DA OBRA
  // =====================================================

  useEffect(() => {
    if (obra?.id_obra) {
      buscarMaquinarios();
    }
  }, [obra?.id_obra]);

  async function buscarMaquinarios() {
    try {
      setCarregando(true);
      setErro("");

      const dados =
        await requisitarMaquinarios(
          `/?idobra=${obra.id_obra}`
        );

      let lista = [];

      if (Array.isArray(dados)) {
        lista = dados;
      } else if (
        Array.isArray(dados?.maquinarios)
      ) {
        lista = dados.maquinarios;
      } else if (
        Array.isArray(dados?.dados)
      ) {
        lista = dados.dados;
      } else if (
        Array.isArray(dados?.resultado)
      ) {
        lista = dados.resultado;
      }

      // Mantém aliases usados em outras partes do ObraDetalhes
      // sem alterar o backend.
      const listaNormalizada =
        lista.map((item) => ({
          ...item,

          id_maquinario:
            item.id_maquina ??
            item.id_maquinario,

          custo_diario_maquinario:
            item.custo_diario ??
            item.custo_diario_maquinario ??
            0,
        }));

      setMaquinarios(
        listaNormalizada
      );

    } catch (erro) {
      console.error(
        "Erro ao buscar maquinários:",
        erro
      );

      setErro(
        erro.message ||
          "Não foi possível carregar os maquinários."
      );

    } finally {
      setCarregando(false);
    }
  }

  function handleChange(event) {
    const { name, value } =
      event.target;

    setFormulario({
      ...formulario,
      [name]: value,
    });
  }

  function abrirCadastro() {
    setMaquinarioEditando(null);

    setFormulario({
      nome: "",
      quantidade: "",
      etapa_atuacao: "",
      custo_diario: "",
      status: "",
    });

    setErro("");
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setMaquinarioEditando(null);

    setFormulario({
      nome: "",
      quantidade: "",
      etapa_atuacao: "",
      custo_diario: "",
      status: "",
    });
  }

  // =====================================================
  // CADASTRAR / ATUALIZAR
  // =====================================================

  async function salvarMaquinario(event) {
    event.preventDefault();

    try {
      setSalvando(true);
      setErro("");

      const dadosMaquinario = {
        nome:
          formulario.nome.trim(),

        quantidade:
          Number(
            formulario.quantidade
          ),

        etapa_atuacao:
          formulario.etapa_atuacao,

        custo_diario:
          Number(
            formulario.custo_diario
          ),

        status:
          formulario.status,

        idobra:
          obra.id_obra,
      };

      if (!dadosMaquinario.nome) {
        throw new Error(
          "Informe o nome do equipamento."
        );
      }

      if (
        dadosMaquinario.quantidade <= 0
      ) {
        throw new Error(
          "A quantidade deve ser maior que zero."
        );
      }

      if (
        dadosMaquinario.custo_diario < 0
      ) {
        throw new Error(
          "O custo diário não pode ser negativo."
        );
      }

      if (maquinarioEditando) {
        const id =
          obterIdMaquinario(
            maquinarioEditando
          );

        if (!id) {
          throw new Error(
            "Não foi possível identificar o ID do maquinário."
          );
        }

        // Seu backend usa PUT /insert/:id
        await requisitarMaquinarios(
          `/insert/${id}`,
          {
            method: "PUT",

            body:
              JSON.stringify(
                dadosMaquinario
              ),
          }
        );

      } else {

        await requisitarMaquinarios(
          "/insert",
          {
            method: "POST",

            body:
              JSON.stringify(
                dadosMaquinario
              ),
          }
        );
      }

      fecharModal();

      await buscarMaquinarios();

    } catch (erro) {
      console.error(
        "Erro ao salvar maquinário:",
        erro
      );

      setErro(
        erro.message ||
          "Não foi possível salvar o maquinário."
      );

    } finally {
      setSalvando(false);
    }
  }

  function editarMaquinario(item) {
    setMaquinarioEditando(item);

    setFormulario({
      nome:
        item.nome || "",

      quantidade:
        item.quantidade ?? "",

      etapa_atuacao:
        item.etapa_atuacao || "",

      custo_diario:
        item.custo_diario ??
        item.custo_diario_maquinario ??
        "",

      status:
        item.status || "",
    });

    setErro("");
    setModalAberto(true);
  }

  // =====================================================
  // EXCLUIR
  // =====================================================

  async function excluirMaquinario(item) {
    const confirmar =
      window.confirm(
        `Deseja realmente excluir "${item.nome}"?`
      );

    if (!confirmar) {
      return;
    }

    try {
      setErro("");

      const id =
        obterIdMaquinario(item);

      if (!id) {
        throw new Error(
          "Não foi possível identificar o ID do maquinário."
        );
      }

      await requisitarMaquinarios(
        `/del/${id}`,
        {
          method: "DELETE",
        }
      );

      await buscarMaquinarios();

    } catch (erro) {
      console.error(
        "Erro ao excluir maquinário:",
        erro
      );

      setErro(
        erro.message ||
          "Não foi possível excluir o maquinário."
      );
    }
  }

  const ativos =
    maquinarios.filter(
      (item) =>
        item.status === "Ativo"
    ).length;

  const custoDiario =
    maquinarios.reduce(
      (total, item) =>
        total +
        Number(
          item.quantidade || 0
        ) *
          Number(
            item.custo_diario ??
            item.custo_diario_maquinario ??
            0
          ),
      0
    );

  return (
    <div>

      <div className="titulo-aba">

        <div>

          <span className="section-label">
            EQUIPAMENTOS
          </span>

          <h2>
            Maquinários e Equipamentos
          </h2>

          <p>
            Controle os equipamentos
            utilizados nesta obra.
          </p>

        </div>

        <button
          type="button"
          className="button"
          onClick={abrirCadastro}
        >
          + Cadastrar Maquinário
        </button>

      </div>

      {erro && (
        <div className="auth-error">
          {erro}
        </div>
      )}

      <div className="cards-resumo">

        <div className="card-resumo">

          <span>
            Maquinários cadastrados
          </span>

          <strong>
            {maquinarios.length}
          </strong>

        </div>

        <div className="card-resumo">

          <span>
            Ativos
          </span>

          <strong>
            {ativos}
          </strong>

        </div>

        <div className="card-resumo">

          <span>
            Custo diário
          </span>

          <strong>
            {formatarReal(
              custoDiario
            )}
          </strong>

        </div>

      </div>

      <div
        className="tabela-container"
        style={{
          marginTop: "25px",
        }}
      >

        <table>

          <thead>

            <tr>

              <th>
                Equipamento
              </th>

              <th>
                Quantidade
              </th>

              <th>
                Etapa de atuação
              </th>

              <th>
                Custo unidade/dia
              </th>

              <th>
                Custo total/dia
              </th>

              <th>
                Status
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
                  colSpan="7"
                  className="tabela-vazia"
                >
                  Carregando maquinários...
                </td>

              </tr>

            ) : maquinarios.length === 0 ? (

              <tr>

                <td
                  colSpan="7"
                  className="tabela-vazia"
                >
                  Nenhum maquinário cadastrado.
                </td>

              </tr>

            ) : (

              maquinarios.map(
                (item) => {

                  const id =
                    obterIdMaquinario(
                      item
                    );

                  const custoUnitario =
                    Number(
                      item.custo_diario ??
                      item.custo_diario_maquinario ??
                      0
                    );

                  return (
                    <tr
                      key={
                        id ||
                        `${item.nome}-${item.idobra}`
                      }
                    >

                      <td>
                        {item.nome}
                      </td>

                      <td>
                        {item.quantidade}
                      </td>

                      <td>
                        {item.etapa_atuacao || "-"}
                      </td>

                      <td>
                        {formatarReal(
                          custoUnitario
                        )}
                      </td>

                      <td>
                        {formatarReal(
                          Number(
                            item.quantidade || 0
                          ) *
                            custoUnitario
                        )}
                      </td>

                      <td>
                        {item.status}
                      </td>

                      <td>

                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                          }}
                        >

                          <button
                            type="button"
                            className="button"
                            onClick={() =>
                              editarMaquinario(
                                item
                              )
                            }
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className="cancel-button"
                            onClick={() =>
                              excluirMaquinario(
                                item
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

      {/* MODAL MAQUINÁRIOS */}

      {modalAberto && (

        <div className="modal-overlay">

          <div className="modal-container modal-obra">

            <div className="modal-header">

              <div>

                <span className="section-label">
                  MAQUINÁRIO
                </span>

                <h2>
                  {maquinarioEditando
                    ? "Editar maquinário"
                    : "Cadastrar maquinário"}
                </h2>

                <p>
                  {obra.obra}
                </p>

              </div>

              <button
                type="button"
                className="modal-close"
                onClick={fecharModal}
              >
                ×
              </button>

            </div>

            <form
              className="obra-form"
              onSubmit={
                salvarMaquinario
              }
            >

              <div className="form-group">

                <label>
                  Nome do equipamento
                </label>

                <input
                  type="text"
                  name="nome"
                  placeholder="Ex: Betoneira"
                  value={
                    formulario.nome
                  }
                  onChange={handleChange}
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Quantidade
                </label>

                <input
                  type="number"
                  name="quantidade"
                  min="1"
                  value={
                    formulario.quantidade
                  }
                  onChange={handleChange}
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Etapa de atuação
                </label>

                <select
                  name="etapa_atuacao"
                  value={formulario.etapa_atuacao}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Selecione a etapa
                  </option>

                  <option value="Mobilização">
                    Mobilização
                  </option>

                  <option value="Infraestrutura">
                    Infraestrutura
                  </option>

                  <option value="Supraestrutura e alvenaria">
                    Supraestrutura e alvenaria
                  </option>

                  <option value="Instalações">
                    Instalações
                  </option>

                  <option value="Revestimentos">
                    Revestimentos
                  </option>

                  <option value="Acabamento">
                    Acabamento
                  </option>
                </select>

              </div>

              <div className="form-group">

                <label>
                  Custo diário por unidade
                </label>

                <input
                  type="number"
                  name="custo_diario"
                  min="0"
                  step="0.01"
                  value={
                    formulario.custo_diario
                  }
                  onChange={handleChange}
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
                  onChange={handleChange}
                  required
                >

                  <option value="">
                    Selecione
                  </option>

                  <option value="Ativo">
                    Ativo
                  </option>

                  <option value="Inativo">
                    Inativo
                  </option>

                </select>

              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={fecharModal}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="button"
                  disabled={salvando}
                >
                  {salvando
                    ? "Salvando..."
                    : maquinarioEditando
                      ? "Salvar alterações"
                      : "Cadastrar maquinário"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

// =====================================================
// INDICADORES
// =====================================================

function Indicadores({
  obra,
  equipes,
  insumos,
  maquinarios,
}) {
  const custoEquipes =
    equipes.reduce(
      (total, equipe) =>
        total +
        Number(
          equipe.custo_mensal || 0
        ),
      0
    );

  const valorInsumos =
    insumos.reduce(
      (total, insumo) =>
        total +
        Number(
          insumo
            .quantidade_disponivel ||
            0
        ) *
          Number(
            insumo
              .valor_unitario ||
              0
          ),
      0
    );

  const custoMaquinarios =
    maquinarios.reduce(
      (total, item) =>
        total +
        Number(
          item.quantidade ||
            0
        ) *
          Number(
            item
              .custo_diario_maquinario ||
              0
          ),
      0
    );

  const maquinariosAtivos =
    maquinarios.filter(
      (item) =>
        item.status === "Ativo"
    ).length;

  const maquinariosInativos =
    maquinarios.filter(
      (item) =>
        item.status === "Inativo"
    ).length;

  const equipesPorEtapa = {};

  equipes.forEach(
    (equipe) => {
      const etapa =
        equipe.etapa_atuacao ||
        "Não informado";

      if (
        !equipesPorEtapa[
          etapa
        ]
      ) {
        equipesPorEtapa[
          etapa
        ] = 0;
      }

      equipesPorEtapa[
        etapa
      ]++;
    }
  );

  const maiorQuantidadeEquipe =
    Math.max(
      ...Object.values(
        equipesPorEtapa
      ),
      1
    );

  const maiorValorInsumo =
    Math.max(
      ...insumos.map(
        (insumo) =>
          Number(
            insumo
              .quantidade_disponivel ||
              0
          ) *
          Number(
            insumo
              .valor_unitario ||
              0
          )
      ),
      1
    );

  return (
    <div>

      <div className="titulo-aba">

        <div>

          <span className="section-label">
            ANÁLISE
          </span>

          <h2>
            Indicadores
          </h2>

          <p>
            Informações consolidadas para
            auxiliar na tomada de decisão.
          </p>

        </div>

      </div>

      {/* CARDS */}

      <div className="cards-resumo">

        <div className="card-resumo">

          <span>
            Custo mensal das equipes
          </span>

          <strong>
            {formatarReal(
              custoEquipes
            )}
          </strong>

        </div>

        <div className="card-resumo">

          <span>
            Valor do estoque
          </span>

          <strong>
            {formatarReal(
              valorInsumos
            )}
          </strong>

        </div>

        <div className="card-resumo">

          <span>
            Maquinários / dia
          </span>

          <strong>
            {formatarReal(
              custoMaquinarios
            )}
          </strong>

        </div>

        <div className="card-resumo">

          <span>
            Orçamento da obra
          </span>

          <strong>
            {formatarReal(
              obra.orcamento_planejado
            )}
          </strong>

        </div>

      </div>

      {/* ÁREA DE GRÁFICOS */}

      <div className="area-graficos">

        {/* EQUIPES POR ETAPA */}

        <div className="card-grafico">

          <h3>
            Equipes por etapa
          </h3>

          <div
            style={{
              marginTop: "25px",
            }}
          >

            {Object.keys(
              equipesPorEtapa
            ).length === 0 ? (

              <p>
                Nenhuma equipe cadastrada.
              </p>

            ) : (

              Object.entries(
                equipesPorEtapa
              ).map(
                ([
                  etapa,
                  quantidade,
                ]) => (

                  <div
                    key={etapa}
                    style={{
                      marginBottom:
                        "18px",
                    }}
                  >

                    <div
                      style={{
                        display:
                          "flex",
                        justifyContent:
                          "space-between",
                        marginBottom:
                          "7px",
                      }}
                    >

                      <span>
                        {etapa}
                      </span>

                      <strong>
                        {quantidade}
                      </strong>

                    </div>

                    <div
                      className="progress-bar"
                    >

                      <div
                        className="progress-value"
                        style={{
                          width: `${
                            (quantidade /
                              maiorQuantidadeEquipe) *
                            100
                          }%`,
                        }}
                      />

                    </div>

                  </div>

                )
              )

            )}

          </div>

        </div>

        {/* MAQUINÁRIOS */}

        <div className="card-grafico">

          <h3>
            Situação dos maquinários
          </h3>

          <div
            className="cards-resumo"
            style={{
              marginTop: "25px",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
            }}
          >

            <div className="card-resumo">

              <span>
                Ativos
              </span>

              <strong>
                {maquinariosAtivos}
              </strong>

            </div>

            <div className="card-resumo">

              <span>
                Inativos
              </span>

              <strong>
                {maquinariosInativos}
              </strong>

            </div>

          </div>

        </div>

        {/* INSUMOS */}

        <div className="card-grafico">

          <h3>
            Valor por insumo
          </h3>

          <div
            style={{
              marginTop: "25px",
            }}
          >

            {insumos.length === 0 ? (

              <p>
                Nenhum insumo cadastrado.
              </p>

            ) : (

              insumos.map(
                (insumo) => {

                  const valor =
                    Number(
                      insumo
                        .quantidade_disponivel ||
                        0
                    ) *
                    Number(
                      insumo
                        .valor_unitario ||
                        0
                    );

                  return (
                    <div
                      key={
                        obterIdInsumo(
                          insumo
                        ) ||
                        insumo.nome
                      }
                      style={{
                        marginBottom:
                          "18px",
                      }}
                    >

                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          marginBottom:
                            "7px",
                        }}
                      >

                        <span>
                          {insumo.nome}
                        </span>

                        <strong>
                          {formatarReal(
                            valor
                          )}
                        </strong>

                      </div>

                      <div
                        className="progress-bar"
                      >

                        <div
                          className="progress-value"
                          style={{
                            width: `${
                              (valor /
                                maiorValorInsumo) *
                              100
                            }%`,
                          }}
                        />

                      </div>

                    </div>
                  );
                }
              )

            )}

          </div>

        </div>

        {/* RESUMO */}

        <div className="card-grafico">

          <h3>
            Resumo operacional
          </h3>

          <div
            style={{
              display: "grid",
              gap: "20px",
              marginTop: "25px",
            }}
          >

            <div>

              <span>
                Equipes terceirizadas
              </span>

              <h2>
                {equipes.length}
              </h2>

            </div>

            <div>

              <span>
                Tipos de insumos
              </span>

              <h2>
                {insumos.length}
              </h2>

            </div>

            <div>

              <span>
                Maquinários cadastrados
              </span>

              <h2>
                {maquinarios.length}
              </h2>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default ObraDetalhes;