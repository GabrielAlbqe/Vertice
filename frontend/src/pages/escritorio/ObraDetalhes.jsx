import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Layout from "../../componentes/escritorio/Layout";

import {
  buscarObraPorId,
  listarObras,
} from "../../api/obras";

import {
  excluirRecurso,
  atribuirEquipe,
  atribuirInsumo,
  atribuirMaquinario,
  buscarCatalogoRecursos,
  buscarRecursosDaObra,
  obterIdEquipe,
  obterIdInsumo,
  obterIdMaquinario,
} from "../../api/recursos";

// =====================================================
// AUXILIARES
// =====================================================

function formatarReal(valor) {
  return Number(valor || 0).toLocaleString(
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

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

function ObraDetalhes({
  obra,
  onVoltar,
  onNavegar,
}) {
  const [
    obraAtual,
    setObraAtual,
  ] = useState(obra);

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

  const [
    catalogo,
    setCatalogo,
  ] = useState({
    equipes: [],
    insumos: [],
    maquinarios: [],
  });

  const [
    atribuindo,
    setAtribuindo,
  ] = useState("");

  const [aviso, setAviso] = useState("");
  const [
    sucesso,
    setSucesso,
  ] = useState("");

  // ===================================================
  // CARREGAR DADOS
  // ===================================================

  useEffect(() => {
    if (obra?.id_obra) {
      carregarDados();
    }
  }, [obra?.id_obra]);

  async function carregarDados() {
    try {
      setCarregando(true);
      setErro("");

      const idObra =
        obra.id_obra;

      const idConstrutora =
        localStorage.getItem(
          "idconstrutora"
        ) ||
        localStorage.getItem(
          "id_construtora"
        );

      const listaObras =
        await listarObras(
          idConstrutora
        );

      const [
        obraServidor,
        recursos,
        catalogoRecursos,
      ] =
        await Promise.all([
          buscarObraPorId(
            idObra
          ),

          buscarRecursosDaObra(
            idObra
          ),

          buscarCatalogoRecursos(
            Array.isArray(
              listaObras
            )
              ? [...listaObras.filter(item => Number(item.id_obra) !== Number(idObra)), obra]
              : [obra]
          ),
        ]);

      setObraAtual(
        obraServidor ||
          obra
      );

      setEquipes(
        recursos?.equipes ||
          []
      );

      setInsumos(
        recursos?.insumos ||
          []
      );

      setMaquinarios(
        recursos?.maquinarios ||
          []
      );

      setAviso("Para transferir recursos, abra a obra de destino. A desatribuição sem destino não está disponível no cadastro atual.");
      setCatalogo({
        equipes:
          catalogoRecursos?.equipes ||
          [],

        insumos:
          catalogoRecursos?.insumos ||
          [],

        maquinarios:
          catalogoRecursos?.maquinarios ||
          [],
      });
    } catch (error) {
      console.error(
        "Erro ao carregar detalhes da obra:",
        error
      );

      setErro(
        error.message ||
          "Não foi possível carregar os dados da obra."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function removerRecurso(tipo, recurso) {
    if (atribuindo || !window.confirm('Excluir definitivamente este cadastro? Ele será removido do sistema, incluindo o vínculo com esta obra.')) return;
    setAtribuindo(tipo);
    setErro("");
    setSucesso("");
    try {
      await excluirRecurso(tipo, recurso);
      await carregarDados();
      setSucesso("Recurso excluído do sistema.");
    } catch (error) {
      setErro(error.message || "Não foi possível excluir o recurso.");
    } finally { setAtribuindo(""); }
  }

  async function atribuirRecurso(
    tipo,
    recurso
  ) {
    if (
      atribuindo || !recurso ||
      !obra?.id_obra
    ) {
      return;
    }

    const idObra =
      obra.id_obra;

    try {
      setAtribuindo(
        tipo
      );

      setErro("");
      setSucesso("");

      if (
        tipo === "equipe"
      ) {
        await atribuirEquipe(
          recurso,
          idObra
        );
      }

      if (
        tipo === "insumo"
      ) {
        await atribuirInsumo(
          recurso,
          idObra
        );
      }

      if (
        tipo ===
        "maquinario"
      ) {
        await atribuirMaquinario(
          recurso,
          idObra
        );
      }

      setSucesso(
        "Recurso atribuído à obra com sucesso."
      );

      await carregarDados();
    } catch (error) {
      console.error(
        "Erro ao atribuir recurso:",
        error
      );

      setErro(
        error.message ||
          "Não foi possível atribuir o recurso à obra."
      );
    } finally {
      setAtribuindo("");
    }
  }

  // ===================================================
  // SEM OBRA
  // ===================================================

  if (!obra?.id_obra) {
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

            <p>
              Volte para a página de Obras e selecione uma obra.
            </p>

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

  const dadosObra =
    obraAtual ||
    obra;

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

        {/* =============================================
            CABEÇALHO
        ============================================= */}

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

            <span
              className="dashboard-eyebrow"
              style={{
                marginTop:
                  "14px",
              }}
            >
              OBRA SELECIONADA
            </span>

            <h1>
              {dadosObra.obra ||
                dadosObra.nome}
            </h1>

            <p>
              Consulte os recursos atribuídos e os indicadores da obra.
            </p>

          </div>

          <div className="status-obra">
            {dadosObra.status ||
              "Sem status"}
          </div>

        </section>

        {aviso && <p role="status">{aviso}</p>}
        {erro && (

          <div className="auth-error">
            {erro}
          </div>

        )}

        {sucesso && (
          <div className="auth-success">
            {sucesso}
          </div>
        )}

        {/* =============================================
            ÁREA PRINCIPAL
        ============================================= */}

        <section className="dashboard-section">

          {/* ABAS */}

          <div className="abas-obra">

            <BotaoAba
              atual={
                abaAtiva
              }
              id="visao-geral"
              titulo="Visão Geral"
              setAba={
                setAbaAtiva
              }
            />

            <BotaoAba
              atual={
                abaAtiva
              }
              id="equipes"
              titulo="Equipes"
              setAba={
                setAbaAtiva
              }
            />

            <BotaoAba
              atual={
                abaAtiva
              }
              id="insumos"
              titulo="Materiais / Insumos"
              setAba={
                setAbaAtiva
              }
            />

            <BotaoAba
              atual={
                abaAtiva
              }
              id="maquinarios"
              titulo="Maquinários"
              setAba={
                setAbaAtiva
              }
            />

            <BotaoAba
              atual={
                abaAtiva
              }
              id="indicadores"
              titulo="Indicadores"
              setAba={
                setAbaAtiva
              }
            />

          </div>

          {/* CONTEÚDO */}

          <div className="conteudo-aba">

            {carregando ? (

              <div
                style={{
                  padding:
                    "30px 0",
                }}
              >
                <p>
                  Carregando recursos atribuídos...
                </p>
              </div>

            ) : (

              <>

                {abaAtiva ===
                  "visao-geral" && (

                  <VisaoGeral
                    obra={
                      dadosObra
                    }
                    equipes={
                      equipes
                    }
                    insumos={
                      insumos
                    }
                    maquinarios={
                      maquinarios
                    }
                  />

                )}

                {abaAtiva ===
                  "equipes" && (

                  <TabelaEquipes
                    onRemover={(item) => removerRecurso("equipe", item)}
                    equipes={
                      equipes
                    }
                    catalogo={
                      catalogo.equipes
                    }
                    idObra={
                      obra.id_obra
                    }
                    onAtribuir={
                      (item) =>
                        atribuirRecurso(
                          "equipe",
                          item
                        )
                    }
                    atribuindo={
                      Boolean(atribuindo)
                    }
                  />

                )}

                {abaAtiva ===
                  "insumos" && (

                  <TabelaInsumos
                    onRemover={(item) => removerRecurso("insumo", item)}
                    insumos={
                      insumos
                    }
                    catalogo={
                      catalogo.insumos
                    }
                    idObra={
                      obra.id_obra
                    }
                    onAtribuir={
                      (item) =>
                        atribuirRecurso(
                          "insumo",
                          item
                        )
                    }
                    atribuindo={
                      Boolean(atribuindo)
                    }
                  />

                )}

                {abaAtiva ===
                  "maquinarios" && (

                  <TabelaMaquinarios
                    onRemover={(item) => removerRecurso("maquinario", item)}
                    maquinarios={
                      maquinarios
                    }
                    catalogo={
                      catalogo.maquinarios
                    }
                    idObra={
                      obra.id_obra
                    }
                    onAtribuir={
                      (item) =>
                        atribuirRecurso(
                          "maquinario",
                          item
                        )
                    }
                    atribuindo={
                      Boolean(atribuindo)
                    }
                  />

                )}

                {abaAtiva ===
                  "indicadores" && (

                  <Indicadores
                    obra={
                      dadosObra
                    }
                    equipes={
                      equipes
                    }
                    insumos={
                      insumos
                    }
                    maquinarios={
                      maquinarios
                    }
                  />

                )}

              </>

            )}

          </div>

        </section>

      </div>

    </Layout>
  );
}

// =====================================================
// BOTÃO DA ABA
// =====================================================

function BotaoAba({
  atual,
  id,
  titulo,
  setAba,
}) {
  return (
    <button
      type="button"
      className={
        atual === id
          ? "aba ativa"
          : "aba"
      }
      onClick={() =>
        setAba(id)
      }
    >
      {titulo}
    </button>
  );
}

// =====================================================
// CARD RESUMO
// =====================================================

function Resumo({
  titulo,
  valor,
}) {
  return (
    <div className="card-resumo">

      <span>
        {titulo}
      </span>

      <strong>
        {valor}
      </strong>

    </div>
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
  const valorEstoque =
    insumos.reduce(
      (
        total,
        item
      ) =>
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

  const custoEquipesDia =
    equipes.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.custo_diario ||
            0
        ),
      0
    );

  const custoMaquinasDia =
    maquinarios.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.quantidade ||
            0
        ) *
          Number(
            item.custo_diario ||
              0
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
            Informações da obra e recursos atribuídos.
          </p>

        </div>

      </div>

      {/* OBRA */}

      <div className="cards-resumo">

        <Resumo
          titulo="Status"
          valor={
            obra.status ||
            "-"
          }
        />

        <Resumo
          titulo="Categoria"
          valor={
            obra.categoria ||
            "-"
          }
        />

        <Resumo
          titulo="Pavimentos"
          valor={
            obra
              .numero_pavimentos ??
            obra.pavimentos ??
            "-"
          }
        />

        <Resumo
          titulo="Orçamento planejado"
          valor={
            formatarReal(
              obra
                .orcamento_planejado
            )
          }
        />

      </div>

      {/* DATAS */}

      <div
        className="cards-resumo"
        style={{
          marginTop:
            "20px",
        }}
      >

        <Resumo
          titulo="Início planejado"
          valor={
            formatarData(
              obra
                .data_inicio_planejada
            )
          }
        />

        <Resumo
          titulo="Término planejado"
          valor={
            formatarData(
              obra
                .data_termino_planejada
            )
          }
        />

      </div>

      {/* RECURSOS */}

      <div
        className="cards-resumo"
        style={{
          marginTop:
            "20px",
        }}
      >

        <Resumo
          titulo="Equipes atribuídas"
          valor={
            equipes.length
          }
        />

        <Resumo
          titulo="Insumos atribuídos"
          valor={
            insumos.length
          }
        />

        <Resumo
          titulo="Maquinários atribuídos"
          valor={
            maquinarios.length
          }
        />

        <Resumo
          titulo="Valor dos insumos"
          valor={
            formatarReal(
              valorEstoque
            )
          }
        />

      </div>

      {/* CUSTOS */}

      <div
        className="cards-resumo"
        style={{
          marginTop:
            "20px",
        }}
      >

        <Resumo
          titulo="Equipes / dia"
          valor={
            formatarReal(
              custoEquipesDia
            )
          }
        />

        <Resumo
          titulo="Maquinários / dia"
          valor={
            formatarReal(
              custoMaquinasDia
            )
          }
        />

      </div>

    </div>
  );
}

// =====================================================
// PAINEL DE ATRIBUIÇÃO
// =====================================================

function PainelAtribuicao({
  tipo,
  catalogo,
  idObra,
  onAtribuir,
  atribuindo,
}) {
  const [
    idSelecionado,
    setIdSelecionado,
  ] = useState("");

  function obterId(item) {
    if (
      tipo === "equipe"
    ) {
      return obterIdEquipe(
        item
      );
    }

    if (
      tipo === "insumo"
    ) {
      return obterIdInsumo(
        item
      );
    }

    return obterIdMaquinario(
      item
    );
  }

  function obterNome(item) {
    if (
      tipo === "equipe"
    ) {
      return (
        item.nome_equipe ||
        item.nome ||
        "Equipe"
      );
    }

    return (
      item.nome ||
      "Recurso"
    );
  }

  const disponiveis =
    catalogo.filter(
      (item) => {
        const obraDoItem =
          item.idobra ??
          item.id_obra ??
          null;

        return (
          Number(
            obraDoItem
          ) !==
          Number(
            idObra
          )
        );
      }
    );

  const selecionado =
    disponiveis.find(
      (item) =>
        String(
          obterId(item)
        ) ===
        String(
          idSelecionado
        )
    );

  async function confirmar() {
    if (!selecionado) {
      return;
    }

    const obraOrigem =
      selecionado.idobra ??
      selecionado.id_obra;

    if (
      obraOrigem &&
      Number(
        obraOrigem
      ) !==
      Number(
        idObra
      )
    ) {
      const mover =
        window.confirm(
          "Este recurso já está ligado a outra obra. Deseja movê-lo para esta obra?"
        );

      if (!mover) {
        return;
      }
    }

    await onAtribuir(
      selecionado
    );

    setIdSelecionado("");
  }

  const titulo =
    tipo === "equipe"
      ? "Atribuir equipe cadastrada"
      : tipo === "insumo"
        ? "Atribuir material / insumo"
        : "Atribuir maquinário";

  return (
    <div className="painel-atribuicao">

      <div className="painel-atribuicao-texto">

        <span className="section-label">
          GERENCIAMENTO
        </span>

        <h3>
          {titulo}
        </h3>

        <p>
          Escolha um recurso já cadastrado e vincule-o à obra selecionada. Recursos de outra obra serão transferidos. O cadastro atual exige uma obra; para manter o recurso, transfira-o em vez de excluir.
        </p>

      </div>

      <div className="painel-atribuicao-controles">

        <select
          aria-label={titulo}
          value={
            idSelecionado
          }
          onChange={
            (event) =>
              setIdSelecionado(
                event.target.value
              )
          }
          disabled={
            atribuindo ||
            disponiveis.length ===
              0
          }
        >
          <option value="">
            {disponiveis.length ===
            0
              ? "Nenhum recurso disponível"
              : "Selecione um recurso"}
          </option>

          {disponiveis.map(
            (item) => {
              const id =
                obterId(
                  item
                );

              const obraOrigem =
                item.idobra ??
                item.id_obra;

              return (
                <option
                  key={id}
                  value={id}
                >
                  {obterNome(
                    item
                  )}
                  {obraOrigem
                    ? ` — obra ${obraOrigem}`
                    : " — sem obra"}
                </option>
              );
            }
          )}

        </select>

        <button
          type="button"
          className="button"
          disabled={
            !selecionado ||
            atribuindo
          }
          onClick={
            confirmar
          }
        >
          {atribuindo
            ? "Atribuindo..."
            : "+ Atribuir"}
        </button>

      </div>

      {disponiveis.length ===
        0 && (
        <small className="painel-atribuicao-aviso">
          Não há outro recurso cadastrado disponível para esta obra.
        </small>
      )}

    </div>
  );
}

// =====================================================
// EQUIPES
// =====================================================

function TabelaEquipes({
  onRemover,
  equipes,
  catalogo,
  idObra,
  onAtribuir,
  atribuindo,
}) {
  return (
    <div>

      <div className="titulo-aba">

        <div>

          <span className="section-label">
            RECURSOS HUMANOS
          </span>

          <h2>
            Equipes
          </h2>

          <p>
            Equipes atualmente atribuídas a esta obra.
          </p>

        </div>

      </div>

      <PainelAtribuicao
        tipo="equipe"
        catalogo={
          catalogo
        }
        idObra={
          idObra
        }
        onAtribuir={
          onAtribuir
        }
        atribuindo={
          atribuindo
        }
      />

      <div className="cards-resumo">

        <Resumo
          titulo="Equipes"
          valor={
            equipes.length
          }
        />

        <Resumo
          titulo="Profissionais"
          valor={
            equipes.reduce(
              (
                total,
                equipe
              ) =>
                total +
                Number(
                  equipe.quantidade_profissionais ||
                    0
                ),
              0
            )
          }
        />

        <Resumo
          titulo="Custo diário"
          valor={
            formatarReal(
              equipes.reduce(
                (
                  total,
                  equipe
                ) =>
                  total +
                  Number(
                    equipe.custo_diario ||
                      0
                  ),
                0
              )
            )
          }
        />

        <Resumo
          titulo="Custo mensal"
          valor={
            formatarReal(
              equipes.reduce(
                (
                  total,
                  equipe
                ) =>
                  total +
                  Number(
                    equipe.custo_mensal ||
                      0
                  ),
                0
              )
            )
          }
        />

      </div>

      <div
        className="tabela-container"
        style={{
          marginTop:
            "24px",
        }}
      >

        <table>

          <thead>

            <tr>

              <th>
                Equipe
              </th>

              <th>
                Etapa
              </th>

              <th>
                Profissionais
              </th>

              <th>
                Custo diário
              </th>

              <th>
                Custo mensal
              </th>

              <th>Ações</th>
            </tr>

          </thead>

          <tbody>

            {equipes.length ===
            0 ? (

              <tr>

                <td
                  colSpan="6"
                  className="tabela-vazia"
                >
                  Nenhuma equipe foi atribuída a esta obra.
                </td>

              </tr>

            ) : (

              equipes.map(
                (equipe) => (

                  <tr
                    key={`${equipe.origem || "interna"}-${obterIdEquipe(equipe)}`}
                  >

                    <td>
                      {
                        equipe.nome_equipe
                      }
                    </td>

                    <td>
                      {equipe.etapa_atuacao ||
                        "-"}
                    </td>

                    <td>
                      {equipe.quantidade_profissionais ??
                        "-"}
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

                    <td><button type="button" className="cancel-button" disabled={atribuindo} onClick={() => onRemover(equipe)}>Excluir cadastro</button></td>
                  </tr>

                )
              )

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}

// =====================================================
// INSUMOS
// =====================================================

function TabelaInsumos({
  onRemover,
  insumos,
  catalogo,
  idObra,
  onAtribuir,
  atribuindo,
}) {
  const valorTotal =
    insumos.reduce(
      (
        total,
        insumo
      ) =>
        total +
        Number(
          insumo.quantidade_disponivel ||
            0
        ) *
          Number(
            insumo.valor_unitario ||
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
            Materiais / Insumos
          </h2>

          <p>
            Insumos atualmente atribuídos a esta obra.
          </p>

        </div>

      </div>

      <PainelAtribuicao
        tipo="insumo"
        catalogo={
          catalogo
        }
        idObra={
          idObra
        }
        onAtribuir={
          onAtribuir
        }
        atribuindo={
          atribuindo
        }
      />

      <div className="cards-resumo">

        <Resumo
          titulo="Tipos de insumo"
          valor={
            insumos.length
          }
        />

        <Resumo
          titulo="Valor total"
          valor={
            formatarReal(
              valorTotal
            )
          }
        />

      </div>

      <div
        className="tabela-container"
        style={{
          marginTop:
            "24px",
        }}
      >

        <table>

          <thead>

            <tr>

              <th>
                Insumo
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

              <th>Ações</th>
            </tr>

          </thead>

          <tbody>

            {insumos.length ===
            0 ? (

              <tr>

                <td
                  colSpan="5"
                  className="tabela-vazia"
                >
                  Nenhum insumo foi atribuído a esta obra.
                </td>

              </tr>

            ) : (

              insumos.map(
                (insumo) => (

                  <tr
                    key={
                      insumo
                        .id_insumos ??
                      insumo
                        .id_insumo ??
                      insumo.id
                    }
                  >

                    <td>
                      {
                        insumo.nome
                      }
                    </td>

                    <td>
                      {insumo.quantidade_disponivel ??
                        0}
                    </td>

                    <td>
                      {formatarReal(
                        insumo.valor_unitario
                      )}
                    </td>

                    <td>
                      {formatarReal(
                        Number(
                          insumo.quantidade_disponivel ||
                            0
                        ) *
                          Number(
                            insumo.valor_unitario ||
                              0
                          )
                      )}
                    </td>

                    <td><button type="button" className="cancel-button" disabled={atribuindo} onClick={() => onRemover(insumo)}>Excluir cadastro</button></td>
                  </tr>

                )
              )

            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}

// =====================================================
// MAQUINÁRIOS
// =====================================================

function TabelaMaquinarios({
  onRemover,
  maquinarios,
  catalogo,
  idObra,
  onAtribuir,
  atribuindo,
}) {
  const custoDiario =
    maquinarios.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.quantidade ||
            0
        ) *
          Number(
            item.custo_diario ||
              0
          ),
      0
    );

  const ativos =
    maquinarios.filter(
      (item) =>
        String(
          item.status ||
            ""
        )
          .trim()
          .toLowerCase() ===
        "ativo"
    ).length;

  return (
    <div>

      <div className="titulo-aba">

        <div>

          <span className="section-label">
            EQUIPAMENTOS
          </span>

          <h2>
            Maquinários
          </h2>

          <p>
            Equipamentos atualmente atribuídos a esta obra.
          </p>

        </div>

      </div>

      <PainelAtribuicao
        tipo="maquinario"
        catalogo={
          catalogo
        }
        idObra={
          idObra
        }
        onAtribuir={
          onAtribuir
        }
        atribuindo={
          atribuindo
        }
      />

      <div className="cards-resumo">

        <Resumo
          titulo="Tipos de maquinário"
          valor={
            maquinarios.length
          }
        />

        <Resumo
          titulo="Ativos"
          valor={
            ativos
          }
        />

        <Resumo
          titulo="Custo diário"
          valor={
            formatarReal(
              custoDiario
            )
          }
        />

      </div>

      <div
        className="tabela-container"
        style={{
          marginTop:
            "24px",
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
                Etapa
              </th>

              <th>
                Custo diário
              </th>

              <th>
                Status
              </th>

              <th>Ações</th>
            </tr>

          </thead>

          <tbody>

            {maquinarios.length ===
            0 ? (

              <tr>

                <td
                  colSpan="6"
                  className="tabela-vazia"
                >
                  Nenhum maquinário foi atribuído a esta obra.
                </td>

              </tr>

            ) : (

              maquinarios.map(
                (item) => (

                  <tr
                    key={
                      item
                        .id_maquina ??
                      item
                        .id_maquinario ??
                      item.id
                    }
                  >

                    <td>
                      {
                        item.nome
                      }
                    </td>

                    <td>
                      {item.quantidade ??
                        0}
                    </td>

                    <td>
                      {item.etapa_atuacao ||
                        "-"}
                    </td>

                    <td>
                      {formatarReal(
                        item.custo_diario
                      )}
                    </td>

                    <td>
                      {item.status ||
                        "-"}
                    </td>

                    <td><button type="button" className="cancel-button" disabled={atribuindo} onClick={() => onRemover(item)}>Excluir cadastro</button></td>
                  </tr>

                )
              )

            )}

          </tbody>

        </table>

      </div>

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
  const dados =
    useMemo(() => {
      const custoDiarioEquipes =
        equipes.reduce(
          (
            total,
            equipe
          ) =>
            total +
            Number(
              equipe.custo_diario ||
                0
            ),
          0
        );

      const custoMensalEquipes =
        equipes.reduce(
          (
            total,
            equipe
          ) =>
            total +
            Number(
              equipe.custo_mensal ||
                0
            ),
          0
        );

      const profissionais =
        equipes.reduce(
          (
            total,
            equipe
          ) =>
            total +
            Number(
              equipe.quantidade_profissionais ||
                0
            ),
          0
        );

      const valorInsumos =
        insumos.reduce(
          (
            total,
            insumo
          ) =>
            total +
            Number(
              insumo.quantidade_disponivel ||
                0
            ) *
              Number(
                insumo.valor_unitario ||
                  0
              ),
          0
        );

      const custoMaquinariosDia =
        maquinarios.reduce(
          (
            total,
            item
          ) =>
            total +
            Number(
              item.quantidade ||
                0
            ) *
              Number(
                item.custo_diario ||
                  0
              ),
          0
        );

      return {
        custoDiarioEquipes,
        custoMensalEquipes,
        profissionais,
        valorInsumos,
        custoMaquinariosDia,
      };
    }, [
      equipes,
      insumos,
      maquinarios,
    ]);

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
            Indicadores calculados utilizando somente os recursos atribuídos a esta obra.
          </p>

        </div>

      </div>

      <div className="cards-resumo">

        <Resumo
          titulo="Profissionais"
          valor={
            dados.profissionais
          }
        />

        <Resumo
          titulo="Custo equipes / dia"
          valor={
            formatarReal(
              dados
                .custoDiarioEquipes
            )
          }
        />

        <Resumo
          titulo="Custo equipes / mês"
          valor={
            formatarReal(
              dados
                .custoMensalEquipes
            )
          }
        />

        <Resumo
          titulo="Maquinários / dia"
          valor={
            formatarReal(
              dados
                .custoMaquinariosDia
            )
          }
        />

      </div>

      <div
        className="cards-resumo"
        style={{
          marginTop:
            "20px",
        }}
      >

        <Resumo
          titulo="Valor dos insumos"
          valor={
            formatarReal(
              dados
                .valorInsumos
            )
          }
        />

        <Resumo
          titulo="Orçamento da obra"
          valor={
            formatarReal(
              obra
                .orcamento_planejado
            )
          }
        />

        <Resumo
          titulo="Equipes atribuídas"
          valor={
            equipes.length
          }
        />

        <Resumo
          titulo="Maquinários atribuídos"
          valor={
            maquinarios.length
          }
        />

      </div>

    </div>
  );
}

export default ObraDetalhes;
