import { useEffect, useState } from "react";
import Layout from "../componentes/Layout";
import { requisitar } from "../api/api";

function Perfil({ onNavegar }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    buscarUsuario();
  }, []);

  async function buscarUsuario() {
    try {
      const idUsuario =
        localStorage.getItem("id_usuario");

      if (!idUsuario) {
        setErro("Usuário não identificado.");
        return;
      }

      const dados = await requisitar(
        `/usuarios/${idUsuario}`
      );

      setUsuario(
        dados.usuario || dados
      );

    } catch (erro) {
      console.error(
        "Erro ao buscar perfil:",
        erro
      );

      setErro(
        "Não foi possível carregar o perfil."
      );

    } finally {
      setCarregando(false);
    }
  }

  return (
    <Layout onNavegar={onNavegar}>

      <div className="dashboard">

        <section className="dashboard-header">

          <div>
            <span className="dashboard-eyebrow">
              MINHA CONTA
            </span>

            <h1>
              Perfil
            </h1>

            <p>
              Informações do usuário conectado.
            </p>
          </div>

        </section>

        {carregando && (
          <p>Carregando...</p>
        )}

        {erro && (
          <div className="auth-error">
            {erro}
          </div>
        )}

        {usuario && (
          <section className="dashboard-section">

            <div className="perfil-container">

              <div className="perfil-avatar">
                {usuario.nome
                  ?.charAt(0)
                  .toUpperCase() || "U"}
              </div>

              <div className="perfil-dados">

                <div className="perfil-campo">
                  <span>Nome</span>

                  <strong>
                    {usuario.nome || "-"}
                  </strong>
                </div>

                <div className="perfil-campo">
                  <span>E-mail</span>

                  <strong>
                    {usuario.email || "-"}
                  </strong>
                </div>

                <div className="perfil-campo">
                  <span>Função</span>

                  <strong>
                    {usuario.ocupacao || "-"}
                  </strong>
                </div>

                <div className="perfil-campo">
                  <span>Ambiente</span>

                  <strong>
                    {usuario.ambiente || "-"}
                  </strong>
                </div>

              </div>

            </div>

          </section>
        )}

      </div>

    </Layout>
  );
}

export default Perfil;