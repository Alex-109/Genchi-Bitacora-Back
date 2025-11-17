// routes/equipoRoute.js
const express = require('express');
const router = express.Router();
const {
  buscarEquipos,
  crearEquipo,
  actualizarEquipo,
  eliminarEquipo,
  obtenerUltimosEquipos,
  registrarIngreso
} = require('../controllers/equipoController');

// ✅ RUTAS PARA EQUIPOS - CORREGIDAS
router.post('/buscar', buscarEquipos);           // POST /api/equipos/buscar
router.get('/ultimos', obtenerUltimosEquipos);   // GET /api/equipos/ultimos
router.post('/', crearEquipo);                   // POST /api/equipos
router.put('/', actualizarEquipo);               // PUT /api/equipos  
router.delete('/:id', eliminarEquipo);           // DELETE /api/equipos/:id
router.post('/:idEquipo/ingreso', registrarIngreso); // POST /api/equipos/:idEquipo/ingreso

module.exports = router;