const ProjecaoFinanceira = require("../models/projecaoFinanceiraModel");
const { dbStatus } = require("../utils/dbError");

// Lista as projeções financeiras filtrando por ID da Obra
exports.listarPorObra = (req, res) => {
  const id_obra = req.query.id_obra || req.headers["id-obra"];

  if (!id_obra) {
    return res.status(400).send("O identificador da obra (id_obra) é obrigatório.");
  }

  ProjecaoFinanceira.getByObra(id_obra, (err, results) => {
    if (err) return res.status(dbStatus(err)).send("Erro interno no servidor ao listar projeções financeiras.");
    res.json(results);
  });
};

// Busca detalhes de uma projeção por ID
exports.buscarPorId = (req, res) => {
  ProjecaoFinanceira.getById(req.params.id, (err, results) => {
    if (err) return res.status(dbStatus(err)).send("Erro interno no servidor ao buscar projeção financeira.");
    if (results.length === 0) return res.status(404).send("Registo não encontrado.");
    res.json(results[0]);
  });
};

// Remove um registo de projeção financeira
exports.deletar = (req, res) => {
  ProjecaoFinanceira.delete(req.params.id, (err, result) => {
    if (err) return res.status(dbStatus(err)).send("Erro interno no servidor ao deletar projeção financeira.");
    if (result.affectedRows === 0) return res.status(404).send("Registo não encontrado.");
    res.send("Projeção financeira removida com sucesso!");
  });
};

// Regista uma nova projeção financeira
exports.criar = async (req, res, next) => {
  try { await preparar(req); } catch(err) { return next(err); }
  ProjecaoFinanceira.create(req.body, (err, result) => {
    if (err) return res.status(dbStatus(err)).send("Erro interno no servidor ao registar projeção financeira.");
    res.status(201).json({
      message: "Projeção financeira registada com sucesso!",
      insertId: result ? result.insertId : null
    });
  });
};

// Atualiza uma projeção financeira existente
exports.atualizar = async (req, res, next) => {
  try { await preparar(req); } catch(err) { return next(err); }
  ProjecaoFinanceira.update(req.params.id, req.body, (err, result) => {
    if (err) return res.status(dbStatus(err)).send("Erro interno no servidor ao atualizar projeção financeira.");
    if (result.affectedRows === 0) return res.status(404).send("Registo não encontrado.");
    res.send("Projeção financeira atualizada com sucesso!");
  });
};

async function preparar(req) {
  const bd=require('../config/connection');
  const sql=(s,p)=>new Promise((resolve,reject)=>bd.query(s,p,(e,r)=>e?reject(e):resolve(r)));
  const data=req.body;
  let filter='',params=[data.id_obra,data.data_projecao];
  if(data.etapa){filter=' AND e.nome_etapa=?';params.push(data.etapa);}
  const [actual]=await sql('SELECT COALESCE(SUM(c.valor_total),0) total FROM custo_realizado c JOIN etapa e ON e.id_etapa=c.id_etapa AND e.id_obra=c.id_obra WHERE c.id_obra=? AND c.data<=?'+filter,params);
  const planParams=[data.id_obra];if(data.etapa)planParams.push(data.etapa);
  const [plan]=await sql('SELECT COUNT(*) count,SUM(valor_planejado) total FROM custo_planejado WHERE id_obra=?'+(data.etapa?' AND etapa=?':''),planParams);
  let budget=Number(plan.count)>0?plan.total:null;
  if(budget===null&&!data.etapa){const [obra]=await sql('SELECT orcamento_planejado FROM obra WHERE id_obra=?',[data.id_obra]);budget=obra.orcamento_planejado;}
  Object.assign(data,require('../utils/financeiro').projetar(actual.total,data.custo_restante_estimado ?? 0,budget));
}
