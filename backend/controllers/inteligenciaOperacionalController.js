const Model = require('../models/inteligenciaOperacionalModel');
const { calcular } = require('../services/inteligenciaOperacional');
const { validarFiltros, ETAPAS, TURNOS, CLIMAS, error } = require('../config/inteligenciaOperacional');
const { idValido } = require('../utils/analyticalValidation');
const { isManager } = require('../utils/analyticalValidation');
exports.permitir = async (req, res, next) => {
  try {
    if (!req.usuario || !idValido(req.usuario.id_usuario)) throw error(401, 'Usuário não autenticado.');
    const user = await Model.usuario(req.usuario.id_usuario);
    if (!user || user.status !== 'Ativo' ||
        !idValido(user.idconstrutora) || Number(user.idconstrutora) !== Number(req.usuario.idconstrutora)) throw error(403, 'Vínculo empresarial sem autorização.');
    const environment = String(user.ambiente || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    if (!isManager(user) || environment !== 'escritorio') throw error(403, 'Inteligência Operacional disponível para a gerência do Escritório.');
    req.idConstrutora = Number(user.idconstrutora);
    next();
  } catch (err) { next(err); }
};
exports.analisar = async (req, res, next) => {
  try {
    const f = validarFiltros(req.query);
    const obra = await Model.obra(f.id_obra, req.idConstrutora);
    const data = await Model.dados(f, req.idConstrutora);
    res.json({ obra, ...calcular(data, f) });
  } catch (err) { next(err); }
};
exports.filtros = async (req, res, next) => {
  try {
    const f = validarFiltros(req.query, false);
    res.json({ ...await Model.filtros(f, req.idConstrutora), etapas: ETAPAS, turnos: TURNOS, climas: CLIMAS,
      recursos_disponiveis: false, motivo_recursos: 'Sem vínculo direto de ocorrência com recurso. Presença no mesmo RDO não determina associação.',
      fontes: [{ id: 'diario', nome: 'Diário de obra (Canteiro)' }, { id: 'rdo', nome: 'RDO estruturado' }] });
  } catch (err) { next(err); }
};
