// routes/actas.js
const express = require('express');
const router = express.Router();
const { generarActaEntrega, generarActaEntregaMultiple } = require('../controllers/actaController');

// Ruta para generar acta de entrega múltiple
router.post('/acta-entrega-multiple', generarActaEntregaMultiple);

router.get('/acta-entrega/:id_equipo', generarActaEntrega);

module.exports = router;