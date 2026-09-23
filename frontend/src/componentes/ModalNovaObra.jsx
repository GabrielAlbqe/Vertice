import { useState } from "react";

function ModalNovaObra({
  aberto,
  onFechar,
  onCadastrar,
}) {
  const [novaObra, setNovaObra] = useState({
    nome_obra: "",
    status: "",
    categoria: "",
    numero_pavimento: "",
    data_inicial_planejada: "",
    data_final_planejada: "",
    orcamento_planejado: "",
  });

  if (!aberto) {
    return null;
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setNovaObra({
      ...novaObra,
      [name]: value,
    });
  }

  function cadastrarObra(event) {
    event.preventDefault();

    if (
      novaObra.data_final_planejada <
      novaObra.data_inicial_planejada
    ) {
      alert(
        "A data final não pode ser anterior à data inicial."
      );

      return;
    }

    const obra = {
      id_obra: Date.now(),

      nome_obra: novaObra.nome_obra,

      status: novaObra.status,

      categoria: novaObra.categoria,

      numero_pavimento: Number(
        novaObra.numero_pavimento
      ),

      data_inicial_planejada:
        novaObra.data_inicial_planejada,

      data_final_planejada:
        novaObra.data_final_planejada,

      orcamento_planejado: Number(
        novaObra.orcamento_planejado
      ),
    };

    if (onCadastrar) {
      onCadastrar(obra);
    }

    setNovaObra({
      nome_obra: "",
      status: "",
      categoria: "",
      numero_pavimento: "",
      data_inicial_planejada: "",
      data_final_planejada: "",
      orcamento_planejado: "",
    });

    onFechar();
  }

  return (
    <div className="modal-overlay">

      <div className="modal-container modal-obra">

        {/* CABEÇALHO */}

        <div className="modal-header">

          <div>
            <span className="section-label">
              PLANEJAMENTO
            </span>

            <h2>Nova obra</h2>

            <p>
              Preencha as informações para cadastrar
              uma nova obra.
            </p>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onFechar}
          >
            ×
          </button>

        </div>

        {/* FORMULÁRIO */}

        <form
          className="obra-form"
          onSubmit={cadastrarObra}
        >

          {/* NOME */}

          <div className="form-group">

            <label>
              Nome da obra
            </label>

            <input
              type="text"
              name="nome_obra"
              placeholder="Ex: Residencial Aurora"
              value={novaObra.nome_obra}
              onChange={handleChange}
              required
            />

          </div>

          <div className="obra-form-grid">

            {/* STATUS */}

            <div className="form-group">

              <label>
                Status
              </label>

              <select
                name="status"
                value={novaObra.status}
                onChange={handleChange}
                required
              >

                <option value="">
                  Selecione
                </option>

                <option value="iniciada">
                  Iniciada
                </option>

                <option value="em andamento">
                  Em andamento
                </option>

                <option value="paralisada">
                  Paralisada
                </option>

                <option value="concluida">
                  Concluída
                </option>

              </select>

            </div>

            {/* CATEGORIA */}

            <div className="form-group">

              <label>
                Categoria
              </label>

              <select
                name="categoria"
                value={novaObra.categoria}
                onChange={handleChange}
                required
              >

                <option value="">
                  Selecione
                </option>

                <option value="residencial">
                  Residencial
                </option>

                <option value="comercial">
                  Comercial
                </option>

                <option value="industrial">
                  Industrial
                </option>

                <option value="reformas">
                  Reformas
                </option>

              </select>

            </div>

          </div>

          {/* PAVIMENTOS */}

          <div className="form-group">

            <label>
              Número de pavimentos
            </label>

            <input
              type="number"
              name="numero_pavimento"
              min="1"
              placeholder="Ex: 12"
              value={novaObra.numero_pavimento}
              onChange={handleChange}
              required
            />

          </div>

          {/* DATAS */}

          <div className="obra-form-grid">

            <div className="form-group">

              <label>
                Data inicial planejada
              </label>

              <input
                type="date"
                name="data_inicial_planejada"
                value={
                  novaObra.data_inicial_planejada
                }
                onChange={handleChange}
                required
              />

            </div>

            <div className="form-group">

              <label>
                Data final planejada
              </label>

              <input
                type="date"
                name="data_final_planejada"
                value={
                  novaObra.data_final_planejada
                }
                onChange={handleChange}
                required
              />

            </div>

          </div>

          {/* ORÇAMENTO */}

          <div className="form-group">

            <label>
              Orçamento planejado
            </label>

            <input
              type="number"
              name="orcamento_planejado"
              min="0"
              step="0.01"
              placeholder="Ex: 1500000"
              value={
                novaObra.orcamento_planejado
              }
              onChange={handleChange}
              required
            />

          </div>

          {/* AÇÕES */}

          <div className="modal-actions">

            <button
              type="button"
              className="cancel-button"
              onClick={onFechar}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="button"
            >
              Cadastrar obra
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default ModalNovaObra;