const Equipo = require('../models/equipo');
const mongoose = require('mongoose'); // Necesario para la validación de ObjectId

// Obtener un equipo por su ID
const getEquipoById = async (req, res) => {
    try {
        const rawId = req.params.id;
        
        // 1. Intentar buscar por _id de MongoDB (el ID largo, preferido por la API)
        let equipo;
        if (mongoose.Types.ObjectId.isValid(rawId)) {
            equipo = await Equipo.findById(rawId);
        }

        // 2. Si no se encontró o no era ObjectId, intentar buscar por el ID autoincrementable 'id'
        if (!equipo) {
             const idValue = (!isNaN(rawId) && Number.isInteger(Number(rawId))) ? Number(rawId) : rawId;
             equipo = await Equipo.findOne({ id: idValue });
        }

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

// Obtener todos los equipos
const getAllEquipos = async (req, res) => {
    try {
        const equipos = await Equipo.find().lean();
        return res.status(200).json(Array.isArray(equipos) ? equipos : []);
    } catch (error) {
        return res.status(500).json({
            message: 'Error al obtener los equipos',
            error: error.message
        });
    }
};

// Crear equipo (PC o Impresora)
const createEquipo = async (req, res, tipo) => {
    const data = { ...req.body, tipo_equipo: tipo };

    // Limpieza de datos (para no guardar campos de PC en Impresoras y viceversa)
    if (tipo === 'PC') {
        delete data.toner;
        delete data.drum;
        delete data.conexion;
        delete data.printerType;
        delete data.color;
        delete data.duplex;
        delete data.networked;
    } else if (tipo === 'Impresora') {
        delete data.nombre_equipo;
        delete data.usuario;
        delete data.ver_win;
        delete data.windows;
        delete data.antivirus;
        delete data.cpu;
        delete data.ram;
        delete data.almacenamiento;
        delete data.motherboard;
    }

    try {
        const nuevoEquipo = new Equipo(data);
        await nuevoEquipo.save();
        return res.status(201).json(nuevoEquipo);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Error de duplicidad: La serie o IP ya existe.' });
        }
        return res.status(500).json({
            message: `Error al crear el equipo de tipo ${tipo}`,
            error: error.message
        });
    }
};

// Controladores específicos
const createPC = (req, res) => createEquipo(req, res, 'PC');
const createImpresora = (req, res) => createEquipo(req, res, 'Impresora');


// Buscar equipos por texto
const searchEquipos = async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: 'Falta el parámetro de búsqueda.' });

    let equipos = [];
    try {
        // Si q es un número entero, busca solo por id
        if (!isNaN(q) && Number.isInteger(Number(q))) {
            equipos = await Equipo.find({ id: Number(q) }).lean();
        } else {
            // Si es texto, busca por los otros campos
            // Utilizamos $or para combinar búsquedas por campos de texto
            equipos = await Equipo.find({
                $or: [
                    { serie: { $regex: q, $options: 'i' } },
                    { nombre_equipo: { $regex: q, $options: 'i' } },
                    { usuario: { $regex: q, $options: 'i' } },
                    { ip: { $regex: q, $options: 'i' } }
                ]
            }).lean();
        }
        return res.status(200).json(equipos);
    } catch (error) {
        return res.status(500).json({
            message: 'Error en la búsqueda',
            error: error.message
        });
    }
};


// Eliminar equipo por su ID (_id de MongoDB o 'id' autoincrementable)
const deleteEquipoById = async (req, res) => {
    try {
        const rawId = req.params.id;

        let equipoEliminado = null;
        
        // 1. Intentar eliminar por _id de MongoDB (si el ID es una cadena larga de 24 caracteres)
        if (mongoose.Types.ObjectId.isValid(rawId)) {
            equipoEliminado = await Equipo.findByIdAndDelete(rawId);
        }

        // 2. Si no se eliminó por _id, intentar eliminar por el ID autoincrementable 'id'
        if (!equipoEliminado) {
            const idValue = (!isNaN(rawId) && Number.isInteger(Number(rawId))) ? Number(rawId) : rawId;
            equipoEliminado = await Equipo.findOneAndDelete({ id: idValue });
        }


        if (!equipoEliminado) {
            // 404 si Mongoose no encuentra el documento con el ID proporcionado
            return res.status(404).json({ message: 'Equipo no encontrado para eliminar.' });
        }
        // Éxito
        return res.status(200).json({ message: `Equipo (ID: ${equipoEliminado.id || equipoEliminado._id}) eliminado correctamente.` });
    } catch (error) {
        // 500 para errores de servidor o base de datos
        return res.status(500).json({
            message: 'Error al eliminar el equipo',
            error: error.message
        });
    }
};


module.exports = {
    createPC,
    createImpresora,
    getAllEquipos,
    getEquipoById,
    searchEquipos,
    deleteEquipoById
};
