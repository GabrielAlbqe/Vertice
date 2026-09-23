import { useState } from "react";
import { requisitar } from "../api/api";

function Cadastro({ onCadastro, onVoltar }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [idconstrutora, setIdConstrutora] = useState("");

  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setErro("");

    // Confere se as senhas são iguais
    if (senha !== confirmarSenha) {
      setErro("As senhas não coincidem.");
      return;
    }

    setCarregando(true);

    try {
      const dados = await requisitar("/usuarios/insert", {
        method: "POST",
        body: JSON.stringify({
          nome,
          email,
          senha,
          idconstrutora,
        }),
      });

      console.log("Usuário cadastrado:", dados);

      // Executa a função enviada pelo componente pai
      onCadastro();

    } catch (erro) {
      console.error("Erro ao cadastrar:", erro);

      setErro(
        erro.message || "Não foi possível criar a conta."
      );

    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="auth-page">

      <div className="auth-container">

        <div className="auth-brand">
          <h1>VÉRTICE</h1>

          <p>
            Inteligência para construção civil
          </p>
        </div>

        <div className="auth-card">

          <div className="auth-header">
            <h2>Criar conta</h2>

            <p>
              Cadastre sua empresa para começar.
            </p>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="form-group">
              <label>Nome</label>

              <input
                type="text"
                placeholder="Nome completo"
                value={nome}
                onChange={(event) =>
                  setNome(event.target.value)
                }
                required
              />
            </div>

            <div className="form-group">
              <label>E-mail</label>

              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                required
              />
            </div>

            <div className="form-group">
              <label>ID da Construtora</label>

              <input
                type="number"
                placeholder="ID da construtora"
                value={idconstrutora}
                onChange={(event) =>
                  setIdConstrutora(event.target.value)
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Senha</label>

              <input
                type="password"
                placeholder="Crie uma senha"
                value={senha}
                onChange={(event) =>
                  setSenha(event.target.value)
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Confirmar senha</label>

              <input
                type="password"
                placeholder="Digite a senha novamente"
                value={confirmarSenha}
                onChange={(event) =>
                  setConfirmarSenha(event.target.value)
                }
                required
              />
            </div>

            {erro && (
              <div className="auth-error">
                {erro}
              </div>
            )}

            <button
              type="submit"
              className="auth-button"
              disabled={carregando}
            >
              {carregando
                ? "Criando conta..."
                : "Criar conta"}
            </button>

          </form>

          <div className="auth-footer">

            <span>Já possui uma conta?</span>

            <button
              type="button"
              onClick={onVoltar}
            >
              Voltar para login
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Cadastro;