import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Layout from "../componentes/Layout";
import Card from "../componentes/Card";

import {
  extrairLista,
  requisicaoOpcional,
  requisitar,
} from "../api/api";

import {
  listarObras,
} from "../api/obras";

function formatarReal(valor) {
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

function Dashboard({
  onNavegar,
}) {
  const [
    usuario,
    setUsuario,
  ] = useState(null);

  const [
    obras,
    setObras,
  ] = useState([]);

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

  const [
    custos,
    setCustos,
  ] = useState([]);

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    erro,
    setErro,
  ] = useState("");

  useEffect(() => {
    carregarDashboard();
  }, []);

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

      const usuarioAtual =
        await requisitar(
          `/usuarios/${idUsuario}`
        );

      setUsuario(
        usuarioAtual?.usuario ||
          usuarioAtual
      );

      const idConstrutora =
        usuarioAtual?.idconstrutora ??
        usuarioAtual?.id_construtora ??
        localStorage.getItem(
          "idconstrutora"
        ) ??
        localStorage.getItem(
          "id_construtora"
        );

      if (!idConstrutora) {
        throw new Error(
          "Construtora do usuário não identificada."
        );
      }

      const listaObras =
        await listarObras(
          idConstrutora
        );

      setObras(
        listaObras
      );

      const pacotes =
        await Promise.all(
          listaObras.map(
            async (obra) => {
              const id =
                obra.id_obra;

              const [
                equipeResp,
                insumoResp,
                maquinaResp,
                custoResp,
              ] =
                await Promise.all([
                  requisicaoOpcional(
                    `/equipes-terceirizadas?id_obra=${id}`
                  ),

                  requisicaoOpcional(
                    `/insumos?idobra=${id}`
                  ),

                  requisicaoOpcional(
                    `/maquinarios?idobra=${id}`
                  ),

                  requisicaoOpcional(
                    `/custos-planejados?id_obra=${id}`
                  ),
                ]);

              return {
                equipes:
                  extrairLista(
                    equipeResp,
                    ["equipes"]
                  ),

                insumos:
                  extrairLista(
                    insumoResp,
                    ["insumos"]
                  ),

                maquinarios:
                  extrairLista(
                    maquinaResp,
                    ["maquinarios"]
                  ),

                custos:
                  extrairLista(
                    custoResp,
                    ["custos"]
                  ),
              };
            }
          )
        );

      setEquipes(
        pacotes.flatMap(
          (item) =>
            item.equipes
        )
      );

      setInsumos(
        pacotes.flatMap(
          (item) =>
            item.insumos
        )
      );

      setMaquinarios(
        pacotes.flatMap(
          (item) =>
            item.maquinarios
        )
      );

      setCustos(
        pacotes.flatMap(
          (item) =>
            item.custos
        )
      );
    } catch (
      erroCarregar
    ) {
      console.error(
        "Erro ao carregar dashboard:",
        erroCarregar
      );

      setErro(
        erroCarregar.message ||
          "Não foi possível carregar o dashboard."
      );
    } finally {
      setCarregando(false);
    }
  }

  const indicadores =
    useMemo(() => {
      const obrasAtivas =
        obras.filter(
          (obra) =>
            [
              "planejamento",
              "em andamento",
            ].includes(
              String(
                obra.status || ""
              )
                .trim()
                .toLowerCase()
            )
        ).length;

      const orcamento =
        obras.reduce(
          (total, obra) =>
            total +
            Number(
              obra
                .orcamento_planejado ||
                0
            ),
          0
        );

      const planejado =
        custos.reduce(
          (total, item) =>
            total +
            Number(
              item
                .valor_planejado ||
                0
            ),
          0
        );

      const estoque =
        insumos.reduce(
          (total, item) =>
            total +
            Number(
              item
                .quantidade_disponivel ||
                0
            ) *
              Number(
                item
                  .valor_unitario ||
                  0
              ),
          0
        );

      const maquinasAtivas =
        maquinarios.filter(
          (item) =>
            item.status ===
            "Ativo"
        ).length;

      return {
        obrasAtivas,
        orcamento,
        planejado,
        estoque,
        maquinasAtivas,
      };
    }, [
      obras,
      custos,
      insumos,
      maquinarios,
    ]);

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
              VISÃO GERAL
            </span>

            <h1>
              Dashboard
            </h1>

            <p>
              {usuario?.nome
                ? `Olá, ${usuario.nome}. Acompanhe o panorama das suas obras.`
                : "Acompanhe o panorama das suas obras."}
            </p>
          </div>

          <div className="dashboard-header-actions">
            <button
              className="button"
              type="button"
              onClick={() =>
                onNavegar(
                  "obras"
                )
              }
            >
              + Nova Obra
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
              carregando
                ? "..."
                : obras.length
            }
            description="Obras cadastradas"
          />

          <Card
            title="Obras ativas"
            value={
              carregando
                ? "..."
                : indicadores
                    .obrasAtivas
            }
            description="Planejamento ou andamento"
          />

          <Card
            title="Equipes"
            value={
              carregando
                ? "..."
                : equipes.length
            }
            description="Terceirizadas vinculadas"
          />

          <Card
            title="Orçamento"
            value={
              carregando
                ? "..."
                : formatarReal(
                    indicadores
                      .orcamento
                  )
            }
            description="Total planejado das obras"
          />

        </section>

        <div className="dashboard-grid">

          <section className="dashboard-section">

            <div className="section-header">

              <div>
                <span className="section-label">
                  PORTFÓLIO
                </span>

                <h2>
                  Obras
                </h2>

                <p>
                  Resumo das obras encontradas para a construtora.
                </p>
              </div>

              <button
                className="secondary-button"
                type="button"
                onClick={() =>
                  onNavegar(
                    "obras"
                  )
                }
              >
                Ver obras
              </button>

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
                      Orçamento
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {carregando ? (
                    <tr>
                      <td
                        colSpan="3"
                        className="tabela-vazia"
                      >
                        Carregando...
                      </td>
                    </tr>
                  ) : obras.length ===
                    0 ? (
                    <tr>
                      <td
                        colSpan="3"
                        className="tabela-vazia"
                      >
                        Nenhuma obra encontrada.
                      </td>
                    </tr>
                  ) : (
                    obras
                      .slice(0, 6)
                      .map(
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
                              {formatarReal(
                                obra
                                  .orcamento_planejado
                              )}
                            </td>
                          </tr>
                        )
                      )
                  )}

                </tbody>

              </table>

            </div>

          </section>

          <section className="dashboard-section">

            <div className="section-header">
              <div>
                <span className="section-label">
                  RECURSOS
                </span>

                <h2>
                  Resumo operacional
                </h2>
              </div>
            </div>

            <div className="resource-summary-grid">

              <div className="resource-summary-card">

                <span>
                  Maquinários ativos
                </span>

                <strong>
                  {
                    indicadores
                      .maquinasAtivas
                  }
                </strong>

                <p>
                  Total cadastrado
                </p>

                <b>
                  {
                    maquinarios.length
                  }
                </b>

              </div>

              <div className="resource-summary-card">

                <span>
                  Tipos de insumos
                </span>

                <strong>
                  {
                    insumos.length
                  }
                </strong>

                <p>
                  Valor do estoque
                </p>

                <b>
                  {formatarReal(
                    indicadores
                      .estoque
                  )}
                </b>

              </div>

            </div>

          </section>

        </div>

        <section className="dashboard-section">

          <div className="section-header">

            <div>
              <span className="section-label">
                FINANCEIRO
              </span>

              <h2>
                Planejamento financeiro
              </h2>
            </div>

          </div>

          <div className="financial-summary-grid">

            <div className="financial-summary-card">
              <span>
                Orçamento das obras
              </span>

              <strong>
                {formatarReal(
                  indicadores
                    .orcamento
                )}
              </strong>
            </div>

            <div className="financial-summary-card">
              <span>
                Custos planejados detalhados
              </span>

              <strong>
                {formatarReal(
                  indicadores
                    .planejado
                )}
              </strong>
            </div>

            <div className="financial-summary-card">
              <span>
                Saldo não detalhado
              </span>

              <strong>
                {formatarReal(
                  Math.max(
                    indicadores
                      .orcamento -
                      indicadores
                        .planejado,
                    0
                  )
                )}
              </strong>
            </div>

          </div>

        </section>

      </div>
    </Layout>
  );
}

export default Dashboard;