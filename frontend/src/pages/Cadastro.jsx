import {
  useState,
} from "react";

import {
  requisitar,
} from "../api/api";

const estadoInicial = {
  nome: "",
  email: "",
  senha: "",
  confirmarSenha: "",
  ocupacao: "",
  ambiente: "Escritório",
  status: "Ativo",
  idconstrutora: "",
};

function Cadastro({
  onCadastro,
  onVoltar,
}) {
  const [
    formulario,
    setFormulario,
  ] = useState(
    estadoInicial
  );

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    carregando,
    setCarregando,
  ] = useState(false);

  function alterar(evento) {
    const {
      name,
      value,
    } = evento.target;

    setFormulario(
      (anterior) => ({
        ...anterior,
        [name]: value,
      })
    );
  }

  async function handleSubmit(
    evento
  ) {
    evento.preventDefault();

    setErro("");

    if (
      formulario.senha !==
      formulario.confirmarSenha
    ) {
      setErro(
        "As senhas não coincidem."
      );

      return;
    }

    try {
      setCarregando(true);

      await requisitar(
        "/usuarios/insert",
        {
          method: "POST",

          body: JSON.stringify({
            nome:
              formulario.nome.trim(),

            email:
              formulario.email.trim(),

            senha:
              formulario.senha,

            ocupacao:
              formulario.ocupacao ||
              null,

            ambiente:
              formulario.ambiente ||
              null,

            status:
              formulario.status ||
              "Ativo",

            idconstrutora:
              Number(
                formulario
                  .idconstrutora
              ),
          }),
        }
      );

      if (
        typeof onCadastro ===
        "function"
      ) {
        onCadastro();
      }
    } catch (erroCadastro) {
      console.error(
        "Erro ao cadastrar:",
        erroCadastro
      );

      setErro(
        erroCadastro.message ||
          "Não foi possível criar a conta."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">

        <div className="auth-brand">
          <h1>
            VÉRTICE
          </h1>

          <p>
            Inteligência para construção civil
          </p>
        </div>

        <div className="auth-card">

          <div className="auth-header">
            <h2>
              Criar conta
            </h2>

            <p>
              Cadastre o usuário para acessar o sistema.
            </p>
          </div>

          <form
            onSubmit={
              handleSubmit
            }
          >

            <div className="form-group">
              <label>
                Nome
              </label>

              <input
                name="nome"
                value={
                  formulario.nome
                }
                onChange={
                  alterar
                }
                required
              />
            </div>

            <div className="form-group">
              <label>
                E-mail
              </label>

              <input
                type="email"
                name="email"
                value={
                  formulario.email
                }
                onChange={
                  alterar
                }
                required
              />
            </div>

            <div className="form-group">
              <label>
                Função / ocupação
              </label>

              <input
                name="ocupacao"
                placeholder="Ex: Engenheiro, Mestre de Obras..."
                value={
                  formulario.ocupacao
                }
                onChange={
                  alterar
                }
              />
            </div>

            <div className="form-group">
              <label>
                Ambiente
              </label>

              <select
                name="ambiente"
                value={
                  formulario.ambiente
                }
                onChange={
                  alterar
                }
              >
                <option value="Escritório">
                  Escritório
                </option>

                <option value="Canteiro">
                  Canteiro
                </option>
              </select>
            </div>

            <div className="form-group">
              <label>
                Status
              </label>

              <select
                name="status"
                value={
                  formulario.status
                }
                onChange={
                  alterar
                }
              >
                <option value="Ativo">
                  Ativo
                </option>

                <option value="Inativo">
                  Inativo
                </option>
              </select>
            </div>

            <div className="form-group">
              <label>
                ID da Construtora
              </label>

              <input
                type="number"
                min="1"
                name="idconstrutora"
                value={
                  formulario
                    .idconstrutora
                }
                onChange={
                  alterar
                }
                required
              />
            </div>

            <div className="form-group">
              <label>
                Senha
              </label>

              <input
                type="password"
                name="senha"
                value={
                  formulario.senha
                }
                onChange={
                  alterar
                }
                required
              />
            </div>

            <div className="form-group">
              <label>
                Confirmar senha
              </label>

              <input
                type="password"
                name="confirmarSenha"
                value={
                  formulario
                    .confirmarSenha
                }
                onChange={
                  alterar
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
              disabled={
                carregando
              }
            >
              {carregando
                ? "Criando conta..."
                : "Criar conta"}
            </button>

          </form>

          <div className="auth-footer">
            <span>
              Já possui uma conta?
            </span>

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