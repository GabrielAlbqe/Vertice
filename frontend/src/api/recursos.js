import {
  extrairLista,
  requisitar,
} from "./api.js";

const CHAVE_DADOS_EQUIPES =
  "vertice_dados_extras_equipes";

// =====================================================
// AUXILIARES
// =====================================================

function removerDuplicados(
  lista,
  obterId
) {
  const mapa = new Map();

  lista.forEach((item) => {
    const id = obterId(item);

    if (
      id !== undefined &&
      id !== null &&
      id !== ""
    ) {
      mapa.set(
        String(id),
        item
      );
    }
  });

  return Array.from(
    mapa.values()
  );
}

// =====================================================
// IDS
// =====================================================

export function obterIdEquipe(item) {
  return (
    item?.id_equipe_terceirizada ??
    item?.id_cadastro_equipes ??
    item?.id_equipe ??
    item?.id
  );
}

export function obterIdInsumo(item) {
  return (
    item?.id_insumos ??
    item?.id_insumo ??
    item?.id
  );
}

export function obterIdMaquinario(item) {
  return (
    item?.id_maquina ??
    item?.id_maquinario ??
    item?.id
  );
}

// =====================================================
// DADOS EXTRAS DAS EQUIPES
// Área + quantidade de profissionais
// =====================================================

function lerDadosExtrasEquipes() {
  try {
    const dados = JSON.parse(
      localStorage.getItem(
        CHAVE_DADOS_EQUIPES
      ) || "{}"
    );

    if (
      !dados ||
      typeof dados !== "object"
    ) {
      return {};
    }

    return dados;
  } catch {
    return {};
  }
}

function salvarDadosExtrasEquipes(
  dados
) {
  localStorage.setItem(
    CHAVE_DADOS_EQUIPES,
    JSON.stringify(dados)
  );
}

function criarChaveTemporaria(
  equipe
) {
  const nome = String(
    equipe?.nome_equipe || ""
  )
    .trim()
    .toLowerCase();

  const idObra =
    equipe?.id_obra ??
    equipe?.idobra ??
    "";

  return `${nome}::${idObra}`;
}

export function obterDadosExtrasEquipe(
  equipe
) {
  const dados =
    lerDadosExtrasEquipes();

  const id =
    obterIdEquipe(equipe);

  if (
    id &&
    dados[`id:${id}`]
  ) {
    return dados[`id:${id}`];
  }

  const chave =
    criarChaveTemporaria(
      equipe
    );

  return (
    dados[`tmp:${chave}`] || {
      area_atuacao: "",
      quantidade_profissionais: 0,
    }
  );
}

export function salvarDadosExtrasEquipe(
  equipe,
  extras = {}
) {
  const dados =
    lerDadosExtrasEquipes();

  const id =
    obterIdEquipe(equipe);

  const chave =
    criarChaveTemporaria(
      equipe
    );

  const valor = {
    area_atuacao:
      extras.area_atuacao || "",

    quantidade_profissionais:
      Number(
        extras.quantidade_profissionais ||
          0
      ),
  };

  if (id) {
    dados[`id:${id}`] =
      valor;
  }

  if (chave) {
    dados[`tmp:${chave}`] =
      valor;
  }

  salvarDadosExtrasEquipes(
    dados
  );
}

export function excluirDadosExtrasEquipe(
  equipe
) {
  const dados =
    lerDadosExtrasEquipes();

  const id =
    obterIdEquipe(equipe);

  const chave =
    criarChaveTemporaria(
      equipe
    );

  if (id) {
    delete dados[`id:${id}`];
  }

  if (chave) {
    delete dados[`tmp:${chave}`];
  }

  salvarDadosExtrasEquipes(
    dados
  );
}

// =====================================================
// NORMALIZAR EQUIPE
// =====================================================

export function normalizarEquipe(
  item = {}
) {
  const equipe = {
    ...item,

    id_equipe_terceirizada:
      item.id_equipe_terceirizada ??
      item.id_equipe ??
      item.id,

    nome_equipe:
      item.nome_equipe ??
      item.nome ??
      "",

    custo_diario_total:
      Number(
        item.custo_diario_total ??
        item.custo_diario ??
        0
      ),

    custo_diario:
      Number(
        item.custo_diario_total ??
        item.custo_diario ??
        0
      ),

    id_obra:
      item.id_obra ??
      item.idobra ??
      null,

    idobra:
      item.id_obra ??
      item.idobra ??
      null,
  };

  const extras =
    obterDadosExtrasEquipe(
      equipe
    );

  equipe.area_atuacao =
    extras.area_atuacao || "";

  equipe.quantidade_profissionais =
    Number(
      extras.quantidade_profissionais ||
        0
    );

  return equipe;
}

// =====================================================
// LISTAR EQUIPES
// =====================================================

export async function listarEquipesTerceirizadas(
  idObra = null
) {
  const caminho =
    idObra
      ? `/equipes-terceirizadas?id_obra=${encodeURIComponent(
          idObra
        )}`
      : "/equipes-terceirizadas";

  const dados =
    await requisitar(
      caminho
    );

  return extrairLista(
    dados,
    ["equipes"]
  ).map(
    normalizarEquipe
  );
}

// =====================================================
// CADASTRAR EQUIPE
// =====================================================

export async function criarEquipe(
  dadosEquipe
) {
  const payload = {
    nome_equipe:
      String(
        dadosEquipe.nome_equipe || ""
      ).trim(),

    custo_diario_total:
      Number(
        dadosEquipe.custo_diario_total ||
          0
      ),

    id_obra:
      Number(
        dadosEquipe.id_obra
      ),
  };

  if (!payload.nome_equipe) {
    throw new Error(
      "Informe o nome da equipe."
    );
  }

  if (!payload.id_obra) {
    throw new Error(
      "Selecione a obra."
    );
  }

  if (
    payload.custo_diario_total < 0
  ) {
    throw new Error(
      "O custo diário não pode ser negativo."
    );
  }

  const resposta =
    await requisitar(
      "/equipes-terceirizadas/insert",
      {
        method: "POST",

        body: JSON.stringify(
          payload
        ),
      }
    );

  const equipeCriada = {
    ...payload,

    id_equipe_terceirizada:
      resposta?.insertId ??
      resposta?.id_equipe_terceirizada ??
      resposta?.id ??
      null,
  };

  salvarDadosExtrasEquipe(
    equipeCriada,
    {
      area_atuacao:
        dadosEquipe.area_atuacao,

      quantidade_profissionais:
        dadosEquipe.quantidade_profissionais,
    }
  );

  return resposta;
}

// =====================================================
// ATUALIZAR EQUIPE
// =====================================================

export async function atualizarEquipe(
  id,
  dadosEquipe
) {
  const payload = {
    nome_equipe:
      String(
        dadosEquipe.nome_equipe || ""
      ).trim(),

    custo_diario_total:
      Number(
        dadosEquipe.custo_diario_total ||
          0
      ),

    id_obra:
      Number(
        dadosEquipe.id_obra
      ),
  };

  const resposta =
    await requisitar(
      `/equipes-terceirizadas/insert/${id}`,
      {
        method: "PUT",

        body: JSON.stringify(
          payload
        ),
      }
    );

  salvarDadosExtrasEquipe(
    {
      ...payload,

      id_equipe_terceirizada:
        id,
    },
    {
      area_atuacao:
        dadosEquipe.area_atuacao,

      quantidade_profissionais:
        dadosEquipe.quantidade_profissionais,
    }
  );

  return resposta;
}

// =====================================================
// EXCLUIR EQUIPE
// =====================================================

export async function excluirEquipe(
  equipe
) {
  const id =
    typeof equipe === "object"
      ? obterIdEquipe(equipe)
      : equipe;

  if (!id) {
    throw new Error(
      "Não foi possível identificar a equipe."
    );
  }

  const resposta =
    await requisitar(
      `/equipes-terceirizadas/del/${id}`,
      {
        method: "DELETE",
      }
    );

  if (
    typeof equipe === "object"
  ) {
    excluirDadosExtrasEquipe(
      equipe
    );
  }

  return resposta;
}

// =====================================================
// INSUMOS DAS OBRAS
// =====================================================

async function buscarInsumosDasObras(
  obras = []
) {
  if (
    !Array.isArray(obras) ||
    obras.length === 0
  ) {
    return [];
  }

  const respostas =
    await Promise.all(
      obras.map(
        async (obra) => {
          const idObra =
            obra?.id_obra ??
            obra?.id;

          if (!idObra) {
            return [];
          }

          try {
            const dados =
              await requisitar(
                `/insumos?idobra=${idObra}`
              );

            return extrairLista(
              dados,
              ["insumos"]
            ).map(
              (insumo) => ({
                ...insumo,

                idobra:
                  insumo.idobra ??
                  idObra,
              })
            );
          } catch {
            return [];
          }
        }
      )
    );

  return removerDuplicados(
    respostas.flat(),
    obterIdInsumo
  );
}

// =====================================================
// MAQUINÁRIOS DAS OBRAS
// =====================================================

async function buscarMaquinariosDasObras(
  obras = []
) {
  if (
    !Array.isArray(obras) ||
    obras.length === 0
  ) {
    return [];
  }

  const respostas =
    await Promise.all(
      obras.map(
        async (obra) => {
          const idObra =
            obra?.id_obra ??
            obra?.id;

          if (!idObra) {
            return [];
          }

          try {
            const dados =
              await requisitar(
                `/maquinarios?idobra=${idObra}`
              );

            return extrairLista(
              dados,
              ["maquinarios"]
            ).map(
              (maquinario) => ({
                ...maquinario,

                idobra:
                  maquinario.idobra ??
                  idObra,
              })
            );
          } catch {
            return [];
          }
        }
      )
    );

  return removerDuplicados(
    respostas.flat(),
    obterIdMaquinario
  );
}

// =====================================================
// CATÁLOGO DE RECURSOS
// =====================================================

export async function buscarCatalogoRecursos(
  obras = []
) {
  const [
    equipes,
    insumos,
    maquinarios,
  ] = await Promise.all([
    listarEquipesTerceirizadas(),

    buscarInsumosDasObras(
      obras
    ),

    buscarMaquinariosDasObras(
      obras
    ),
  ]);

  return {
    equipes,
    insumos,
    maquinarios,
  };
}

// =====================================================
// ATRIBUIR EQUIPE
// =====================================================

export async function atribuirEquipe(
  equipe,
  idObra
) {
  const id =
    obterIdEquipe(
      equipe
    );

  if (!id) {
    throw new Error(
      "Não foi possível identificar a equipe."
    );
  }

  const payload = {
    nome_equipe:
      equipe.nome_equipe,

    custo_diario_total:
      Number(
        equipe.custo_diario_total ??
        equipe.custo_diario ??
        0
      ),

    id_obra:
      Number(
        idObra
      ),
  };

  const resposta =
    await requisitar(
      `/equipes-terceirizadas/insert/${id}`,
      {
        method: "PUT",

        body: JSON.stringify(
          payload
        ),
      }
    );

  salvarDadosExtrasEquipe(
    {
      ...equipe,

      id_obra:
        idObra,

      idobra:
        idObra,
    },
    {
      area_atuacao:
        equipe.area_atuacao,

      quantidade_profissionais:
        equipe.quantidade_profissionais,
    }
  );

  return resposta;
}

// =====================================================
// ATRIBUIR INSUMO
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
      "Não foi possível identificar o insumo."
    );
  }

  return requisitar(
    `/insumos/insert/${id}`,
    {
      method: "PUT",

      body: JSON.stringify({
        nome:
          insumo.nome,

        quantidade_disponivel:
          Number(
            insumo.quantidade_disponivel ||
            0
          ),

        valor_unitario:
          Number(
            insumo.valor_unitario ||
            0
          ),

        idobra:
          Number(
            idObra
          ),
      }),
    }
  );
}

// =====================================================
// ATRIBUIR MAQUINÁRIO
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
      "Não foi possível identificar o maquinário."
    );
  }

  return requisitar(
    `/maquinarios/insert/${id}`,
    {
      method: "PUT",

      body: JSON.stringify({
        nome:
          maquinario.nome,

        quantidade:
          Number(
            maquinario.quantidade ||
            0
          ),

        etapa_atuacao:
          maquinario.etapa_atuacao ||
          "",

        custo_diario:
          Number(
            maquinario.custo_diario ||
            0
          ),

        status:
          maquinario.status ||
          "Ativo",

        idobra:
          Number(
            idObra
          ),
      }),
    }
  );
}

// =====================================================
// RECURSOS DE UMA OBRA
// =====================================================

export async function buscarRecursosDaObra(
  idObra
) {
  const [
    equipes,
    insumos,
    maquinarios,
  ] = await Promise.all([
    listarEquipesTerceirizadas(
      idObra
    ).catch(
      () => []
    ),

    requisitar(
      `/insumos?idobra=${idObra}`
    ).catch(
      () => []
    ),

    requisitar(
      `/maquinarios?idobra=${idObra}`
    ).catch(
      () => []
    ),
  ]);

  return {
    equipes,

    insumos:
      extrairLista(
        insumos,
        ["insumos"]
      ),

    maquinarios:
      extrairLista(
        maquinarios,
        ["maquinarios"]
      ),
  };
}