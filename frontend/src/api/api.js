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

  const contentType =
    resposta.headers.get(
      "content-type"
    ) || "";

  let dados;

  if (
    contentType.includes(
      "application/json"
    )
  ) {
    dados =
      await resposta.json();
  } else {
    dados =
      await resposta.text();
  }

  if (!resposta.ok) {
    const mensagem =
      typeof dados ===
      "string"
        ? dados
        : dados?.mensagem ||
          dados?.erro ||
          "Erro na requisição.";

    throw new Error(
      mensagem
    );
  }

  return dados;
}