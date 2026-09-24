const BASE_URL = "http://localhost:3000/api";

export async function requisitar(caminho, opcoes = {}) {
  const resposta = await fetch(`${BASE_URL}${caminho}`, {
    ...opcoes,
    headers: {
      "Content-Type": "application/json",
      ...(opcoes.headers || {}),
    },
  });

  const texto = await resposta.text();

  let dados = null;

  if (texto) {
    try {
      dados = JSON.parse(texto);
    } catch {
      dados = texto;
    }
  }

  if (!resposta.ok) {
    throw new Error(
      dados?.mensagem ||
        dados?.message ||
        dados?.erro ||
        `Erro ${resposta.status} na requisição`
    );
  }

  return dados;
}

export async function requisicaoOpcional(
  caminho,
  opcoes = {},
  valorPadrao = null
) {
  try {
    return await requisitar(caminho, opcoes);
  } catch (erro) {
    console.warn(
      `Requisição opcional falhou: ${caminho}`,
      erro.message || erro
    );

    return valorPadrao;
  }
}

export function extrairLista(dados, chaves = []) {
  if (Array.isArray(dados)) {
    return dados;
  }

  if (!dados || typeof dados !== "object") {
    return [];
  }

  for (const chave of chaves) {
    if (Array.isArray(dados[chave])) {
      return dados[chave];
    }
  }

  if (Array.isArray(dados.dados)) {
    return dados.dados;
  }

  if (Array.isArray(dados.resultados)) {
    return dados.resultados;
  }

  if (Array.isArray(dados.lista)) {
    return dados.lista;
  }

  return [];
}

export { BASE_URL };