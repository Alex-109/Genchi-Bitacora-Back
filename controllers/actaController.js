// controllers/actasController.js
const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const Equipo = require('../models/equipo');


// Configuración para formatear la fecha en español
moment.locale('es');

const generarActaEntrega = async (req, res) => {
  const { id_equipo } = req.params;

  try {
    // 1. Buscar el equipo en la base de datos
    const equipo = await Equipo.findOne({ id: Number(id_equipo) });
    if (!equipo) {
      return res.status(404).json({ message: 'Equipo no encontrado' });
    }

    // 2. Cargar la plantilla
    const templatePath = path.join(__dirname, '../templates/plantilla-acta-entrega.docx');
    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip);

    // 3. Formatear datos específicos
    const fechaActual = moment();
    
    // Formatear fecha: "a 30 días del mes de OCTUBRE del año 2025"
    const dia = fechaActual.format('D');
    const mes = fechaActual.format('MMMM').toUpperCase();
    const año = fechaActual.format('YYYY');
    const fechaFormateada = `a ${dia} días del mes de ${mes} del año ${año}`;

    // Generar número de acta: "id_equipo/año"
    const numeroActa = `${equipo.id}/${año}`;

    // 4. Preparar datos para la plantilla
    const datosActa = {
      num_acta: numeroActa,
      fecha: fechaFormateada,
      unidad: equipo.nombre_unidad || 'Valparaíso',
      
      // Nuevos campos agregados
      tipo_equipo: equipo.tipo_equipo ? `${equipo.tipo_equipo.toUpperCase()}` : '',
      marca: equipo.marca || '',
      modelo: equipo.modelo || '',
      
      // Datos del equipo existentes
      cpu: equipo.cpu || '',
      almacenamiento: equipo.almacenamiento ? `${equipo.almacenamiento} ${equipo.tipo_almacenamiento || ''}` : '',
      ram: equipo.ram ? `${equipo.ram} GB RAM` : '',
      serie: equipo.serie ? `Serie Nº ${equipo.serie}` : '',
      nombre_equipo: equipo.nombre_equipo || '',
      ip: equipo.ip ? `IP ${equipo.ip}` : '',
      num_inv: equipo.num_inv ? `Inv. Nº ${equipo.num_inv}` : '',
      
      // Observaciones y usuario
      comentarios: equipo.observaciones || 'Equipo en condiciones óptimas',
      nombre_usuario: equipo.usuario_asignado ? `Usuario: ${equipo.usuario_asignado}` : '',
      
      // Datos del encargado
      nombre_encargado: 'PAOLA A. GUERRA CHANAY',
      cargo: 'Encargada de Informática'
    };

    // 5. Reemplazar en la plantilla
    doc.render(datosActa);

    // 6. Generar el documento
    const buf = doc.getZip().generate({ type: 'nodebuffer' });

    // 7. Configurar respuesta
    const nombreArchivo = `acta-entrega-${equipo.id}-${equipo.serie || 'sin-serie'}.docx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    
    res.send(buf);

  } catch (error) {
    console.error('Error generando acta de entrega:', error);
    res.status(500).json({ 
      message: 'Error generando acta de entrega', 
      error: error.message 
    });
  }
};

module.exports = {
  generarActaEntrega
};