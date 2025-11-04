// controllers/reparacionesController.js (o el nombre de tu archivo de controlador)

const Reparaciones = require('../models/reparaciones');
const Equipo = require('../models/equipo');

// Iniciar una reparación: actualiza equipo y registra cambios
const iniciarReparacion = async (req, res) => {
  const { id_equipo, cambios, obs, rut } = req.body;

  try {
    const equipo = await Equipo.findOne({ id: id_equipo });
    if (!equipo) return res.status(404).json({ message: 'Equipo no encontrado' });

    const cambiosRegistrados = {}; 
    for (let key in cambios) {
      if (equipo[key] !== cambios[key]) {
        cambiosRegistrados[key] = {
          antes: equipo[key],
          despues: cambios[key]
        };
        equipo[key] = cambios[key];
      }
    }

    // ✅ CORRECCIÓN DE VALIDACIÓN:
    // Ahora solo falla si NO hay cambios Y TAMPOCO hay observación.
    if (Object.keys(cambiosRegistrados).length === 0 && (!obs || obs.trim() === '')) {
      return res.status(400).json({ message: 'No hay cambios ni observaciones para registrar.' });
    }

    // Si hubo cambios, guarda el equipo (actualiza atributos)
    if (Object.keys(cambiosRegistrados).length > 0) {
      await equipo.save();
    }

    const nuevaRepa = new Reparaciones({
      id_equipo: equipo.id,
      rut,
      obs,
      cambios: cambiosRegistrados
    });

    await nuevaRepa.save();
    res.status(201).json(nuevaRepa);
  } catch (error) {
    console.error('Error al iniciar reparación:', error);
    res.status(500).json({ message: 'Error al iniciar reparación', error: error.message });
  }
};

// Obtener historial combinado (Reparaciones e Ingresos) por id_equipo
const getReparacionesByIdEquipo = async (req, res) => {
  const { id_equipo } = req.query;
  if (!id_equipo) return res.status(400).json({ message: 'ID de equipo no especificado' });

  try {
    // 1. Buscar el equipo para obtener el historial de ingresos
    const equipo = await Equipo.findOne({ id: Number(id_equipo) }).select('id historial_ingresos');
    
    if (!equipo) {
      return res.status(404).json({ message: 'Equipo no encontrado' });
    }

    // 2. Buscar las reparaciones relacionadas
    const reparaciones = await Reparaciones.find({ id_equipo: Number(id_equipo) }).sort({ createdAt: -1 });

    // 3. Combinar ambos arrays en la respuesta JSON
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