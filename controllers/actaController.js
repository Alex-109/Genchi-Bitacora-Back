// controllers/actasController.js
const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const Equipo = require('../models/equipo');
const ObjetoVario = require('../models/objetoVario');
const Reparaciones = require('../models/reparaciones');
const Contador = require('../models/contador');

// Configuración para formatear la fecha en español
moment.locale('es');

// ✅ FUNCIÓN AUXILIAR: Verificar si un campo tiene valor
const tieneValor = (valor) => {
  return valor !== undefined && valor !== null && valor !== '' && valor !== 'undefined';
};

// ✅ FUNCIÓN AUXILIAR: Limpiar valores
const limpiarValor = (valor) => {
  if (!tieneValor(valor)) return '';
  return String(valor).trim();
};

// ✅ FUNCIÓN PARA OBTENER EL PRÓXIMO NÚMERO DE ACTA
const obtenerProximoNumeroActa = async () => {
  try {
    const contador = await Contador.findByIdAndUpdate(
      'num_acta',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    return contador.seq;
  } catch (error) {
    console.error('Error obteniendo número de acta:', error);
    return Date.now();
  }
};

// ✅ FUNCIÓN MEJORADA: CONSTRUIR DESCRIPCIÓN CON FORMATO - SEPARADA POR TIPO
const construirDescripcion = (item) => {
  const lineas = [];
  
  // ✅ DETECTAR SI ES EQUIPO U OBJETO VARIOS
  if (item.tipo_equipo) {
    // ✅ CASO EQUIPO
    lineas.push(`EQUIPO: ${item.tipo_equipo.toUpperCase()}`);
    lineas.push(''); // Línea en blanco para separar
    
    // Información básica del equipo
    if (item.marca) lineas.push(`• Marca: ${item.marca}`);
    if (item.modelo) lineas.push(`• Modelo: ${item.modelo}`);
    if (item.serie) lineas.push(`• Serie: ${item.serie}`);
    if (item.num_inv) lineas.push(`• Inventario: ${item.num_inv}`);
    if (item.ip) lineas.push(`• Dirección IP: ${item.ip}`);
    
    // Información específica para PCs y notebooks
    if (item.tipo_equipo === 'pc' || item.tipo_equipo === 'notebook') {
      lineas.push(''); // Línea en blanco
      lineas.push('ESPECIFICACIONES TÉCNICAS:');
      if (item.cpu) lineas.push(`  - Procesador: ${item.cpu}`);
      if (item.ram) lineas.push(`  - Memoria RAM: ${item.ram} GB`);
      if (item.almacenamiento) {
        const tipo = item.tipo_almacenamiento || 'GB';
        lineas.push(`  - Almacenamiento: ${item.almacenamiento} ${tipo}`);
      }
      if (item.nombre_equipo) lineas.push(`  - Nombre del equipo: ${item.nombre_equipo}`);
      if (item.ver_win) lineas.push(`  - Windows: ${item.ver_win}`);
      if (item.antivirus) lineas.push(`  - Antivirus: ${item.antivirus}`);
    }
    
    // Información específica para impresoras
    if (item.tipo_equipo === 'impresora') {
      lineas.push(''); // Línea en blanco
      lineas.push('CONSUMIBLES:');
      if (item.toner) lineas.push(`  - Toner: ${item.toner}`);
      if (item.drum) lineas.push(`  - Drum: ${item.drum}`);
      if (item.conexion) lineas.push(`  - Conexión: ${item.conexion}`);
    }
  } else if (item.nombre) {
    // ✅ CASO OBJETO VARIOS - SOLO NOMBRE Y DESCRIPCIÓN
    lineas.push(`OBJETO: ${item.nombre}`);
    lineas.push(''); // Línea en blanco
    
    
    // Solo mostrar comentarios/descripción si tiene valor
    if (item.comentarios && item.comentarios.trim() !== '') {
      lineas.push(`• Descripción: ${item.comentarios}`);
    }
  }
  
  // Si no hay información adicional, agregar mensaje mínimo
  if (lineas.length <= 2) {
    lineas.push('• Sin información adicional');
  }
  
  // Unir todas las líneas con saltos de línea
  return lineas.join('\n');
};

// ✅ FUNCIÓN PARA MAPEAR USUARIO - MEJORADA PARA OBJETOS VARIOS
const mapearUsuario = (item) => {
  // Para equipos
  if (item.nombre_usuario) return item.nombre_usuario;
  
  return 'Sin asignar';
};

// ✅ FUNCIÓN PARA MAPEAR OBSERVACIONES - MEJORADA
const mapearObservaciones = (item, reparaciones = []) => {
   // Para objetos varios, siempre "Sin observaciones"
  if (item.nombre && !item.tipo_equipo) {
    return 'Sin observaciones.';
  }
  
  // Para equipos, buscar en reparaciones
  if (reparaciones.length > 0 && reparaciones[0].obs) {
    return limpiarValor(reparaciones[0].obs) || 'Sin observaciones.';
  }
  
  return 'Sin observaciones.';
};

const generarActaEntregaMultiple = async (req, res) => {
  const { equiposIds, objetosIds } = req.body;
  const { encargado, cargo } = req.query;

  console.log('🔍 Parámetros recibidos:', {
    equiposIds,
    objetosIds,
    encargado,
    cargo
  });

  try {
    if ((!equiposIds || equiposIds.length === 0) && (!objetosIds || objetosIds.length === 0)) {
      return res.status(400).json({ message: 'No se proporcionaron equipos u objetos para generar el acta' });
    }

    const numeroSecuencial = await obtenerProximoNumeroActa();
    
    const equipos = equiposIds && equiposIds.length > 0 
      ? await Equipo.find({ id: { $in: equiposIds.map(id => Number(id)) } })
      : [];

    const objetos = objetosIds && objetosIds.length > 0
      ? await ObjetoVario.find({ id: { $in: objetosIds.map(id => Number(id)) } })
      : [];

    // ✅ LOGS CRÍTICOS AGREGADOS AQUÍ
    console.log('🔍 EQUIPOS ENCONTRADOS:', equipos.length);
    equipos.forEach((equipo, index) => {
      console.log(`   Equipo ${index + 1}:`, {
        id: equipo.id,
        tipo_equipo: equipo.tipo_equipo,
        marca: equipo.marca,
        modelo: equipo.modelo,
        nombre_unidad: equipo.nombre_unidad,
        nombre_usuario: equipo.nombre_usuario,
        comentarios: equipo.comentarios
      });
    });

    console.log('🔍 OBJETOS VARIOS ENCONTRADOS:', objetos.length);
    objetos.forEach((objeto, index) => {
      console.log(`   Objeto ${index + 1}:`, {
        id: objeto.id,
        nombre: objeto.nombre,
        unidad: objeto.unidad,
        comentarios: objeto.comentarios
      });
    });

    const items = [];
    
    // ✅ PROCESAR EQUIPOS
    for (const equipo of equipos) {
      const reparaciones = await Reparaciones.find({ id_equipo: equipo.id })
        .sort({ createdAt: -1 });

      console.log('🔍 CONSTRUYENDO ITEM PARA EQUIPO:', equipo.id);
      const descripcion = construirDescripcion(equipo);
      const observaciones = mapearObservaciones(equipo, reparaciones);
      const usuario = mapearUsuario(equipo);

      console.log('   - Descripción:', descripcion);
      console.log('   - Observaciones:', observaciones);
      console.log('   - Usuario:', usuario);

      const item = {
        cantidad: '01',
        descripcion: descripcion,
        obs: observaciones,
        usuario: usuario,
        tipo: 'equipo' // ✅ Identificar el tipo
      };
      
      console.log('🔍 ITEM EQUIPO CONSTRUIDO:', item);
      items.push(item);
    }
    
    // ✅ PROCESAR OBJETOS VARIOS
    for (const objeto of objetos) {
      console.log('🔍 CONSTRUYENDO ITEM PARA OBJETO:', objeto.id);
      const descripcion = construirDescripcion(objeto);
      const observaciones = mapearObservaciones(objeto);
      const usuario = mapearUsuario(objeto);

      console.log('   - Descripción:', descripcion);
      console.log('   - Observaciones:', observaciones);
      console.log('   - Usuario:', usuario);

      const item = {
        cantidad: '01',
        descripcion: descripcion,
        obs: observaciones,
        usuario: usuario,
        tipo: 'objeto' // ✅ Identificar el tipo
      };
      
      console.log('🔍 ITEM OBJETO CONSTRUIDO:', item);
      items.push(item);
    }

    // ✅ LOG CRÍTICO AGREGADO AQUÍ
    console.log('🔍 TODOS LOS ITEMS:', JSON.stringify(items, null, 2));

    const fechaActual = moment();
    const dia = fechaActual.format('D');
    const mes = fechaActual.format('MMMM').toUpperCase();
    const año = fechaActual.format('YYYY');
    const fechaFormateada = `a ${dia} días del mes de ${mes} del año ${año}`;

    let unidad = 'Valparaíso';
    if (equipos.length > 0 && equipos[0].nombre_unidad) {
      unidad = limpiarValor(equipos[0].nombre_unidad);
    } else if (objetos.length > 0 && objetos[0].unidad) {
      unidad = limpiarValor(objetos[0].unidad);
    }

    const numeroActa = `${numeroSecuencial.toString().padStart(3, '0')}/${año}`;

    const datosActa = {
      num_acta: numeroActa,
      fecha: fechaFormateada,
      unidad: unidad,
      encargado: encargado || 'default',
      cargo: cargo || 'Encargada de Informática',
      items: items
    };

    // ✅ LOGS MEJORADOS AQUÍ
    console.log('📋 ESTRUCTURA COMPLETA PARA PLANTILLA:');
    console.log('- num_acta:', datosActa.num_acta);
    console.log('- fecha:', datosActa.fecha);
    console.log('- unidad:', datosActa.unidad);
    console.log('- encargado:', datosActa.encargado);
    console.log('- cargo:', datosActa.cargo);
    console.log('- items.length:', datosActa.items.length);
    console.log('- equipos en acta:', items.filter(item => item.tipo === 'equipo').length);
    console.log('- objetos en acta:', items.filter(item => item.tipo === 'objeto').length);
    
    if (datosActa.items.length > 0) {
      console.log('- primer item completo:', datosActa.items[0]);
    }

    const templatePath = path.join(__dirname, '../templates/plantilla-acta-entrega.docx');
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip);

    console.log('🔄 Renderizando plantilla...');
    doc.render(datosActa);
    console.log('✅ Plantilla renderizada correctamente');

    const buf = doc.getZip().generate({ type: 'nodebuffer' });

    const nombreArchivo = `acta-entrega-${numeroActa}.docx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    
    res.send(buf);

  } catch (error) {
    console.error('❌ Error generando acta de entrega múltiple:', error);
    res.status(500).json({ 
      message: 'Error generando acta de entrega', 
      error: error.message 
    });
  }
};

// ✅ FUNCIÓN INDIVIDUAL ACTUALIZADA CON CONTADOR
const generarActaEntrega = async (req, res) => {
  const { id_equipo } = req.params;
  const { encargado, cargo } = req.query;

  console.log('🔍 Parámetros recibidos (individual):', {
    id_equipo,
    encargado,
    cargo
  });

  try {
    // Usar la función múltiple con un solo equipo
    return await generarActaEntregaMultiple(
      { 
        body: { equiposIds: [id_equipo], objetosIds: [] } 
      }, 
      { 
        query: { encargado, cargo } 
      },
      res
    );

  } catch (error) {
    console.error('❌ Error generando acta de entrega individual:', error);
    res.status(500).json({ 
      message: 'Error generando acta de entrega', 
      error: error.message 
    });
  }
};

module.exports = {
  generarActaEntrega,
  generarActaEntregaMultiple
};