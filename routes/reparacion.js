const express = require('express');
const router = express.Router();
const {
  iniciarReparacion,
  getReparacionesBySerie,
  getReparacionesByIdEquipo
} = require('../controllers/reparacionesController');

// Iniciar una reparación
router.post('/iniciar', iniciarReparacion);

// Obtener historial de reparaciones por número de serie
router.get('/', getReparacionesByIdEquipo);

module.exports = router;
