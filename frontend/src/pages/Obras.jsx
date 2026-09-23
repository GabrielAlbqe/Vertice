import { useEffect, useState } from "react";

import Layout from "../componentes/Layout";
import Card from "../componentes/Card";
import Table from "../componentes/Table";
import { requisitar } from "../api/api";

// =====================================================
// FORMULÁRIOS
// =====================================================

const formularioObraVazio = {
  nome: "",
  status: "",
  categoria: "",
  numero_pavimentos: "",
  data_inicio_planejada: "",
  data_termino_planejada: "",
  orcamento_planejado: "",
};


const insumoVazio = {
  nome: "",
  quantidade_lote: "",
  valor_lote: "",
};

const maquinarioVazio = {
  nome: "",
  quantidade: "",
  custo_diario_maquinario: "",
  prazo_final_estimado: "",
  status: "Ativo",
};

const planejamentoVazio = {
  etapa: "",
  origem_custo: "",
  valor_planejado: "",
  data_inicio_prevista: "",
  data_fim_prevista: "",
};


const ETAPAS = [
  "Mobilização",
  "Infraestrutura",
  "Supraestrutura e Alvenaria",
  "Instalações",
  "Revestimentos",
  "Acabamento",
];

const CHAVE_RECURSOS =
  "vertice_recursos_obras_prototipo_v1";

// Enquanto a rota definitiva de atribuição ainda não existe,
// a relação obra <-> equipe fica salva no navegador.
// Quando o backend estiver pronto, basta trocar para true
// e ajustar as duas rotas abaixo.
const CHAVE_ATRIBUICOES_EQUIPES =
  "vertice_atribuicoes_equipes_obras_v1";

const ATRIBUICAO_EQUIPE_API_ATIVA =
  false;

const ROTA_ATRIBUIR_EQUIPE =
  "/obra-equipes/insert";

const ROTA_REMOVER_ATRIBUICAO =
  "/obra-equipes/del";

// =====================================================
// COMPONENTE
// =====================================================

function Obras({ onNavegar, onAbrirObra }) {
  const [obras, setObras] = useState([]);
  const [carregando, setCarregando] =
    useState(true);
  const [salvando, setSalvando] =
    useState(false);
  const [erro, setErro] = useState("");

  // Modal cadastro/edição da obra
  const [modalAberto, setModalAberto] =
    useState(false);
  const [obraEditando, setObraEditando] =
    useState(null);
  const [formulario, setFormulario] =
    useState(formularioObraVazio);

  // Modal de recursos da obra
  const [modalRecursos, setModalRecursos] =
    useState(false);
  const [obraRecursos, setObraRecursos] =
    useState(null);
  const [abaRecursos, setAbaRecursos] =
    useState("equipes");

  // Recursos temporários enquanto as rotas definitivas
  // ainda estão sendo concluídas.
  const [recursosPorObra, setRecursosPorObra] =
    useState(() => {
      try {
        const salvo =
          localStorage.getItem(
            CHAVE_RECURSOS
          );

        return salvo
          ? JSON.parse(salvo)
          : {};
      } catch {
        return {};
      }
    });

  // Catálogo de equipes já cadastradas no sistema
  const [equipesDisponiveis, setEquipesDisponiveis] =
    useState([]);

  const [
    carregandoCatalogoEquipes,
    setCarregandoCatalogoEquipes,
  ] = useState(false);

  const [erroEquipes, setErroEquipes] =
    useState("");

  const [
    idEquipeSelecionada,
    setIdEquipeSelecionada,
  ] = useState("");

  // Relações temporárias obra <-> equipe.
  // Aqui salvamos somente IDs, sem duplicar cadastro da equipe.
  const [
    atribuicoesEquipes,
    setAtribuicoesEquipes,
  ] = useState(() => {
    try {
      const salvo =
        localStorage.getItem(
          CHAVE_ATRIBUICOES_EQUIPES
        );

      return salvo
        ? JSON.parse(salvo)
        : {};
    } catch {
      return {};
    }
  });

  const [formInsumo, setFormInsumo] =
    useState(insumoVazio);
  const [formMaquinario, setFormMaquinario] =
    useState(maquinarioVazio);
  const [
    formPlanejamento,
    setFormPlanejamento,
  ] = useState(planejamentoVazio);

  const idConstrutora =
    localStorage.getItem(
      "idconstrutora"
    );

  // =====================================================
  // PERSISTÊNCIA TEMPORÁRIA DOS RECURSOS
  // =====================================================

  useEffect(() => {
    localStorage.setItem(
      CHAVE_RECURSOS,
      JSON.stringify(
        recursosPorObra
      )
    );
  }, [recursosPorObra]);

  useEffect(() => {
    localStorage.setItem(
      CHAVE_ATRIBUICOES_EQUIPES,
      JSON.stringify(
        atribuicoesEquipes
      )
    );
  }, [atribuicoesEquipes]);

  // =====================================================
  // AUXILIARES
  // =====================================================

  function limparData(data) {
    if (!data) return "";
    return String(data).split("T")[0];
  }

  function formatarData(data) {
    const dataLimpa =
      limparData(data);

    if (!dataLimpa) return "-";

    const [ano, mes, dia] =
      dataLimpa.split("-");

    return `${dia}/${mes}/${ano}`;
  }

  function formatarReal(valor) {
    return Number(
      valor || 0
    ).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function normalizarStatus(status) {
    return String(status || "")
      .trim()
      .toLowerCase();
  }

  function obterIdEquipe(equipe) {
    return (
      equipe?.id_cadastro_equipes ??
      equipe?.id_equipe_terceirizad ??
      equipe?.id_equipe ??
      equipe?.id
    );
  }

  function extrairLista(dados, chaves = []) {
    if (Array.isArray(dados)) {
      return dados;
    }

    for (const chave of chaves) {
      if (Array.isArray(dados?.[chave])) {
        return dados[chave];
      }
    }

    if (Array.isArray(dados?.dados)) {
      return dados.dados;
    }

    if (Array.isArray(dados?.resultado)) {
      return dados.resultado;
    }

    return [];
  }

  function removerDuplicadasPorId(lista) {
    const mapa = new Map();

    lista.forEach((equipe) => {
      const id = obterIdEquipe(equipe);

      if (id !== undefined && id !== null) {
        mapa.set(String(id), equipe);
      }
    });

    return Array.from(mapa.values());
  }

  function normalizarObra(item) {
    return {
      ...item,

      id_obra:
        item.id_obra ??
        item.id,

      obra:
        item.nome ??
        item.nome_obra ??
        item.obra ??
        "",

      nome:
        item.nome ??
        item.nome_obra ??
        item.obra ??
        "",

      status:
        item.status ?? "",

      categoria:
        item.categoria ?? "",

      pavimentos:
        item.numero_pavimentos ??
        item.numero_pavimento ??
        item.pavimentos ??
        0,

      numero_pavimentos:
        item.numero_pavimentos ??
        item.numero_pavimento ??
        item.pavimentos ??
        0,

      data_inicio_planejada:
        limparData(
          item.data_inicio_planejada ??
            item.data_inicial_planejada
        ),

      data_termino_planejada:
        limparData(
          item.data_termino_planejada ??
            item.data_final_planejada
        ),

      data_inicial_planejada:
        limparData(
          item.data_inicio_planejada ??
            item.data_inicial_planejada
        ),

      data_final_planejada:
        limparData(
          item.data_termino_planejada ??
            item.data_final_planejada
        ),

      orcamento_planejado:
        Number(
          item.orcamento_planejado ||
            0
        ),

      id_construtora:
        item.id_construtora ??
        item.idconstrutora ??
        idConstrutora,
    };
  }

  function obterRecursos(idObra) {
    return (
      recursosPorObra[
        String(idObra)
      ] || {
        equipes: [],
        insumos: [],
        maquinarios: [],
        planejamento: [],
      }
    );
  }

  function atualizarRecursosDaObra(
    idObra,
    atualizador
  ) {
    const chave =
      String(idObra);

    setRecursosPorObra(
      (anterior) => {
        const atual =
          anterior[chave] || {
            equipes: [],
            insumos: [],
            maquinarios: [],
            planejamento: [],
          };

        return {
          ...anterior,
          [chave]:
            atualizador(atual),
        };
      }
    );
  }

  // =====================================================
  // BUSCAR OBRAS
  // =====================================================

  async function buscarObras() {
    try {
      setCarregando(true);
      setErro("");

      if (!idConstrutora) {
        throw new Error(
          "ID da construtora não encontrado. Faça login novamente."
        );
      }

      const dados =
        await requisitar(
          `/obras?id_construtora=${idConstrutora}`
        );

      const lista =
        Array.isArray(dados)
          ? dados
          : Array.isArray(dados?.obras)
            ? dados.obras
            : [];

      setObras(
        lista.map(normalizarObra)
      );
    } catch (error) {
      console.error(
        "Erro ao buscar obras:",
        error
      );

      setErro(
        error.message ||
          "Não foi possível carregar as obras."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    buscarObras();
  }, []);

  // =====================================================
  // FORMULÁRIO DA OBRA
  // =====================================================

  function handleChange(event) {
    const { name, value } =
      event.target;

    setFormulario(
      (anterior) => ({
        ...anterior,
        [name]: value,
      })
    );
  }

  function abrirModalCadastro() {
    setErro("");
    setObraEditando(null);
    setFormulario(
      formularioObraVazio
    );
    setModalAberto(true);
  }

  function abrirModalEdicao(obra) {
    setErro("");
    setObraEditando(obra);

    setFormulario({
      nome:
        obra.nome ??
        obra.obra ??
        "",

      status:
        obra.status ?? "",

      categoria:
        obra.categoria ?? "",

      numero_pavimentos:
        obra.numero_pavimentos ??
        obra.pavimentos ??
        "",

      data_inicio_planejada:
        limparData(
          obra.data_inicio_planejada ??
            obra.data_inicial_planejada
        ),

      data_termino_planejada:
        limparData(
          obra.data_termino_planejada ??
            obra.data_final_planejada
        ),

      orcamento_planejado:
        obra.orcamento_planejado ??
        "",
    });

    setModalAberto(true);
  }

  function fecharModal() {
    if (salvando) return;

    setModalAberto(false);
    setObraEditando(null);
    setFormulario(
      formularioObraVazio
    );
  }

  async function salvarObra(event) {
    event.preventDefault();

    try {
      setSalvando(true);
      setErro("");

      if (!idConstrutora) {
        throw new Error(
          "ID da construtora não encontrado."
        );
      }

      if (
        formulario
          .data_termino_planejada <
        formulario
          .data_inicio_planejada
      ) {
        throw new Error(
          "A data de término não pode ser anterior à data de início."
        );
      }

      const dadosObra = {
        nome:
          formulario.nome.trim(),

        status:
          formulario.status,

        id_construtora:
          Number(idConstrutora),

        categoria:
          formulario.categoria,

        numero_pavimentos:
          Number(
            formulario
              .numero_pavimentos
          ),

        data_inicio_planejada:
          formulario
            .data_inicio_planejada,

        data_termino_planejada:
          formulario
            .data_termino_planejada,

        orcamento_planejado:
          Number(
            formulario
              .orcamento_planejado
          ),
      };

      if (obraEditando) {
        await requisitar(
          `/obras/insert/${obraEditando.id_obra}`,
          {
            method: "PUT",
            body:
              JSON.stringify(
                dadosObra
              ),
          }
        );
      } else {
        await requisitar(
          "/obras/insert",
          {
            method: "POST",
            body:
              JSON.stringify(
                dadosObra
              ),
          }
        );
      }

      setModalAberto(false);
      setObraEditando(null);
      setFormulario(
        formularioObraVazio
      );

      await buscarObras();
    } catch (error) {
      console.error(
        "Erro ao salvar obra:",
        error
      );

      setErro(
        error.message ||
          "Erro ao salvar obra."
      );
    } finally {
      setSalvando(false);
    }
  }

  // =====================================================
  // EXCLUIR OBRA
  // =====================================================

  async function excluirObra(obra) {
    const confirmar =
      window.confirm(
        `Deseja realmente excluir a obra "${obra.obra}"?`
      );

    if (!confirmar) return;

    try {
      setErro("");

      await requisitar(
        `/obras/del/${obra.id_obra}`,
        {
          method: "DELETE",
        }
      );

      // Também limpa os recursos temporários
      // ligados à obra.
      setRecursosPorObra(
        (anterior) => {
          const copia = {
            ...anterior,
          };

          delete copia[
            String(obra.id_obra)
          ];

          return copia;
        }
      );

      await buscarObras();
    } catch (error) {
      console.error(
        "Erro ao excluir obra:",
        error
      );

      setErro(
        error.message ||
          "Erro ao excluir obra."
      );
    }
  }

  // =====================================================
  // ABRIR OBRA
  // =====================================================

  function abrirObra(obra) {
    if (
      typeof onAbrirObra ===
      "function"
    ) {
      onAbrirObra(obra);
    }
  }

  // =====================================================
  // RECURSOS DA OBRA
  // =====================================================

  function abrirModalRecursos(obra) {
    setObraRecursos(obra);
    setAbaRecursos("equipes");

    setIdEquipeSelecionada("");

    // A atribuição é uma relação separada do cadastro.
    // Portanto, aqui carregamos apenas o catálogo de equipes.
    buscarCatalogoEquipes();

    setFormInsumo(insumoVazio);
    setFormMaquinario(
      maquinarioVazio
    );
    setFormPlanejamento(
      planejamentoVazio
    );

    setModalRecursos(true);
  }

  function fecharModalRecursos() {
    setModalRecursos(false);
    setObraRecursos(null);
  }

  async function buscarCatalogoEquipes() {
    try {
      setCarregandoCatalogoEquipes(true);
      setErroEquipes("");

      // Tenta listagem geral primeiro.
      // Se o backend atual ainda exigir idobra,
      // monta o catálogo juntando as equipes encontradas
      // nas obras existentes.
      try {
        const dadosGerais =
          await requisitar(
            "/equipes"
          );

        const listaGeral =
          extrairLista(
            dadosGerais,
            ["equipes"]
          );

        if (listaGeral.length > 0) {
          setEquipesDisponiveis(
            removerDuplicadasPorId(
              listaGeral
            )
          );

          return;
        }
      } catch (erroListagemGeral) {
        console.warn(
          "Listagem geral de equipes indisponível. Montando catálogo pelas obras.",
          erroListagemGeral
        );
      }

      const respostas =
        await Promise.all(
          obras.map(
            async (obra) => {
              try {
                const dados =
                  await requisitar(
                    `/equipes/?idobra=${obra.id_obra}`
                  );

                return extrairLista(
                  dados,
                  ["equipes"]
                );
              } catch {
                return [];
              }
            }
          )
        );

      setEquipesDisponiveis(
        removerDuplicadasPorId(
          respostas.flat()
        )
      );
    } catch (error) {
      console.error(
        "Erro ao carregar catálogo de equipes:",
        error
      );

      setErroEquipes(
        "Não foi possível carregar as equipes cadastradas."
      );

      setEquipesDisponiveis([]);
    } finally {
      setCarregandoCatalogoEquipes(false);
    }
  }

  function obterIdsAtribuidosLocalmente(idObra) {
    const lista =
      atribuicoesEquipes[
        String(idObra)
      ] || [];

    return lista.map(
      (item) =>
        String(item.id_equipe)
    );
  }

  function obterEquipesAtribuidasExibidas() {
    if (!obraRecursos) {
      return [];
    }

    const idsAtribuidos =
      obterIdsAtribuidosLocalmente(
        obraRecursos.id_obra
      );

    return idsAtribuidos
      .map((id) =>
        equipesDisponiveis.find(
          (equipe) =>
            String(
              obterIdEquipe(
                equipe
              )
            ) ===
            String(id)
        )
      )
      .filter(Boolean);
  }

  function obterEquipesAindaDisponiveis() {
    if (!obraRecursos) {
      return equipesDisponiveis;
    }

    const idsAtribuidos =
      new Set(
        obterIdsAtribuidosLocalmente(
          obraRecursos.id_obra
        )
      );

    return equipesDisponiveis.filter(
      (equipe) => {
        const id =
          obterIdEquipe(equipe);

        return (
          id !== undefined &&
          id !== null &&
          !idsAtribuidos.has(
            String(id)
          )
        );
      }
    );
  }

  async function atribuirEquipeExistente(
    event
  ) {
    event.preventDefault();

    if (!obraRecursos) {
      return;
    }

    if (!idEquipeSelecionada) {
      setErroEquipes(
        "Selecione uma equipe para atribuir."
      );
      return;
    }

    const idObra =
      obraRecursos.id_obra;

    const idEquipe =
      Number(
        idEquipeSelecionada
      );

    try {
      setErroEquipes("");

      if (
        ATRIBUICAO_EQUIPE_API_ATIVA
      ) {
        await requisitar(
          ROTA_ATRIBUIR_EQUIPE,
          {
            method: "POST",
            body:
              JSON.stringify({
                id_obra:
                  Number(idObra),
                id_equipe:
                  idEquipe,
              }),
          }
        );
      } else {
        setAtribuicoesEquipes(
          (anterior) => {
            const chave =
              String(idObra);

            const atuais =
              anterior[chave] || [];

            const jaExiste =
              atuais.some(
                (item) =>
                  String(
                    item.id_equipe
                  ) ===
                  String(idEquipe)
              );

            if (jaExiste) {
              return anterior;
            }

            return {
              ...anterior,

              [chave]: [
                ...atuais,
                {
                  id_obra:
                    Number(idObra),
                  id_equipe:
                    idEquipe,
                },
              ],
            };
          }
        );
      }

      setIdEquipeSelecionada("");
    } catch (error) {
      console.error(
        "Erro ao atribuir equipe:",
        error
      );

      setErroEquipes(
        error.message ||
          "Não foi possível atribuir a equipe."
      );
    }
  }

  async function removerAtribuicaoEquipe(
    equipe
  ) {
    if (!obraRecursos) {
      return;
    }

    const idEquipe =
      obterIdEquipe(equipe);

    if (!idEquipe) {
      return;
    }

    const idObra =
      obraRecursos.id_obra;

    const confirmar =
      window.confirm(
        `Remover a equipe "${equipe.nome_equipe}" desta obra?`
      );

    if (!confirmar) {
      return;
    }

    try {
      setErroEquipes("");

      if (
        ATRIBUICAO_EQUIPE_API_ATIVA
      ) {
        await requisitar(
          `${ROTA_REMOVER_ATRIBUICAO}/${idObra}/${idEquipe}`,
          {
            method: "DELETE",
          }
        );
      } else {
        setAtribuicoesEquipes(
          (anterior) => {
            const chave =
              String(idObra);

            const atuais =
              anterior[chave] || [];

            return {
              ...anterior,

              [chave]:
                atuais.filter(
                  (item) =>
                    String(
                      item.id_equipe
                    ) !==
                    String(
                      idEquipe
                    )
                ),
            };
          }
        );
      }
    } catch (error) {
      console.error(
        "Erro ao remover atribuição:",
        error
      );

      setErroEquipes(
        error.message ||
          "Não foi possível remover a atribuição."
      );
    }
  }

  function atribuirInsumo(event) {
    event.preventDefault();

    if (!obraRecursos) return;

    const novoInsumo = {
      id_insumo:
        Date.now(),

      id_obra:
        obraRecursos.id_obra,

      nome:
        formInsumo.nome.trim(),

      quantidade_lote:
        Number(
          formInsumo
            .quantidade_lote
        ),

      valor_lote:
        Number(
          formInsumo
            .valor_lote
        ),
    };

    atualizarRecursosDaObra(
      obraRecursos.id_obra,
      (atual) => ({
        ...atual,
        insumos: [
          ...atual.insumos,
          novoInsumo,
        ],
      })
    );

    setFormInsumo(
      insumoVazio
    );
    setErro("");
  }

  function atribuirMaquinario(event) {
    event.preventDefault();

    if (!obraRecursos) return;

    const novoMaquinario = {
      id_maquinario:
        Date.now(),

      id_obra:
        obraRecursos.id_obra,

      nome:
        formMaquinario.nome.trim(),

      quantidade:
        Number(
          formMaquinario
            .quantidade
        ),

      custo_diario_maquinario:
        Number(
          formMaquinario
            .custo_diario_maquinario
        ),

      prazo_final_estimado:
        formMaquinario
          .prazo_final_estimado,

      status:
        formMaquinario.status,
    };

    atualizarRecursosDaObra(
      obraRecursos.id_obra,
      (atual) => ({
        ...atual,
        maquinarios: [
          ...atual.maquinarios,
          novoMaquinario,
        ],
      })
    );

    setFormMaquinario(
      maquinarioVazio
    );
    setErro("");
  }

  function adicionarPlanejamento(
    event
  ) {
    event.preventDefault();

    if (!obraRecursos) return;

    if (
      formPlanejamento
        .data_fim_prevista &&
      formPlanejamento
        .data_inicio_prevista &&
      formPlanejamento
        .data_fim_prevista <
        formPlanejamento
          .data_inicio_prevista
    ) {
      setErro(
        "A data final prevista não pode ser anterior à data inicial."
      );
      return;
    }

    const novoPlanejamento = {
      id_custo_planejado:
        Date.now(),

      id_obra:
        obraRecursos.id_obra,

      etapa:
        formPlanejamento.etapa,

      origem_custo:
        formPlanejamento
          .origem_custo,

      valor_planejado:
        Number(
          formPlanejamento
            .valor_planejado
        ),

      data_inicio_prevista:
        formPlanejamento
          .data_inicio_prevista,

      data_fim_prevista:
        formPlanejamento
          .data_fim_prevista,
    };

    atualizarRecursosDaObra(
      obraRecursos.id_obra,
      (atual) => ({
        ...atual,
        planejamento: [
          ...atual.planejamento,
          novoPlanejamento,
        ],
      })
    );

    setFormPlanejamento(
      planejamentoVazio
    );
    setErro("");
  }

  function removerRecurso(
    tipo,
    id
  ) {
    if (!obraRecursos) return;

    atualizarRecursosDaObra(
      obraRecursos.id_obra,
      (atual) => ({
        ...atual,

        [tipo]:
          atual[tipo].filter(
            (item) => {
              const idItem =
                item
                  .id_equipe_terceirizad ??
                item.id_insumo ??
                item.id_maquinario ??
                item.id_custo_planejado;

              return (
                String(idItem) !==
                String(id)
              );
            }
          ),
      })
    );
  }

  // =====================================================
  // INDICADORES
  // =====================================================

  const obrasAtivas =
    obras.filter((obra) => {
      const status =
        normalizarStatus(
          obra.status
        );

      return [
        "planejamento",
        "em andamento",
        "iniciada",
        "iniciado",
        "ativa",
        "ativo",
      ].includes(status);
    }).length;

  const obrasParalisadas =
    obras.filter(
      (obra) =>
        normalizarStatus(
          obra.status
        ) === "paralisada"
    ).length;

  const obrasConcluidas =
    obras.filter((obra) =>
      [
        "concluída",
        "concluida",
      ].includes(
        normalizarStatus(
          obra.status
        )
      )
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

  // =====================================================
  // TABELA
  // =====================================================

  const obrasTabela =
    obras.map((obra) => {
      const recursos =
        obterRecursos(
          obra.id_obra
        );

      return {
        ...obra,

        inicio:
          formatarData(
            obra
              .data_inicio_planejada
          ),

        fim:
          formatarData(
            obra
              .data_termino_planejada
          ),

        orcamento:
          formatarReal(
            obra.orcamento_planejado
          ),

        recursos: (
          <div
            style={{
              display: "flex",
              gap: "6px",
              flexWrap: "wrap",
            }}
          >
            <span className="badge">
              Equipes: {
                (
                  atribuicoesEquipes[
                    String(
                      obra.id_obra
                    )
                  ] || []
                ).length
              }
            </span>

            <span className="badge">
              I: {recursos.insumos.length}
            </span>

            <span className="badge">
              M: {recursos.maquinarios.length}
            </span>
          </div>
        ),

        acoes: (
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className="button"
              onClick={() =>
                abrirObra(obra)
              }
            >
              Abrir
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                abrirModalRecursos(
                  obra
                )
              }
            >
              Recursos
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                abrirModalEdicao(
                  obra
                )
              }
            >
              Editar
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                excluirObra(obra)
              }
            >
              Excluir
            </button>
          </div>
        ),
      };
    });

  const columns = [
    {
      key: "obra",
      label: "Obra",
    },
    {
      key: "status",
      label: "Status",
    },
    {
      key: "categoria",
      label: "Categoria",
    },
    {
      key: "pavimentos",
      label: "Pavimentos",
    },
    {
      key: "inicio",
      label: "Início planejado",
    },
    {
      key: "fim",
      label: "Término planejado",
    },
    {
      key: "orcamento",
      label: "Orçamento",
    },
    {
      key: "recursos",
      label: "Recursos",
    },
    {
      key: "acoes",
      label: "Ações",
    },
  ];

  const recursosSelecionados =
    obraRecursos
      ? obterRecursos(
          obraRecursos.id_obra
        )
      : {
          equipes: [],
          insumos: [],
          maquinarios: [],
          planejamento: [],
        };

  const equipesAtribuidas =
    obterEquipesAtribuidasExibidas();

  const equipesParaAtribuir =
    obterEquipesAindaDisponiveis();

  // =====================================================
  // JSX
  // =====================================================

  return (
    <Layout onNavegar={onNavegar}>

      <div className="dashboard">

        {/* CABEÇALHO */}

        <section className="dashboard-header">

          <div>

            <span className="dashboard-eyebrow">
              PORTFÓLIO
            </span>

            <h1>
              Obras
            </h1>

            <p>
              Cadastre as obras e atribua
              equipes, materiais, maquinários
              e planejamento a cada projeto.
            </p>

          </div>

          <div className="dashboard-header-actions">

            <button
              type="button"
              className="button"
              onClick={
                abrirModalCadastro
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

        {/* CARDS */}

        <section className="cards-grid">

          <Card
            title="Total de obras"
            value={obras.length}
            description="Obras cadastradas"
          />

          <Card
            title="Obras ativas"
            value={obrasAtivas}
            description="Planejamento ou execução"
          />

          <Card
            title="Paralisadas"
            value={obrasParalisadas}
            description="Necessitam acompanhamento"
          />

          <Card
            title="Orçamento total"
            value={
              formatarReal(
                orcamentoTotal
              )
            }
            description={`${obrasConcluidas} obra(s) concluída(s)`}
          />

        </section>

        {/* LISTAGEM */}

        <section className="dashboard-section">

          <div className="section-header">

            <div>

              <span className="section-label">
                PORTFÓLIO DE OBRAS
              </span>

              <h2>
                Obras cadastradas
              </h2>

              <p>
                Abra a obra ou use
                "Recursos" para fazer as
                atribuições enquanto as novas
                rotas do backend são
                finalizadas.
              </p>

            </div>

            <button
              type="button"
              className="button"
              onClick={
                abrirModalCadastro
              }
            >
              + Nova obra
            </button>

          </div>

          <div className="dashboard-table">

            {carregando ? (
              <p>
                Carregando obras...
              </p>
            ) : obras.length === 0 ? (
              <p>
                Nenhuma obra cadastrada.
              </p>
            ) : (
              <Table
                columns={columns}
                data={obrasTabela}
              />
            )}

          </div>

        </section>

        {/* =================================================
            MODAL CADASTRAR / EDITAR OBRA
        ================================================= */}

        {modalAberto && (

          <div className="modal-overlay">

            <div className="modal-container modal-obra">

              <div className="modal-header">

                <div>

                  <span className="section-label">
                    {obraEditando
                      ? "EDITAR OBRA"
                      : "NOVA OBRA"}
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
                  salvarObra
                }
              >

                <div className="obra-form-grid">

                  <div className="form-group">

                    <label>
                      Nome da obra
                    </label>

                    <input
                      type="text"
                      name="nome"
                      value={
                        formulario.nome
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Ex.: Residencial Vértice"
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
                      onChange={
                        handleChange
                      }
                      required
                    >

                      <option value="">
                        Selecione
                      </option>

                      <option value="Planejamento">
                        Planejamento
                      </option>

                      <option value="Em Andamento">
                        Em Andamento
                      </option>

                      <option value="Concluída">
                        Concluída
                      </option>

                      <option value="Paralisada">
                        Paralisada
                      </option>

                    </select>

                  </div>

                  <div className="form-group">

                    <label>
                      Categoria
                    </label>

                    <select
                      name="categoria"
                      value={
                        formulario.categoria
                      }
                      onChange={
                        handleChange
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
                      Número de pavimentos
                    </label>

                    <input
                      type="number"
                      name="numero_pavimentos"
                      min="1"
                      value={
                        formulario
                          .numero_pavimentos
                      }
                      onChange={
                        handleChange
                      }
                      required
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Data de início planejada
                    </label>

                    <input
                      type="date"
                      name="data_inicio_planejada"
                      value={
                        formulario
                          .data_inicio_planejada
                      }
                      onChange={
                        handleChange
                      }
                      required
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Data de término planejada
                    </label>

                    <input
                      type="date"
                      name="data_termino_planejada"
                      value={
                        formulario
                          .data_termino_planejada
                      }
                      onChange={
                        handleChange
                      }
                      required
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Orçamento planejado
                    </label>

                    <input
                      type="number"
                      name="orcamento_planejado"
                      min="0"
                      step="0.01"
                      value={
                        formulario
                          .orcamento_planejado
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Ex.: 1500000"
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
                    disabled={
                      salvando
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
                      : obraEditando
                        ? "Salvar alterações"
                        : "Cadastrar obra"}
                  </button>

                </div>

              </form>

            </div>

          </div>
        )}

        {/* =================================================
            MODAL RECURSOS DA OBRA
        ================================================= */}

        {modalRecursos &&
          obraRecursos && (

          <div className="modal-overlay">

            <div
              className="modal-container modal-obra"
              style={{
                maxWidth: "1050px",
                width: "94%",
                maxHeight: "92vh",
                overflowY: "auto",
              }}
            >

              <div className="modal-header">

                <div>

                  <span className="section-label">
                    RECURSOS DA OBRA
                  </span>

                  <h2>
                    {obraRecursos.obra}
                  </h2>

                  <p>
                    Gerencie quais equipes e recursos
                    estão atribuídos a esta obra.
                  </p>

                </div>

                <button
                  type="button"
                  className="modal-close"
                  onClick={
                    fecharModalRecursos
                  }
                >
                  ×
                </button>

              </div>

              {/* ABAS */}

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                  marginBottom: "24px",
                }}
              >

                {[
                  ["equipes", "Equipes"],
                  ["insumos", "Materiais e Insumos"],
                  ["maquinarios", "Maquinários"],
                  ["planejamento", "Planejamento"],
                ].map(
                  ([chave, label]) => (

                    <button
                      key={chave}
                      type="button"
                      className={
                        abaRecursos ===
                        chave
                          ? "button"
                          : "secondary-button"
                      }
                      onClick={() =>
                        setAbaRecursos(
                          chave
                        )
                      }
                    >
                      {label}
                    </button>

                  )
                )}

              </div>

              {/* ============================
                  EQUIPES
              ============================ */}

              {abaRecursos ===
                "equipes" && (

                <div>

                  <div className="section-header">

                    <div>

                      <span className="section-label">
                        EQUIPES TERCEIRIZADAS
                      </span>

                      <h2>
                        Atribuir equipes à obra
                      </h2>

                      <p>
                        A equipe já existe no cadastro.
                        Aqui você apenas escolhe qual
                        equipe será vinculada à obra
                        selecionada.
                      </p>

                    </div>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={
                        buscarCatalogoEquipes
                      }
                    >
                      Atualizar
                    </button>

                  </div>

                  {erroEquipes && (
                    <div className="auth-error">
                      {erroEquipes}
                    </div>
                  )}

                  {/* ATRIBUIR EQUIPE EXISTENTE */}

                  <form
                    className="obra-form"
                    onSubmit={
                      atribuirEquipeExistente
                    }
                    style={{
                      marginTop: "20px",
                    }}
                  >

                    <div className="obra-form-grid">

                      <div className="form-group">

                        <label>
                          Equipe cadastrada
                        </label>

                        <select
                          value={
                            idEquipeSelecionada
                          }
                          onChange={(event) =>
                            setIdEquipeSelecionada(
                              event.target.value
                            )
                          }
                          disabled={
                            carregandoCatalogoEquipes
                          }
                          required
                        >

                          <option value="">
                            {carregandoCatalogoEquipes
                              ? "Carregando equipes..."
                              : "Selecione uma equipe"}
                          </option>

                          {equipesParaAtribuir.map(
                            (equipe) => {

                              const id =
                                obterIdEquipe(
                                  equipe
                                );

                              return (
                                <option
                                  key={id}
                                  value={id}
                                >
                                  {equipe.nome_equipe}
                                  {equipe.etapa_atuacao
                                    ? ` — ${equipe.etapa_atuacao}`
                                    : ""}
                                </option>
                              );
                            }
                          )}

                        </select>

                      </div>

                    </div>

                    <div className="modal-actions">

                      <button
                        type="submit"
                        className="button"
                        disabled={
                          !idEquipeSelecionada ||
                          carregandoCatalogoEquipes
                        }
                      >
                        + Atribuir equipe
                      </button>

                    </div>

                  </form>

                  {!ATRIBUICAO_EQUIPE_API_ATIVA && (
                    <p
                      style={{
                        marginTop: "10px",
                        fontSize: "13px",
                        opacity: 0.72,
                      }}
                    >
                      Enquanto a rota definitiva de
                      atribuição não estiver pronta, o sistema
                      salva somente a relação id_obra +
                      id_equipe no navegador. O cadastro da
                      equipe permanece intacto.
                    </p>
                  )}

                  {/* EQUIPES JÁ ATRIBUÍDAS */}

                  <div
                    className="section-header"
                    style={{
                      marginTop: "30px",
                    }}
                  >

                    <div>

                      <span className="section-label">
                        EQUIPES DA OBRA
                      </span>

                      <h2>
                        Equipes atribuídas
                      </h2>

                      <p>
                        {equipesAtribuidas.length}
                        {" "}
                        equipe(s) vinculada(s) a esta obra.
                      </p>

                    </div>

                  </div>

                  <div
                    className="dashboard-table"
                    style={{
                      marginTop: "16px",
                    }}
                  >

                    {carregandoCatalogoEquipes ? (

                      <p>
                        Carregando equipes...
                      </p>

                    ) : equipesAtribuidas.length ===
                      0 ? (

                      <p>
                        Nenhuma equipe atribuída
                        a esta obra.
                      </p>

                    ) : (

                      <table>

                        <thead>
                          <tr>
                            <th>Equipe</th>
                            <th>Etapa atual</th>
                            <th>Profissionais</th>
                            <th>Custo diário</th>
                            <th>Custo mensal</th>
                            <th>Ações</th>
                          </tr>
                        </thead>

                        <tbody>

                          {equipesAtribuidas.map(
                            (equipe) => {

                              const id =
                                obterIdEquipe(
                                  equipe
                                );

                              return (
                                <tr
                                  key={id}
                                >

                                  <td>
                                    {equipe.nome_equipe}
                                  </td>

                                  <td>
                                    {equipe.etapa_atuacao || "-"}
                                  </td>

                                  <td>
                                    {equipe.quantidade_profissionais ?? "-"}
                                  </td>

                                  <td>
                                    {formatarReal(
                                      equipe.custo_diario ??
                                      equipe.custo_diario_total
                                    )}
                                  </td>

                                  <td>
                                    {formatarReal(
                                      equipe.custo_mensal
                                    )}
                                  </td>

                                  <td>

                                    <button
                                      type="button"
                                      className="secondary-button"
                                      onClick={() =>
                                        removerAtribuicaoEquipe(
                                          equipe
                                        )
                                      }
                                    >
                                      Remover atribuição
                                    </button>

                                  </td>

                                </tr>
                              );
                            }
                          )}

                        </tbody>

                      </table>

                    )}

                  </div>

                </div>

              )}

              {/* ============================
                  INSUMOS
              ============================ */}

              {abaRecursos ===
                "insumos" && (

                <div>

                  <div className="section-header">

                    <div>

                      <span className="section-label">
                        MATERIAIS
                      </span>

                      <h2>
                        Atribuir material ou insumo
                      </h2>

                    </div>

                  </div>

                  <form
                    className="obra-form"
                    onSubmit={
                      atribuirInsumo
                    }
                  >

                    <div className="obra-form-grid">

                      <div className="form-group">

                        <label>
                          Nome
                        </label>

                        <input
                          type="text"
                          value={
                            formInsumo.nome
                          }
                          onChange={(e) =>
                            setFormInsumo(
                              {
                                ...formInsumo,
                                nome:
                                  e.target
                                    .value,
                              }
                            )
                          }
                          required
                        />

                      </div>

                      <div className="form-group">

                        <label>
                          Quantidade por lote
                        </label>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            formInsumo
                              .quantidade_lote
                          }
                          onChange={(e) =>
                            setFormInsumo(
                              {
                                ...formInsumo,
                                quantidade_lote:
                                  e.target
                                    .value,
                              }
                            )
                          }
                          required
                        />

                      </div>

                      <div className="form-group">

                        <label>
                          Valor do lote
                        </label>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            formInsumo
                              .valor_lote
                          }
                          onChange={(e) =>
                            setFormInsumo(
                              {
                                ...formInsumo,
                                valor_lote:
                                  e.target
                                    .value,
                              }
                            )
                          }
                          required
                        />

                      </div>

                    </div>

                    <div className="modal-actions">

                      <button
                        type="submit"
                        className="button"
                      >
                        Atribuir insumo
                      </button>

                    </div>

                  </form>

                  <div
                    className="dashboard-table"
                    style={{
                      marginTop: "24px",
                    }}
                  >

                    {recursosSelecionados
                      .insumos.length ===
                    0 ? (
                      <p>
                        Nenhum insumo atribuído.
                      </p>
                    ) : (

                      <table>

                        <thead>
                          <tr>
                            <th>Insumo</th>
                            <th>Qtd. lote</th>
                            <th>Valor lote</th>
                            <th>Ações</th>
                          </tr>
                        </thead>

                        <tbody>

                          {recursosSelecionados
                            .insumos
                            .map(
                              (insumo) => (

                                <tr
                                  key={
                                    insumo
                                      .id_insumo
                                  }
                                >

                                  <td>
                                    {insumo.nome}
                                  </td>

                                  <td>
                                    {insumo.quantidade_lote}
                                  </td>

                                  <td>
                                    {formatarReal(
                                      insumo
                                        .valor_lote
                                    )}
                                  </td>

                                  <td>

                                    <button
                                      type="button"
                                      className="secondary-button"
                                      onClick={() =>
                                        removerRecurso(
                                          "insumos",
                                          insumo
                                            .id_insumo
                                        )
                                      }
                                    >
                                      Remover
                                    </button>

                                  </td>

                                </tr>

                              )
                            )}

                        </tbody>

                      </table>

                    )}

                  </div>

                </div>

              )}

              {/* ============================
                  MAQUINÁRIOS
              ============================ */}

              {abaRecursos ===
                "maquinarios" && (

                <div>

                  <div className="section-header">

                    <div>

                      <span className="section-label">
                        EQUIPAMENTOS
                      </span>

                      <h2>
                        Atribuir maquinário
                      </h2>

                    </div>

                  </div>

                  <form
                    className="obra-form"
                    onSubmit={
                      atribuirMaquinario
                    }
                  >

                    <div className="obra-form-grid">

                      <div className="form-group">

                        <label>
                          Nome
                        </label>

                        <input
                          type="text"
                          value={
                            formMaquinario
                              .nome
                          }
                          onChange={(e) =>
                            setFormMaquinario(
                              {
                                ...formMaquinario,
                                nome:
                                  e.target
                                    .value,
                              }
                            )
                          }
                          required
                        />

                      </div>

                      <div className="form-group">

                        <label>
                          Quantidade
                        </label>

                        <input
                          type="number"
                          min="1"
                          value={
                            formMaquinario
                              .quantidade
                          }
                          onChange={(e) =>
                            setFormMaquinario(
                              {
                                ...formMaquinario,
                                quantidade:
                                  e.target
                                    .value,
                              }
                            )
                          }
                          required
                        />

                      </div>

                      <div className="form-group">

                        <label>
                          Custo diário por unidade
                        </label>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            formMaquinario
                              .custo_diario_maquinario
                          }
                          onChange={(e) =>
                            setFormMaquinario(
                              {
                                ...formMaquinario,
                                custo_diario_maquinario:
                                  e.target
                                    .value,
                              }
                            )
                          }
                          required
                        />

                      </div>

                      <div className="form-group">

                        <label>
                          Prazo final estimado
                        </label>

                        <input
                          type="date"
                          value={
                            formMaquinario
                              .prazo_final_estimado
                          }
                          onChange={(e) =>
                            setFormMaquinario(
                              {
                                ...formMaquinario,
                                prazo_final_estimado:
                                  e.target
                                    .value,
                              }
                            )
                          }
                        />

                      </div>

                      <div className="form-group">

                        <label>
                          Status
                        </label>

                        <select
                          value={
                            formMaquinario
                              .status
                          }
                          onChange={(e) =>
                            setFormMaquinario(
                              {
                                ...formMaquinario,
                                status:
                                  e.target
                                    .value,
                              }
                            )
                          }
                        >

                          <option value="Ativo">
                            Ativo
                          </option>

                          <option value="Inativo">
                            Inativo
                          </option>

                        </select>

                      </div>

                    </div>

                    <div className="modal-actions">

                      <button
                        type="submit"
                        className="button"
                      >
                        Atribuir maquinário
                      </button>

                    </div>

                  </form>

                  <div
                    className="dashboard-table"
                    style={{
                      marginTop: "24px",
                    }}
                  >

                    {recursosSelecionados
                      .maquinarios.length ===
                    0 ? (
                      <p>
                        Nenhum maquinário atribuído.
                      </p>
                    ) : (

                      <table>

                        <thead>
                          <tr>
                            <th>Maquinário</th>
                            <th>Qtd.</th>
                            <th>Custo/un.</th>
                            <th>Prazo</th>
                            <th>Status</th>
                            <th>Ações</th>
                          </tr>
                        </thead>

                        <tbody>

                          {recursosSelecionados
                            .maquinarios
                            .map(
                              (item) => (

                                <tr
                                  key={
                                    item
                                      .id_maquinario
                                  }
                                >

                                  <td>
                                    {item.nome}
                                  </td>

                                  <td>
                                    {item.quantidade}
                                  </td>

                                  <td>
                                    {formatarReal(
                                      item
                                        .custo_diario_maquinario
                                    )}
                                  </td>

                                  <td>
                                    {formatarData(
                                      item
                                        .prazo_final_estimado
                                    )}
                                  </td>

                                  <td>
                                    {item.status}
                                  </td>

                                  <td>

                                    <button
                                      type="button"
                                      className="secondary-button"
                                      onClick={() =>
                                        removerRecurso(
                                          "maquinarios",
                                          item
                                            .id_maquinario
                                        )
                                      }
                                    >
                                      Remover
                                    </button>

                                  </td>

                                </tr>

                              )
                            )}

                        </tbody>

                      </table>

                    )}

                  </div>

                </div>

              )}

              {/* ============================
                  PLANEJAMENTO
              ============================ */}

              {abaRecursos ===
                "planejamento" && (

                <div>

                  <div className="section-header">

                    <div>

                      <span className="section-label">
                        CUSTO PLANEJADO
                      </span>

                      <h2>
                        Planejamento por etapa
                      </h2>

                    </div>

                  </div>

                  <form
                    className="obra-form"
                    onSubmit={
                      adicionarPlanejamento
                    }
                  >

                    <div className="obra-form-grid">

                      <div className="form-group">

                        <label>
                          Etapa
                        </label>

                        <select
                          value={
                            formPlanejamento
                              .etapa
                          }
                          onChange={(e) =>
                            setFormPlanejamento(
                              {
                                ...formPlanejamento,
                                etapa:
                                  e.target
                                    .value,
                              }
                            )
                          }
                          required
                        >

                          <option value="">
                            Selecione
                          </option>

                          {ETAPAS.map(
                            (etapa) => (
                              <option
                                key={etapa}
                                value={etapa}
                              >
                                {etapa}
                              </option>
                            )
                          )}

                        </select>

                      </div>

                      <div className="form-group">

                        <label>
                          Origem do custo
                        </label>

                        <select
                          value={
                            formPlanejamento
                              .origem_custo
                          }
                          onChange={(e) =>
                            setFormPlanejamento(
                              {
                                ...formPlanejamento,
                                origem_custo:
                                  e.target
                                    .value,
                              }
                            )
                          }
                          required
                        >

                          <option value="">
                            Selecione
                          </option>

                          <option value="Equipe">
                            Equipe
                          </option>

                          <option value="Insumo">
                            Insumo
                          </option>

                          <option value="Maquinário">
                            Maquinário
                          </option>

                        </select>

                      </div>

                      <div className="form-group">

                        <label>
                          Valor planejado
                        </label>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            formPlanejamento
                              .valor_planejado
                          }
                          onChange={(e) =>
                            setFormPlanejamento(
                              {
                                ...formPlanejamento,
                                valor_planejado:
                                  e.target
                                    .value,
                              }
                            )
                          }
                          required
                        />

                      </div>

                      <div className="form-group">

                        <label>
                          Início previsto
                        </label>

                        <input
                          type="date"
                          value={
                            formPlanejamento
                              .data_inicio_prevista
                          }
                          onChange={(e) =>
                            setFormPlanejamento(
                              {
                                ...formPlanejamento,
                                data_inicio_prevista:
                                  e.target
                                    .value,
                              }
                            )
                          }
                          required
                        />

                      </div>

                      <div className="form-group">

                        <label>
                          Fim previsto
                        </label>

                        <input
                          type="date"
                          value={
                            formPlanejamento
                              .data_fim_prevista
                          }
                          onChange={(e) =>
                            setFormPlanejamento(
                              {
                                ...formPlanejamento,
                                data_fim_prevista:
                                  e.target
                                    .value,
                              }
                            )
                          }
                          required
                        />

                      </div>

                    </div>

                    <div className="modal-actions">

                      <button
                        type="submit"
                        className="button"
                      >
                        Adicionar planejamento
                      </button>

                    </div>

                  </form>

                  <div
                    className="dashboard-table"
                    style={{
                      marginTop: "24px",
                    }}
                  >

                    {recursosSelecionados
                      .planejamento
                      .length === 0 ? (
                      <p>
                        Nenhum custo planejado
                        cadastrado.
                      </p>
                    ) : (

                      <table>

                        <thead>
                          <tr>
                            <th>Etapa</th>
                            <th>Origem</th>
                            <th>Valor</th>
                            <th>Início</th>
                            <th>Fim</th>
                            <th>Ações</th>
                          </tr>
                        </thead>

                        <tbody>

                          {recursosSelecionados
                            .planejamento
                            .map(
                              (item) => (

                                <tr
                                  key={
                                    item
                                      .id_custo_planejado
                                  }
                                >

                                  <td>
                                    {item.etapa}
                                  </td>

                                  <td>
                                    {item.origem_custo}
                                  </td>

                                  <td>
                                    {formatarReal(
                                      item
                                        .valor_planejado
                                    )}
                                  </td>

                                  <td>
                                    {formatarData(
                                      item
                                        .data_inicio_prevista
                                    )}
                                  </td>

                                  <td>
                                    {formatarData(
                                      item
                                        .data_fim_prevista
                                    )}
                                  </td>

                                  <td>

                                    <button
                                      type="button"
                                      className="secondary-button"
                                      onClick={() =>
                                        removerRecurso(
                                          "planejamento",
                                          item
                                            .id_custo_planejado
                                        )
                                      }
                                    >
                                      Remover
                                    </button>

                                  </td>

                                </tr>

                              )
                            )}

                        </tbody>

                      </table>

                    )}

                  </div>

                </div>

              )}

            </div>

          </div>

        )}

      </div>

    </Layout>
  );
}

export default Obras;
