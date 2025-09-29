// controllers/EquipoController.js (Ejemplo)
const Equipo = require('../models/equipo');

// Obtener un equipo por su ID
const getEquipoById = async (req, res) => {
    try {
        // Mongoose encuentra el equipo donde el campo 'id' coincide con el parámetro de la URL
        const equipo = await Equipo.findOne({ id: req.params.id }); 
        
        if (!equipo) {
            return res.status(404).json({ message: 'Equipo no encontrado.' });
        }
        return res.status(200).json(equipo);
    } catch (error) {
        return res.status(500).json({
            message: 'Error al buscar el equipo',
            error: error.message
        });
    }
};

// guardar nuevo pc


/**
 * Función principal para crear un equipo (PC o Impresora).
 * Limpia los datos que no corresponden al tipo de activo antes de guardar.
 */
const createEquipo = async (req, res, tipo) => {
    // Asegura que el tipo de activo en el body coincida con el endpoint usado
    const data = { ...req.body, tipo_equipo: tipo };

    // Lógica de limpieza: Remueve campos irrelevantes para mantener el documento limpio
    if (tipo === 'PC') {
        // Campos que deben ser removidos si es un PC (son de Impresora)
        delete data.toner;
        delete data.drum;
        delete data.conexion;
    } else if (tipo === 'Impresora') {
        // Campos que deben ser removidos si es una Impresora (son de PC)
        delete data.nombre_equipo;
        delete data.usuario;
        delete data.ver_win;
        delete data.antivirus;
        delete data.cpu;
        delete data.ram;
        delete data.almacenamiento;


    }

    try {
        const nuevoEquipo = new Equipo(data);
        await nuevoEquipo.save();
        
        return res.status(201).json(nuevoEquipo); 
    } catch (error) {
        // Error de unicidad (serie, ip, id)
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Error de duplicidad: La serie o IP ya existe.' });
        }
        // Error de validación (required: true) o Mongoose/DB
        return res.status(500).json({ 
            message: `Error al crear el equipo de tipo ${tipo}`, 
            error: error.message 
        });
    }
};

// --- Funciones Wrapper (Envoltura) para los Endpoints ---

// Controlador para crear un PC
const createPC = (req, res) => createEquipo(req, res, 'PC');

// Controlador para crear una Impresora
const createImpresora = (req, res) => createEquipo(req, res, 'Impresora');


// Para las rutas genéricas, podemos crear una función para obtener todos
const getAllEquipos = async (req, res) => {
    try {
        const equipos = await Equipo.find().lean(); // Usamos .lean() para mayor velocidad
        return res.status(200).json(equipos);
    } catch (error) {
        return res.status(500).json({ 
            message: 'Error al obtener los equipos', 
            error: error.message 
        });
    }
};


module.exports = {
    createPC,
    createImpresora,
    getAllEquipos,
    getEquipoById,
    // ... otros métodos CRUD genéricos
};