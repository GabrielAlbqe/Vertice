import {
  requisitar,
} from "./api.js";

// =====================================================
// AUXILIARES
// =====================================================

function extrairArray(
  dados,
  chaves = []
) {
  if (Array.isArray(dados)) {
    return dados;
  }

  for (const chave of chaves) {
    if (
      Array.isArray(
        dados?.[chave]
      )
    ) {
      return dados[chave];
    }
  }

  if (
    Array.isArray(
      dados?.dados
    )
  ) {
    return dados.dados;
  }

  if (
    Array.isArray(
      dados?.resultado
    )
  ) {
    return dados.resultado;
  }

  throw new Error("Formato de resposta inesperado na consulta de recursos.");
}

function removerDuplicados(
  lista,
  obterId
) {
  const mapa =
    new Map();

  lista.forEach(
    (item) => {
      const id =
        obterId(item);

      if (
        id !== undefined &&
        id !== null
      ) {
        mapa.set(
          String(id),
          item
        );
      }
    }
  );

  return Array.from(
    mapa.values()
  );
}

// =====================================================
// IDS
// =====================================================

export function obterIdEquipe(
  item
) {
  return (
    item?.id_cadastro_equipes ??
    item?.id_equipe_terceirizada ??
    item?.id_equipe_terceirizad ??
    item?.id_equipe ??
    item?.id
  );
}

export function obterIdInsumo(
  item
) {
  return (
    item?.id_insumos ??
    item?.id_insumo ??
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
// EQUIPES
// =====================================================

export async function buscarEquipePorId(
  id
) {
  if (!id) {
    throw new Error(
      "ID da equipe não informado."
    );
  }

  return requisitar(
    `/equipes/${id}`
  );
}

export async function listarEquipesEmpresa(
  idConstrutora = null
) {
  const dados =
    await requisitar(
      "/equipes"
    );

  const equipes =
    extrairArray(
      dados,
      [
        "equipes",
      ]
    );

  const lista =
    removerDuplicados(
      equipes,
      obterIdEquipe
    );

  if (!idConstrutora) {
    return lista;
  }

  const dadosObras =
    await requisitar(
      `/obras?id_construtora=${encodeURIComponent(
        idConstrutora
      )}`
    );

  const obras =
    extrairArray(
      dadosObras,
      [
        "obras",
      ]
    );

  const idsObras =
    new Set(
      obras
        .map(
          (obra) =>
            Number(
              obra.id_obra ??
              obra.id
            )
        )
        .filter(
          (id) =>
            id > 0
        )
    );

  return lista.filter(
    (equipe) =>
      idsObras.has(
        Number(
          equipe.idobra
        )
      )
  );
}

export async function listarEquipes(
  idObra = null
) {
  if (
    idObra !== null &&
    idObra !== undefined &&
    idObra !== ""
  ) {
    const dados =
      await requisitar(
        `/equipes?idobra=${encodeURIComponent(
          idObra
        )}`
      );

    return removerDuplicados(extrairArray(
      dados,
      [
        "equipes",
      ]
    ), obterIdEquipe).filter(item => String(item.idobra ?? item.id_obra) === String(idObra));
  }

  return listarEquipesEmpresa();
}

export async function buscarEquipes(
  idObra = null
) {
  return listarEquipes(
    idObra
  );
}

function montarPayloadEquipe(
  equipe = {}
) {
  if (
    !Number.isInteger(
      Number(
        equipe.idobra
      )
    ) ||
    Number(
      equipe.idobra
    ) <= 0
  ) {
    throw new Error(
      "Selecione uma obra para a equipe."
    );
  }

  return {
    nome_equipe:
      equipe.nome_equipe ??
      equipe.nome ??
      "",

    etapa_atuacao:
      equipe.etapa_atuacao ??
      "",

    quantidade_profissionais:
      Number(
        equipe.quantidade_profissionais ??
        0
      ),

    custo_diario:
      Number(
        equipe.custo_diario ??
        0
      ),

    custo_mensal:
      Number(
        equipe.custo_mensal ??
        0
      ),

    idobra:
      Number(
        equipe.idobra
      ),
  };
}

export async function criarEquipe(
  equipe
) {
  const payload =
    montarPayloadEquipe(
      equipe
    );

  return requisitar(
    "/equipes/insert",
    {
      method: "POST",

      body:
        JSON.stringify(
          payload
        ),
    }
  );
}

export async function cadastrarEquipe(
  equipe
) {
  return criarEquipe(
    equipe
  );
}

export async function atualizarEquipe(
  idOuEquipe,
  dadosEquipe = null
) {
  const equipe =
    dadosEquipe ??
    (
      typeof idOuEquipe ===
      "object"
        ? idOuEquipe
        : {}
    );

  const id =
    typeof idOuEquipe ===
    "object"
      ? obterIdEquipe(
          idOuEquipe
        )
      : idOuEquipe;

  if (!id) {
    throw new Error(
      "Não foi possível identificar a equipe."
    );
  }

  const payload =
    montarPayloadEquipe(
      equipe
    );

  return requisitar(
    `/equipes/insert/${id}`,
    {
      method: "PUT",

      body:
        JSON.stringify(
          payload
        ),
    }
  );
}

export async function excluirEquipe(
  idOuEquipe
) {
  const id =
    typeof idOuEquipe ===
    "object"
      ? obterIdEquipe(
          idOuEquipe
        )
      : idOuEquipe;

  if (!id) {
    throw new Error(
      "Não foi possível identificar a equipe."
    );
  }

  return requisitar(
    `/equipes/del/${id}`,
    {
      method:
        "DELETE",
    }
  );
}

export async function removerEquipe(
  idOuEquipe
) {
  return excluirEquipe(
    idOuEquipe
  );
}

// =====================================================
// EQUIPES TERCEIRIZADAS
// =====================================================

export async function listarEquipesTerceirizadas(
  idObra = null
) {
  const rota =
    idObra
      ? `/equipes-terceirizadas?id_obra=${encodeURIComponent(
          idObra
        )}`
      : "/equipes-terceirizadas";

  const dados =
    await requisitar(
      rota
    );

  return extrairArray(
    dados,
    [
      "equipes",
      "equipes_terceirizadas",
    ]
  );
}

export async function criarEquipeTerceirizada(
  equipe
) {
  return requisitar(
    "/equipes-terceirizadas/insert",
    {
      method: "POST",

      body:
        JSON.stringify(
          equipe
        ),
    }
  );
}

export async function atualizarEquipeTerceirizada(
  id,
  equipe
) {
  if (!id) {
    throw new Error(
      "ID da equipe terceirizada não informado."
    );
  }

  return requisitar(
    `/equipes-terceirizadas/insert/${id}`,
    {
      method: "PUT",

      body:
        JSON.stringify(
          equipe
        ),
    }
  );
}

export async function excluirEquipeTerceirizada(
  id
) {
  if (!id) {
    throw new Error(
      "ID da equipe terceirizada não informado."
    );
  }

  return requisitar(
    `/equipes-terceirizadas/del/${id}`,
    {
      method:
        "DELETE",
    }
  );
}

// =====================================================
// INSUMOS
// =====================================================

export async function listarInsumos(
  idObra = null
) {
  const rota =
    idObra
      ? `/insumos?idobra=${encodeURIComponent(
          idObra
        )}`
      : "/insumos";

  const dados =
    await requisitar(
      rota
    );

  return extrairArray(
    dados,
    [
      "insumos",
    ]
  );
}

export async function buscarInsumoPorId(
  id
) {
  return requisitar(
    `/insumos/${id}`
  );
}

export async function criarInsumo(
  insumo
) {
  return requisitar(
    "/insumos/insert",
    {
      method: "POST",

      body:
        JSON.stringify(
          insumo
        ),
    }
  );
}

export async function atualizarInsumo(
  id,
  insumo
) {
  return requisitar(
    `/insumos/insert/${id}`,
    {
      method: "PUT",

      body:
        JSON.stringify(
          insumo
        ),
    }
  );
}

export async function excluirInsumo(
  idOuInsumo
) {
  const id =
    typeof idOuInsumo ===
    "object"
      ? obterIdInsumo(
          idOuInsumo
        )
      : idOuInsumo;

  return requisitar(
    `/insumos/del/${id}`,
    {
      method:
        "DELETE",
    }
  );
}

// =====================================================
// MAQUINÁRIOS
// =====================================================

export async function listarMaquinarios(
  idObra = null
) {
  const rota =
    idObra
      ? `/maquinarios?idobra=${encodeURIComponent(
          idObra
        )}`
      : "/maquinarios";

  const dados =
    await requisitar(
      rota
    );

  return extrairArray(
    dados,
    [
      "maquinarios",
    ]
  );
}

export async function buscarMaquinarioPorId(
  id
) {
  return requisitar(
    `/maquinarios/${id}`
  );
}

export async function criarMaquinario(
  maquinario
) {
  return requisitar(
    "/maquinarios/insert",
    {
      method: "POST",

      body:
        JSON.stringify(
          maquinario
        ),
    }
  );
}

export async function atualizarMaquinario(
  id,
  maquinario
) {
  return requisitar(
    `/maquinarios/insert/${id}`,
    {
      method: "PUT",

      body:
        JSON.stringify(
          maquinario
        ),
    }
  );
}

export async function excluirMaquinario(
  idOuMaquinario
) {
  const id =
    typeof idOuMaquinario ===
    "object"
      ? obterIdMaquinario(
          idOuMaquinario
        )
      : idOuMaquinario;

  return requisitar(
    `/maquinarios/del/${id}`,
    {
      method:
        "DELETE",
    }
  );
}

// =====================================================
// CATÁLOGO DE RECURSOS
// =====================================================

export async function buscarCatalogoRecursos(obras = []) {
  const ids = [...new Set(obras.map(o => Number(o.id_obra ?? o.id)).filter(id => id > 0))];
  if (!ids.length) return { equipes: [], insumos: [], maquinarios: [] };
  // As rotas de insumos e máquinas exigem idobra; não existe listagem global.
  const equipes = await listarEquipesEmpresa();
  const insumos = [], maquinarios = [];
  for (let i = 0; i < ids.length; i += 4) {
    const lote = await Promise.all(ids.slice(i, i + 4).map(async id => {
      const [materiais, maquinas] = await Promise.all([listarInsumos(id), listarMaquinarios(id)]);
      return { materiais: materiais.filter(r => Number(r.idobra) === id), maquinas: maquinas.filter(r => Number(r.idobra) === id) };
    }));
    for (const item of lote) { insumos.push(...item.materiais); maquinarios.push(...item.maquinas); }
  }
  return { equipes: equipes.filter(e => ids.includes(Number(e.idobra))), insumos: removerDuplicados(insumos, obterIdInsumo), maquinarios: removerDuplicados(maquinarios, obterIdMaquinario) };
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

  return atualizarEquipe(
    id,
    {
      ...equipe,

      idobra:
        Number(
          idObra
        ),
    }
  );
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

  return atualizarInsumo(
    id,
    {
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

  return atualizarMaquinario(
    id,
    {
      nome:
        maquinario.nome,

      quantidade:
        Number(
          maquinario.quantidade ||
          0
        ),

      etapa_atuacao:
        maquinario.etapa_atuacao ??
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
    terceirizadas,
  ] =
    await Promise.all([
      listarEquipes(
        idObra
      ),

      listarInsumos(
        idObra
      ),

      listarMaquinarios(
        idObra
      ),

      listarEquipesTerceirizadas(
        idObra
      ),
    ]);

  const equipesTerceirizadas =
    terceirizadas.map(
      (item) => ({
        ...item,

        custo_diario:
          item.custo_diario ??
          item.custo_diario_total,

        origem:
          "terceirizada",
      })
    );

  return {
    equipes: [
      ...equipes,
      ...equipesTerceirizadas,
    ],

    insumos,

    maquinarios,
  };
}

// =====================================================
// EXCLUIR RECURSO
// =====================================================

export async function excluirRecurso(
  tipo,
  recurso
) {
  if (
    tipo === "equipe"
  ) {
    if (
      recurso.origem ===
      "terceirizada"
    ) {
      return excluirEquipeTerceirizada(
        obterIdEquipe(
          recurso
        )
      );
    }

    return excluirEquipe(
      recurso
    );
  }

  if (
    tipo === "insumo"
  ) {
    return excluirInsumo(
      recurso
    );
  }

  if (
    tipo ===
    "maquinario"
  ) {
    return excluirMaquinario(
      recurso
    );
  }

  throw new Error(
    "Tipo de recurso inválido."
  );
}
