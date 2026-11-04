const crypto = require('crypto');
const pool = require('../config/operacional');
class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
const fail = (status, message) => { throw new HttpError(status, message); };
function id(value) { const n = Number(value); if (!['number','string'].includes(typeof value) || !Number.isSafeInteger(n) || n <= 0) fail(400, 'Identificador inválido.'); return n; }
function text(value, max, required = true) {
  if (value === undefined && !required) return '';
  if (typeof value !== 'string' || value.trim().length > max || (required && !value.trim())) fail(400, `Texto inválido (máximo ${max} caracteres).`);
  return value.trim();
}
function number(value, max = 1e9) { if (!['number','string'].includes(typeof value) || value === '' || !Number.isFinite(Number(value)) || Number(value) <= 0 || Number(value) > max) fail(400, 'Quantidade inválida.'); return Number(value); }
function option(value, options) { if (!options.includes(value)) fail(400, 'Opção inválida.'); return value; }
function date(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) fail(400, 'Data inválida.');
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(new Date());
  if (value > today) fail(400, 'A data não pode estar no futuro.'); return value;
}
async function obra(c, value, user, lock = false) {
  const [rows] = await c.query('SELECT * FROM obra WHERE id_obra=? AND id_construtora=?' + (lock ? ' FOR UPDATE' : ''), [id(value), user.idconstrutora]);
  if (!rows.length) fail(403, 'Obra indisponível para este usuário.'); return rows[0];
}
async function related(c, table, pk, value, column, work) {
  const [rows] = await c.query(`SELECT * FROM ${table} WHERE ${pk}=? AND ${column}=?${['cadastro_de_equipes','cadastro_de_equipes_terceirizadas'].includes(table)&&c!==pool?' FOR SHARE':''}`, [id(value), work]);
  if (!rows.length) fail(400, 'O recurso não pertence à obra selecionada.');
  if(['cadastro_de_equipes','cadastro_de_equipes_terceirizadas'].includes(table)&&rows[0].ativo===0)fail(409,'Equipe inativa não pode participar de novos registros.');return rows[0];
}
const wrap = handler => async (req, res, next) => { try { await handler(req, res, next); } catch (e) { next(e); } };
async function user(req, res, next) {
  try {
    const [rows] = await pool.query("SELECT id_usuario,idconstrutora,ambiente FROM usuario WHERE id_usuario=? AND status='Ativo'", [id(req.usuario?.id_usuario)]);
    if (!rows[0]?.idconstrutora) fail(403, 'Usuário sem acesso ativo à construtora.');
    req.acesso = rows[0]; next();
  } catch (e) { next(e); }
}
async function write(req, action, binaryHash = '') {
  const key = req.get('Idempotency-Key');
  if (!key || !/^[a-zA-Z0-9_-]{16,80}$/.test(key)) fail(400, 'Informe uma chave de idempotência válida.');
  const hash = crypto.createHash('sha256').update(req.method + req.path + JSON.stringify(Buffer.isBuffer(req.body) ? req.query : req.body) + binaryHash).digest('hex');
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    try { await c.query('INSERT INTO requisicao_operacional(usuario_id,chave,hash) VALUES (?,?,?)', [req.acesso.id_usuario, key, hash]); }
    catch (e) {
      if (e.code !== 'ER_DUP_ENTRY') throw e;
      const [rows] = await c.query('SELECT hash,resposta FROM requisicao_operacional WHERE usuario_id=? AND chave=?', [req.acesso.id_usuario, key]);
      if (rows[0].hash !== hash) fail(409, 'Chave já utilizada com conteúdo diferente.');
      const result = typeof rows[0].resposta === 'string' ? JSON.parse(rows[0].resposta) : rows[0].resposta;
      await c.rollback(); return { result, repeated: true };
    }
    const audit=require('./auditoria');
    const endpoint=req.originalUrl.split('?')[0];
    const kind=endpoint.match(/^\/api\/operacional\/(?:gestao\/(pessoas|custos)|(diarios|atividades|materiais|ocorrencias))(?:\/\d+(?:\/resolver)?)?$/);
    const enabled=kind&&await audit.disponivel(c),resource=kind&&(kind[1]||kind[2]);
    let before=null;
    if(enabled&&resource==='pessoas'&&req.params.id)before=(await c.query('SELECT equipe_id,terceirizada_id,ativo FROM profissional WHERE id_profissional=? AND id_construtora=?',[id(req.params.id),req.acesso.idconstrutora]))[0][0]||null;
    const result = await action(c);
    if(enabled){
      const details=resource==='pessoas'?{anterior:before,atual:{equipe_id:req.body.equipe_id||null,terceirizada_id:req.body.terceirizada_id||null,ativo:req.body.ativo}}:{};
      const work=req.body.obra_id||req.body.obrax_id||req.body.id_obra||null;
      await audit.registrar(c,req,req.method==='PUT'?'Registro atualizado':'Registro confirmado',resource,result.insertId||Number(req.params.id),work,details);
    }
    await c.query('UPDATE requisicao_operacional SET resposta=? WHERE usuario_id=? AND chave=?', [JSON.stringify(result), req.acesso.id_usuario, key]);
    try { await c.commit(); } catch (e) { e.commitUncertain = true; throw e; }
    return { result, repeated: false };
  } catch (e) { try { await c.rollback(); } catch { /* Preserva a falha original e o estado de commit incerto. */ } throw e; } finally { c.release(); }
}
function errors(err, req, res, next) {
  if (res.headersSent) return next(err);
  if(err.code==='SCHEMA_NOT_READY'){
    console.error(JSON.stringify({event:'schema_not_ready',requestId:req.requestId,module:err.module,migrations:err.migrations,status:503}));
    return res.status(503).json({code:'SCHEMA_NOT_READY',message:'Este m\u00f3dulo requer uma atualiza\u00e7\u00e3o autorizada do banco de dados.',migrations:err.migrations});
  }
  const missing = ['ER_NO_SUCH_TABLE', 'ER_BAD_FIELD_ERROR'].includes(err.code);
  const status = ['ER_LOCK_DEADLOCK','ER_LOCK_WAIT_TIMEOUT'].includes(err.code)?409:err.status || (missing ? 503 : ['ER_NO_REFERENCED_ROW_2', 'ER_CHECK_CONSTRAINT_VIOLATED', 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD', 'ER_DATA_TOO_LONG'].includes(err.code) ? 400 : 500);
  if(status>=500)console.error(JSON.stringify({event:'request_error',requestId:req.requestId,code:err.code||'INTERNAL_ERROR',status}));
  res.status(status).json({ message: missing ? 'Módulo indisponível. Contate o responsável pelo sistema.' : err.type === 'entity.parse.failed' ? 'JSON inválido.' : status === 413 ? 'Arquivo ou requisição excede o tamanho permitido.' : ['ER_LOCK_DEADLOCK','ER_LOCK_WAIT_TIMEOUT'].includes(err.code)?'Conflito de operações simultâneas. Atualize os registros e tente novamente.':status < 500 ? err.message : 'Não foi possível concluir a operação.' });
}
module.exports = { pool, fail, id, text, number, option, date, obra, related, wrap, user, write, errors };
