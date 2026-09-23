import { useEffect, useState } from "react";
import { requisitar } from "../api/api";

function Login({ onLogin, onCadastro }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [lembrarEmail, setLembrarEmail] =
    useState(false);
  const [mensagem, setMensagem] =
    useState("");
  const [carregando, setCarregando] =
    useState(false);

  // =====================================================
  // CARREGAR E-MAIL LEMBRADO
  // =====================================================

  useEffect(() => {
    const emailSalvo =
      localStorage.getItem(
        "email_lembrado"
      );

    if (emailSalvo) {
      setEmail(emailSalvo);
      setLembrarEmail(true);
    }
  }, []);

  // =====================================================
  // LOGIN
  // =====================================================

  async function entrar(evento) {
    evento.preventDefault();

    try {
      setCarregando(true);
      setMensagem("");

      if (!email.trim()) {
        throw new Error(
          "Informe o e-mail."
        );
      }

      if (!senha) {
        throw new Error(
          "Informe a senha."
        );
      }

      const dados =
        await requisitar(
          "/usuarios/login",
          {
            method: "POST",

            body: JSON.stringify({
              email:
                email.trim(),
              senha,
            }),
          }
        );

      const usuario =
        dados?.usuario;

      if (!usuario) {
        throw new Error(
          "O servidor não retornou os dados do usuário."
        );
      }

      if (!usuario.id_usuario) {
        throw new Error(
          "O servidor não retornou o ID do usuário."
        );
      }

      // =================================================
      // SALVAR USUÁRIO LOGADO
      // =================================================

      localStorage.setItem(
        "id_usuario",
        String(
          usuario.id_usuario
        )
      );

      localStorage.setItem(
        "nome_usuario",
        usuario.nome || ""
      );

      localStorage.setItem(
        "email_usuario",
        usuario.email || ""
      );

      localStorage.setItem(
        "ocupacao",
        usuario.ocupacao || ""
      );

      localStorage.setItem(
        "ambiente",
        usuario.ambiente || ""
      );

      localStorage.setItem(
        "status_usuario",
        usuario.status || ""
      );

      if (
        usuario.idconstrutora !==
          undefined &&
        usuario.idconstrutora !==
          null
      ) {
        localStorage.setItem(
          "idconstrutora",
          String(
            usuario.idconstrutora
          )
        );

        // Mantido também para compatibilidade
        // com partes antigas do frontend.
        localStorage.setItem(
          "id_construtora",
          String(
            usuario.idconstrutora
          )
        );
      }

      localStorage.setItem(
        "usuario",
        JSON.stringify(usuario)
      );

      // =================================================
      // LEMBRAR SOMENTE O E-MAIL
      // Nunca salvamos a senha.
      // =================================================

      if (lembrarEmail) {
        localStorage.setItem(
          "email_lembrado",
          email.trim()
        );
      } else {
        localStorage.removeItem(
          "email_lembrado"
        );
      }

      // =================================================
      // IR PARA O SISTEMA
      // =================================================

      if (
        typeof onLogin ===
        "function"
      ) {
        onLogin(usuario);
      }
    } catch (erro) {
      console.error(
        "Erro de login:",
        erro
      );

      setMensagem(
        erro.message ||
          "Não foi possível fazer login."
      );
    } finally {
      setCarregando(false);
    }
  }

  // =====================================================
  // JSX
  // =====================================================

  return (
    <div className="auth-page">

      <div className="auth-container">

        <div className="auth-brand">

          <h1>
            VÉRTICE
          </h1>

          <p>
            Planejamento e Controle de Obras
          </p>

        </div>

        <div className="auth-card">

          <div className="auth-header">

            <h2>
              Entrar
            </h2>

            <p>
              Acesse sua conta para continuar.
            </p>

          </div>

          {mensagem && (
            <div
              className="auth-error"
              style={{
                marginBottom: "18px",
              }}
            >
              {mensagem}
            </div>
          )}

          <form onSubmit={entrar}>

            <div className="form-group">

              <label htmlFor="email">
                E-mail
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(evento) =>
                  setEmail(
                    evento.target.value
                  )
                }
                placeholder="seuemail@empresa.com"
                autoComplete="email"
                disabled={carregando}
                required
              />

            </div>

            <div className="form-group">

              <label htmlFor="senha">
                Senha
              </label>

              <input
                id="senha"
                type="password"
                value={senha}
                onChange={(evento) =>
                  setSenha(
                    evento.target.value
                  )
                }
                placeholder="Digite sua senha"
                autoComplete="current-password"
                disabled={carregando}
                required
              />

            </div>

            <div className="auth-options">

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                }}
              >

                <input
                  type="checkbox"
                  checked={lembrarEmail}
                  onChange={(evento) =>
                    setLembrarEmail(
                      evento.target.checked
                    )
                  }
                  disabled={carregando}
                  style={{
                    width: "auto",
                  }}
                />

                Lembrar e-mail

              </label>

            </div>

            <button
              type="submit"
              className="auth-button"
              disabled={carregando}
            >
              {carregando
                ? "Entrando..."
                : "Entrar"}
            </button>

          </form>

          <div
            className="auth-footer"
            style={{
              marginTop: "22px",
            }}
          >

            <span>
              Ainda não possui conta?
            </span>

            <button
              type="button"
              onClick={() => {
                if (
                  typeof onCadastro ===
                  "function"
                ) {
                  onCadastro();
                }
              }}
              disabled={carregando}
            >
              Cadastre-se
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;
