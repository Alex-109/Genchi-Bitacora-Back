const Equipo = require('../models/equipo');
const mongoose = require('mongoose');
const Reparaciones = require('../models/reparaciones');

// Función auxiliar para crear un patrón de RegEx que ignora espacios (flexible).
// Esto permite que '8 GB' (filtro) encuentre '8gb' (DB).

/* =========================================================================
   Función auxiliar: Crear patrón flexible para búsqueda difusa
   - Ignora mayúsculas/minúsculas
   - Ignora espacios y acentos
   - Permite coincidencias aproximadas (ej: 'i5' encuentra 'i5 8400')
   ========================================================================= */
function createFlexiblePattern(input) {
  if (!input) return /.*/;
  const clean = input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '');
  const pattern = clean.split('').join('\\s*'); // permite espacios intermedios
  return new RegExp(pattern, 'i');
}

/* =========================================================================
   1️⃣  API: Obtener los últimos equipos ingresados
   - Método: GET
   - Query params: limit (opcional, default 10)
   ========================================================================= */
const obtenerUltimosEquipos = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const equipos = await Equipo.find()
      .sort({ createdAt: -1 }) // más recientes primero
      .limit(limit);

    res.json(equipos);
  } catch (error) {
    console.error('Error al obtener los últimos equipos:', error);
    res.status(500).json({ error: 'Error al obtener los últimos equipos' });
  }
};

/* =========================================================================
   2️⃣  API: Buscar equipos con filtros y búsqueda general
   - Método: POST
   - Body: 
     {
       tipo_equipo, marca, nombre_unidad, cpu, ram, almacenamiento,
       tipo_almacenamiento, query, fechaInicio, fechaFin, limit, pagina
     }
   ========================================================================= */
const buscarEquipos = async (req, res) => {
  const {
    tipo_equipo,
    marca,
    nombre_unidad,
    cpu,
    ram,
    almacenamiento,
    tipo_almacenamiento,
    query,
    fechaInicio,
    fechaFin,
    limit = 10,
    pagina = 1
  } = req.body;

  const filtros = {};
  const skip = (pagina - 1) * limit;

  try {
    // 🔹 1. Filtro por tipo de equipo
    if (tipo_equipo && tipo_equipo !== 'todos') {
      filtros.tipo_equipo = tipo_equipo.toLowerCase().trim();
    }

    // 🔹 2. Filtros aproximados
    if (marca) filtros.marca = { $regex: createFlexiblePattern(marca) };
    if (nombre_unidad) filtros.nombre_unidad = { $regex: createFlexiblePattern(nombre_unidad) };
    if (cpu) filtros.cpu = { $regex: createFlexiblePattern(cpu) };

    // 🔹 2.5 Filtros exactos o personalizados
    if (ram) filtros.ram = ram;

    if (almacenamiento) {
      if (almacenamiento === "Otros") {
        filtros.almacenamiento = { $nin: ["250","256","500","512","1000"] };
      } else {
        filtros.almacenamiento = almacenamiento;
      }
    }

    // ✅ tipo_almacenamiento con patrón flexible
    if (tipo_almacenamiento) {
      filtros.tipo_almacenamiento = { $regex: createFlexiblePattern(tipo_almacenamiento) };
    }

    // 🔹 3. Búsqueda general
    if (query) {
      const flexible = createFlexiblePattern(query);
      filtros.$or = [
        { nombre_equipo: { $regex: flexible } },
        { ip: { $regex: flexible } },
        { serie: { $regex: flexible } },
        { num_inv: { $regex: flexible } }
      ];
    }

    // 🔹 4. Filtro por rango de fechas (equipos o reparaciones en ese rango)
    if (fechaInicio || fechaFin) {
      const inicio = fechaInicio ? new Date(fechaInicio + "T00:00:00") : new Date("2000-01-01");
      const fin = fechaFin ? new Date(fechaFin + "T23:59:59.999") : new Date();

      // Buscar IDs de equipos con reparaciones en ese rango
      const reparacionesIds = await Reparaciones.find({
        createdAt: { $gte: inicio, $lte: fin }
      }).distinct("id_equipo");

      // Si ya había un $or, combinamos
      const existingOr = filtros.$or ? filtros.$or : [];

      filtros.$or = [
        ...existingOr,
        { createdAt: { $gte: inicio, $lte: fin } }, // equipos creados en el rango
        { id: { $in: reparacionesIds } }            // o con reparaciones en el rango
      ];
    }

    // 🔹 5. Conteo total y consulta paginada
    const total = await Equipo.countDocuments(filtros);
    const equipos = await Equipo.find(filtros)
      .sort({ updatedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      total,
      equipos,
      paginaActual: pagina,
      totalPaginas: Math.ceil(total / limit)
    });

  } catch (err) {
    console.error('❌ Error al buscar equipos:', err);
    res.status(500).json({ error: 'Error al buscar equipos' });
  }
};



// 🆕 Crear nuevo equipo
const crearEquipo = async (req, res) => {
  let { ip, serie, num_inv, nombre_equipo, almacenamiento} = req.body;
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
    // --- Transformar almacenamiento si es número ---
    if (typeof almacenamiento === 'number') {
      req.body.almacenamiento = `${almacenamiento} GB`;
    }

    // --- Construir condiciones solo con valores no vacíos ---
    const condiciones = [];
    if (serie != null && serie !== '') condiciones.push({ serie });
    if (num_inv != null && num_inv !== '') condiciones.push({ num_inv });
    if (ip != null && ip !== '') condiciones.push({ ip });
    if (nombre_equipo != null && nombre_equipo !== '') condiciones.push({ nombre_equipo });

    // --- Buscar duplicados solo si hay campos a revisar ---
    let duplicado = null;
    if (condiciones.length > 0) {
      duplicado = await Equipo.findOne({ $or: condiciones });
    }

    if (duplicado) {
      let mensaje = 'Ya existe un equipo con ';
      if (serie && duplicado.serie === serie) mensaje += 'esa serie.';
      else if (num_inv && duplicado.num_inv === num_inv) mensaje += 'ese número de inventario.';
      else if (ip && duplicado.ip === ip) mensaje += 'esa dirección IP.';
      else if (nombre_equipo && duplicado.nombre_equipo === nombre_equipo) mensaje += 'ese nombre de equipo.';
      return res.status(400).json({ mensaje });
    }

    // --- Convertir cadenas vacías a null antes de guardar ---
    const limpiarCampo = (valor) => (valor === '' ? null : valor);

    const nuevo = new Equipo({
      ...req.body,
      serie: limpiarCampo(serie),
      num_inv: limpiarCampo(num_inv),
      ip: limpiarCampo(ip),
      nombre_equipo: limpiarCampo(nombre_equipo)

    });

    await nuevo.save();

    res.status(201).json({ mensaje: 'Equipo creado correctamente.' });

  } catch (err) {
    console.error('❌ Error al guardar el equipo:', err);
    return res.status(500).json({ mensaje: 'Error al crear el equipo.', detalle: err.message });
  }
};

//REGISTRAR INGRESOS

const registrarIngreso = async (req, res) => {
  const { idEquipo } = req.params;
  const { estado } = req.body;

  try {
    const equipo = await Equipo.findOne({ id: Number(idEquipo) }); // Cambiado de findById a findOne
    if (!equipo) return res.status(404).json({ mensaje: 'Equipo no encontrado' });

    // Crear nuevo registro de ingreso
    const nuevoIngreso = {
      fecha: new Date(),
      estado: estado
    };

    // Push al array historial_ingresos
    equipo.historial_ingresos = equipo.historial_ingresos || [];
    equipo.historial_ingresos.push(nuevoIngreso);

    // Actualizar el estado actual del equipo
    equipo.estado = estado;

    await equipo.save();

    res.status(200).json({ mensaje: 'Ingreso registrado correctamente', ingreso: nuevoIngreso });
  } catch (err) {
    console.error('Error registrando ingreso:', err);
    res.status(500).json({ mensaje: 'Error al registrar ingreso', detalle: err.message });
  }
};


// ✏️ Actualizar equipo por ID
const actualizarEquipo = async (req, res) => {
  const { id, changes } = req.body;

  try {
    // 🔁 Transformar almacenamiento si viene como número
    if (typeof changes.almacenamiento === 'number') {
      changes.almacenamiento = `${changes.almacenamiento} GB`;
    }

    // ✅ CORRECCIÓN DE BÚSQUEDA:
    // Cambiamos findByIdAndUpdate (que busca por _id) 
    // por findOneAndUpdate (buscando por el campo 'id' numérico).
    const equipoActualizado = await Equipo.findOneAndUpdate(
        { id: id }, // Condición de búsqueda
        { $set: changes }, // Cambios a aplicar
        { new: true } // Opcional: devuelve el documento actualizado
    );

    if (!equipoActualizado) {
        return res.status(404).json({ mensaje: 'Equipo no encontrado para actualizar.' });
    }

    res.json({ mensaje: 'Equipo actualizado' });
  } catch (err) {
    console.error('❌ Error al actualizar equipo:', err);
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
  eliminarEquipo,
  obtenerUltimosEquipos,
  registrarIngreso

};