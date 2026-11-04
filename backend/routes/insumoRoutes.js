const express = require("express");
const router = express.Router();
const insumosController = require("../controllers/insumosController");

// Endpoints da API para controle de Insumos
router.get("/", insumosController.listarPorObra);
router.get("/:id", insumosController.buscarPorId);
router.delete("/del/:id", insumosController.deletar);
router.post("/insert", insumosController.criar);
router.put("/insert/:id",require('../utils/operacional').wrap(async(req,res,next)=>{
 const {pool,obra,id,text,fail}=require('../utils/operacional');
 if(!await require('../utils/auditoria').disponivel(pool))return next();
 const c=await pool.getConnection();
 try{
  await c.beginTransaction();
  const w=id(req.body.idobra);await obra(c,w,req.acesso,true);
  const [rows]=await c.query('SELECT i.*,s.unidade FROM cadastro_de_insumos i LEFT JOIN estoque_config s ON s.insumo_id=i.id_insumos WHERE i.id_insumos=? AND i.idobra=? FOR UPDATE',[id(req.params.id),w]);
  if(!rows[0])fail(404,'Material não encontrado nesta obra.');
  if(rows[0].unidade&&Number(req.body.quantidade_disponivel)!==rows[0].quantidade_disponivel)fail(409,'Saldo controlado por movimentações. Atualize a consulta e use entradas ou saídas.');
  const quantity=rows[0].unidade?rows[0].quantidade_disponivel:Number(req.body.quantidade_disponivel);
  if(!Number.isSafeInteger(quantity)||quantity<0||quantity>2147483647)fail(400,'Saldo inicial inválido.');
  const name=text(req.body.nome,45),price=Number(req.body.valor_unitario);if(!Number.isSafeInteger(price)||price<0||price>2147483647)fail(400,'Valor unitário inválido.');
  await c.query('UPDATE cadastro_de_insumos SET nome=?,valor_unitario=?,quantidade_disponivel=? WHERE id_insumos=?',[name,price,quantity,id(req.params.id)]);
  await require('../utils/auditoria').registrar(c,req,'Material atualizado','insumo',id(req.params.id),w,{nome:name,valor_unitario:price});await c.commit();res.json({message:'Insumo atualizado com sucesso!'});
 }catch(e){await c.rollback();throw e;}finally{c.release();}
}),insumosController.atualizar);

module.exports = router;
