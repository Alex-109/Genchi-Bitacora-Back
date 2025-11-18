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


// 🆕 Crear nuevo equipo - CORREGIDO PARA CAMPOS VACÍOS
const crearEquipo = async (req, res) => {
  console.log('🔍 [CREAR_EQUIPO] Iniciando creación de equipo...');
  console.log('📦 [CREAR_EQUIPO] Body recibido:', JSON.stringify(req.body, null, 2));
  
  let { ip, serie, num_inv, nombre_equipo, almacenamiento, tipo_equipo, marca, nombre_unidad } = req.body;
  const errores = [];

  console.log('🔍 [CREAR_EQUIPO] Campos extraídos:', {
    tipo_equipo,
    marca, 
    nombre_unidad,
    ip,
    serie,
    num_inv,
    nombre_equipo,
    almacenamiento
  });

  // --- Validar formato de IP (IPv4 simple) ---
  const ipRegex = /^(?!.*\.\.)(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;
  if (ip && ip.trim() !== '' && !ipRegex.test(ip)) {
    console.log('❌ [CREAR_EQUIPO] IP inválida:', ip);
    errores.push('Formato de IP inválido.');
  }

  // ✅ Validar campos obligatorios
  if (!tipo_equipo || tipo_equipo.trim() === '') {
    console.log('❌ [CREAR_EQUIPO] tipo_equipo faltante');
    errores.push('El tipo de equipo es obligatorio.');
  }
  if (!marca || marca.trim() === '') {
    console.log('❌ [CREAR_EQUIPO] marca faltante');
    errores.push('La marca es obligatoria.');
  }
  if (!nombre_unidad || nombre_unidad.trim() === '') {
    console.log('❌ [CREAR_EQUIPO] nombre_unidad faltante');
    errores.push('La unidad es obligatoria.');
  }

  console.log('🔍 [CREAR_EQUIPO] Errores de validación:', errores);

  if (errores.length > 0) {
    console.log('❌ [CREAR_EQUIPO] Validación fallida, retornando 400');
    return res.status(400).json({ errores });
  }

  try {
    // --- Transformar almacenamiento si es número ---
    console.log('🔍 [CREAR_EQUIPO] Tipo de almacenamiento:', typeof almacenamiento, 'Valor:', almacenamiento);
    if (typeof almacenamiento === 'number') {
      req.body.almacenamiento = `${almacenamiento} GB`;
      console.log('🔍 [CREAR_EQUIPO] Almacenamiento transformado:', req.body.almacenamiento);
    }

    // ✅ CORRECCIÓN: Solo buscar duplicados en campos NO VACÍOS
    const condiciones = [];
    
    // Solo agregar a condiciones si el campo tiene valor real
    if (serie && serie.trim() !== '') {
      console.log('🔍 [CREAR_EQUIPO] Agregando condición serie:', serie);
      condiciones.push({ serie: serie.trim() });
    }
    
    if (num_inv && num_inv.trim() !== '') {
      console.log('🔍 [CREAR_EQUIPO] Agregando condición num_inv:', num_inv);
      condiciones.push({ num_inv: num_inv.trim() });
    }
    
    if (ip && ip.trim() !== '') {
      console.log('🔍 [CREAR_EQUIPO] Agregando condición ip:', ip);
      condiciones.push({ ip: ip.trim() });
    }
    
    if (nombre_equipo && nombre_equipo.trim() !== '') {
      console.log('🔍 [CREAR_EQUIPO] Agregando condición nombre_equipo:', nombre_equipo);
      condiciones.push({ nombre_equipo: nombre_equipo.trim() });
    }

    console.log('🔍 [CREAR_EQUIPO] Condiciones para búsqueda de duplicados:', condiciones);

    // --- Buscar duplicados solo si hay campos con valores reales ---
    let duplicado = null;
    if (condiciones.length > 0) {
      console.log('🔍 [CREAR_EQUIPO] Buscando duplicados...');
      duplicado = await Equipo.findOne({ $or: condiciones });
      console.log('🔍 [CREAR_EQUIPO] Resultado búsqueda duplicados:', duplicado ? 'ENCONTRADO' : 'NO ENCONTRADO');
      
      if (duplicado) {
        console.log('🔍 [CREAR_EQUIPO] Duplicado encontrado:', duplicado);
      }
    } else {
      console.log('🔍 [CREAR_EQUIPO] No hay condiciones para buscar duplicados (todos los campos opcionales están vacíos)');
    }

    if (duplicado) {
      let mensaje = 'Ya existe un equipo con ';
      if (serie && serie.trim() !== '' && duplicado.serie === serie.trim()) {
        mensaje += 'esa serie.';
      } else if (num_inv && num_inv.trim() !== '' && duplicado.num_inv === num_inv.trim()) {
        mensaje += 'ese número de inventario.';
      } else if (ip && ip.trim() !== '' && duplicado.ip === ip.trim()) {
        mensaje += 'esa dirección IP.';
      } else if (nombre_equipo && nombre_equipo.trim() !== '' && duplicado.nombre_equipo === nombre_equipo.trim()) {
        mensaje += 'ese nombre de equipo.';
      }
      
      console.log('❌ [CREAR_EQUIPO] Duplicado detectado:', mensaje);
      return res.status(400).json({ mensaje });
    }

    // ✅ CORRECCIÓN: Convertir cadenas vacías a undefined (no a null)
    const limpiarCampo = (valor) => {
      if (valor === '' || valor === null) {
        return undefined; // Mejor usar undefined para que Mongoose no incluya el campo
      }
      return valor.trim();
    };

    const datosParaGuardar = {
      ...req.body,
      // Solo incluir campos si tienen valor
      ...(serie !== undefined && serie !== '' && { serie: limpiarCampo(serie) }),
      ...(num_inv !== undefined && num_inv !== '' && { num_inv: limpiarCampo(num_inv) }),
      ...(ip !== undefined && ip !== '' && { ip: limpiarCampo(ip) }),
      ...(nombre_equipo !== undefined && nombre_equipo !== '' && { nombre_equipo: limpiarCampo(nombre_equipo) })
    };

    // Asegurar que los campos obligatorios estén presentes y limpios
    datosParaGuardar.tipo_equipo = tipo_equipo.trim();
    datosParaGuardar.marca = marca.trim();
    datosParaGuardar.nombre_unidad = nombre_unidad.trim();

    console.log('🔍 [CREAR_EQUIPO] Datos finales para guardar:', JSON.stringify(datosParaGuardar, null, 2));

    const nuevo = new Equipo(datosParaGuardar);
    console.log('🔍 [CREAR_EQUIPO] Objeto Mongoose creado');

    console.log('💾 [CREAR_EQUIPO] Guardando en la base de datos...');
    await nuevo.save();
    console.log('✅ [CREAR_EQUIPO] Equipo guardado exitosamente. ID:', nuevo.id);

    res.status(201).json({ 
      mensaje: 'Equipo creado correctamente.',
      equipo: {
        id: nuevo.id,
        tipo_equipo: nuevo.tipo_equipo,
        marca: nuevo.marca,
        nombre_unidad: nuevo.nombre_unidad
      }
    });

  } catch (err) {
    console.error('❌ [CREAR_EQUIPO] Error al guardar el equipo:');
    console.error('❌ [CREAR_EQUIPO] Nombre del error:', err.name);
    console.error('❌ [CREAR_EQUIPO] Mensaje:', err.message);
    console.error('❌ [CREAR_EQUIPO] Stack:', err.stack);
    
    if (err.name === 'ValidationError') {
      console.error('❌ [CREAR_EQUIPO] Errores de validación de Mongoose:', err.errors);
      return res.status(400).json({ 
        mensaje: 'Error de validación', 
        errores: Object.values(err.errors).map(e => e.message) 
      });
    }
    
    if (err.code === 11000) {
      console.error('❌ [CREAR_EQUIPO] Error de duplicado:', err.keyValue);
      return res.status(400).json({ 
        mensaje: 'Error de duplicación en la base de datos', 
        campo: Object.keys(err.keyValue)[0],
        valor: Object.values(err.keyValue)[0]
      });
    }

    return res.status(500).json({ 
      mensaje: 'Error al crear el equipo.', 
      detalle: err.message 
    });
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



// ❌ Eliminar equipo por ID - VERSIÓN CORREGIDA
const eliminarEquipo = async (req, res) => {
  try {
    const rawId = req.params.id;
    const idValue = Number(rawId);

    if (isNaN(idValue) || !Number.isInteger(idValue)) {
      return res.status(400).json({ message: 'ID inválido. Debe ser un número entero.' });
    }

    // ✅ VERIFICAR SI EL EQUIPO EXISTE PRIMERO
    const equipoExistente = await Equipo.findOne({ id: idValue });
    if (!equipoExistente) {
      return res.status(404).json({ message: `No se encontró ningún equipo con ID ${idValue}.` });
    }

    // ✅ ELIMINAR REPARACIONES ASOCIADAS PRIMERO
    const resultadoReparaciones = await Reparaciones.deleteMany({ id_equipo: idValue });
    console.log(`🧹 Eliminadas ${resultadoReparaciones.deletedCount} reparaciones del equipo ${idValue}`);

    // ✅ ELIMINAR EL EQUIPO
    const equipoEliminado = await Equipo.findOneAndDelete({ id: idValue });

    if (!equipoEliminado) {
      // Esto no debería pasar ya que verificamos arriba, pero por seguridad
      return res.status(404).json({ message: `Error: Equipo con ID ${idValue} no encontrado para eliminar.` });
    }

    console.log(`✅ Equipo con ID ${idValue} eliminado correctamente`);

    return res.status(200).json({
      message: `Equipo con ID ${idValue} eliminado correctamente.`,
      equipo: equipoEliminado,
      reparacionesEliminadas: resultadoReparaciones.deletedCount
    });

  } catch (error) {
    console.error('❌ Error detallado al eliminar equipo:', error);
    
    // ✅ ERROR MÁS ESPECÍFICO
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      return res.status(500).json({
        message: 'Error de base de datos al eliminar el equipo.',
        error: error.message
      });
    }
    
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