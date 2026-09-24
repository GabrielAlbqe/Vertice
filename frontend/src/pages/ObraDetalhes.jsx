import {
  useEffect,
  useState,
} from "react";

import Layout from "../componentes/Layout";

import {
  buscarRecursosDaObra,
  obterIdEquipe,
  obterIdInsumo,
  obterIdMaquinario,
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

function formatarData(
  data
) {
  if (!data) {
    return "-";
  }

  const limpa =
    String(data)
      .split("T")[0];

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

function ObraDetalhes({
  obra,
  onVoltar,
  onNavegar,
}) {
  const [
    abaAtiva,
    setAbaAtiva,
  ] = useState(
    "visao-geral"
  );

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
      "obra-detalhes"
    );
  }, []);

  useEffect(() => {
    if (
      obra?.id_obra
    ) {
      carregarRecursos();
    }
  }, [
    obra?.id_obra,
  ]);

  async function carregarRecursos() {
    try {
      setCarregando(
        true
      );

      setErro("");

      const dados =
        await buscarRecursosDaObra(
          obra.id_obra
        );

      setEquipes(
        Array.isArray(
          dados?.equipes
        )
          ? dados.equipes
          : []
      );

      setInsumos(
        Array.isArray(
          dados?.insumos
        )
          ? dados.insumos
          : []
      );

      setMaquinarios(
        Array.isArray(
          dados?.maquinarios
        )
          ? dados.maquinarios
          : []
      );
    } catch (error) {
      setErro(
        error?.message ||
        "Erro ao carregar recursos."
      );
    } finally {
      setCarregando(
        false
      );
    }
  }

  if (!obra) {
    return (
      <Layout
        onNavegar={
          onNavegar
        }
      >

        <div className="dashboard">

          <section className="dashboard-section">

            <h2>
              Nenhuma obra selecionada
            </h2>

            <button
              type="button"
              className="button"
              onClick={
                onVoltar
              }
            >
              Voltar para Obras
            </button>

          </section>

        </div>

      </Layout>
    );
  }

  const valorEstoque =
    insumos.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.quantidade_disponivel ??
          item.quantidade_lote ??
          0
        ) *
        Number(
          item.valor_unitario ??
          item.valor_lote ??
          0
        ),
      0
    );

  const custoEquipes =
    equipes.reduce(
      (
        total,
        equipe
      ) =>
        total +
        Number(
          equipe.custo_diario_total ??
          0
        ),
      0
    );

  const custoMaquinarios =
    maquinarios.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.quantidade ??
          0
        ) *
        Number(
          item.custo_diario ??
          item.custo_diario_maquinario ??
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

            <button
              type="button"
              className="botao-voltar"
              onClick={
                onVoltar
              }
            >
              ← Voltar para Obras
            </button>

            <span className="dashboard-eyebrow">
              OBRA
            </span>

            <h1>
              {obra.nome ||
                obra.obra ||
                "Obra"}
            </h1>

            <p>
              Acompanhe as informações
              e recursos desta obra.
            </p>

          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={
              carregarRecursos
            }
          >
            Atualizar
          </button>

        </section>

        {erro && (
          <div className="auth-error">
            {erro}
          </div>
        )}

        <section className="dashboard-section">

          <div className="abas-obra">

            <button
              type="button"
              className={
                abaAtiva ===
                "visao-geral"
                  ? "aba ativa"
                  : "aba"
              }
              onClick={() =>
                setAbaAtiva(
                  "visao-geral"
                )
              }
            >
              Visão Geral
            </button>

            <button
              type="button"
              className={
                abaAtiva ===
                "equipes"
                  ? "aba ativa"
                  : "aba"
              }
              onClick={() =>
                setAbaAtiva(
                  "equipes"
                )
              }
            >
              Equipes
            </button>

            <button
              type="button"
              className={
                abaAtiva ===
                "insumos"
                  ? "aba ativa"
                  : "aba"
              }
              onClick={() =>
                setAbaAtiva(
                  "insumos"
                )
              }
            >
              Materiais / Insumos
            </button>

            <button
              type="button"
              className={
                abaAtiva ===
                "maquinarios"
                  ? "aba ativa"
                  : "aba"
              }
              onClick={() =>
                setAbaAtiva(
                  "maquinarios"
                )
              }
            >
              Maquinários
            </button>

            <button
              type="button"
              className={
                abaAtiva ===
                "indicadores"
                  ? "aba ativa"
                  : "aba"
              }
              onClick={() =>
                setAbaAtiva(
                  "indicadores"
                )
              }
            >
              Indicadores
            </button>

          </div>

          {abaAtiva ===
            "visao-geral" && (

            <div>

              <div className="cards-resumo">

                <div className="card-resumo">

                  <span>
                    Status
                  </span>

                  <strong>
                    {obra.status ||
                      "-"}
                  </strong>

                </div>

                <div className="card-resumo">

                  <span>
                    Categoria
                  </span>

                  <strong>
                    {obra.categoria ||
                      "-"}
                  </strong>

                </div>

                <div className="card-resumo">

                  <span>
                    Pavimentos
                  </span>

                  <strong>
                    {obra.numero_pavimentos ??
                      obra.pavimentos ??
                      "-"}
                  </strong>

                </div>

                <div className="card-resumo">

                  <span>
                    Orçamento
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
                  marginTop:
                    "16px",
                }}
              >

                <div className="card-resumo">

                  <span>
                    Início
                  </span>

                  <strong>
                    {formatarData(
                      obra.data_inicio_planejada ??
                      obra.data_inicial_planejada
                    )}
                  </strong>

                </div>

                <div className="card-resumo">

                  <span>
                    Término
                  </span>

                  <strong>
                    {formatarData(
                      obra.data_termino_planejada ??
                      obra.data_final_planejada
                    )}
                  </strong>

                </div>

                <div className="card-resumo">

                  <span>
                    Equipes
                  </span>

                  <strong>
                    {equipes.length}
                  </strong>

                </div>

                <div className="card-resumo">

                  <span>
                    Maquinários
                  </span>

                  <strong>
                    {maquinarios.length}
                  </strong>

                </div>

              </div>

            </div>

          )}

          {abaAtiva ===
            "equipes" && (

            <div>

              <div className="titulo-aba">

                <div>

                  <span className="section-label">
                    RECURSOS HUMANOS
                  </span>

                  <h2>
                    Equipes atribuídas
                  </h2>

                  <p>
                    A atribuição das equipes
                    é realizada na página Obras.
                  </p>

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
                    </tr>

                  </thead>

                  <tbody>

                    {carregando ? (

                      <tr>
                        <td
                          colSpan="4"
                          className="tabela-vazia"
                        >
                          Carregando...
                        </td>
                      </tr>

                    ) : equipes.length ===
                      0 ? (

                      <tr>
                        <td
                          colSpan="4"
                          className="tabela-vazia"
                        >
                          Nenhuma equipe atribuída.
                        </td>
                      </tr>

                    ) : (

                      equipes.map(
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
                                  ? `detalhe-equipe-${id}`
                                  : `detalhe-equipe-${index}`
                              }
                            >

                              <td>
                                {equipe.nome_equipe ||
                                  "-"}
                              </td>

                              <td>
                                {equipe.area_atuacao ||
                                  "-"}
                              </td>

                              <td>
                                {equipe.quantidade_profissionais ??
                                  0}
                              </td>

                              <td>
                                {formatarReal(
                                  equipe.custo_diario_total
                                )}
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

          )}

          {abaAtiva ===
            "insumos" && (

            <div>

              <div className="titulo-aba">

                <div>

                  <span className="section-label">
                    MATERIAIS
                  </span>

                  <h2>
                    Materiais e insumos
                  </h2>

                </div>

              </div>

              <div className="tabela-container">

                <table>

                  <thead>

                    <tr>
                      <th>Insumo</th>
                      <th>Quantidade</th>
                      <th>Valor unitário</th>
                    </tr>

                  </thead>

                  <tbody>

                    {insumos.length ===
                    0 ? (

                      <tr>
                        <td
                          colSpan="3"
                          className="tabela-vazia"
                        >
                          Nenhum insumo cadastrado.
                        </td>
                      </tr>

                    ) : (

                      insumos.map(
                        (
                          item,
                          index
                        ) => {

                          const id =
                            obterIdInsumo(
                              item
                            );

                          return (

                            <tr
                              key={
                                id != null
                                  ? `insumo-${id}`
                                  : `insumo-${index}`
                              }
                            >

                              <td>
                                {item.nome ||
                                  "-"}
                              </td>

                              <td>
                                {item.quantidade_disponivel ??
                                  item.quantidade_lote ??
                                  0}
                              </td>

                              <td>
                                {formatarReal(
                                  item.valor_unitario ??
                                  item.valor_lote ??
                                  0
                                )}
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

          )}

          {abaAtiva ===
            "maquinarios" && (

            <div>

              <div className="titulo-aba">

                <div>

                  <span className="section-label">
                    EQUIPAMENTOS
                  </span>

                  <h2>
                    Maquinários
                  </h2>

                </div>

              </div>

              <div className="tabela-container">

                <table>

                  <thead>

                    <tr>
                      <th>Equipamento</th>
                      <th>Quantidade</th>
                      <th>Custo/dia</th>
                      <th>Status</th>
                    </tr>

                  </thead>

                  <tbody>

                    {maquinarios.length ===
                    0 ? (

                      <tr>
                        <td
                          colSpan="4"
                          className="tabela-vazia"
                        >
                          Nenhum maquinário cadastrado.
                        </td>
                      </tr>

                    ) : (

                      maquinarios.map(
                        (
                          item,
                          index
                        ) => {

                          const id =
                            obterIdMaquinario(
                              item
                            );

                          return (

                            <tr
                              key={
                                id != null
                                  ? `maquina-${id}`
                                  : `maquina-${index}`
                              }
                            >

                              <td>
                                {item.nome ||
                                  "-"}
                              </td>

                              <td>
                                {item.quantidade ??
                                  0}
                              </td>

                              <td>
                                {formatarReal(
                                  item.custo_diario ??
                                  item.custo_diario_maquinario ??
                                  0
                                )}
                              </td>

                              <td>
                                {item.status ||
                                  "-"}
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

          )}

          {abaAtiva ===
            "indicadores" && (

            <div>

              <div className="titulo-aba">

                <div>

                  <span className="section-label">
                    INDICADORES
                  </span>

                  <h2>
                    Resumo da obra
                  </h2>

                </div>

              </div>

              <div className="cards-resumo">

                <div className="card-resumo">

                  <span>
                    Custo diário equipes
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
                      valorEstoque
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
                    Orçamento
                  </span>

                  <strong>
                    {formatarReal(
                      obra.orcamento_planejado
                    )}
                  </strong>

                </div>

              </div>

            </div>

          )}

        </section>

      </div>

    </Layout>
  );
}

export default ObraDetalhes;