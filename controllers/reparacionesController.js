const Reparaciones = require('../models/reparaciones');
const Equipo = require('../models/equipo');

// Iniciar una reparación: actualiza equipo y registra cambios
const iniciarReparacion = async (req, res) => {
  const { id_equipo, cambios, obs, rut } = req.body;

  try {
    const equipo = await Equipo.findOne({ id: id_equipo });
    if (!equipo) return res.status(404).json({ message: 'Equipo no encontrado' });

    // Detectar cambios reales
    const cambiosRegistrados = {}; // <-- DECLARACIÓN AQUÍ
    for (let key in cambios) {
      if (equipo[key] !== cambios[key]) {
        cambiosRegistrados[key] = {
          antes: equipo[key],
          despues: cambios[key]
        };
        equipo[key] = cambios[key];
      }
    }

    // Validar que haya cambios reales
    if (Object.keys(cambiosRegistrados).length === 0) {
      return res.status(400).json({ message: 'No hay cambios para registrar.' });
    }

    await equipo.save();

    const nuevaRepa = new Reparaciones({
      id_equipo: equipo.id,
      rut,
      obs,
      cambios: cambiosRegistrados
    });

    await nuevaRepa.save();
    res.status(201).json(nuevaRepa);
  } catch (error) {
    res.status(500).json({ message: 'Error al iniciar reparación', error: error.message });
  }
};

// Obtener reparaciones por id_equipo
const getReparacionesByIdEquipo = async (req, res) => {
  const { id_equipo } = req.query;
  if (!id_equipo) return res.status(400).json({ message: 'ID de equipo no especificado' });

  try {
    const reparaciones = await Reparaciones.find({ id_equipo: Number(id_equipo) }).sort({ createdAt: -1 });
    res.status(200).json(reparaciones);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener reparaciones', error: error.message });
  }
};

module.exports = {
  iniciarReparacion,
  getReparacionesByIdEquipo
};

