import {invalidarSessao} from '../canteiro/sessao.js';
import {API_URL,sessionId,sessionHeaders} from './sessionTransport.js';

export async function requisitar(
  endpoint,
  opcoes = {}
) {
  let resposta;

  // =====================================================
  // TOKEN JWT
  // =====================================================

  const token = sessionId();

  try {
    resposta = await fetch(
      `${API_URL}${endpoint}`,
      {
        ...opcoes,
        credentials:'include',

        signal: opcoes.signal
          ? AbortSignal.any([
              opcoes.signal,
              AbortSignal.timeout(15000),
            ])
          : AbortSignal.timeout(15000),

        headers: {
          "Content-Type":
            "application/json",

          // Envia automaticamente o JWT
          // caso o usuário esteja logado.
          ...sessionHeaders(),

          ...(opcoes.headers || {}),
        },
      }
    );
  } catch (causa) {
    if (
      causa.name ===
      "AbortError"
    ) {
      throw causa;
    }

    throw new Error(
      "Falha de conexão com o servidor. Se estava enviando, consulte os registros antes de tentar novamente.",
      {
        cause: causa,
      }
    );
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
    if(resposta.status===401 && endpoint!=='/usuarios/login')invalidarSessao(token);
    const mensagem =
      typeof dados === "string"
        ? (
            dados
              .trim()
              .startsWith("<")
              ? `Erro ${resposta.status} no servidor ao acessar ${endpoint}.`
              : dados
          )
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

  if (
    typeof dados === "string"
  ) {
    // Confirmações textuais dos contratos legados, somente nas rotas e mensagens conhecidas.
    // HTML, GET e textos desconhecidos continuam sendo rejeitados.
    const metodo=(opcoes.method || 'GET').toUpperCase();
    const legado=[
      ['POST',/^\/maquinarios\/insert$/,'Maquinário registrado com sucesso!'],
      ['PUT',/^\/maquinarios\/insert\/\d+$/,'Maquinário atualizado com sucesso!'],
      ['DELETE',/^\/maquinarios\/del\/\d+$/,'Maquinário removido com sucesso!'],
      ['PUT',/^\/insumos\/insert\/\d+$/,'Insumo atualizado com sucesso!'],
      ['DELETE',/^\/insumos\/del\/\d+$/,'Insumo removido com sucesso!'],
    ].some(([m,rota,mensagem])=>m===metodo&&rota.test(endpoint)&&dados===mensagem);
    if(legado)return {message:dados,confirmado:true};
    throw new Error(
      `Formato de resposta inesperado ao acessar ${endpoint}.`
    );
  }

  return dados;
}

export function extrairLista(
  dados,
  chaves = []
) {
  if (
    Array.isArray(dados)
  ) {
    return dados;
  }

  for (
    const chave of chaves
  ) {
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
