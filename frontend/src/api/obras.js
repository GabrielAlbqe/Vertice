import { listarEquipesEmpresa } from "./recursos.js";

import {
  requisitar,
} from "./api.js";

// =====================================================
// CACHE LOCAL DE IDS DE OBRAS
// =====================================================

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

export function normalizarObra(
  item = {}
) {
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

function salvarIdsConhecidos(
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
    CHAVE_IDS_OBRAS,
    JSON.stringify(limpos)
  );
}

export function lembrarIdObra(
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
    lerIdsConhecidos()
      .filter(
        (item) =>
          item !== numero
      )
  );
}

// =====================================================
// BUSCAR UMA OBRA
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
// DESCOBRIR IDS EXISTENTES
// =====================================================
//
// IMPORTANTE:
// O GET /api/obras do backend atual está quebrado porque
// o controller chama Obra.getAll(), mas o model não possui getAll().
//
// Como o backend não será alterado, o frontend descobre IDs por
// outras rotas JÁ FUNCIONAIS que possuem id_obra:
//   /etapas
//   /equipes-terceirizadas
//   /custos-planejados
//
// Também preserva os IDs de obras que o navegador já conhece.
// Isso elimina a antiga varredura /obras/1, /obras/2, /obras/3...
// e, consequentemente, os vários 404 do console.
// =====================================================

async function descobrirIdsObras() {
  const ids =
    new Set(
      lerIdsConhecidos()
    );

  // Se havia uma obra aberta anteriormente,
  // aproveitamos o ID salvo no navegador.
  try {
    const selecionada =
      JSON.parse(
        localStorage.getItem(
          "obra_selecionada"
        ) || "null"
      );

    const id =
      Number(
        selecionada?.id_obra ??
        selecionada?.id
      );

    if (
      Number.isInteger(id) &&
      id > 0
    ) {
      ids.add(id);
    }
  } catch {
    // Ignora JSON antigo inválido.
  }

  const resultados =
    await Promise.allSettled([
      requisitar(
        "/etapas"
      ),

      requisitar(
        "/equipes-terceirizadas"
      ),

      requisitar(
        "/custos-planejados"
      ),
    ]);

  resultados.forEach(
    (resultado) => {
      if (
        resultado.status !==
        "fulfilled"
      ) {
        return;
      }

      const lista =
        extrairArray(
          resultado.value,
          [
            "etapas",
            "equipes",
            "equipes_terceirizadas",
            "custos",
            "custos_planejados",
          ]
        );

      lista.forEach(
        (item) => {
          const id =
            Number(
              item?.id_obra ??
              item?.idobra ??
              item?.idx_obra ??
              item?.obrax_id
            );

          if (
            Number.isInteger(id) &&
            id > 0
          ) {
            ids.add(id);
          }
        }
      );
    }
  );

  const equipes = await listarEquipesEmpresa();
  equipes.forEach(item => { if (Number(item.idobra) > 0) ids.add(Number(item.idobra)); });
  const listaIds = Array.from(ids);

  salvarIdsConhecidos(
    listaIds
  );

  return listaIds;
}

// =====================================================
// LISTAR OBRAS
// =====================================================

export async function listarObras(
  idConstrutora
) {
  const ids =
    await descobrirIdsObras();

  // Sem IDs conhecidos, retornamos lista vazia.
  // Não fazemos varredura numérica e não chamamos /obras/,
  // evitando os erros do backend e os 404 em sequência.


  const respostas =
    await Promise.allSettled(
      ids.map(
        (id) =>
          buscarObraPorId(
            id
          )
      )
    );

  const obras =
    respostas
      .filter(
        (resultado) =>
          resultado.status ===
          "fulfilled"
      )
      .map(
        (resultado) =>
          resultado.value
      )
      .filter(
        (obra) => {
          if (!obra) {
            return false;
          }

          if (!idConstrutora) {
            return true;
          }

          return (
            Number(
              obra.id_construtora
            ) ===
            Number(
              idConstrutora
            )
          );
        }
      );

  respostas.forEach((resultado, index) => {
    if (resultado.status === "rejected" && resultado.reason?.status === 404) esquecerIdObra(ids[index]);
  });
  const falha = respostas.find(item => item.status === "rejected" && item.reason?.status !== 404);
  if (falha) throw falha.reason;
  obras.aviso = "A listagem de obras está parcial: o servidor não oferece a consulta completa. São exibidas obras conhecidas ou vinculadas aos registros encontrados.";

  return obras.sort(
    (a, b) =>
      Number(
        b.id_obra
      ) -
      Number(
        a.id_obra
      )
  );
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
        method:
          "POST",

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
        method:
          "PUT",

        body:
          JSON.stringify(
            dadosObra
          ),
      }
    );

  lembrarIdObra(
    id
  );

  return resposta;
}

// =====================================================
// EXCLUIR
// =====================================================

export async function excluirObra(
  id
) {
  const resposta =
    await requisitar(
      `/obras/del/${id}`,
      {
        method:
          "DELETE",
      }
    );

  esquecerIdObra(
    id
  );

  return resposta;
}