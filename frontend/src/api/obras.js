import {
  extrairLista,
  requisitar,
} from "./api.js";

const CHAVE_IDS_OBRAS =
  "vertice_ids_obras_conhecidas";

// =====================================================
// AUXILIARES
// =====================================================

function limparData(data) {
  if (!data) {
    return "";
  }

  return String(data)
    .split("T")[0];
}

function statusCanonico(
  status
) {
  const original =
    String(
      status || ""
    ).trim();

  const valor =
    original.toLowerCase();

  if (
    valor ===
    "planejamento"
  ) {
    return "Planejamento";
  }

  if (
    valor ===
      "em andamento" ||
    valor === "ativo" ||
    valor === "ativa" ||
    valor === "iniciado" ||
    valor === "iniciada"
  ) {
    return "Em Andamento";
  }

  if (
    valor === "paralisada" ||
    valor === "paralisado"
  ) {
    return "Paralisada";
  }

  if (
    valor === "concluída" ||
    valor === "concluida" ||
    valor === "concluído" ||
    valor === "concluido"
  ) {
    return "Concluída";
  }

  return (
    original ||
    "Planejamento"
  );
}

// =====================================================
// NORMALIZAR
// =====================================================

export function normalizarObra(
  item = {}
) {
  const nome =
    item.nome ??
    item.nome_obra ??
    item.obra ??
    "";

  const pavimentos =
    item.numero_pavimentos ??
    item.numero_pavimento ??
    item.pavimentos ??
    0;

  return {
    ...item,

    id_obra:
      item.id_obra ??
      item.id,

    nome,

    obra:
      nome,

    status:
      statusCanonico(
        item.status
      ),

    categoria:
      item.categoria ??
      "",

    numero_pavimentos:
      pavimentos,

    pavimentos,

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
      null,
  };
}

// =====================================================
// IDS CONHECIDOS
// =====================================================

function lerIdsConhecidos() {
  try {
    const dados =
      JSON.parse(
        localStorage.getItem(
          CHAVE_IDS_OBRAS
        ) || "[]"
      );

    if (
      !Array.isArray(dados)
    ) {
      return [];
    }

    return [
      ...new Set(
        dados
          .map(Number)
          .filter(
            (id) =>
              Number.isInteger(
                id
              ) &&
              id > 0
          )
      ),
    ];
  } catch {
    return [];
  }
}

function salvarIdsConhecidos(
  ids
) {
  localStorage.setItem(
    CHAVE_IDS_OBRAS,
    JSON.stringify(
      [
        ...new Set(
          ids
            .map(Number)
            .filter(
              (id) =>
                Number.isInteger(
                  id
                ) &&
                id > 0
            )
        ),
      ]
    )
  );
}

export function lembrarIdObra(
  id
) {
  const numero =
    Number(id);

  if (
    !Number.isInteger(
      numero
    ) ||
    numero <= 0
  ) {
    return;
  }

  salvarIdsConhecidos([
    ...lerIdsConhecidos(),
    numero,
  ]);
}

export function esquecerIdObra(
  id
) {
  const numero =
    Number(id);

  salvarIdsConhecidos(
    lerIdsConhecidos().filter(
      (item) =>
        item !== numero
    )
  );
}

// =====================================================
// BUSCAR POR ID
// =====================================================

export async function buscarObraPorId(
  id
) {
  const dados =
    await requisitar(
      `/obras/${id}`
    );

  const obra =
    normalizarObra(
      dados?.obra ??
        dados
    );

  if (obra.id_obra) {
    lembrarIdObra(
      obra.id_obra
    );
  }

  return obra;
}

// =====================================================
// LISTAR
// =====================================================

export async function listarObras(
  idConstrutora
) {
  try {
    const dados =
      await requisitar(
        `/obras?id_construtora=${encodeURIComponent(
          idConstrutora ?? ""
        )}`
      );

    const lista =
      extrairLista(
        dados,
        ["obras"]
      );

    const obras =
      lista
        .map(
          normalizarObra
        )
        .filter(
          (obra) =>
            !idConstrutora ||
            !obra.id_construtora ||
            Number(
              obra.id_construtora
            ) ===
              Number(
                idConstrutora
              )
        );

    obras.forEach(
      (obra) => {
        lembrarIdObra(
          obra.id_obra
        );
      }
    );

    return obras;
  } catch (erro) {
    console.warn(
      "Listagem geral de obras indisponível. Usando IDs conhecidos.",
      erro?.message ||
        erro
    );

    const ids =
      lerIdsConhecidos();

    if (
      ids.length === 0
    ) {
      return [];
    }

    const respostas =
      await Promise.all(
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

    return respostas
      .filter(Boolean)
      .filter(
        (obra) =>
          !idConstrutora ||
          !obra.id_construtora ||
          Number(
            obra.id_construtora
          ) ===
            Number(
              idConstrutora
            )
      );
  }
}

// =====================================================
// CRIAR
// =====================================================

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

  const id =
    resposta?.insertId ??
    resposta?.id_obra ??
    resposta?.id;

  if (id) {
    lembrarIdObra(id);
  }

  return resposta;
}

// =====================================================
// ATUALIZAR
// =====================================================

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

// =====================================================
// EXCLUIR
// =====================================================

// A rota atual do backend está retornando 500.
// Enquanto o backend não for alterado,
// evitamos disparar uma requisição quebrada.

export async function excluirObra() {
  throw new Error(
    "A exclusão de obras está temporariamente indisponível no backend."
  );
}