import {
  requisitar,
} from "./api";

const LIMITE_EQUIPES = 100;
const TAMANHO_LOTE = 10;
const LOTES_VAZIOS_PARA_PARAR = 2;

function removerDuplicados(
  lista,
  obterId
) {
  const mapa = new Map();

  lista.forEach(
    (item) => {
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
    }
  );

  return Array.from(
    mapa.values()
  );
}

export function obterIdEquipe(item) {
  return (
    item?.id_cadastro_equipes ??
    item?.id_equipe_terceirizada ??
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
// EQUIPES INTERNAS
// =====================================================
// O GET /equipes/ do backend atual também chama getAll(),
// que não existe no model. Por isso buscamos por /equipes/:id.
// =====================================================

async function buscarEquipesPorId() {
  const encontrados = [];

  let lotesVazios = 0;

  for (
    let inicio = 1;
    inicio <= LIMITE_EQUIPES;
    inicio += TAMANHO_LOTE
  ) {
    const ids = Array.from(
      {
        length: Math.min(
          TAMANHO_LOTE,
          LIMITE_EQUIPES -
            inicio +
            1
        ),
      },
      (_, indice) =>
        inicio + indice
    );

    const lote =
      await Promise.all(
        ids.map(
          async (id) => {
            try {
              return await requisitar(
                `/equipes/${id}`
              );
            } catch {
              return null;
            }
          }
        )
      );

    const existentes =
      lote.filter(Boolean);

    encontrados.push(
      ...existentes
    );

    if (existentes.length > 0) {
      lotesVazios = 0;
    } else {
      lotesVazios += 1;

      if (
        encontrados.length > 0 &&
        lotesVazios >=
          LOTES_VAZIOS_PARA_PARAR
      ) {
        break;
      }

      if (
        encontrados.length === 0 &&
        inicio >= 30
      ) {
        break;
      }
    }
  }

  return removerDuplicados(
    encontrados,
    obterIdEquipe
  );
}

// =====================================================
// INSUMOS / MAQUINÁRIOS
// =====================================================

async function buscarRecursosPorObras(
  obras,
  endpoint,
  obterId
) {
  const respostas =
    await Promise.all(
      obras.map(
        async (obra) => {
          try {
            const idObra =
              obra.id_obra;

            const dados =
              await requisitar(
                `${endpoint}?idobra=${idObra}`
              );

            return Array.isArray(
              dados
            )
              ? dados
              : [];
          } catch {
            return [];
          }
        }
      )
    );

  let lista =
    respostas.flat();

  if (lista.length === 0) {
    const tentativas =
      await Promise.all(
        Array.from(
          { length: 30 },
          (_, i) => i + 1
        ).map(
          async (id) => {
            try {
              return await requisitar(
                `${endpoint}/${id}`
              );
            } catch {
              return null;
            }
          }
        )
      );

    lista =
      tentativas.filter(
        Boolean
      );
  }

  return removerDuplicados(
    lista,
    obterId
  );
}

// =====================================================
// CATÁLOGO COMPLETO
// Mantido porque outras telas do frontend podem usar.
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
      buscarEquipesPorId(),

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
// Mantidas para a página interna da obra / outras telas.
// =====================================================

export async function atribuirEquipe(
  equipe,
  idObra
) {
  const id =
    obterIdEquipe(equipe);

  if (!id) {
    throw new Error(
      "Não foi possível identificar a equipe selecionada."
    );
  }

  const payload = {
    nome_equipe:
      equipe.nome_equipe,

    etapa_atuacao:
      equipe.etapa_atuacao,

    quantidade_profissionais:
      Number(
        equipe.quantidade_profissionais ||
          0
      ),

    custo_diario:
      Number(
        equipe.custo_diario ||
          0
      ),

    custo_mensal:
      Number(
        equipe.custo_mensal ||
          0
      ),

    idobra:
      Number(idObra),
  };

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

export async function atribuirInsumo(
  insumo,
  idObra
) {
  const id =
    obterIdInsumo(insumo);

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
      Number(idObra),
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
      Number(idObra),
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
// RECURSOS JÁ LIGADOS À OBRA
// =====================================================

export async function buscarRecursosDaObra(
  idObra
) {
  const [
    insumosResposta,
    maquinariosResposta,
    terceirizadasResposta,
  ] =
    await Promise.all([
      requisitar(
        `/insumos?idobra=${idObra}`
      ).catch(() => []),

      requisitar(
        `/maquinarios?idobra=${idObra}`
      ).catch(() => []),

      // Esta rota do backend funciona filtrando por id_obra.
      requisitar(
        `/equipes-terceirizadas?id_obra=${idObra}`
      ).catch(() => []),
    ]);

  // As equipes da tabela cadastro_de_equipes são buscadas
  // por ID porque /equipes/ está quebrado no backend atual.
  const equipesInternas =
    await buscarEquipesPorId();

  const internasDaObra =
    equipesInternas.filter(
      (equipe) =>
        Number(
          equipe.idobra
        ) ===
        Number(
          idObra
        )
    );

  const terceirizadas =
    Array.isArray(
      terceirizadasResposta
    )
      ? terceirizadasResposta
      : [];

  return {
    equipes:
      removerDuplicados(
        [
          ...internasDaObra,
          ...terceirizadas,
        ],
        obterIdEquipe
      ),

    insumos:
      Array.isArray(
        insumosResposta
      )
        ? insumosResposta
        : [],

    maquinarios:
      Array.isArray(
        maquinariosResposta
      )
        ? maquinariosResposta
        : [],
  };
}