// controllers/reparacionesController.js

const Reparaciones = require('../models/reparaciones');
const Equipo = require('../models/equipo');
const Contador = require('../models/contador');

// 🔹 FUNCIÓN AUXILIAR: obtener e incrementar contador (incremento atómico)
const getNextSequenceValue = async (sequenceName) => {
    const sequenceDocument = await Contador.findOneAndUpdate(
        { _id: sequenceName },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return sequenceDocument.seq;
};

// ---------------------------------------------------------
// 🔧  INICIAR REPARACIÓN (actualiza equipo + registra acta)
// ---------------------------------------------------------

const iniciarReparacion = async (req, res) => {
    const { id_equipo, cambios, obs, rut } = req.body;

    try {
        const equipo = await Equipo.findOne({ id: id_equipo });
        if (!equipo) return res.status(404).json({ message: 'Equipo no encontrado' });

        const cambiosRegistrados = {};

        // ---------------------------------------------------------
        // ✔ VALIDACIÓN DE NOMBRE ÚNICO (solo si se intenta cambiar)
        // ---------------------------------------------------------
        if (cambios.nombre && cambios.nombre !== equipo.nombre) {
            const existeNombre = await Equipo.findOne({ nombre: cambios.nombre });
            if (existeNombre) {
                return res.status(400).json({ 
                    message: 'Ya existe otro equipo con ese nombre' 
                });
            }
        }

        // ---------------------------------------------------------
        // ✔ VALIDACIÓN DE IP ÚNICA (solo si viene y cambia)
        // ---------------------------------------------------------
        if (cambios.ip && cambios.ip !== equipo.ip) {
            const existeIP = await Equipo.findOne({ ip: cambios.ip });
            if (existeIP) {
                return res.status(400).json({ 
                    message: 'La dirección IP ya está registrada en otro equipo' 
                });
            }
        }

        // ---------------------------------------------------------
        // 📌 Registrar cambios en atributos del equipo
        // ---------------------------------------------------------
        for (let key in cambios) {
            if (equipo[key] !== cambios[key]) {
                cambiosRegistrados[key] = {
                    antes: equipo[key],
                    despues: cambios[key]
                };
                equipo[key] = cambios[key];
            }
        }

        // ---------------------------------------------------------
        // ✔ Validación: debe haber cambios o una observación
        // ---------------------------------------------------------
        if (Object.keys(cambiosRegistrados).length === 0 && (!obs || obs.trim() === '')) {
            return res.status(400).json({ message: 'No hay cambios ni observaciones para registrar.' });
        }

        // Si hubo cambios reales, guardar equipo
        if (Object.keys(cambiosRegistrados).length > 0) {
            await equipo.save();
        }

        // ---------------------------------------------------------
        // 📌 Obtener número de acta secuencial
        // ---------------------------------------------------------
        const nextActaNumber = await getNextSequenceValue('num_acta_global');

        const nuevaRepa = new Reparaciones({
            id_equipo: equipo.id,
            rut,
            obs,
            cambios: cambiosRegistrados,
            contador_num_acta: nextActaNumber
        });

        await nuevaRepa.save();

        res.status(201).json(nuevaRepa);

    } catch (error) {
        console.error('Error al iniciar reparación:', error);
        res.status(500).json({ message: 'Error al iniciar reparación', error: error.message });
    }
};

// ---------------------------------------------------------
// 🔧 OBTENER HISTORIAL DE REPARACIONES POR ID EQUIPO
// ---------------------------------------------------------

const getReparacionesByIdEquipo = async (req, res) => {
    const { id_equipo } = req.query;
    if (!id_equipo) return res.status(400).json({ message: 'ID de equipo no especificado' });

    try {
        const equipo = await Equipo.findOne({ id: Number(id_equipo) }).select('id historial_ingresos');
        
        if (!equipo) {
            return res.status(404).json({ message: 'Equipo no encontrado' });
        }

        const reparaciones = await Reparaciones.find({ id_equipo: Number(id_equipo) })
            .sort({ createdAt: -1 });

        res.status(200).json({
            historial_reparaciones: reparaciones,
            historial_ingresos: equipo.historial_ingresos || []
        });

    } catch (error) {
        console.error('Error al obtener historial combinado:', error);
        res.status(500).json({ message: 'Error al obtener historial combinado', error: error.message });
    }
};

module.exports = {
    iniciarReparacion,
    getReparacionesByIdEquipo
};
