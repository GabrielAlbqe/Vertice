const express = require('express');
const router = express.Router();

const exigirConstrutora = require('../middlewares/exigirConstrutora');
const equipeController = require('../controllers/equipeController');

router.use(exigirConstrutora);
router.get('/', equipeController.listarPorObra);
router.post('/insert', equipeController.criar);
router.patch('/:id/obra', equipeController.alterarObra);
router.get('/:id', equipeController.buscarPorId);
router.put('/insert/:id', equipeController.atualizar);
router.delete('/del/:id', equipeController.deletar);

module.exports = router;
