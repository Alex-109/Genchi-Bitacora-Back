const Equipo = require('../models/equipo');
const mongoose = require('mongoose');

// 🔍 Buscar equipos con filtros y búsqueda general
const buscarEquipos = async (req, res) => {
  const {
    marca,
    tipo_equipo,
    nombre_unidad,
    cpu,
    ram,
    almacenamiento,
    tipo_almacenamiento,
    query
  } = req.body;

  const filtros = {};

  if (marca) filtros.marca = {$regex: marca, $options: 'i' };
  if (tipo_equipo) filtros.tipo_equipo = {$regex: tipo_equipo, $options: 'i' };
  if (nombre_unidad) filtros.nombre_unidad = {$regex: nombre_unidad, $options: 'i' };
  if (cpu) filtros.cpu = {$regex: cpu, $options: 'i' };
  if (ram) filtros.ram = ram;
  if (almacenamiento) filtros.almacenamiento = almacenamiento;
  if (tipo_almacenamiento) filtros.tipo_almacenamiento = {$regex: tipo_almacenamiento, $options: 'i' };

  if (query) {
    filtros.$or = [
      { nombre_equipo: { $regex: query, $options: 'i' } },
      { ip: { $regex: query, $options: 'i' } },
      { serie: { $regex: query, $options: 'i' } },
      { num_inv: { $regex: query, $options: 'i' } }
    ];
  }

  try {
    const equipos = await Equipo.find(filtros);
    res.json(equipos);
  } catch (err) {
    res.status(500).json({ error: 'Error al buscar equipos' });
  }
};

// 🆕 Crear nuevo equipo
const crearEquipo = async (req, res) => {
  const { ip, serie, num_inv, nombre_equipo} = req.body;
  const errores = [];

  // --- Validar formato de IP (IPv4 simple) ---
  const ipRegex = /^(?!.*\.\.)(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;
  if (ip && !ipRegex.test(ip)) {
    errores.push('Formato de IP inválido.');
  }

  if (errores.length > 0) {
    return res.status(400).json({ errores });
  }

  try {
    // --- Verificar duplicados manualmente ---
    const duplicado = await Equipo.findOne({
      $or: [
        { serie: serie },
        { num_inv: num_inv },
        { ip: ip },
        { nombre_equipo: nombre_equipo}
      ]
    });

    if (duplicado) {
      // Detectar cuál campo está duplicado
      let mensaje = 'Ya existe un equipo con ';
      if (duplicado.serie === serie) mensaje += 'esa serie.';
      else if (duplicado.num_inv === num_inv) mensaje += 'ese número de inventario.';
      else if (duplicado.ip === ip) mensaje += 'esa dirección IP.';
      else if (duplicado.nombre_equipo === nombre_equipo) mensaje += 'ese nombre de equipo.';
      return res.status(400).json({ mensaje });
    }

    // --- Si todo está bien, crear el nuevo equipo ---
    const nuevo = new Equipo(req.body);
    await nuevo.save();

    res.status(201).json({ mensaje: 'Equipo creado correctamente.' });

  } catch (err) {
  console.error('❌ Error al guardar el equipo:', err);
  return res.status(500).json({ mensaje: 'Error al crear el equipo.', detalle: err.message });
}

};


// ✏️ Actualizar equipo por ID
const actualizarEquipo = async (req, res) => {
  const { id, changes } = req.body;
  try {
    await Equipo.findByIdAndUpdate(id, changes);
    res.json({ mensaje: 'Equipo actualizado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar equipo' });
  }
};

// ❌ Eliminar equipo por ID autoincrementable

const eliminarEquipo = async (req, res) => {
  try {
    const rawId = req.params.id;

    // Validar que sea un número entero
    const idValue = Number(rawId);
    if (isNaN(idValue) || !Number.isInteger(idValue)) {
      return res.status(400).json({ message: 'ID inválido. Debe ser un número entero.' });
    }

    // Buscar y eliminar por campo "id"
    const equipoEliminado = await Equipo.findOneAndDelete({ id: idValue });

    if (!equipoEliminado) {
      return res.status(404).json({ message: `No se encontró ningún equipo con ID ${idValue}.` });
    }

    return res.status(200).json({
      message: `Equipo con ID ${idValue} eliminado correctamente.`,
      equipo: equipoEliminado
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error al eliminar el equipo.',
      error: error.message
    });
  }
};


module.exports = {
  buscarEquipos,
  crearEquipo,
  actualizarEquipo,
  eliminarEquipo
};
