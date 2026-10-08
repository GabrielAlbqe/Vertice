import { requisitar } from "./api.js";

export async function analisarProdutividade(
  idObra,
  periodo = {}
) {
  const rdos = await requisitar(
    `/rdo?id_obra=${idObra}`
  );

  const {
    inicio = null,
    fim = null
  } = periodo;

  let rdosFiltrados = rdos;

  if (inicio) {
    rdosFiltrados = rdosFiltrados.filter(
      rdo => rdo.data_rdo >= inicio
    );
  }

  if (fim) {
    rdosFiltrados = rdosFiltrados.filter(
      rdo => rdo.data_rdo <= fim
    );
  }

  const atrasos = [];
  const paralisacoes = [];

  for (const rdo of rdosFiltrados) {
    const atraso = await requisitar(
      `/atrasos?id_rdo=${rdo.id_rdo}`
    );

    const paralisacao = await requisitar(
      `/paralisacoes?id_rdo=${rdo.id_rdo}`
    );

    atrasos.push(...atraso);
    paralisacoes.push(...paralisacao);
  }

  const ocorrencias = [
    ...atrasos.map(item => ({
      ...item,
      tipo_ocorrencia: "Atraso"
    })),

    ...paralisacoes.map(item => ({
      ...item,
      tipo_ocorrencia: "Paralisação"
    }))
  ];

  const grupos = {};

  for (const ocorrencia of ocorrencias) {
    const etapa =
      ocorrencia.etapa || "Não informado";

    const origem =
      ocorrencia.origem_atraso ||
      ocorrencia.origem_paralisacao ||
      "Não informado";

    const tipo =
      ocorrencia.tipo_ocorrencia;

    const chave =
      `${etapa}|${origem}|${tipo}`;

    if (!grupos[chave]) {
      grupos[chave] = {
        etapa_padrao: etapa,
        origem,
        tipo_ocorrencia: tipo,
        ocorrencias: 0,
        duracao_acumulada: 0,
        rdos: new Set()
      };
    }

    grupos[chave].ocorrencias++;

    grupos[chave].duracao_acumulada += Number(
      ocorrencia.duracao || 0
    );

    grupos[chave].rdos.add(
      ocorrencia.id_rdo
    );
  }

  const totalOcorrencias =
    ocorrencias.length;

  const resultado =
    Object.values(grupos).map(grupo => {

      const duracaoMedia =
        grupo.ocorrencias > 0
          ? grupo.duracao_acumulada /
            grupo.ocorrencias
          : 0;

      const frequencia =
        totalOcorrencias > 0
          ? (grupo.ocorrencias /
              totalOcorrencias) * 100
          : 0;

      const recorrencia =
        rdosFiltrados.length > 0
          ? (grupo.rdos.size /
              rdosFiltrados.length) * 100
          : 0;

      return {
        etapa_padrao:
          grupo.etapa_padrao,

        origem:
          grupo.origem,

        tipo_ocorrencia:
          grupo.tipo_ocorrencia,

        ocorrencias:
          grupo.ocorrencias,

        duracao_acumulada:
          Number(
            grupo.duracao_acumulada.toFixed(2)
          ),

        duracao_media:
          Number(
            duracaoMedia.toFixed(2)
          ),

        frequencia:
          Number(
            frequencia.toFixed(2)
          ),

        recorrencia:
          Number(
            recorrencia.toFixed(2)
          )
      };
    });

  resultado.sort(
    (a, b) =>
      b.duracao_media -
      a.duracao_media
  );

  const duracaoTotal =
    ocorrencias.reduce(
      (total, item) =>
        total +
        Number(item.duracao || 0),
      0
    );

  return {
    resumo: {
      periodos_analisados:
        rdosFiltrados.length,

      total_ocorrencias:
        totalOcorrencias,

      duracao_acumulada:
        Number(
          duracaoTotal.toFixed(2)
        ),

      duracao_media:
        totalOcorrencias > 0
          ? Number(
              (
                duracaoTotal /
                totalOcorrencias
              ).toFixed(2)
            )
          : 0
    },

    padroes: resultado
  };
}

