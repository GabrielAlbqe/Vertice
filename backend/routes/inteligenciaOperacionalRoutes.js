const router = require('express').Router();
const controller = require('../controllers/inteligenciaOperacionalController');
router.use(controller.permitir);
router.get('/filtros', controller.filtros);
router.get('/', controller.analisar);
router.all(['/', '/filtros'], (req,res) => res.set('Allow','GET').status(405).json({message:'Método não permitido.'}));
module.exports = router;
