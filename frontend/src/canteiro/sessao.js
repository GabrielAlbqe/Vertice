import {limparCache} from './offline.js';
import {API_URL,readSession,sessionId,sessionHeaders} from '../api/sessionTransport.js';
export function usuarioSeguro(
  usuario = {}
) {
  return Object.fromEntries(
    [
      "id_usuario",
      "nome",
      "email",
      "ocupacao",
      "ambiente",
      "perfil",
      "status",
      "idconstrutora",
      "id_construtora",
    ]
      .filter(
        (campo) =>
          usuario[campo] !==
          undefined
      )
      .map(
        (campo) => [
          campo,
          usuario[campo],
        ]
      )
  );
}

export function lerUsuario() {
  let usuario = {};

  try {
    usuario =
      JSON.parse(
        localStorage.getItem(
          "usuario"
        ) || "{}"
      ) || {};
  } catch {
    // Sessão antiga ou inválida.
  }

  usuario =
    usuarioSeguro(usuario);

  return {
    ...usuario,

    id_usuario:
      localStorage.getItem(
        "id_usuario"
      ) ||
      usuario.id_usuario,

    nome:
      usuario.nome ||
      localStorage.getItem(
        "nome_usuario"
      ) ||
      "",

    email:
      usuario.email ||
      localStorage.getItem(
        "email_usuario"
      ) ||
      "",

    ocupacao:
      usuario.ocupacao ||
      localStorage.getItem(
        "ocupacao"
      ) ||
      "",

    ambiente:
      usuario.ambiente ||
      localStorage.getItem(
        "ambiente"
      ) ||
      "",

    idconstrutora:
      usuario.idconstrutora ||
      usuario.id_construtora ||
      localStorage.getItem(
        "idconstrutora"
      ) ||
      localStorage.getItem(
        "id_construtora"
      ),
  };
}

export function usuarioCanteiro(
  usuario = lerUsuario()
) {
  const ambiente =
    String(
      usuario.ambiente || ""
    )
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .toLowerCase()
      .trim();

  if (ambiente) {
    return (
      ambiente === "canteiro" ||
      ambiente ===
        "canteiro de obras"
    );
  }

  const perfil =
    String(
      usuario.perfil ||
      usuario.ocupacao ||
      ""
    )
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .toLowerCase()
      .trim();

  return (
    perfil === "operacional"
  );
}

export const paginasCanteiro = [
  "canteiro-home",
  "canteiro-obra",
  "canteiro-registrar",
  "canteiro-diario",
  "canteiro-registros",
  "canteiro-historico",
  "canteiro-pendencias",
  "canteiro-perfil",
  "canteiro-atividade",
  "canteiro-material",
  "canteiro-ocorrencia",
  "canteiro-foto",
];

export function limparSessaoLocal() {
  limparCache(localStorage.getItem('id_usuario'));
  [
    "id_usuario",
    "nome_usuario",
    "email_usuario",
    "ocupacao",
    "ambiente",
    "status_usuario",
    "idconstrutora",
    "id_construtora",
    "usuario",
    "obra_selecionada",
    "pagina_atual",
    "abrir_cadastro_obra",

    // JWT
    "token",
    "vertice:session",
  ].forEach(
    (chave) =>
      localStorage.removeItem(
        chave
      )
  );
}

export function sessaoValida() {
  const session=readSession();
  return Number.isFinite(session?.expiresAt) && session.expiresAt>Date.now() && session.user===String(localStorage.getItem('id_usuario'));
}

export function invalidarSessao(token) {
  // Uma resposta atrasada não deve encerrar um login mais recente.
  if(token!==sessionId())return;
  limparSessaoLocal();
  if(typeof window!=='undefined')window.dispatchEvent(new Event('vertice:sessao-expirada'));
}

export async function sairCanteiro(){
  try{
    const response=await fetch(API_URL+'/usuarios/logout',{method:'POST',credentials:'include',headers:sessionHeaders(),signal:AbortSignal.timeout(10000)});
    if(!response.ok&&response.status!==401)throw Error();
    limparSessaoLocal();return true;
  }catch{if(typeof window!=='undefined')window.alert('Não foi possível revogar a sessão. Conecte-se e tente sair novamente.');return false;}
}
