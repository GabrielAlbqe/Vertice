const express = require('express');
const { pool, fail, id, text, number, option, date, obra, related, wrap, user, write, errors } = require('../utils/operacional');
const router = express.Router();
router.use(user);
router.use('/gestao',require('./gestaoRoutes').router);
const etapas = ['Mobilização','Infraestrutura','Supraestrutura e Alvenaria','Instalações','Revestimentos','Acabamentos'];
const response = (res, value) => res.status(value.repeated ? 200 : 201).json(value.result);
router.post('/diarios', wrap(async (req, res) => {
  const b = req.body, work = id(b.obrax_id), day = date(b.data);
  const shift = option(b.turno, ['Manhã','Tarde','Noite']);
  const climate = option(b.clima, ['Ensolarado','Chuvoso']);
  const stage = option(b.etapa_atuacao, etapas);
  const fields = ['paralisacoes','origem_paralisacoes','atrasos','origem_atrasos','observacoes'];
  const values = Object.fromEntries(fields.map(f => [f, text(b[f], f.startsWith('origem') ? 255 : 10000, false)]));
  const teams = b.equipes || [], external = b.terceirizadas || [], machines = b.maquinarios || [];
  if (![teams, external, machines].every(a => Array.isArray(a) && a.length <= 200)) fail(400, 'Lista de recursos inválida.');
  response(res, await write(req, async c => {
    await obra(c, work, req.acesso, true);
    const [existing] = await c.query('SELECT id_diario FROM diario_obra WHERE obrax_id=? AND usuario_id=? AND data=? AND turno=?', [work, req.acesso.id_usuario, day, shift]);
    if (existing.length) fail(409, 'Já existe um diário seu para esta obra, data e turno. Consulte o histórico.');
    for (const team of teams) await related(c, 'cadastro_de_equipes','id_cadastro_equipes',team,'idobra',work);
    for (const team of external) await related(c, 'cadastro_de_equipes_terceirizadas','id_equipe_terceirizada',team,'id_obra',work);
    for (const machine of machines) {
      const row = await related(c, 'cadastro_de_maquinario','id_maquina',machine.id,'idobra',work);
      if (!Number.isInteger(number(machine.quantidade)) || Number(machine.quantidade) > Number(row.quantidade)) fail(400, 'Quantidade de maquinários excede o cadastro.');
    }
    const [result] = await c.query('INSERT INTO diario_obra(data,clima,turno,etapa_atuacao,paralisacoes,origem_paralisacoes,atrasos,origem_atrasos,obrax_id,usuario_id) VALUES (?,?,?,?,?,?,?,?,?,?)', [day,climate,shift,stage,values.paralisacoes,values.origem_paralisacoes,values.atrasos,values.origem_atrasos,work,req.acesso.id_usuario]);
    const diary = result.insertId;
    await c.query('INSERT INTO diario_complemento(diario_id,observacoes) VALUES (?,?)',[diary,values.observacoes]);
    for (const team of new Set(teams.map(id))) await c.query('INSERT INTO diario_equipe_presente VALUES (?,?)',[diary,team]);
    for (const team of new Set(external.map(id))) await c.query('INSERT INTO diario_terceirizada_presente VALUES (?,?)',[diary,team]);
    for (const machine of machines) await c.query('INSERT INTO diario_maquinario_utilizado VALUES (?,?,?)',[diary,id(machine.id),Number(machine.quantidade)]);
    return { insertId: diary, message: 'Diário confirmado pelo servidor.' };
  }));
}));
async function consultarDiario(req) {
  const [rows] = await pool.query('SELECT d.*,c.observacoes,c.registrado_em FROM diario_obra d LEFT JOIN diario_complemento c ON c.diario_id=d.id_diario JOIN obra o ON o.id_obra=d.obrax_id WHERE d.id_diario=? AND o.id_construtora=?', [id(req.params.id),req.acesso.idconstrutora]);
  if (!rows.length) fail(404, 'Diário não encontrado.');
  const diary = rows[0];
  const queries = {
    equipes: ['SELECT e.* FROM diario_equipe_presente p JOIN cadastro_de_equipes e ON e.id_cadastro_equipes=p.equipe_id WHERE p.diario_id=?', diary.id_diario],
    terceirizadas: ['SELECT e.* FROM diario_terceirizada_presente p JOIN cadastro_de_equipes_terceirizadas e ON e.id_equipe_terceirizada=p.equipe_id WHERE p.diario_id=?', diary.id_diario],
    maquinarios: ['SELECT m.nome,p.quantidade FROM diario_maquinario_utilizado p JOIN cadastro_de_maquinario m ON m.id_maquina=p.maquinario_id WHERE p.diario_id=?', diary.id_diario],
    materiais: ['SELECT a.*,i.nome,r.registrado_em FROM apropriacao_registro r JOIN apropriacao a ON a.id_apropriacao=r.apropriacao_id JOIN cadastro_de_insumos i ON i.id_insumos=a.id_insumo WHERE r.diario_id=?', diary.id_diario],
    atividades: ['SELECT a.*,e.descricao FROM apontamento_fisico a JOIN atividade_eap e ON e.id_atividade=a.atividade_eap_id WHERE a.diario_id=?', diary.id_diario],
  };
  for (const [key,[sql,value]] of Object.entries(queries)) diary[key] = (await pool.query(sql,[value]))[0];
  return diary;
}
router.get('/diarios/:id', wrap(async (req,res)=>res.json(await consultarDiario(req))));
router.get('/diarios/:id/documento',wrap(async(req,res)=>{
  const d=await consultarDiario(req),rows=[['Campo','Valor'],['Diário',d.id_diario],['Obra',d.obrax_id],['Responsável (ID)',d.usuario_id],['Data',d.data],['Turno',d.turno],['Clima',d.clima],['Etapa',d.etapa_atuacao],['Observações',d.observacoes],['Paralisações',d.paralisacoes],['Atrasos',d.atrasos]];
  for(const e of [...d.equipes,...d.terceirizadas])rows.push(['Equipe presente',e.nome_equipe]);
  for(const m of d.maquinarios)rows.push(['Maquinário utilizado',`${m.nome}: ${m.quantidade}`]);
  for(const a of d.atividades)rows.push(['Atividade',`${a.descricao}: ${a.percentual_dia}% no dia`]);
  for(const m of d.materiais)rows.push(['Material',`${m.nome}: ${m.quantidade_consumida}`]);
  res.set({'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="diario-${d.id_diario}.csv"`,'Cache-Control':'private, no-store'});
  res.send(require('../utils/csv').csv(rows));
}));
router.post('/atividades', wrap(async (req, res) => {
  const b=req.body, work=id(b.obra_id), progress=number(b.percentual_dia,100);
  const photo=text(b.url_foto,512,false);
  if (photo && !/^https?:\/\//i.test(photo)) fail(400,'Endereço de foto inválido.');
  response(res, await write(req, async c => {
    await obra(c,work,req.acesso,true);
    await related(c,'diario_obra','id_diario',b.diario_id,'obrax_id',work);
    await related(c,'atividade_eap','id_atividade',b.atividade_eap_id,'idx_obra',work);
    const [total]=await c.query('SELECT COALESCE(SUM(percentual_dia),0) total FROM apontamento_fisico WHERE atividade_eap_id=?',[id(b.atividade_eap_id)]);
    if (Number(total[0].total)+progress>100.00001) fail(409,'O avanço acumulado ultrapassaria 100%. Revise os apontamentos anteriores.');
    const [r]=await c.query('INSERT INTO apontamento_fisico(percentual_dia,url_foto,diario_id,atividade_eap_id) VALUES (?,?,?,?)',[progress,photo,id(b.diario_id),id(b.atividade_eap_id)]);
    return {insertId:r.insertId};
  }));
}));
router.post('/materiais', wrap(async (req,res)=>{
  const b=req.body,work=id(b.obra_id),quantity=number(b.quantidade_consumida),purchase=option(b.tipo_compra,['Planejada','Emergencial']);
  response(res,await write(req,async c=>{
    await obra(c,work,req.acesso,true);
    await related(c,'cadastro_de_insumos','id_insumos',b.id_insumo,'idobra',work);
    await related(c,'atividade_eap','id_atividade',b.id_atividade,'idx_obra',work);
    if(b.diario_id)await related(c,'diario_obra','id_diario',b.diario_id,'obrax_id',work);
    const [r]=await c.query('INSERT INTO apropriacao(quantidade_consumida,tipo_compra,id_insumo,id_atividade,id_usuario) VALUES (?,?,?,?,?)',[quantity,purchase,id(b.id_insumo),id(b.id_atividade),req.acesso.id_usuario]);
    await c.query('INSERT INTO apropriacao_registro(apropriacao_id,diario_id) VALUES (?,?)',[r.insertId,b.diario_id?id(b.diario_id):null]);
    return {insertId:r.insertId,message:'Consumo registrado. Estoque não alterado.'};
  }));
}));
router.get('/materiais',wrap(async(req,res)=>{
  await obra(pool,req.query.obra_id,req.acesso);
  const [rows]=await pool.query('SELECT a.*,i.nome,e.descricao atividade,r.diario_id,r.registrado_em,u.nome responsavel FROM apropriacao a JOIN atividade_eap e ON e.id_atividade=a.id_atividade JOIN cadastro_de_insumos i ON i.id_insumos=a.id_insumo JOIN usuario u ON u.id_usuario=a.id_usuario LEFT JOIN apropriacao_registro r ON r.apropriacao_id=a.id_apropriacao WHERE e.idx_obra=? ORDER BY r.registrado_em DESC,a.id_apropriacao DESC',[id(req.query.obra_id)]);
  res.json(rows);
}));
router.use('/fotos', require('./fotosRoutes'));
router.use('/ocorrencias', require('./ocorrenciasOperacionaisRoutes'));
router.use(errors);
module.exports=router;
