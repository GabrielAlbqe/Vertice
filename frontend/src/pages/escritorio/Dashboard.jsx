import "./dashboardOverview.css";
import {
  useEffect,
  useState,
} from "react";

import Layout from "../../componentes/escritorio/Layout";
import Card from "../../componentes/escritorio/Card";
import Skeleton from "../../componentes/shared/Skeleton";

import {
  listarObras,
} from "../../api/obras.js";

import {
  buscarCatalogoRecursos,
} from "../../api/recursos.js";

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

function normalizarStatus(
  status
) {
  return String(
    status || ""
  )
    .trim()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
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
          "iniciada",
          "em andamento",
        ].includes(
          normalizarStatus(
            obra.status
          )
        )
    ).length;

  const paralisadas =
    obras.filter(
      (obra) => ["paralisada", "pausada"].includes(normalizarStatus(obra.status))
    ).length;

  const orcamentoTotal =
    obras.every(o => o.orcamento_planejado !== null && Number.isFinite(Number(o.orcamento_planejado))) ? obras.reduce(
      (total, obra) =>
        total +
        Number(
          obra.orcamento_planejado ||
          0
        ),
      0
    ) : null;

  const profissionais =
    equipes.every(e => e.quantidade_profissionais !== null && e.quantidade_profissionais !== undefined && Number.isFinite(Number(e.quantidade_profissionais))) ? equipes.reduce(
      (total, equipe) =>
        total +
        Number(
          equipe.quantidade_profissionais ||
          0
        ),
      0
    ) : "Não informado";

  return (
    <Layout
      onNavegar={
        onNavegar
      }
    >

      <div className="dashboard overview-page">

        <section className="dashboard-header">

          <div>

            <span className="dashboard-eyebrow">
              VISÃO GERAL
            </span>

            <h1>
              Dashboard
            </h1>

            <p>
              Obras, recursos e planejamento da construtora em um só lugar.
            </p>

          </div>

          <div className="dashboard-header-actions">

            <button
              type="button"
              className="secondary-button"
              disabled={carregando}
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
          <div className="auth-error" role="alert">
            {erro}
          </div>
        )}

        <section className="cards-grid dashboard-kpis" aria-label="Indicadores da construtora">
          {carregando ? <Skeleton label="Carregando indicadores da construtora…" rows={4} /> : [
            ["Total de obras", obras.length, "Cadastros da construtora", "obras"],

            ["Obras ativas", obrasAtivas, "Em execução", "obras"],


            ["Profissionais", profissionais, equipes.length + " equipes cadastradas", "equipes"],
            ["Orçamento", formatarReal(orcamentoTotal), "Planejado da construtora", "analytics-financeiro"]
          ].map(([title, value, description, destino]) => <Card key={title} title={title} value={erro ? "Não informado" : value} description={erro ? "Consulta indisponível" : description} onClick={() => onNavegar(destino)} />)}
        </section>


        {!carregando && !erro && obras.some(o => String(o.nome || o.obra || "").startsWith("[DEMO]")) && <p className="overview-demo" role="status"><strong>Dados de demonstração incluídos.</strong> Os totais também consideram as obras identificadas com [DEMO].</p>}
        <div className="overview-columns">
        <section className="dashboard-section overview-status">
          <div className="section-header"><div><span className="section-label">PORTFÓLIO</span><h2>Situação das obras</h2></div></div>
          {carregando || erro ? <p role="status">{carregando ? "Carregando situação das obras…" : "Consulta indisponível."}</p> : obras.length === 0 ? <p>Nenhuma obra cadastrada.</p> : <ul className="overview-status-list">{[
            ["Em andamento",obrasAtivas,"ativa"],
            ["Planejamento",obras.filter(o => normalizarStatus(o.status) === "planejamento").length,"planejamento"],
            ["Concluídas",obras.filter(o => normalizarStatus(o.status) === "concluida").length,"concluida"],
            ["Paralisadas ou pausadas",paralisadas,"paralisada"],
            ["Outros status",obras.filter(o => !["iniciada","em andamento","planejamento","concluida","paralisada","pausada"].includes(normalizarStatus(o.status))).length,"outros"]
          ].map(([nome,total,classe]) => <li key={nome}><div><span><i className={classe} aria-hidden="true" />{nome}</span><strong>{total}<small>{Math.round(total/obras.length*100)}%</small></strong></div><div className="overview-track" aria-hidden="true"><span className={classe} style={{width: total/obras.length*100+"%"}} /></div></li>)}</ul>}
          {!carregando && !erro && paralisadas > 0 && <p className="overview-caption">{paralisadas} {paralisadas === 1 ? "obra paralisada ou pausada para acompanhar." : "obras paralisadas ou pausadas para acompanhar."}</p>}
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
                {carregando ? "..." : erro ? "Não informado" : equipes.length}
              </strong>

              <small>
                {carregando || erro ? "Não informado" : profissionais} profissionais
              </small>

            </div>

            <div className="planning-card">

              <span>
                Insumos
              </span>

              <strong>
                {carregando ? "..." : erro ? "Não informado" : insumos.length}
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
                {carregando ? "..." : erro ? "Não informado" : maquinarios.length}
              </strong>

              <small>
                Registros encontrados
              </small>

            </div>

          </div>

        </section>


        </div>
        <section className="overview-shortcuts" aria-label="Análises da construtora">
          <button type="button" onClick={() => onNavegar("inteligencia-operacional")}><span className="section-label">ANÁLISE DE CAMPO</span><strong>Inteligência Operacional <span aria-hidden="true">↗</span></strong><p>Acompanhe padrões, ocorrências e tendências das obras.</p></button>
          <button type="button" onClick={() => onNavegar("analytics-financeiro")}><span className="section-label">PLANEJAMENTO E CUSTOS</span><strong>Análise financeira <span aria-hidden="true">↗</span></strong><p>Consulte indicadores financeiros e a evolução dos custos.</p></button>
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

            <table aria-label="Obras em acompanhamento">

              <thead>

                <tr>
                  <th scope="col">Obra</th>
                  <th scope="col">Status</th>
                  <th scope="col">Categoria</th>
                  <th scope="col">Orçamento</th>
                </tr>

              </thead>

              <tbody>

                {carregando || erro || obras.length ===
                0 ? (

                  <tr>

                    <td
                      colSpan="4"
                      className="tabela-vazia"
                    >
                      {carregando ? "Carregando obras…" : erro ? "Não foi possível concluir a consulta." : "Nenhuma obra cadastrada."}
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
                            <span className={"overview-badge " + (["paralisada","pausada"].includes(normalizarStatus(obra.status)) ? "paralisada" : ["iniciada","em andamento"].includes(normalizarStatus(obra.status)) ? "ativa" : normalizarStatus(obra.status) === "concluida" ? "concluida" : "outros")}>{obra.status || "Não informado"}</span>
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
