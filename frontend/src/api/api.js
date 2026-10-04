const API_URL = (import.meta.env?.VITE_API_URL || "http://localhost:3000/api").replace(/\/$/, "");

export async function requisitar(
  endpoint,
  opcoes = {}
) {
  let resposta;
  try {
    resposta = await fetch(
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
  } catch (causa) {
    if (causa.name === "AbortError") throw causa;
    throw new Error("Falha de conexão com o servidor. Se estava enviando, consulte os registros antes de tentar novamente.", { cause: causa });
  }

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
        ? (dados.trim().startsWith("<") ? `Erro ${resposta.status} no servidor ao acessar ${endpoint}.` : dados)
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
