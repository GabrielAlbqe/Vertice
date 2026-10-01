import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Layout from "../../componentes/escritorio/Layout";
import Card from "../../componentes/escritorio/Card";

import {
  requisitar,
} from "../../api/api.js";

import {
  listarObras,
} from "../../api/obras.js";

import {
  carregarAnalytics,
} from "../../api/analytics.js";

import {
  calcularAnalytics,
  normalizarAnalytics,
  ETAPAS,
  ORIGENS,
  FILTROS_VAZIOS,
  hojeLocal,
} from "../../api/analyticsCalculos.js";

// =====================================================
// FORMATAÇÕES
// =====================================================

const reais = (valor) =>
  valor === null ||
  !Number.isFinite(valor)
    ? "Indisponível"
    : valor.toLocaleString(
        "pt-BR",
        {
          style: "currency",
          currency: "BRL",
          maximumFractionDigits: 2,
        }
      );

const porcentagem = (valor) =>
  valor === null ||
  !Number.isFinite(valor)
    ? "Sem base de comparação"
    : `${valor.toLocaleString(
        "pt-BR",
        {
          maximumFractionDigits: 1,
        }
      )}%`;

const compacto = (valor) =>
  valor.toLocaleString(
    "pt-BR",
    {
      notation: "compact",
      maximumFractionDigits: 1,
    }
  );

const dataCurta = (data) =>
  new Date(
    `${data}T12:00:00`
  ).toLocaleDateString(
    "pt-BR",
    {
      month: "short",
      year: "2-digit",
    }
  );

const diferenca = (
  valor,
  percentual
) =>
  valor === null
    ? "Sem base de comparação"
    : valor === 0
      ? "Dentro do plano"
      : `${
          percentual === null
            ? ""
            : `${porcentagem(
                Math.abs(
                  percentual
                )
              )} `
        }${
          valor > 0
            ? "acima do plano"
            : "abaixo do plano · economia"
        }`;

// =====================================================
// DATAS
// =====================================================

function limparData(data) {
  if (!data) {
    return "";
  }

  return String(
    data
  ).split("T")[0];
}

function formatarData(data) {
  if (!data) {
    return "Não informada";
  }

  const limpa =
    limparData(data);

  const [
    ano,
    mes,
    dia,
  ] = limpa.split("-");

  if (
    !ano ||
    !mes ||
    !dia
  ) {
    return "Não informada";
  }

  return `${dia}/${mes}/${ano}`;
}

// =====================================================
// PERÍODO PADRÃO
// =====================================================

function criarPeriodoAnalise(
  obra
) {
  return {
    ...FILTROS_VAZIOS,

    // Começa automaticamente
    // na data cadastrada da obra
    inicio:
      limparData(
        obra?.data_inicio_planejada
      ),

    // Termina automaticamente
    // na data atual
    fim:
      hojeLocal(),
  };
}

// =====================================================
// GRÁFICO
// =====================================================

function Projecao({
  resultado,
}) {
  const {
    pontos,
    planejado,
  } =
    resultado;

  const largura = 800;
  const altura = 300;

  const esquerda = 72;
  const topo = 22;
  const direita = 24;
  const base = 250;

  const maximo =
    Math.max(
      1,

      planejado ||
        0,

      ...pontos.flatMap(
        (item) => [
          item.realizado ||
            0,

          item.projetado ||
            0,
        ]
      )
    ) * 1.12;

  const inicio =
    pontos.length
      ? Date.parse(
          pontos[0].data
        )
      : 0;

  const intervalo =
    pontos.length
      ? Math.max(
          1,

          Date.parse(
            pontos.at(-1)
              .data
          ) -
            inicio
        )
      : 1;

  const x = (data) =>
    esquerda +
    (
      (
        Date.parse(data) -
        inicio
      ) /
      intervalo
    ) *
      (
        largura -
        esquerda -
        direita
      );

  const y = (valor) =>
    base -
    (
      valor /
      maximo
    ) *
      (
        base -
        topo
      );

  const linha = (campo) =>
    pontos
      .filter(
        (item) =>
          item[campo] !==
          null
      )
      .map(
        (item) =>
          `${x(
            item.data
          )},${y(
            item[campo]
          )}`
      )
      .join(" ");

  return (
    <section className="dashboard-section analytics-projecao">
      <div className="analytics-section-heading">
        <div>
          <span className="section-label">
            EVOLUÇÃO FINANCEIRA
          </span>

          <h2>
            Projeção comparativa
          </h2>

          <p>
            Valores acumulados no
            recorte aplicado.
          </p>
        </div>

        <div className="analytics-legend">
          <span>
            <i className="analytics-dot realizado" />
            Realizado
          </span>

          <span>
            <i className="analytics-dot projetado" />
            Projetado
          </span>

          <span>
            <i className="analytics-dot planejado" />
            Planejado
          </span>
        </div>
      </div>

      <div className="analytics-projecao-grid">
        <div className="analytics-chart">

          {!pontos.length ? (
            <div className="analytics-empty">
              Sem lançamentos
              datados suficientes
              para exibir a
              evolução.
            </div>
          ) : (
            <>
              <svg
                viewBox={`0 0 ${largura} ${altura}`}
                role="img"
                aria-label="Evolução dos custos"
              >

                {[0, 1, 2, 3, 4].map(
                  (indice) => {
                    const valor =
                      (
                        maximo *
                        indice
                      ) /
                      4;

                    return (
                      <g
                        key={
                          indice
                        }
                      >
                        <line
                          x1={
                            esquerda
                          }
                          x2={
                            largura -
                            direita
                          }
                          y1={y(
                            valor
                          )}
                          y2={y(
                            valor
                          )}
                          className="analytics-gridline"
                        />

                        <text
                          x={
                            esquerda -
                            10
                          }
                          y={
                            y(
                              valor
                            ) +
                            4
                          }
                          textAnchor="end"
                        >
                          {compacto(
                            valor
                          )}
                        </text>
                      </g>
                    );
                  }
                )}

                <text
                  x={esquerda}
                  y={12}
                >
                  R$ acumulado
                </text>

                {planejado !==
                  null && (
                  <line
                    x1={
                      esquerda
                    }
                    x2={
                      largura -
                      direita
                    }
                    y1={y(
                      planejado
                    )}
                    y2={y(
                      planejado
                    )}
                    className="analytics-line-planejado"
                  />
                )}

                <polyline
                  points={linha(
                    "realizado"
                  )}
                  className="analytics-line-realizado"
                />

                <polyline
                  points={linha(
                    "projetado"
                  )}
                  className="analytics-line-projetado"
                />

                {pontos.map(
                  (
                    item,
                    indice
                  ) => (
                    <g
                      key={
                        item.data
                      }
                    >
                      {[
                        "realizado",
                        "projetado",
                      ].map(
                        (campo) =>
                          item[
                            campo
                          ] !==
                            null && (
                            <circle
                              key={
                                campo
                              }
                              cx={x(
                                item.data
                              )}
                              cy={y(
                                item[
                                  campo
                                ]
                              )}
                              r={3.5}
                              className={`analytics-point-${campo}`}
                            >
                              <title>
                                {item.data
                                  .split(
                                    "-"
                                  )
                                  .reverse()
                                  .join(
                                    "/"
                                  )}
                                {" · "}
                                {
                                  campo
                                }
                                {": "}
                                {reais(
                                  item[
                                    campo
                                  ]
                                )}
                              </title>
                            </circle>
                          )
                      )}

                      {(
                        indice %
                          Math.max(
                            1,
                            Math.ceil(
                              (
                                pontos.length -
                                1
                              ) /
                                4
                            )
                          ) ===
                          0 ||
                        indice ===
                          pontos.length -
                            1
                      ) && (
                        <text
                          x={x(
                            item.data
                          )}
                          y={
                            altura -
                            20
                          }
                          textAnchor={
                            indice ===
                            0
                              ? "start"
                              : indice ===
                                  pontos.length -
                                    1
                                ? "end"
                                : "middle"
                          }
                        >
                          {dataCurta(
                            item.data
                          )}
                        </text>
                      )}
                    </g>
                  )
                )}
              </svg>

              <details className="analytics-table-details">
                <summary>
                  Ver valores por
                  período
                </summary>

                <div className="tabela-container">
                  <table>
                    <thead>
                      <tr>
                        <th>
                          Data
                        </th>

                        <th>
                          Realizado
                          acumulado
                        </th>

                        <th>
                          Projetado
                          acumulado
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {pontos.map(
                        (item) => (
                          <tr
                            key={
                              item.data
                            }
                          >
                            <td>
                              {item.data
                                .split(
                                  "-"
                                )
                                .reverse()
                                .join(
                                  "/"
                                )}
                            </td>

                            <td>
                              {item.realizado ===
                              null
                                ? "—"
                                : reais(
                                    item.realizado
                                  )}
                            </td>

                            <td>
                              {item.projetado ===
                              null
                                ? "—"
                                : reais(
                                    item.projetado
                                  )}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </details>
            </>
          )}
        </div>

        <aside className="analytics-forecast">
          <span>
            PROJECIONAL
          </span>

          <strong>
            {reais(
              resultado.projetado
            )}
          </strong>

          <p>
            {resultado.desvioProjetado >
            0
              ? "+"
              : ""}

            {resultado.desvioProjetado ===
            null
              ? "Sem comparação disponível"
              : reais(
                  resultado.desvioProjetado
                )}
          </p>

          <p>
            {diferenca(
              resultado.desvioProjetado,
              resultado.desvioProjetadoPercentual
            )}
          </p>

          <small>
            Estimativa para o fim
            da obra ou período
            selecionado.
          </small>
        </aside>
      </div>
    </section>
  );
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function AnalyticsFinanceiro({
  onNavegar,
}) {
  const [
    obras,
    setObras,
  ] =
    useState([]);

  const [
    idObra,
    setIdObra,
  ] =
    useState("");

  const [
    dados,
    setDados,
  ] =
    useState(null);

  const [
    carregando,
    setCarregando,
  ] =
    useState(true);

  const [
    erro,
    setErro,
  ] =
    useState("");

  const [
    avisoObras,
    setAvisoObras,
  ] =
    useState("");

  const [
    erroFiltro,
    setErroFiltro,
  ] =
    useState("");

  const [
    rascunho,
    setRascunho,
  ] =
    useState({
      ...FILTROS_VAZIOS,
    });

  const [
    filtros,
    setFiltros,
  ] =
    useState({
      ...FILTROS_VAZIOS,
    });

  const [
    recarregar,
    setRecarregar,
  ] =
    useState(0);

  // ===================================================
  // CARREGAR OBRAS
  // ===================================================

  useEffect(() => {
    let ativo =
      true;

    setCarregando(
      true
    );

    setErro("");
    setDados(null);

    async function carregarObras() {
      try {
        let id =
          localStorage.getItem(
            "idconstrutora"
          ) ||
          localStorage.getItem(
            "id_construtora"
          );

        if (!id) {
          const usuario =
            await requisitar(
              `/usuarios/${localStorage.getItem(
                "id_usuario"
              )}`
            );

          const dadosUsuario =
            usuario.usuario ||
            usuario;

          id =
            dadosUsuario
              .idconstrutora ??
            dadosUsuario
              .id_construtora;
        }

        if (!id) {
          throw new Error(
            "Não foi possível identificar a construtora. Entre novamente no sistema."
          );
        }

        const lista =
          await listarObras(
            id
          );

        if (!ativo) {
          return;
        }

        const listaValida =
          Array.isArray(
            lista
          )
            ? lista
            : [];

        setObras(
          listaValida
        );

        setAvisoObras(
          lista?.aviso ||
            ""
        );

        let selecionada =
          null;

        try {
          selecionada =
            JSON.parse(
              localStorage.getItem(
                "obra_selecionada"
              ) ||
                "null"
            )?.id_obra;
        } catch {
          selecionada =
            null;
        }

        const obraInicial =
          listaValida.find(
            (item) =>
              Number(
                item.id_obra
              ) ===
              Number(
                selecionada
              )
          ) ||
          listaValida[0] ||
          null;

        const novoId =
          obraInicial
            ? String(
                obraInicial.id_obra
              )
            : "";

        setIdObra(
          novoId
        );

        if (
          obraInicial
        ) {
          const periodo =
            criarPeriodoAnalise(
              obraInicial
            );

          setRascunho(
            periodo
          );

          setFiltros(
            periodo
          );
        }
      } catch (error) {
        if (ativo) {
          setErro(
            error.message
          );

          setObras(
            []
          );

          setIdObra(
            ""
          );
        }
      } finally {
        if (ativo) {
          setCarregando(
            false
          );
        }
      }
    }

    carregarObras();

    return () => {
      ativo =
        false;
    };
  }, [recarregar]);

  // ===================================================
  // CARREGAR DADOS DA ANÁLISE
  // ===================================================

  useEffect(() => {
    if (!idObra) {
      return;
    }

    const controller =
      new AbortController();

    setCarregando(
      true
    );

    setErro("");
    setDados(null);

    carregarAnalytics(
      idObra,
      controller.signal
    )
      .then(
        (resposta) => {
          if (
            !controller
              .signal
              .aborted
          ) {
            setDados(
              normalizarAnalytics(
                resposta
              )
            );
          }
        }
      )
      .catch(
        (error) => {
          if (
            !controller
              .signal
              .aborted
          ) {
            setErro(
              error.message
            );
          }
        }
      )
      .finally(
        () => {
          if (
            !controller
              .signal
              .aborted
          ) {
            setCarregando(
              false
            );
          }
        }
      );

    return () =>
      controller.abort();
  }, [
    idObra,
    recarregar,
  ]);

  // ===================================================
  // OBRA SELECIONADA
  // ===================================================

  const obraSelecionada =
    useMemo(
      () =>
        obras.find(
          (obra) =>
            String(
              obra.id_obra
            ) ===
            String(
              idObra
            )
        ) ||
        null,
      [
        obras,
        idObra,
      ]
    );

  // ===================================================
  // RESULTADO
  // ===================================================

  const resultado =
    useMemo(
      () =>
        dados
          ? calcularAnalytics(
              dados,
              filtros
            )
          : null,
      [
        dados,
        filtros,
      ]
    );

  // ===================================================
  // RECURSOS
  // ===================================================

  const recursos =
    useMemo(
      () =>
        [
          ...new Map(
            (
              dados?.registros ||
              []
            )
              .filter(
                (item) =>
                  item.chave &&
                  (
                    !rascunho.origem ||
                    item.origem ===
                      rascunho.origem
                  )
              )
              .map(
                (item) => [
                  item.chave,
                  item,
                ]
              )
          ).values(),
        ],
      [
        dados,
        rascunho.origem,
      ]
    );

  const alterado =
    JSON.stringify(
      rascunho
    ) !==
    JSON.stringify(
      filtros
    );

  // ===================================================
  // ALTERAR FILTROS
  // ===================================================

  function alterar(
    event
  ) {
    const {
      name,
      value,
    } =
      event.target;

    setRascunho(
      (anterior) => ({
        ...anterior,

        [name]:
          value,

        ...(
          name ===
          "origem"
            ? {
                recurso:
                  "",
              }
            : {}
        ),
      })
    );

    setErroFiltro(
      ""
    );
  }

  // ===================================================
  // APLICAR FILTROS
  // ===================================================

  function aplicar(
    event
  ) {
    event.preventDefault();

    if (
      rascunho.inicio &&
      rascunho.fim &&
      rascunho.inicio >
        rascunho.fim
    ) {
      setErroFiltro(
        "A data final deve ser igual ou posterior à data inicial."
      );

      return;
    }

    setFiltros({
      ...rascunho,
    });

    setErroFiltro(
      ""
    );
  }

  // ===================================================
  // SELECIONAR OBRA
  // ===================================================

  function selecionarObra(
    event
  ) {
    const novoId =
      event.target.value;

    setDados(
      null
    );

    setCarregando(
      Boolean(
        novoId
      )
    );

    setIdObra(
      novoId
    );

    const obraEscolhida =
      obras.find(
        (item) =>
          String(
            item.id_obra
          ) ===
          String(
            novoId
          )
      );

    if (
      obraEscolhida
    ) {
      const periodo =
        criarPeriodoAnalise(
          obraEscolhida
        );

      setRascunho(
        periodo
      );

      setFiltros(
        periodo
      );
    } else {
      setRascunho({
        ...FILTROS_VAZIOS,
      });

      setFiltros({
        ...FILTROS_VAZIOS,
      });
    }

    setErroFiltro(
      ""
    );
  }

  // ===================================================
  // LIMPAR FILTROS
  // ===================================================

  function limparFiltros() {
    const periodo =
      criarPeriodoAnalise(
        obraSelecionada
      );

    setRascunho(
      periodo
    );

    setFiltros(
      periodo
    );

    setErroFiltro(
      ""
    );
  }

  // ===================================================
  // ESCALA DOS GRÁFICOS
  // ===================================================

  const maxEtapa =
    resultado
      ? Math.max(
          1,

          ...resultado.etapas.flatMap(
            (item) => [
              item.planejado ||
                0,

              item.realizado ||
                0,
            ]
          )
        )
      : 1;

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <Layout
      onNavegar={
        onNavegar
      }
    >
      <div className="dashboard analytics-page">

        {/* CABEÇALHO */}

        <section className="dashboard-header">
          <div>
            <span className="dashboard-eyebrow">
              ANALYTICS FINANCEIRO
            </span>

            <h1>
              Controle de custos
              da obra
            </h1>

            <p>
              Acompanhamento
              executivo
            </p>
          </div>

          <button
            type="button"
            className="secondary-button"
            disabled={
              carregando
            }
            onClick={() =>
              setRecarregar(
                (valor) =>
                  valor +
                  1
              )
            }
          >
            Atualizar dados
          </button>
        </section>

        {/* FILTROS */}

        <section className="dashboard-section analytics-filters">

          <div className="analytics-work">
            <div className="form-group">
              <label htmlFor="analytics-obra">
                Obra em análise
              </label>

              <select
                id="analytics-obra"
                value={
                  idObra
                }
                onChange={
                  selecionarObra
                }
                disabled={
                  !obras.length
                }
              >
                <option value="">
                  Selecione uma obra
                </option>

                {obras.map(
                  (item) => (
                    <option
                      value={
                        item.id_obra
                      }
                      key={
                        item.id_obra
                      }
                    >
                      {item.nome ||
                        item.obra}
                    </option>
                  )
                )}
              </select>
            </div>

            <span>
              Dados existentes ·
              somente consulta
            </span>
          </div>

          <form
            onSubmit={
              aplicar
            }
          >
            <fieldset
              disabled={
                carregando ||
                !dados
              }
              className="analytics-filter-grid"
            >

              {/* DATAS EDITÁVEIS */}

              <div className="analytics-period">
                <span>
                  Período analisado
                </span>

                <div>
                  <label htmlFor="analytics-inicio">
                    De

                    <input
                      id="analytics-inicio"
                      type="date"
                      name="inicio"
                      value={
                        rascunho.inicio
                      }
                      onChange={
                        alterar
                      }
                    />
                  </label>

                  <label htmlFor="analytics-fim">
                    Até

                    <input
                      id="analytics-fim"
                      type="date"
                      name="fim"
                      value={
                        rascunho.fim
                      }
                      onChange={
                        alterar
                      }
                    />
                  </label>
                </div>
              </div>

              {/* ETAPA */}

              <div className="form-group">
                <label htmlFor="analytics-etapa">
                  Etapa
                </label>

                <select
                  id="analytics-etapa"
                  name="etapa"
                  value={
                    rascunho.etapa
                  }
                  onChange={
                    alterar
                  }
                >
                  <option value="">
                    Todas as etapas
                  </option>

                  {ETAPAS.map(
                    (item) => (
                      <option
                        key={
                          item
                        }
                        value={
                          item
                        }
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* ORIGEM */}

              <div className="form-group">
                <label htmlFor="analytics-origem">
                  Origem
                </label>

                <select
                  id="analytics-origem"
                  name="origem"
                  value={
                    rascunho.origem
                  }
                  onChange={
                    alterar
                  }
                >
                  <option value="">
                    Todas as origens
                  </option>

                  {Object.entries(
                    ORIGENS
                  ).map(
                    ([
                      id,
                      nome,
                    ]) => (
                      <option
                        key={
                          id
                        }
                        value={
                          id
                        }
                      >
                        {nome}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* RECURSO */}

              <div className="form-group">
                <label htmlFor="analytics-recurso">
                  Equipe / Máquina /
                  Insumo
                </label>

                <select
                  id="analytics-recurso"
                  name="recurso"
                  value={
                    rascunho.recurso
                  }
                  onChange={
                    alterar
                  }
                >
                  <option value="">
                    Todos os recursos
                  </option>

                  {recursos.map(
                    (item) => (
                      <option
                        key={
                          item.chave
                        }
                        value={
                          item.chave
                        }
                      >
                        {item.nome}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* BOTÕES */}

              <div className="analytics-filter-actions">
                <button
                  className="button"
                  type="submit"
                >
                  Aplicar filtros
                </button>

                <button
                  className="secondary-button"
                  type="button"
                  onClick={
                    limparFiltros
                  }
                >
                  Limpar filtros
                </button>
              </div>
            </fieldset>

            {erroFiltro && (
              <p
                className="auth-error"
                role="alert"
              >
                {erroFiltro}
              </p>
            )}

            <p
              className="analytics-filter-status"
              role="status"
            >
              {alterado
                ? "Há alterações nos filtros. Clique em Aplicar filtros para atualizar os indicadores."
                : filtros.inicio &&
                    filtros.fim
                  ? `Período atual: ${formatarData(
                      filtros.inicio
                    )} até ${formatarData(
                      filtros.fim
                    )}.`
                  : "Cards e gráficos refletem o mesmo recorte aplicado."}
            </p>
          </form>
        </section>

        {/* ERRO */}

        {erro && (
          <div
            className="auth-error"
            role="alert"
          >
            {erro}
          </div>
        )}

        {avisoObras && (
          <p className="analytics-notice">
            {avisoObras}
          </p>
        )}

        {/* CARREGAMENTO */}

        {carregando ? (
          <section
            className="dashboard-section analytics-empty"
            role="status"
          >
            Carregando dados
            financeiros da obra…
          </section>
        ) : !idObra ? (
          <section className="dashboard-section analytics-empty">
            <h2>
              Nenhuma obra
              selecionada
            </h2>

            <p>
              Selecione uma obra
              disponível ou acesse
              Obras para consultar
              seus projetos.
            </p>

            <button
              className="secondary-button"
              onClick={() =>
                onNavegar(
                  "obras"
                )
              }
            >
              Ir para Obras
            </button>
          </section>
        ) : (
          resultado && (
            <>
              {/* AVISOS */}

              {!!resultado.avisos
                .length && (
                <details
                  className="analytics-notice"
                  open
                >
                  <summary>
                    Disponibilidade
                    dos dados e
                    critérios de
                    cálculo
                  </summary>

                  <ul>
                    {resultado.avisos.map(
                      (aviso) => (
                        <li
                          key={
                            aviso
                          }
                        >
                          {aviso}
                        </li>
                      )
                    )}
                  </ul>
                </details>
              )}

              {resultado.quantidade ===
                0 &&
                resultado.realizado !==
                  null && (
                  <p
                    className="analytics-notice"
                    role="status"
                  >
                    Nenhum custo
                    realizado encontrado
                    entre{" "}
                    {formatarData(
                      filtros.inicio
                    )}{" "}
                    e{" "}
                    {formatarData(
                      filtros.fim
                    )}
                    .
                  </p>
                )}

              {/* CARDS */}

              <section
                className="cards-grid analytics-cards"
                aria-label="Indicadores financeiros"
              >
                <Card
                  title="PLANEJADO"
                  value={reais(
                    resultado.planejado
                  )}
                  description={
                    resultado.usaOrcamento
                      ? "Orçamento aprovado da obra"
                      : "Custos planejados no recorte"
                  }
                />

                <Card
                  title="REALIZADO"
                  value={reais(
                    resultado.realizado
                  )}
                  description={
                    resultado.realizadoPercentual ===
                    null
                      ? "Sem percentual de comparação"
                      : `${porcentagem(
                          resultado.realizadoPercentual
                        )} do planejado`
                  }
                />

                <Card
                  title="PROJETADO"
                  value={reais(
                    resultado.projetado
                  )}
                  description="Estimativa ao término do recorte"
                />

                <div
                  className={
                    resultado.desvio >
                    0
                      ? "analytics-negative"
                      : resultado.desvio <
                          0
                        ? "analytics-positive"
                        : ""
                  }
                >
                  <Card
                    title="DESVIO"
                    value={`${
                      resultado.desvio >
                      0
                        ? "+"
                        : ""
                    }${reais(
                      resultado.desvio
                    )}`}
                    description={diferenca(
                      resultado.desvio,
                      resultado.desvioPercentual
                    )}
                  />
                </div>
              </section>

              <p className="analytics-method">
                Período analisado:{" "}
                <strong>
                  {formatarData(
                    filtros.inicio
                  )}
                </strong>
                {" até "}
                <strong>
                  {formatarData(
                    filtros.fim
                  )}
                </strong>
                .
              </p>

              <p className="analytics-method">
                Desvio = realizado −
                planejado. A
                comparação da
                estimativa final com
                o plano aparece em
                Projecional.
              </p>

              {/* PAINÉIS */}

              <div className="analytics-panels">

                <section className="dashboard-section">
                  <div className="analytics-section-heading">
                    <div>
                      <span className="section-label">
                        COMPARATIVO
                      </span>

                      <h2>
                        Custo por etapa
                      </h2>
                    </div>

                    <div className="analytics-legend">
                      <span>
                        <i className="analytics-dot planejado" />
                        Planejado
                      </span>

                      <span>
                        <i className="analytics-dot realizado" />
                        Realizado
                      </span>
                    </div>
                  </div>

                  <p className="analytics-method">
                    Equipes + insumos +
                    maquinários por
                    etapa.
                  </p>

                  <div className="analytics-stages">
                    {resultado.etapas.map(
                      (item) => (
                        <div
                          className="analytics-stage"
                          key={
                            item.nome
                          }
                        >
                          <h3>
                            {item.nome ===
                            ETAPAS[2]
                              ? "Alvenaria/Supraestrutura"
                              : item.nome}
                          </h3>

                          {[
                            "planejado",
                            "realizado",
                          ].map(
                            (tipo) => (
                              <div
                                className="analytics-bar-row"
                                key={
                                  tipo
                                }
                              >
                                <span>
                                  {tipo ===
                                  "planejado"
                                    ? "Planejado"
                                    : "Realizado"}
                                </span>

                                <div className="analytics-track">
                                  <div
                                    className={`analytics-fill ${tipo}`}
                                    style={{
                                      width: `${Math.max(
                                        0,
                                        ((item[
                                          tipo
                                        ] ||
                                          0) /
                                          maxEtapa) *
                                          100
                                      )}%`,
                                    }}
                                  />
                                </div>

                                <strong>
                                  {reais(
                                    item[
                                      tipo
                                    ]
                                  )}
                                </strong>
                              </div>
                            )
                          )}
                        </div>
                      )
                    )}
                  </div>
                </section>

                {/* ORIGEM DOS CUSTOS */}

                <section className="dashboard-section">
                  <span className="section-label">
                    DISTRIBUIÇÃO DO
                    REALIZADO
                  </span>

                  <h2>
                    Origem dos custos
                  </h2>

                  <p className="analytics-method">
                    Participação de
                    cada origem nos
                    registros do
                    período.
                  </p>

                  <div className="analytics-origins">
                    {resultado.origens.map(
                      (item) => (
                        <div
                          className="analytics-origin"
                          key={
                            item.id
                          }
                        >
                          <div>
                            <h3>
                              {
                                item.nome
                              }
                            </h3>

                            <span>
                              {porcentagem(
                                item.percentual
                              )}
                            </span>
                          </div>

                          <strong>
                            {reais(
                              item.valor
                            )}
                          </strong>

                          <div className="analytics-track">
                            <div
                              className={`analytics-fill ${item.id}`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(
                                    0,
                                    item.percentual ||
                                      0
                                  )
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  <div className="analytics-source">
                    <span>
                      Fonte do realizado
                    </span>

                    <strong>
                      {dados.fonte}
                    </strong>

                    <small>
                      Cadastro de estoque
                      e vínculo com a
                      obra não são
                      considerados
                      consumo.
                    </small>
                  </div>
                </section>
              </div>

              {/* PROJEÇÃO */}

              <Projecao
                resultado={
                  resultado
                }
              />

              {/* METODOLOGIA */}

              <section className="dashboard-section analytics-methodology">
                <div>
                  <span className="section-label">
                    CRITÉRIOS DA
                    PROJEÇÃO
                  </span>

                  <h2>
                    Ritmo de execução
                  </h2>

                  <p>
                    Média diária:{" "}
                    <strong>
                      {reais(
                        resultado.media
                      )}
                    </strong>
                    {" · "}
                    <strong>
                      {
                        resultado.diasEfetivos
                      }
                    </strong>{" "}
                    dias distintos com
                    custos registrados
                    {" · "}
                    <strong>
                      {resultado.diasRestantes ??
                        "Indisponível"}
                    </strong>{" "}
                    dias corridos
                    restantes.
                  </p>

                  <p>
                    A estimativa mantém
                    essa média nos dias
                    restantes, sem
                    calendário de
                    trabalho. Datas sem
                    registros não são
                    tratadas como dias
                    efetivos.
                  </p>
                </div>

                <div>
                  <span className="section-label">
                    ATRASOS E
                    PARALISAÇÕES
                  </span>

                  <h2>
                    Impacto estimado
                  </h2>

                  <p>
                    {filtros.recurso
                      ? "Contagem por recurso indisponível."
                      : dados.ocorrenciasCompletas ===
                          false
                        ? "Consulta de ocorrências incompleta."
                        : `${resultado.ocorrencias.length} ocorrências identificadas neste recorte.`}
                  </p>

                  <p>
                    Estimativa monetária
                    indisponível: os
                    registros não
                    identificam o
                    recurso afetado nem
                    a unidade da
                    duração.
                  </p>
                </div>
              </section>
            </>
          )
        )}
      </div>
    </Layout>
  );
}