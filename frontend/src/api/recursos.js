import {
  requisitar,
} from "./api.js";

// =====================================================
// CHAVES LOCAIS
// =====================================================

const CHAVE_IDS_EQUIPES =
  "vertice_ids_equipes_conhecidos";

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
      id !== null
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

  return [];
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
// CACHE DOS IDS DAS EQUIPES
// =====================================================

function lerIdsEquipesConhecidos() {
  try {
    const dados =
      JSON.parse(
        localStorage.getItem(
          CHAVE_IDS_EQUIPES
        ) || "[]"
      );

    if (!Array.isArray(dados)) {
      return [];
    }

    return [
      ...new Set(
        dados
          .map(Number)
          .filter(
            (id) =>
              Number.isInteger(id) &&
              id > 0
          )
      ),
    ];
  } catch {
    return [];
  }
}

function salvarIdsEquipesConhecidos(
  ids
) {
  const limpos = [
    ...new Set(
      ids
        .map(Number)
        .filter(
          (id) =>
            Number.isInteger(id) &&
            id > 0
        )
    ),
  ];

  localStorage.setItem(
    CHAVE_IDS_EQUIPES,
    JSON.stringify(limpos)
  );
}

function lembrarIdEquipe(
  id
) {
  const numero =
    Number(id);

  if (
    !Number.isInteger(numero) ||
    numero <= 0
  ) {
    return;
  }

  salvarIdsEquipesConhecidos([
    ...lerIdsEquipesConhecidos(),
    numero,
  ]);
}

function esquecerIdEquipe(
  id
) {
  const numero =
    Number(id);

  salvarIdsEquipesConhecidos(
    lerIdsEquipesConhecidos()
      .filter(
        (item) =>
          item !== numero
      )
  );
}

// =====================================================
// EQUIPE POR ID
// =====================================================

export async function buscarEquipePorId(
  id
) {
  if (!id) {
    throw new Error(
      "ID da equipe não informado."
    );
  }

  const equipe =
    await requisitar(
      `/equipes/${id}`
    );

  const idEncontrado =
    obterIdEquipe(
      equipe
    );

  if (idEncontrado) {
    lembrarIdEquipe(
      idEncontrado
    );
  }

  return equipe;
}

// =====================================================
// DESCOBRIR IDS SEM VARRER /equipes/1...100
// =====================================================
//
// O backend atual não possui um GET /equipes funcional para
// listar todas as equipes, pois o controller chama getAll()
// e o model não tem esse método.
//
// Para NÃO gerar dezenas de 404 no console, o frontend:
// 1. usa IDs que já conhece no localStorage;
// 2. aproveita IDs existentes em /equipes-etapas;
// 3. faz apenas um fallback opcional para a equipe ID 1.
// =====================================================

async function descobrirIdsEquipes() {
  const ids =
    new Set(
      lerIdsEquipesConhecidos()
    );

  try {
    const resposta =
      await requisitar(
        "/equipes-etapas"
      );

    const etapas =
      extrairArray(
        resposta,
        [
          "equipes_etapas",
          "etapas",
        ]
      );

    etapas.forEach(
      (item) => {
        const id =
          Number(
            item?.id_equipe
          );

        if (
          Number.isInteger(id) &&
          id > 0
        ) {
          ids.add(id);
        }
      }
    );
  } catch {
    // Se não houver registros em equipe_etapa,
    // seguimos somente com os IDs conhecidos.
  }

  // Compatibilidade com projetos que já possuem a primeira equipe.
  // É UMA única tentativa, não uma varredura de IDs.
  if (ids.size === 0) {
    try {
      const primeira =
        await requisitar(
          "/equipes/1"
        );

      const id =
        obterIdEquipe(
          primeira
        );

      if (id) {
        ids.add(
          Number(id)
        );
      }
    } catch (error) {
      if (error.status !== 404) throw error;
      // Não gera uma sequência de requisições 404.
    }
  }

  const lista =
    Array.from(ids);

  salvarIdsEquipesConhecidos(
    lista
  );

  return lista;
}

// =====================================================
// LISTAR EQUIPES DA EMPRESA
// =====================================================

export async function listarEquipesEmpresa(idConstrutora = null) {
  const ids =
    await descobrirIdsEquipes();



  const respostas =
    await Promise.all(
      ids.map(
        async (id) => {
          try {
            return await buscarEquipePorId(
              id
            );
          } catch (error) {
            if (error.status !== 404) throw error;
            esquecerIdEquipe(id);
            return null;
          }
        }
      )
    );

  const equipes =
    respostas.filter(Boolean);

  salvarIdsEquipesConhecidos(
    equipes
      .map(
        obterIdEquipe
      )
      .filter(Boolean)
  );

  const lista = removerDuplicados(equipes, obterIdEquipe);
  lista.aviso = "A listagem de equipes está parcial: o servidor não oferece a consulta completa. São exibidos registros conhecidos neste navegador ou encontrados em etapas.";
  if (!idConstrutora) return lista;
  const obras = await Promise.all([...new Set(lista.map(item => item.idobra).filter(Boolean))].map(id => requisitar(`/obras/${id}`)));
  const permitidas = new Set(obras.filter(item => Number(item.id_construtora) === Number(idConstrutora)).map(item => Number(item.id_obra)));
  const filtradas = lista.filter(item => permitidas.has(Number(item.idobra)));
  filtradas.aviso = lista.aviso;
  return filtradas;
}

// Alias usado em outras telas.
export async function listarEquipes(
  idObra = null
) {
  const equipes =
    await listarEquipesEmpresa();

  if (
    idObra === null ||
    idObra === undefined ||
    idObra === ""
  ) {
    return equipes;
  }

  return equipes.filter(
    (equipe) =>
      Number(
        equipe.idobra
      ) ===
      Number(
        idObra
      )
  );
}

export async function buscarEquipes(
  idObra = null
) {
  return listarEquipes(
    idObra
  );
}

// =====================================================
// CRUD DE EQUIPES
// =====================================================

function montarPayloadEquipe(
  equipe = {}
) {
  if (!Number.isInteger(Number(equipe.idobra)) || Number(equipe.idobra) <= 0) {
    throw new Error("Selecione uma obra. O cadastro atual exige esse vínculo.");
  }
  for (const campo of ["custo_diario", "custo_mensal"]) {
    if (!Number.isFinite(Number(equipe[campo])) || Number(equipe[campo]) < 0) throw new Error("Informe custos válidos.");
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
      equipe.idobra !== undefined &&
      equipe.idobra !== null &&
      equipe.idobra !== ""
        ? Number(
            equipe.idobra
          )
        : null,
  };
}

export async function criarEquipe(
  equipe
) {
  const payload =
    montarPayloadEquipe(
      equipe
    );

  const resposta =
    await requisitar(
      "/equipes/insert",
      {
        method: "POST",

        body:
          JSON.stringify(
            payload
          ),
      }
    );

  const idCriado =
    resposta?.insertId ??
    resposta?.id_cadastro_equipes ??
    resposta?.id;

  if (idCriado) {
    lembrarIdEquipe(
      idCriado
    );
  }

  return resposta;
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
      "Não foi possível identificar o ID da equipe."
    );
  }

  const payload =
    montarPayloadEquipe(
      equipe
    );

  const resposta =
    await requisitar(
      `/equipes/insert/${id}`,
      {
        method: "PUT",

        body:
          JSON.stringify(
            payload
          ),
      }
    );

  lembrarIdEquipe(
    id
  );

  return resposta;
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
      "Não foi possível identificar o ID da equipe."
    );
  }

  const resposta =
    await requisitar(
      `/equipes/del/${id}`,
      {
        method: "DELETE",
      }
    );

  esquecerIdEquipe(
    id
  );

  return resposta;
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
      ? `/equipes-terceirizadas?id_obra=${idObra}`
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
      method: "DELETE",
    }
  );
}

// =====================================================
// INSUMOS / MAQUINÁRIOS
// =====================================================

async function buscarRecursosPorObras(obras, endpoint, obterId) {
  const ids = [...new Set(obras.map(obra => Number(obra.id_obra)).filter(id => id > 0))];
  const respostas = await Promise.all(ids.map(id => requisitar(`${endpoint}?idobra=${id}`)));
  return removerDuplicados(respostas.flatMap(dados => extrairArray(dados)), obterId);
}

// =====================================================
// CATÁLOGO COMPLETO
// =====================================================

export async function buscarCatalogoRecursos(
  obras = []
) {
  const [
    equipes,
    insumos,
    maquinarios,
  ] =
    await Promise.all([
      listarEquipesEmpresa(localStorage.getItem("idconstrutora") || localStorage.getItem("id_construtora")),

      buscarRecursosPorObras(
        obras,
        "/insumos",
        obterIdInsumo
      ),

      buscarRecursosPorObras(
        obras,
        "/maquinarios",
        obterIdMaquinario
      ),
    ]);

  return {
    equipes,
    insumos,
    maquinarios,
  };
}

// =====================================================
// ATRIBUIÇÕES
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
      "Não foi possível identificar a equipe selecionada."
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
      "Não foi possível identificar o insumo selecionado."
    );
  }

  const payload = {
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
  };

  return requisitar(
    `/insumos/insert/${id}`,
    {
      method: "PUT",

      body:
        JSON.stringify(
          payload
        ),
    }
  );
}

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
      "Não foi possível identificar o maquinário selecionado."
    );
  }

  const payload = {
    nome:
      maquinario.nome,

    quantidade:
      Number(
        maquinario.quantidade ||
        0
      ),

    etapa_atuacao:
      maquinario.etapa_atuacao,

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
  };

  return requisitar(
    `/maquinarios/insert/${id}`,
    {
      method: "PUT",

      body:
        JSON.stringify(
          payload
        ),
    }
  );
}

// =====================================================
// RECURSOS DA OBRA
// =====================================================

export async function buscarRecursosDaObra(idObra) {
  const [insumos, maquinarios, terceirizadas, internas] = await Promise.all([
    requisitar(`/insumos?idobra=${idObra}`),
    requisitar(`/maquinarios?idobra=${idObra}`),
    listarEquipesTerceirizadas(idObra),
    listarEquipesEmpresa(),
  ]);
  return {
    equipes: [
      ...internas.filter(item => Number(item.idobra) === Number(idObra)),
      ...terceirizadas.filter(item => Number(item.id_obra) === Number(idObra)).map(item => ({ ...item, custo_diario: item.custo_diario_total, origem: "terceirizada" })),
    ],
    insumos: extrairArray(insumos, ["insumos"]).filter(item => Number(item.idobra) === Number(idObra)),
    maquinarios: extrairArray(maquinarios, ["maquinarios"]).filter(item => Number(item.idobra) === Number(idObra)),
    aviso: internas.aviso,
  };
}

// O schema exige idobra NOT NULL. DELETE exclui o cadastro; não desatribui.
export async function excluirRecurso(tipo, recurso) {
  if (tipo === "equipe") {
    return recurso.origem === "terceirizada"
      ? excluirEquipeTerceirizada(obterIdEquipe(recurso))
      : excluirEquipe(recurso);
  }
  const rotas = { insumo: ["insumos", obterIdInsumo], maquinario: ["maquinarios", obterIdMaquinario] };
  const config = rotas[tipo];
  if (!config) throw new Error("Tipo de recurso inválido.");
  const id = config[1](recurso);
  if (!id) throw new Error("Recurso sem identificador.");
  return requisitar(`/${config[0]}/del/${id}`, { method: "DELETE" });
}
