// routes/unidadRoutes.js
const express = require('express');
const router = express.Router();
const unidadController = require('../controllers/unidadController');

// Ruta principal para manejar peticiones GET y POST
// GET /api/unidades       => Obtener todas las unidades
router.get('/', unidadController.getAllUnidades);

// POST /api/unidades      => Crear una nueva unidad
router.post('/', unidadController.createUnidad);

// GET /api/unidades/:direccion => Obtener una unidad específica por su dirección
router.get('/:direccion', unidadController.getUnidadByDireccion);


module.exports = router;