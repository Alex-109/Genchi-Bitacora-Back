// controllers/UnidadController.js
const Unidad = require('../models/unidad');

// Obtener todas las unidades
const getAllUnidades = async (req, res) => {
    try {
        const unidades = await Unidad.find();
        return res.status(200).json(unidades);
    } catch (error) {
        // Manejo básico de errores de servidor
        return res.status(500).json({ 
            message: 'Error al obtener las unidades', 
            error: error.message 
        });
    }
};

// Crear una nueva unidad
const createUnidad = async (req, res) => {
    const { direccion, nombre_u, area, encargado_u } = req.body;
    
    // Validación básica de datos
    if (!direccion || !nombre_u) {
        return res.status(400).json({ message: 'La dirección y el nombre son campos obligatorios.' });
    }

    try {
        const nuevaUnidad = new Unidad({ direccion, nombre_u, area, encargado_u });
        await nuevaUnidad.save();
        
        // Código de respuesta 201 (Created)
        return res.status(201).json(nuevaUnidad); 
    } catch (error) {
        // Manejo de error por duplicidad (unique: true en direccion)
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Ya existe una unidad con esa dirección.' });
        }
        return res.status(500).json({ 
            message: 'Error al crear la unidad', 
            error: error.message 
        });
    }
};

// Obtener una unidad por dirección (o por _id si se usara ese campo)
const getUnidadByDireccion = async (req, res) => {
    try {
        const unidad = await Unidad.findOne({ direccion: req.params.direccion });

        if (!unidad) {
            return res.status(404).json({ message: 'Unidad no encontrada.' });
        }
        
        return res.status(200).json(unidad);
    } catch (error) {
        return res.status(500).json({ 
            message: 'Error al buscar la unidad', 
            error: error.message 
        });
    }
};

module.exports = {
    getAllUnidades,
    createUnidad,
    getUnidadByDireccion,
    // Aquí irían updateUnidad y deleteUnidad
};