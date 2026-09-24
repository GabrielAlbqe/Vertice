import {
  useEffect,
  useState,
} from "react";

import Layout from "../componentes/Layout";
import Card from "../componentes/Card";

import {
  listarObras,
} from "../api/obras.js";

import {
  buscarCatalogoRecursos,
} from "../api/recursos.js";

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

function normalizarStatus(
  status
) {
  return String(
    status || ""
  )
    .trim()
    .toLowerCase();
}

function Dashboard({
  onNavegar,
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
    insumos,
    setInsumos,
  ] = useState([]);

  const [
    maquinarios,
    setMaquinarios,
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
    localStorage.setItem(
      "pagina_atual",
      "dashboard"
    );

    carregar();
  }, []);

  async function carregar() {
    try {
      setCarregando(
        true
      );

      setErro("");

      const idConstrutora =
        localStorage.getItem(
          "idconstrutora"
        ) ||
        localStorage.getItem(
          "id_construtora"
        );

      if (!idConstrutora) {
        throw new Error(
          "Construtora não identificada."
        );
      }

      const listaObras =
        await listarObras(
          idConstrutora
        );

      const validas =
        Array.isArray(
          listaObras
        )
          ? listaObras
          : [];

      setObras(
        validas
      );

      const recursos =
        await buscarCatalogoRecursos(
          validas
        );

      setEquipes(
        recursos?.equipes ??
        []
      );

      setInsumos(
        recursos?.insumos ??
        []
      );

      setMaquinarios(
        recursos?.maquinarios ??
        []
      );
    } catch (error) {
      setErro(
        error?.message ||
        "Erro ao carregar o Dashboard."
      );
    } finally {
      setCarregando(
        false
      );
    }
  }

  function abrirNovaObra() {
    localStorage.setItem(
      "abrir_cadastro_obra",
      "1"
    );

    onNavegar(
      "obras"
    );
  }

  const obrasAtivas =
    obras.filter(
      (obra) =>
        [
          "planejamento",
          "em andamento",
        ].includes(
          normalizarStatus(
            obra.status
          )
        )
    ).length;

  const paralisadas =
    obras.filter(
      (obra) =>
        normalizarStatus(
          obra.status
        ) ===
        "paralisada"
    ).length;

  const orcamentoTotal =
    obras.reduce(
      (total, obra) =>
        total +
        Number(
          obra.orcamento_planejado ||
          0
        ),
      0
    );

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
              Acompanhe as informações
              principais da construtora.
            </p>

          </div>

          <div className="dashboard-header-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={
                carregar
              }
            >
              Atualizar
            </button>

            <button
              type="button"
              className="button"
              onClick={
                abrirNovaObra
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
            title="Obras ativas"
            value={
              carregando
                ? "..."
                : obrasAtivas
            }
            description={`${obras.length} cadastradas`}
          />

          <Card
            title="Equipes"
            value={
              carregando
                ? "..."
                : equipes.length
            }
            description={`${profissionais} profissionais`}
          />

          <Card
            title="Orçamento"
            value={
              carregando
                ? "..."
                : formatarReal(
                    orcamentoTotal
                  )
            }
            description="Planejado"
          />

          <Card
            title="Paralisadas"
            value={
              carregando
                ? "..."
                : paralisadas
            }
            description="Necessitam atenção"
          />

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

          <div className="planning-grid">

            <div className="planning-card">

              <span>
                Equipes
              </span>

              <strong>
                {equipes.length}
              </strong>

              <small>
                {profissionais} profissionais
              </small>

            </div>

            <div className="planning-card">

              <span>
                Insumos
              </span>

              <strong>
                {insumos.length}
              </strong>

              <small>
                Tipos cadastrados
              </small>

            </div>

            <div className="planning-card">

              <span>
                Maquinários
              </span>

              <strong>
                {maquinarios.length}
              </strong>

              <small>
                Registros encontrados
              </small>

            </div>

          </div>

        </section>

        <section className="dashboard-section">

          <div className="section-header">

            <div>

              <span className="section-label">
                PORTFÓLIO
              </span>

              <h2>
                Obras em acompanhamento
              </h2>

            </div>

            <div className="section-actions">

              <button
                type="button"
                className="button"
                onClick={
                  abrirNovaObra
                }
              >
                + Nova obra
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  onNavegar(
                    "obras"
                  )
                }
              >
                Ver todas
              </button>

            </div>

          </div>

          <div className="dashboard-table">

            <table>

              <thead>

                <tr>
                  <th>Obra</th>
                  <th>Status</th>
                  <th>Categoria</th>
                  <th>Orçamento</th>
                </tr>

              </thead>

              <tbody>

                {obras.length ===
                0 ? (

                  <tr>

                    <td
                      colSpan="4"
                      className="tabela-vazia"
                    >
                      Nenhuma obra cadastrada.
                    </td>

                  </tr>

                ) : (

                  obras
                    .slice(
                      0,
                      6
                    )
                    .map(
                      (obra) => (

                        <tr
                          key={
                            `dash-obra-${obra.id_obra}`
                          }
                        >

                          <td>
                            {obra.nome ||
                              obra.obra ||
                              "-"}
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
                            {formatarReal(
                              obra.orcamento_planejado
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

      </div>

    </Layout>
  );
}

export default Dashboard;