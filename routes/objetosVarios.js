const express = require('express');
const router = express.Router(); // ✅ Express Router

const {
  obtenerObjetosVarios,
  obtenerObjetoVario,
  crearObjetoVario,
  actualizarObjetoVario,
  eliminarObjetoVario
} = require('../controllers/objetosVariosController');

// Rutas para objetos varios
router.get('/', obtenerObjetosVarios);
router.get('/:id', obtenerObjetoVario);
router.post('/', crearObjetoVario);
router.put('/:id', actualizarObjetoVario);
router.delete('/:id', eliminarObjetoVario);

module.exports = router;