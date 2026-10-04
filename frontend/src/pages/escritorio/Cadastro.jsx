import {
  useState,
  useRef,
} from "react";

import {
  requisitar,
} from "../../api/api";

import logoVertice from "../../assets/logo-vertice.png";

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
  const trava = useRef(false);
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
    if (trava.current) return;

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
      if (!formulario.nome.trim() || !Number.isInteger(Number(formulario.idconstrutora)) || Number(formulario.idconstrutora) <= 0) throw new Error("Informe nome e construtora válidos.");
      trava.current = true;
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
      trava.current = false;
      setCarregando(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">

        <div className="auth-brand">
          <img
            src={logoVertice}
            alt="Sistema Vértice - Gestão inteligente de obras"
            className="auth-brand-logo"
          />
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

          <form aria-busy={carregando}
            onSubmit={
              handleSubmit
            }
          >

            <div className="form-group">
              <label htmlFor="cadastro-nome">Nome</label>

              <input
                id="cadastro-nome" name="nome"
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
              <label htmlFor="cadastro-email">E-mail</label>

              <input
                type="email"
                id="cadastro-email" name="email"
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
              <label htmlFor="cadastro-ocupacao">Função / ocupação</label>

              <input
                id="cadastro-ocupacao" name="ocupacao"
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
              <label htmlFor="ambiente">
                Ambiente
              </label>

              <select
                id="ambiente"
                name="ambiente"
                value={formulario.ambiente}
                onChange={alterar}
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
              <label htmlFor="status">
                Status
              </label>

              <select
                id="status"
                name="status"
                value={formulario.status}
                onChange={alterar}
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
              <label htmlFor="cadastro-idconstrutora">ID da Construtora</label>

              <input
                type="number"
                min="1"
                id="cadastro-idconstrutora" name="idconstrutora"
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
              <label htmlFor="cadastro-senha">Senha</label>

              <input
                type="password"
                id="cadastro-senha" name="senha"
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
              <label htmlFor="cadastro-confirmarSenha">Confirmar senha</label>

              <input
                type="password"
                id="cadastro-confirmarSenha" name="confirmarSenha"
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
              <div className="auth-error" role="alert">
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
