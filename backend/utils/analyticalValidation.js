const idValido = value => ['string','number'].includes(typeof value) && /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value)) && Number(value)>0;
const dataValida = value => typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value+'T00:00:00Z')) && new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
const isManager = user => new Set(['gerencia','gerente','administrador','administradora','admin']).has(String(user.ocupacao||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase());
module.exports={idValido,dataValida,isManager};
