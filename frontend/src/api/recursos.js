import {
  extrairLista,
  requisitar,
} from "./api.js";

// =====================================================
// CHAVES DO LOCALSTORAGE
// =====================================================

const CHAVE_EQUIPES =
  "vertice_catalogo_equipes_empresa";

const CHAVE_ATRIBUICOES =
  "vertice_atribuicoes_equipes_obras";

// =====================================================
// JSON LOCAL
// =====================================================

function lerJSON(
  chave,
  padrao
) {
  try {
    const salvo =
      localStorage.getItem(
        chave
      );

    if (!salvo) {
      return padrao;
    }

    return JSON.parse(
      salvo
    );
  } catch {
    return padrao;
  }
}

function salvarJSON(
  chave,
  valor
) {
  localStorage.setItem(
    chave,
    JSON.stringify(
      valor
    )
  );
}

// =====================================================
// IDS
// =====================================================

export function obterIdEquipe(
  item
) {
  return (
    item?.id_equipe ??
    item?.id_equipe_catalogo ??
    item?.id_cadastro_equipes ??
    item?.id_equipe_terceirizad ??
    item?.id_equipe_terceirizada ??
    item?.id
  );
}

export function obterIdInsumo(
  item
) {
  return (
    item?.id_insumos ??
    item?.id_insumo ??
    item?.id_cadastro_de_insumos ??
    item?.id
  );
}

export function obterIdMaquinario(
  item
) {
  return (
    item?.id_maquina ??
    item?.id_maquinario ??
    item?.id
  );
}

// =====================================================
// EQUIPES DA EMPRESA
// =====================================================

function lerEquipes() {
  const dados =
    lerJSON(
      CHAVE_EQUIPES,
      []
    );

  return Array.isArray(
    dados
  )
    ? dados
    : [];
}

function salvarEquipes(
  equipes
) {
  salvarJSON(
    CHAVE_EQUIPES,
    equipes
  );
}

function normalizarEquipe(
  equipe = {}
) {
  return {
    ...equipe,

    id_equipe:
      obterIdEquipe(
        equipe
      ),

    nome_equipe:
      equipe.nome_equipe ??
      equipe.nome ??
      "",

    area_atuacao:
      equipe.area_atuacao ??
      equipe.etapa_atuacao ??
      "",

    quantidade_profissionais:
      Number(
        equipe.quantidade_profissionais ??
        0
      ),

    custo_diario_total:
      Number(
        equipe.custo_diario_total ??
        equipe.custo_diario ??
        0
      ),

    id_construtora:
      equipe.id_construtora ??
      equipe.idconstrutora ??
      null,
  };
}

// =====================================================
// LISTAR EQUIPES DA EMPRESA
// =====================================================

export async function listarEquipesEmpresa(
  idConstrutora = null
) {
  const equipes =
    lerEquipes().map(
      normalizarEquipe
    );

  if (!idConstrutora) {
    return equipes;
  }

  return equipes.filter(
    (equipe) =>
      Number(
        equipe.id_construtora
      ) ===
      Number(
        idConstrutora
      )
  );
}

// =====================================================
// COMPATIBILIDADE COM CÓDIGOS ANTIGOS
// =====================================================

export async function listarEquipesTerceirizadas() {
  const idConstrutora =
    localStorage.getItem(
      "idconstrutora"
    ) ||
    localStorage.getItem(
      "id_construtora"
    );

  return listarEquipesEmpresa(
    idConstrutora
  );
}

// =====================================================
// CRIAR EQUIPE
// =====================================================

export async function criarEquipe(
  dados
) {
  const equipes =
    lerEquipes();

  const idConstrutora =
    dados.id_construtora ??
    localStorage.getItem(
      "idconstrutora"
    ) ??
    localStorage.getItem(
      "id_construtora"
    );

  if (!idConstrutora) {
    throw new Error(
      "Construtora não identificada."
    );
  }

  let id =
    Date.now();

  while (
    equipes.some(
      (equipe) =>
        String(
          obterIdEquipe(
            equipe
          )
        ) ===
        String(id)
    )
  ) {
    id += 1;
  }

  const novaEquipe = {
    id_equipe: id,

    nome_equipe:
      String(
        dados.nome_equipe ??
        ""
      ).trim(),

    area_atuacao:
      String(
        dados.area_atuacao ??
        ""
      ),

    quantidade_profissionais:
      Number(
        dados.quantidade_profissionais ??
        0
      ),

    custo_diario_total:
      Number(
        dados.custo_diario_total ??
        0
      ),

    id_construtora:
      Number(
        idConstrutora
      ),
  };

  if (
    !novaEquipe.nome_equipe
  ) {
    throw new Error(
      "Informe o nome da equipe."
    );
  }

  if (
    !novaEquipe.area_atuacao
  ) {
    throw new Error(
      "Selecione a área de atuação."
    );
  }

  if (
    novaEquipe
      .quantidade_profissionais <=
    0
  ) {
    throw new Error(
      "Informe a quantidade de profissionais."
    );
  }

  equipes.push(
    novaEquipe
  );

  salvarEquipes(
    equipes
  );

  return novaEquipe;
}

// =====================================================
// ATUALIZAR EQUIPE
// =====================================================

export async function atualizarEquipe(
  id,
  dados
) {
  const equipes =
    lerEquipes();

  const indice =
    equipes.findIndex(
      (equipe) =>
        String(
          obterIdEquipe(
            equipe
          )
        ) ===
        String(id)
    );

  if (indice === -1) {
    throw new Error(
      "Equipe não encontrada."
    );
  }

  equipes[indice] = {
    ...equipes[indice],

    nome_equipe:
      String(
        dados.nome_equipe ??
        ""
      ).trim(),

    area_atuacao:
      String(
        dados.area_atuacao ??
        ""
      ),

    quantidade_profissionais:
      Number(
        dados.quantidade_profissionais ??
        0
      ),

    custo_diario_total:
      Number(
        dados.custo_diario_total ??
        0
      ),
  };

  salvarEquipes(
    equipes
  );

  return equipes[
    indice
  ];
}

// =====================================================
// EXCLUIR EQUIPE
// =====================================================

export async function excluirEquipe(
  equipeOuId
) {
  const id =
    typeof equipeOuId ===
    "object"
      ? obterIdEquipe(
          equipeOuId
        )
      : equipeOuId;

  if (!id) {
    throw new Error(
      "Equipe não identificada."
    );
  }

  const novasEquipes =
    lerEquipes().filter(
      (equipe) =>
        String(
          obterIdEquipe(
            equipe
          )
        ) !==
        String(id)
    );

  salvarEquipes(
    novasEquipes
  );

  const atribuicoes =
    lerAtribuicoes();

  Object.keys(
    atribuicoes
  ).forEach(
    (idObra) => {
      atribuicoes[
        idObra
      ] =
        (
          atribuicoes[
            idObra
          ] || []
        ).filter(
          (idEquipe) =>
            String(
              idEquipe
            ) !==
            String(id)
        );
    }
  );

  salvarAtribuicoes(
    atribuicoes
  );

  return {
    sucesso: true,
  };
}

// =====================================================
// ATRIBUIÇÕES
// =====================================================

function lerAtribuicoes() {
  const dados =
    lerJSON(
      CHAVE_ATRIBUICOES,
      {}
    );

  if (
    !dados ||
    typeof dados !==
      "object" ||
    Array.isArray(dados)
  ) {
    return {};
  }

  const valores =
    Object.values(
      dados
    );

  // Formato antigo:
  // {
  //   idEquipe: idObra
  // }

  const formatoAntigo =
    valores.length > 0 &&
    valores.every(
      (valor) =>
        !Array.isArray(
          valor
        )
    );

  if (!formatoAntigo) {
    return dados;
  }

  // Novo formato:
  // {
  //   idObra: [idEquipe]
  // }

  const convertido = {};

  Object.entries(
    dados
  ).forEach(
    ([
      idEquipe,
      idObra,
    ]) => {
      if (!idObra) {
        return;
      }

      const chave =
        String(
          idObra
        );

      if (
        !Array.isArray(
          convertido[
            chave
          ]
        )
      ) {
        convertido[
          chave
        ] = [];
      }

      convertido[
        chave
      ].push(
        String(
          idEquipe
        )
      );
    }
  );

  salvarAtribuicoes(
    convertido
  );

  return convertido;
}

function salvarAtribuicoes(
  atribuicoes
) {
  salvarJSON(
    CHAVE_ATRIBUICOES,
    atribuicoes
  );
}

// =====================================================
// IDS DAS EQUIPES DE UMA OBRA
// =====================================================

export function obterIdsEquipesDaObra(
  idObra
) {
  const atribuicoes =
    lerAtribuicoes();

  const lista =
    atribuicoes[
      String(
        idObra
      )
    ];

  return Array.isArray(
    lista
  )
    ? lista
    : [];
}

// =====================================================
// ATRIBUIR EQUIPE À OBRA
// =====================================================

export async function atribuirEquipe(
  equipe,
  idObra
) {
  const idEquipe =
    obterIdEquipe(
      equipe
    );

  if (!idEquipe) {
    throw new Error(
      "Equipe não identificada."
    );
  }

  if (!idObra) {
    throw new Error(
      "Obra não identificada."
    );
  }

  const atribuicoes =
    lerAtribuicoes();

  const chave =
    String(
      idObra
    );

  const lista =
    Array.isArray(
      atribuicoes[
        chave
      ]
    )
      ? [
          ...atribuicoes[
            chave
          ],
        ]
      : [];

  const jaExiste =
    lista.some(
      (id) =>
        String(id) ===
        String(
          idEquipe
        )
    );

  if (!jaExiste) {
    lista.push(
      String(
        idEquipe
      )
    );
  }

  atribuicoes[
    chave
  ] = lista;

  salvarAtribuicoes(
    atribuicoes
  );

  return {
    sucesso: true,

    id_obra:
      Number(
        idObra
      ),

    id_equipe:
      idEquipe,
  };
}

// =====================================================
// REMOVER EQUIPE DA OBRA
// =====================================================

export async function desatribuirEquipe(
  equipe,
  idObra
) {
  const idEquipe =
    obterIdEquipe(
      equipe
    );

  if (
    !idEquipe ||
    !idObra
  ) {
    return {
      sucesso: false,
    };
  }

  const atribuicoes =
    lerAtribuicoes();

  const chave =
    String(
      idObra
    );

  atribuicoes[
    chave
  ] =
    (
      atribuicoes[
        chave
      ] || []
    ).filter(
      (id) =>
        String(id) !==
        String(
          idEquipe
        )
    );

  salvarAtribuicoes(
    atribuicoes
  );

  return {
    sucesso: true,
  };
}

// =====================================================
// BUSCAR RECURSOS DA OBRA
// =====================================================

export async function buscarRecursosDaObra(
  idObra
) {
  const idConstrutora =
    localStorage.getItem(
      "idconstrutora"
    ) ||
    localStorage.getItem(
      "id_construtora"
    );

  const equipes =
    await listarEquipesEmpresa(
      idConstrutora
    );

  const idsEquipes =
    obterIdsEquipesDaObra(
      idObra
    );

  const equipesDaObra =
    equipes.filter(
      (equipe) =>
        idsEquipes.some(
          (id) =>
            String(id) ===
            String(
              obterIdEquipe(
                equipe
              )
            )
        )
    );

  let insumos = [];
  let maquinarios = [];

  try {
    const dados =
      await requisitar(
        `/insumos?idobra=${idObra}`
      );

    insumos =
      extrairLista(
        dados,
        ["insumos"]
      );
  } catch (error) {
    console.warn(
      "Não foi possível carregar insumos:",
      error?.message ||
        error
    );
  }

  try {
    const dados =
      await requisitar(
        `/maquinarios?idobra=${idObra}`
      );

    maquinarios =
      extrairLista(
        dados,
        ["maquinarios"]
      );
  } catch (error) {
    console.warn(
      "Não foi possível carregar maquinários:",
      error?.message ||
        error
    );
  }

  return {
    equipes:
      equipesDaObra,

    insumos,

    maquinarios,
  };
}

// =====================================================
// CATÁLOGO GERAL DE RECURSOS
// =====================================================

export async function buscarCatalogoRecursos(
  obras = []
) {
  const idConstrutora =
    localStorage.getItem(
      "idconstrutora"
    ) ||
    localStorage.getItem(
      "id_construtora"
    );

  const equipes =
    await listarEquipesEmpresa(
      idConstrutora
    );

  const insumos = [];
  const maquinarios = [];

  if (
    Array.isArray(
      obras
    )
  ) {
    await Promise.all(
      obras.map(
        async (obra) => {
          const idObra =
            obra?.id_obra;

          if (!idObra) {
            return;
          }

          try {
            const dadosInsumos =
              await requisitar(
                `/insumos?idobra=${idObra}`
              );

            const listaInsumos =
              extrairLista(
                dadosInsumos,
                [
                  "insumos",
                ]
              );

            listaInsumos.forEach(
              (item) => {
                const id =
                  obterIdInsumo(
                    item
                  );

                const existe =
                  insumos.some(
                    (
                      existente
                    ) =>
                      String(
                        obterIdInsumo(
                          existente
                        )
                      ) ===
                      String(id)
                  );

                if (!existe) {
                  insumos.push({
                    ...item,

                    idobra:
                      item.idobra ??
                      idObra,
                  });
                }
              }
            );
          } catch {
            // ignora obra
            // sem rota de insumos
          }

          try {
            const dadosMaquinas =
              await requisitar(
                `/maquinarios?idobra=${idObra}`
              );

            const listaMaquinas =
              extrairLista(
                dadosMaquinas,
                [
                  "maquinarios",
                ]
              );

            listaMaquinas.forEach(
              (item) => {
                const id =
                  obterIdMaquinario(
                    item
                  );

                const existe =
                  maquinarios.some(
                    (
                      existente
                    ) =>
                      String(
                        obterIdMaquinario(
                          existente
                        )
                      ) ===
                      String(id)
                  );

                if (!existe) {
                  maquinarios.push({
                    ...item,

                    idobra:
                      item.idobra ??
                      idObra,
                  });
                }
              }
            );
          } catch {
            // ignora obra
            // sem rota de maquinários
          }
        }
      )
    );
  }

  return {
    equipes,
    insumos,
    maquinarios,
  };
}

// =====================================================
// COMPATIBILIDADE - INSUMOS
// =====================================================

export async function atribuirInsumo(
  insumo,
  idObra
) {
  const id =
    obterIdInsumo(
      insumo
    );

  if (!id) {
    throw new Error(
      "Insumo não identificado."
    );
  }

  return requisitar(
    `/insumos/insert/${id}`,
    {
      method: "PUT",

      body:
        JSON.stringify({
          ...insumo,

          idobra:
            Number(
              idObra
            ),

          id_obra:
            Number(
              idObra
            ),
        }),
    }
  );
}

// =====================================================
// COMPATIBILIDADE - MAQUINÁRIOS
// =====================================================

export async function atribuirMaquinario(
  maquinario,
  idObra
) {
  const id =
    obterIdMaquinario(
      maquinario
    );

  if (!id) {
    throw new Error(
      "Maquinário não identificado."
    );
  }

  return requisitar(
    `/maquinarios/insert/${id}`,
    {
      method: "PUT",

      body:
        JSON.stringify({
          ...maquinario,

          idobra:
            Number(
              idObra
            ),

          id_obra:
            Number(
              idObra
            ),
        }),
    }
  );
}