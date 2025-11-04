// routes/actas.js
const express = require('express');
const router = express.Router();
const { generarActaEntrega } = require('../controllers/actaController');

router.get('/acta-entrega/:id_equipo', generarActaEntrega);

module.exports = router;