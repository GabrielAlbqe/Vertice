import { useState } from "react";

import Layout from "../componentes/Layout";
import Card from "../componentes/Card";
import Table from "../componentes/Table";

function Equipes({ onNavegar }) {
  const [modalAberto, setModalAberto] = useState(false);

  const obras = [
    {
      id_obra: 1,
      nome: "Residencial Aurora",
    },
    {
      id_obra: 2,
      nome: "Edifício Central",
    },
    {
      id_obra: 3,
      nome: "Condomínio Vale",
    },
    {
      id_obra: 4,
      nome: "Hospital São Lucas",
    },
  ];

  const diasSemana = [
    { valor: "seg", nome: "Segunda" },
    { valor: "ter", nome: "Terça" },
    { valor: "qua", nome: "Quarta" },
    { valor: "qui", nome: "Quinta" },
    { valor: "sex", nome: "Sexta" },
    { valor: "sab", nome: "Sábado" },
    { valor: "dom", nome: "Domingo" },
  ];

  const [equipes, setEquipes] = useState([
    {
      id_equipe: 1,
      nome_equipe: "Equipe Elétrica",
      tipo_equipe: "Terceirizada",
      etapa_atuacao: "Instalações",
      custo_diario_total: 850,

      dias_semana_atuacao: [
        "seg",
        "ter",
        "qua",
        "qui",
        "sex",
      ],

      dias_atuacao: "Seg, Ter, Qua, Qui, Sex",

      id_obra: 1,
      obra: "Residencial Aurora",
    },

    {
      id_equipe: 2,
      nome_equipe: "Equipe Estrutural",
      tipo_equipe: "Própria",
      etapa_atuacao: "Supraestrutura e alvenaria",
      custo_diario_total: 1200,

      dias_semana_atuacao: [
        "seg",
        "ter",
        "qua",
        "qui",
        "sex",
        "sab",
      ],

      dias_atuacao: "Seg, Ter, Qua, Qui, Sex, Sáb",

      id_obra: 2,
      obra: "Edifício Central",
    },

    {
      id_equipe: 3,
      nome_equipe: "Equipe de Acabamento",
      tipo_equipe: "Terceirizada",
      etapa_atuacao: "Acabamento",
      custo_diario_total: 700,

      dias_semana_atuacao: [
        "seg",
        "qua",
        "sex",
      ],

      dias_atuacao: "Seg, Qua, Sex",

      id_obra: 3,
      obra: "Condomínio Vale",
    },
  ]);

  const [novaEquipe, setNovaEquipe] = useState({
    nome_equipe: "",
    tipo_equipe: "",
    etapa_atuacao: "",
    custo_diario_total: "",
    dias_semana_atuacao: [],
    id_obra: "",
  });

  const columns = [
    {
      key: "nome_equipe",
      label: "Equipe",
    },
    {
      key: "tipo_equipe",
      label: "Tipo",
    },
    {
      key: "etapa_atuacao",
      label: "Etapa de atuação",
    },
    {
      key: "custo_diario_total",
      label: "Custo diário",
    },
    {
      key: "dias_atuacao",
      label: "Dias de atuação",
    },
    {
      key: "obra",
      label: "Obra",
    },
  ];

  function handleChange(event) {
    const { name, value } = event.target;

    setNovaEquipe({
      ...novaEquipe,
      [name]: value,
    });
  }

  function handleDiaChange(event) {
    const { value, checked } = event.target;

    if (checked) {
      setNovaEquipe({
        ...novaEquipe,

        dias_semana_atuacao: [
          ...novaEquipe.dias_semana_atuacao,
          value,
        ],
      });
    } else {
      setNovaEquipe({
        ...novaEquipe,

        dias_semana_atuacao:
          novaEquipe.dias_semana_atuacao.filter(
            (dia) => dia !== value
          ),
      });
    }
  }

  function formatarDias(dias) {
    const nomes = {
      seg: "Seg",
      ter: "Ter",
      qua: "Qua",
      qui: "Qui",
      sex: "Sex",
      sab: "Sáb",
      dom: "Dom",
    };

    return dias
      .map((dia) => nomes[dia])
      .join(", ");
  }

  function criarEquipe(event) {
    event.preventDefault();

    if (novaEquipe.dias_semana_atuacao.length === 0) {
      alert("Selecione pelo menos um dia de atuação.");
      return;
    }

    const obraSelecionada = obras.find(
      (obra) =>
        obra.id_obra === Number(novaEquipe.id_obra)
    );

    const equipe = {
      id_equipe: Date.now(),

      nome_equipe: novaEquipe.nome_equipe,

      tipo_equipe:
        novaEquipe.tipo_equipe === "propria"
          ? "Própria"
          : "Terceirizada",

      etapa_atuacao:
        novaEquipe.etapa_atuacao,

      custo_diario_total: Number(
        novaEquipe.custo_diario_total
      ),

      dias_semana_atuacao:
        novaEquipe.dias_semana_atuacao,

      dias_atuacao: formatarDias(
        novaEquipe.dias_semana_atuacao
      ),

      id_obra: Number(
        novaEquipe.id_obra
      ),

      obra: obraSelecionada
        ? obraSelecionada.nome
        : "",
    };

    setEquipes([
      ...equipes,
      equipe,
    ]);

    setNovaEquipe({
      nome_equipe: "",
      tipo_equipe: "",
      etapa_atuacao: "",
      custo_diario_total: "",
      dias_semana_atuacao: [],
      id_obra: "",
    });

    setModalAberto(false);
  }

  const equipesProprias =
    equipes.filter(
      (equipe) =>
        equipe.tipo_equipe === "Própria"
    ).length;

  const equipesTerceirizadas =
    equipes.filter(
      (equipe) =>
        equipe.tipo_equipe === "Terceirizada"
    ).length;

  const custoDiarioTotal =
    equipes.reduce(
      (total, equipe) =>
        total +
        Number(
          equipe.custo_diario_total || 0
        ),
      0
    );

  const obrasAtendidas =
    new Set(
      equipes.map(
        (equipe) => equipe.id_obra
      )
    ).size;

  return (
    <Layout onNavegar={onNavegar}>

      <div className="dashboard">

        {/* CABEÇALHO */}

        <section className="dashboard-header">

          <div>

            <span className="dashboard-eyebrow">
              PLANEJAMENTO DE OBRA
            </span>

            <h1>
              Equipes
            </h1>

            <p>
              Cadastre e acompanhe as equipes próprias
              e terceirizadas vinculadas às obras.
            </p>

          </div>

        </section>

        {/* CARDS */}

        <section className="cards-grid">

          <Card
            title="Total de equipes"
            value={equipes.length}
            description="Equipes cadastradas"
          />

          <Card
            title="Equipes próprias"
            value={equipesProprias}
            description="Equipes da empresa"
          />

          <Card
            title="Terceirizadas"
            value={equipesTerceirizadas}
            description="Equipes contratadas"
          />

          <Card
            title="Custo diário"
            value={`R$ ${custoDiarioTotal.toLocaleString(
              "pt-BR",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}`}
            description={`${obrasAtendidas} obras atendidas`}
          />

        </section>

        {/* LISTA */}

        <section className="dashboard-section">

          <div className="section-header">

            <div>

              <span className="section-label">
                GESTÃO DE EQUIPES
              </span>

              <h2>
                Equipes cadastradas
              </h2>

              <p>
                Visualize equipes, tipos,
                etapas, dias de atuação,
                custos e obras.
              </p>

            </div>

            <button
              className="secondary-button"
              onClick={() =>
                setModalAberto(true)
              }
            >
              + Nova equipe
            </button>

          </div>

          <div className="dashboard-table">

            <Table
              columns={columns}
              data={equipes}
            />

          </div>

        </section>

        {/* MODAL */}

        {modalAberto && (

          <div className="modal-overlay">

            <div className="modal-container">

              <div className="modal-header">

                <div>

                  <span className="section-label">
                    PLANEJAMENTO
                  </span>

                  <h2>
                    Nova equipe
                  </h2>

                  <p>
                    Informe os dados da equipe.
                  </p>

                </div>

                <button
                  type="button"
                  className="modal-close"
                  onClick={() =>
                    setModalAberto(false)
                  }
                >
                  ×
                </button>

              </div>

              <form
                className="equipe-form"
                onSubmit={criarEquipe}
              >

                {/* NOME */}

                <div className="form-group">

                  <label>
                    Nome da equipe
                  </label>

                  <input
                    type="text"
                    name="nome_equipe"
                    placeholder="Ex: Equipe Elétrica"
                    value={
                      novaEquipe.nome_equipe
                    }
                    onChange={handleChange}
                    required
                  />

                </div>

                {/* TIPO */}

                <div className="form-group">

                  <label>
                    Tipo da equipe
                  </label>

                  <select
                    name="tipo_equipe"
                    value={
                      novaEquipe.tipo_equipe
                    }
                    onChange={handleChange}
                    required
                  >

                    <option value="">
                      Selecione o tipo
                    </option>

                    <option value="propria">
                      Própria empresa
                    </option>

                    <option value="terceirizada">
                      Terceirizada
                    </option>

                  </select>

                </div>

                {/* ETAPA */}

                <div className="form-group">

                  <label>
                    Etapa de atuação
                  </label>

                  <select
                    name="etapa_atuacao"
                    value={
                      novaEquipe.etapa_atuacao
                    }
                    onChange={handleChange}
                    required
                  >

                    <option value="">
                      Selecione uma etapa
                    </option>

                    <option value="Mobilização">
                      Mobilização
                    </option>

                    <option value="Infraestrutura">
                      Infraestrutura
                    </option>

                    <option value="Supraestrutura e alvenaria">
                      Supraestrutura e alvenaria
                    </option>

                    <option value="Instalações">
                      Instalações
                    </option>

                    <option value="Revestimentos">
                      Revestimentos
                    </option>

                    <option value="Acabamento">
                      Acabamento
                    </option>

                  </select>

                </div>

                {/* CUSTO */}

                <div className="form-group">

                  <label>
                    Custo diário total
                  </label>

                  <input
                    type="number"
                    name="custo_diario_total"
                    min="0"
                    step="0.01"
                    placeholder="Ex: 850,00"
                    value={
                      novaEquipe.custo_diario_total
                    }
                    onChange={handleChange}
                    required
                  />

                </div>

                {/* DIAS */}

                <div className="form-group">

                  <label>
                    Dias da semana de atuação
                  </label>

                  <span className="form-help">
                    Selecione todos os dias em que
                    a equipe trabalha.
                  </span>

                  <div className="dias-semana-grid">

                    {diasSemana.map((dia) => (

                      <label
                        className="dia-checkbox"
                        key={dia.valor}
                      >

                        <input
                          type="checkbox"
                          value={dia.valor}
                          checked={
                            novaEquipe.dias_semana_atuacao.includes(
                              dia.valor
                            )
                          }
                          onChange={
                            handleDiaChange
                          }
                        />

                        <span>
                          {dia.nome}
                        </span>

                      </label>

                    ))}

                  </div>

                </div>

                {/* OBRA */}

                <div className="form-group">

                  <label>
                    Obra
                  </label>

                  <select
                    name="id_obra"
                    value={
                      novaEquipe.id_obra
                    }
                    onChange={handleChange}
                    required
                  >

                    <option value="">
                      Selecione uma obra
                    </option>

                    {obras.map((obra) => (

                      <option
                        key={obra.id_obra}
                        value={obra.id_obra}
                      >
                        {obra.nome}
                      </option>

                    ))}

                  </select>

                </div>

                {/* BOTÕES */}

                <div className="modal-actions">

                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() =>
                      setModalAberto(false)
                    }
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="secondary-button"
                  >
                    Cadastrar equipe
                  </button>

                </div>

              </form>

            </div>

          </div>

        )}

      </div>

    </Layout>
  );
}

export default Equipes;