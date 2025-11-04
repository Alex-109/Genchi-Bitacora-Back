// routes/equipoRoutes.js (CORREGIDO)
const express = require('express');
const router = express.Router();
const equipoController = require('../controllers/equipoController');


// Rutas para equipos
router.post('/buscar', equipoController.buscarEquipos);
router.post('/crear', equipoController.crearEquipo);
router.put('/actualizar', equipoController.actualizarEquipo);
router.delete('/eliminar/:id', equipoController.eliminarEquipo);
router.get('/ultimos', equipoController.obtenerUltimosEquipos);
router.post('/ingreso/:idEquipo', equipoController.registrarIngreso);

module.exports = router;