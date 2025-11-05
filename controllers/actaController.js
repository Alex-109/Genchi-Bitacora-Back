// controllers/actasController.js
const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip'); // ✅ PizZip en minúsculas (aunque depende de cómo lo instalaste)
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const Equipo = require('../models/equipo');
const Reparaciones = require('../models/reparaciones');

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

const generarActaEntrega = async (req, res) => {
  const { id_equipo } = req.params;

  try {
    // 1. Buscar el equipo en la base de datos
    const equipo = await Equipo.findOne({ id: Number(id_equipo) });
    if (!equipo) {
      return res.status(404).json({ message: 'Equipo no encontrado' });
    }

    // 2. Buscar las reparaciones asociadas (ORDENADAS por fecha más reciente)
    const reparaciones = await Reparaciones.find({ id_equipo: equipo.id })
      .sort({ createdAt: -1 });

    // ✅ Inicializar la base del número de acta con el ID del equipo (fallback)
    // ESTA VARIABLE SE ACTUALIZARÁ CON EL CONTADOR GLOBAL SI EXISTE UNA REPARACIÓN RECIENTE
    let actaNumeroBase = equipo.id;

    // 3. Obtener la observación más reciente y el contador
    let observacionMasReciente = 'Sin observaciones.';
    
    if (reparaciones.length > 0) {
        const ultimaReparacion = reparaciones[0];

        if (ultimaReparacion.obs) {
            observacionMasReciente = limpiarValor(ultimaReparacion.obs) || 'Sin observaciones.';
        }
        
        // ✅ USAR EL CONTADOR SECUENCIAL (si existe), SOBREESCRIBIENDO el valor de actaNumeroBase
        // Dado que ya funciona en el documento, esta lógica es correcta
        if (ultimaReparacion.contador_num_acta) {
            actaNumeroBase = ultimaReparacion.contador_num_acta;
        }
    }

    // 4. Cargar la plantilla
    const templatePath = path.join(__dirname, '../templates/plantilla-acta-entrega.docx');
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip);

    // 5. Formatear datos específicos
    const fechaActual = moment();
    
    // Formatear fecha: "a 30 días del mes de OCTUBRE del año 2025"
    const dia = fechaActual.format('D');
    const mes = fechaActual.format('MMMM').toUpperCase();
    const año = fechaActual.format('YYYY');
    const fechaFormateada = `a ${dia} días del mes de ${mes} del año ${año}`;

    // Generar número de acta: "contador/año"
    const numeroActa = `${actaNumeroBase}/${año}`; 

    // 6. Preparar datos para la plantilla con condicionales granulares
    const datosActa = {
      // Datos básicos del acta
      num_acta: numeroActa,
      fecha: fechaFormateada,
      unidad: limpiarValor(equipo.nombre_unidad) || 'Valparaíso',
      obs: observacionMasReciente,
      
      // Campos comunes con condicionales individuales
      tipo: limpiarValor(equipo.tipo_equipo?.toUpperCase()),
      tiene_tipo: tieneValor(equipo.tipo_equipo),
      
      marca: limpiarValor(equipo.marca),
      tiene_marca: tieneValor(equipo.marca),
      
      modelo: limpiarValor(equipo.modelo),
      tiene_modelo: tieneValor(equipo.modelo),
      
      equipo: limpiarValor(equipo.nombre_equipo),
      tiene_equipo: tieneValor(equipo.nombre_equipo),
      
      serie: limpiarValor(equipo.serie),
      tiene_serie: tieneValor(equipo.serie),
      
      ip: limpiarValor(equipo.ip),
      tiene_ip: tieneValor(equipo.ip),
      
      num_inv: limpiarValor(equipo.num_inv),
      tiene_num_inv: tieneValor(equipo.num_inv),
      
      // ✅ CONDICIONALES para PC
      es_pc: equipo.tipo_equipo === 'pc' || equipo.tipo_equipo === 'notebook',
      
      cpu: limpiarValor(equipo.cpu),
      tiene_cpu: tieneValor(equipo.cpu),
      
      ram: equipo.ram ? `${limpiarValor(equipo.ram)} GB RAM` : '',
      tiene_ram: tieneValor(equipo.ram),
      
      alm: equipo.almacenamiento ? 
        `${limpiarValor(equipo.almacenamiento)} ${limpiarValor(equipo.tipo_almacenamiento) || 'GB'}` : '',
      tiene_alm: tieneValor(equipo.almacenamiento),
      
      // ✅ CONDICIONALES para Impresora
      es_impresora: equipo.tipo_equipo === 'impresora',
      
      toner: limpiarValor(equipo.toner),
      tiene_toner: tieneValor(equipo.toner),
      
      drum: limpiarValor(equipo.drum),
      tiene_drum: tieneValor(equipo.drum),
      
      conexion: limpiarValor(equipo.conexion),
      tiene_conexion: tieneValor(equipo.conexion),
      
      // Datos del encargado
      encargado: 'PAOLA GUERRA CHANAY',
      cargo: 'Encargada de Informática',

      // Añadido para evitar el "undefined" del tag {usuario} en la plantilla
      usuario: ''

    };



    // 7. Log para debugging
    console.log('📋 Datos enviados a la plantilla:', {
      tipo_equipo: equipo.tipo_equipo,
      conexion: datosActa.conexion,
      tiene_conexion: datosActa.tiene_conexion,
      es_impresora: datosActa.es_impresora
    });

    // 8. Reemplazar en la plantilla
    doc.render(datosActa);

    // 9. Generar el documento
    const buf = doc.getZip().generate({ type: 'nodebuffer' });

    // 10. Configurar respuesta
    // ⭐ LA CORRECCIÓN: Usamos actaNumeroBase en el nombre del archivo
    const nombreArchivo = `acta-entrega-${actaNumeroBase}-${equipo.nombre_unidad || 'unidad'}.docx`; 
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    
    res.send(buf);

  } catch (error) {
    console.error('❌ Error generando acta de entrega:', error);
    res.status(500).json({ 
      message: 'Error generando acta de entrega', 
      error: error.message 
    });
  }
};

module.exports = {
  generarActaEntrega
};