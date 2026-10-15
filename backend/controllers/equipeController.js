const Equipe = require('../models/equipeModel');
const { dbStatus } = require('../utils/dbError');

const ETAPAS = [
  'Mobilização', 'Infraestrutura', 'Supraestrutura e Alvenaria',
  'Instalações', 'Revestimentos', 'Acabamentos'
];

function idValido(valor) {
  if (valor === null || valor === undefined || valor === '' ||
      typeof valor === 'boolean' || Array.isArray(valor) || typeof valor === 'object') {
    return false;
  }
  const numero = Number(valor);
  return Number.isSafeInteger(numero) && numero > 0;
}

function obraDoBody(dados) {
  const valor = dados?.idobra;
  if (valor === null || valor === undefined || valor === '') return null;
  return valor;
}

function erroBanco(res, erro) {
  console.error('Erro ao acessar equipes:', erro.message);
  return res.status(dbStatus(erro)).json({
    message: 'Erro ao processar a operação no banco de dados.'
  });
}

function validarCadastro(dados) {
  if (typeof dados?.nome_equipe !== 'string' ||
      !dados.nome_equipe.trim() || dados.nome_equipe.trim().length > 45) {
    return 'Informe um nome de equipe de até 45 caracteres.';
  }
  if (!ETAPAS.includes(dados.etapa_atuacao)) {
    return 'Etapa de atuação inválida.';
  }
  if (!Number.isSafeInteger(dados.quantidade_profissionais) ||
      dados.quantidade_profissionais < 0) {
    return 'Quantidade de profissionais inválida.';
  }
  for (const campo of ['custo_diario', 'custo_mensal']) {
    if (typeof dados[campo] !== 'number' ||
        !Number.isFinite(dados[campo]) || dados[campo] < 0) {
      return `${campo} inválido.`;
    }
  }
  return null;
}

function validarObra(idobra, idConstrutora, res, continuar) {
  if (idobra === null) return continuar();
  if (!idValido(idobra)) {
    return res.status(400).json({ message: 'ID da obra inválido.' });
  }
  return Equipe.verificarObra(Number(idobra), idConstrutora, (erro, obras) => {
    if (erro) return erroBanco(res, erro);
    if (!obras.length) {
      return res.status(404).json({
        message: 'Obra não encontrada nesta construtora.'
      });
    }
    return continuar();
  });
}

function responderLista(res) {
  return (erro, resultados) => {
    if (erro) return erroBanco(res, erro);
    return res.json(resultados);
  };
}

exports.listarTodas = (req, res) => {
  return Equipe.getAll(req.idConstrutora, responderLista(res));
};

exports.listarPorObra = (req, res) => {
  const filtro = req.query.idobra;
  if (filtro === undefined || filtro === '') {
    return exports.listarTodas(req, res);
  }
  if (filtro === 'null') {
    return Equipe.getSemObra(req.idConstrutora, responderLista(res));
  }
  if (!idValido(filtro)) {
    return res.status(400).json({ message: 'ID da obra inválido.' });
  }
  return Equipe.getByObra(Number(filtro), req.idConstrutora, responderLista(res));
};

exports.buscarPorId = (req, res) => {
  if (!idValido(req.params.id)) {
    return res.status(400).json({ message: 'ID da equipe inválido.' });
  }
  return Equipe.getById(Number(req.params.id), req.idConstrutora, (erro, equipes) => {
    if (erro) return erroBanco(res, erro);
    if (!equipes.length) {
      return res.status(404).json({ message: 'Equipe não encontrada.' });
    }
    return res.json(equipes[0]);
  });
};

exports.criar = (req, res) => {
  const dados = req.body || {};
  const erroValidacao = validarCadastro(dados);
  if (erroValidacao) {
    return res.status(400).json({ message: erroValidacao });
  }
  const idobra = obraDoBody(dados);
  return validarObra(idobra, req.idConstrutora, res, () => {
    const cadastro = {
      ...dados,
      nome_equipe: dados.nome_equipe.trim(),
      idobra: idobra === null ? null : Number(idobra)
    };
    return Equipe.create(cadastro, req.idConstrutora, (erro, resultado) => {
      if (erro) return erroBanco(res, erro);
      return res.status(201).json({
        message: 'Equipe cadastrada com sucesso.',
        insertId: resultado.insertId
      });
    });
  });
};

exports.atualizar = (req, res) => {
  if (!idValido(req.params.id)) {
    return res.status(400).json({ message: 'ID da equipe inválido.' });
  }
  const dados = req.body || {};
  const erroValidacao = validarCadastro(dados);
  if (erroValidacao) {
    return res.status(400).json({ message: erroValidacao });
  }
  const idobra = obraDoBody(dados);
  return validarObra(idobra, req.idConstrutora, res, () => {
    const atualizado = {
      ...dados,
      nome_equipe: dados.nome_equipe.trim(),
      idobra: idobra === null ? null : Number(idobra)
    };
    return Equipe.update(
      Number(req.params.id), atualizado, req.idConstrutora,
      (erro, resultado) => {
        if (erro) return erroBanco(res, erro);
        if (!resultado.affectedRows) {
          return res.status(404).json({ message: 'Equipe não encontrada.' });
        }
        return res.json({ message: 'Equipe atualizada com sucesso.' });
      }
    );
  });
};

exports.alterarObra = (req, res) => {
  if (!idValido(req.params.id)) {
    return res.status(400).json({ message: 'ID da equipe inválido.' });
  }
  if (!req.body || !Object.prototype.hasOwnProperty.call(req.body, 'idobra')) {
    return res.status(400).json({
      message: 'Informe idobra, usando null para desatribuir.'
    });
  }
  const idobra = obraDoBody(req.body);
  return validarObra(idobra, req.idConstrutora, res, () => {
    const novoIdObra = idobra === null ? null : Number(idobra);
    return Equipe.updateObra(
      Number(req.params.id), novoIdObra, req.idConstrutora,
      (erro, resultado) => {
        if (erro) return erroBanco(res, erro);
        if (!resultado.affectedRows) {
          return res.status(404).json({ message: 'Equipe não encontrada.' });
        }
        return res.json({
          message: novoIdObra === null
            ? 'Equipe desatribuída com sucesso.'
            : 'Vínculo da equipe atualizado com sucesso.',
          id_cadastro_equipes: Number(req.params.id),
          idobra: novoIdObra
        });
      }
    );
  });
};

exports.deletar = (req, res) => {
  if (!idValido(req.params.id)) {
    return res.status(400).json({ message: 'ID da equipe inválido.' });
  }
  return Equipe.delete(Number(req.params.id), req.idConstrutora, (erro, resultado) => {
    if (erro) return erroBanco(res, erro);
    if (!resultado.affectedRows) {
      return res.status(404).json({ message: 'Equipe não encontrada.' });
    }
    return res.json({ message: 'Equipe excluída definitivamente.' });
  });
};
