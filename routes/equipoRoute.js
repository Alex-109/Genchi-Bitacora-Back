// routes/equipoRoutes.js (CORREGIDO)
const express = require('express');
const router = express.Router();
const equipoController = require('../controllers/equipoController');

// Usamos el wrapper EXPORTADO createPC
router.post('/pc', equipoController.createPC); 

// Usamos el wrapper EXPORTADO createImpresora
router.post('/impresora', equipoController.createImpresora);

// Las demás rutas quedan bien
router.get('/:id', equipoController.getEquipoById);
router.get('/', equipoController.getAllEquipos);

module.exports = router;