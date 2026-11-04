const router=require('express').Router();
const pool = require('../config/operacional');
const db = { query(sql, params, callback) { pool.query(sql, params).then(([rows]) => callback(null, rows), callback); } };
const IO=require('../models/inteligenciaOperacionalModel');
const {permitir}=require('../controllers/inteligenciaOperacionalController');
const {validarFiltros,error}=require('../config/inteligenciaOperacional');
const {analisar}=require('../services/historicoPreditivo');
const query=(sql,p)=>new Promise((resolve,reject)=>db.query(sql,p,(e,r)=>e?reject(e):resolve(r)));
router.use(permitir);
router.get('/',async(req,res,next)=>{
 try {
  const allowed=new Set(['id_obra','inicio','fim','fonte']);
  for(const k of Object.keys(req.query))if(!allowed.has(k))throw error(400,'Filtro desconhecido: '+k);
  const f=validarFiltros(req.query);
  await IO.obra(f.id_obra,req.idConstrutora);
  const params=[f.id_obra,req.idConstrutora];
  const end=f.fim?' AND c.data<=?':'';
  const me=f.fim?' AND m.data_calculo<=?':'';
  const [obras,custos,metricas,operacao]=await Promise.all([
    query('SELECT id_obra,nome,orcamento_planejado,data_inicio_planejada,data_termino_planejada FROM obra WHERE id_obra=? AND id_construtora=?',params),
    query('SELECT c.data,SUM(c.valor_total) valor FROM custo_realizado c JOIN obra o ON o.id_obra=c.id_obra WHERE o.id_obra=? AND o.id_construtora=?'+end+' GROUP BY c.data ORDER BY c.data LIMIT 50001',f.fim?[...params,f.fim]:params),
    query('SELECT m.id_metrica,m.data_calculo,m.idc,m.idp,m.eac FROM metricas_eva m JOIN obra o ON o.id_obra=m.obra_idxx WHERE o.id_obra=? AND o.id_construtora=?'+me+' ORDER BY m.data_calculo,m.id_metrica LIMIT 50001',f.fim?[...params,f.fim]:params),
    IO.dados(f,req.idConstrutora)
  ]);
  if(custos.length>50000||metricas.length>50000)throw error(422,'Histórico muito extenso. Reduza a data final.');
  const data=analisar({obra:obras[0],custos,metricas:metricas.filter(m=>!f.inicio||m.data_calculo>=f.inicio),...operacao},f);
  if(f.inicio){data.financeiro=data.financeiro.filter(r=>r.data>=f.inicio);data.eva=data.eva.filter(r=>r.data>=f.inicio);data.ultimo=data.eva.filter(m=>m.data===data.eva.at(-1)?.data).length===1?data.eva.at(-1):null;}
  res.set('Cache-Control','no-store').json(data);
 }catch(e){next(e);}
});
router.all('/',(req,res)=>res.set('Allow','GET').status(405).json({message:'Módulo somente de leitura.'}));
module.exports=router;
