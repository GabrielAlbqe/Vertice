import { requisitar } from "./api.js";

const CHAVE_IDS_OBRAS = "vertice_ids_obras_conhecidas";

const LIMITE_VARREDURA = 80;
const TAMANHO_LOTE = 10;
const LOTES_VAZIOS_PARA_PARAR = 2;

function limparData(data) {
  if (!data) return "";

  return String(data).split("T")[0];
}

export function normalizarObra(item = {}) {
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
      item.status ??
      "",

    categoria:
      item.categoria ??
      "",

    numero_pavimentos:
      item.numero_pavimentos ??
      item.numero_pavimento ??
      item.pavimentos ??
      0,

    pavimentos:
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
        item.orcamento_planejado || 0
      ),

    id_construtora:
      item.id_construtora ??
      item.idconstrutora ??
      null,
  };
}

function lerIdsConhecidos() {
  try {
    const dados = JSON.parse(
      localStorage.getItem(
        CHAVE_IDS_OBRAS
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

function salvarIdsConhecidos(ids) {
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
    CHAVE_IDS_OBRAS,
    JSON.stringify(limpos)
  );
}

export function lembrarIdObra(id) {
  const numero = Number(id);

  if (
    !Number.isInteger(numero) ||
    numero <= 0
  ) {
    return;
  }

  salvarIdsConhecidos([
    ...lerIdsConhecidos(),
    numero,
  ]);
}

export function esquecerIdObra(id) {
  const numero = Number(id);

  salvarIdsConhecidos(
    lerIdsConhecidos().filter(
      (item) => item !== numero
    )
  );
}

export async function buscarObraPorId(id) {
  const dados = await requisitar(
    `/obras/${id}`
  );

  const obra = normalizarObra(dados);

  if (obra.id_obra) {
    lembrarIdObra(
      obra.id_obra
    );
  }

  return obra;
}

async function buscarIdsConhecidos(
  idConstrutora
) {
  const respostas = await Promise.all(
    lerIdsConhecidos().map(
      async (id) => {
        try {
          return await buscarObraPorId(
            id
          );
        } catch {
          return null;
        }
      }
    )
  );

  return respostas.filter(
    (obra) =>
      obra &&
      (
        !idConstrutora ||
        Number(
          obra.id_construtora
        ) ===
          Number(
            idConstrutora
          )
      )
  );
}

async function varrerObrasPorId(
  idConstrutora
) {
  const encontradas = new Map();

  let lotesVazios = 0;

  for (
    let inicio = 1;
    inicio <= LIMITE_VARREDURA;
    inicio += TAMANHO_LOTE
  ) {
    const ids = Array.from(
      {
        length: Math.min(
          TAMANHO_LOTE,
          LIMITE_VARREDURA -
            inicio +
            1
        ),
      },

      (_, indice) =>
        inicio + indice
    );

    const lote = await Promise.all(
      ids.map(
        async (id) => {
          try {
            return await buscarObraPorId(
              id
            );
          } catch {
            return null;
          }
        }
      )
    );

    const existentes =
      lote.filter(Boolean);

    existentes.forEach(
      (obra) => {
        if (
          !idConstrutora ||
          Number(
            obra.id_construtora
          ) ===
            Number(
              idConstrutora
            )
        ) {
          encontradas.set(
            Number(
              obra.id_obra
            ),
            obra
          );
        }
      }
    );

    if (
      existentes.length > 0
    ) {
      lotesVazios = 0;
    } else {
      lotesVazios += 1;

      if (
        encontradas.size > 0 &&
        lotesVazios >=
          LOTES_VAZIOS_PARA_PARAR
      ) {
        break;
      }
    }
  }

  return Array.from(
    encontradas.values()
  );
}

export async function listarObras(
  idConstrutora = 1
) {
  try {
    const conhecidas =
      await buscarIdsConhecidos(
        idConstrutora
      );

    if (
      conhecidas.length > 0
    ) {
      return conhecidas.sort(
        (a, b) =>
          Number(
            b.id_obra
          ) -
          Number(
            a.id_obra
          )
      );
    }

    const varridas =
      await varrerObrasPorId(
        idConstrutora
      );

    return varridas.sort(
      (a, b) =>
        Number(
          b.id_obra
        ) -
        Number(
          a.id_obra
        )
    );
  } catch (erro) {
    console.error(
      "Erro ao carregar obras:",
      erro
    );

    return [];
  }
}

export async function criarObra(
  dadosObra
) {
  const resposta =
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

  const idCriado =
    resposta?.insertId ??
    resposta?.id_obra ??
    resposta?.id;

  if (idCriado) {
    lembrarIdObra(
      idCriado
    );
  }

  return resposta;
}

export async function atualizarObra(
  id,
  dadosObra
) {
  const resposta =
    await requisitar(
      `/obras/insert/${id}`,
      {
        method: "PUT",

        body:
          JSON.stringify(
            dadosObra
          ),
      }
    );

  lembrarIdObra(id);

  return resposta;
}

export async function excluirObra(
  id
) {
  const resposta =
    await requisitar(
      `/obras/del/${id}`,
      {
        method: "DELETE",
      }
    );

  esquecerIdObra(id);

  return resposta;
}