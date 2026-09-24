const API_URL =
  "http://localhost:3000/api";

export async function requisitar(
  endpoint,
  opcoes = {}
) {
  const resposta =
    await fetch(
      `${API_URL}${endpoint}`,
      {
        ...opcoes,

        headers: {
          "Content-Type":
            "application/json",

          ...(opcoes.headers ||
            {}),
        },
      }
    );

  const texto =
    await resposta.text();

  let dados = null;

  if (texto) {
    try {
      dados =
        JSON.parse(texto);
    } catch {
      dados = texto;
    }
  }

  if (!resposta.ok) {
    const mensagem =
      typeof dados === "string"
        ? dados
        : dados?.message ||
          dados?.mensagem ||
          dados?.error ||
          dados?.erro ||
          `Erro ${resposta.status} na requisição`;

    const erro =
      new Error(mensagem);

    erro.status =
      resposta.status;

    erro.dados =
      dados;

    throw erro;
  }

  return dados;
}

export async function requisicaoOpcional(
  endpoint,
  opcoes = {},
  fallback = null
) {
  try {
    return await requisitar(
      endpoint,
      opcoes
    );
  } catch (erro) {
    console.warn(
      `Falha opcional em ${endpoint}:`,
      erro?.message ||
        erro
    );

    return fallback;
  }
}

export function extrairLista(
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

export {
  API_URL,
};