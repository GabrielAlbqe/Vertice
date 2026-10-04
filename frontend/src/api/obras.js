import {
  requisitar,
} from "./api.js";

function limparData(data) {
  if (!data) {
    return "";
  }

  return String(data)
    .split("T")[0];
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
      null,

    pavimentos:
      item.numero_pavimentos ??
      item.numero_pavimento ??
      item.pavimentos ??
      null,

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
      item.orcamento_planejado === null || item.orcamento_planejado === undefined || item.orcamento_planejado === "" ? null : Number(item.orcamento_planejado),

    id_construtora:
      item.id_construtora ??
      item.idconstrutora ??
      null,
  };
}

export async function listarObras(
  idConstrutora
) {
  let rota =
    "/obras";

  if (idConstrutora) {
    rota +=
      `?id_construtora=${encodeURIComponent(
        idConstrutora
      )}`;
  }

  const dados =
    await requisitar(
      rota
    );

  if (!Array.isArray(dados) && !Array.isArray(dados?.obras)) throw new Error("Formato de resposta inesperado na consulta de obras.");

  const lista =
    Array.isArray(dados)
      ? dados
      : Array.isArray(
          dados?.obras
        )
        ? dados.obras
        : [];

  return lista
    .map(
      normalizarObra
    )
    .filter(
      (obra) => {
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
    )
    .sort(
      (a, b) =>
        Number(
          b.id_obra
        ) -
        Number(
          a.id_obra
        )
    );
}

export async function buscarObraPorId(
  id
) {
  const dados =
    await requisitar(
      `/obras/${id}`
    );

  return normalizarObra(
    dados
  );
}

export async function criarObra(
  dadosObra
) {
  return requisitar(
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

export async function atualizarObra(
  id,
  dadosObra
) {
  return requisitar(
    `/obras/insert/${id}`,
    {
      method: "PUT",

      body:
        JSON.stringify(
          dadosObra
        ),
    }
  );
}

export async function excluirObra(
  id
) {
  return requisitar(
    `/obras/del/${id}`,
    {
      method:
        "DELETE",
    }
  );
}
