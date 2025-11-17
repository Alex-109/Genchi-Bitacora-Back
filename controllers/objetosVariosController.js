const ObjetoVario = require('../models/objetoVario');

// ✅ Obtener todos los objetos varios - MODIFICADO
const obtenerObjetosVarios = async (req, res) => {
  try {
    const { unidad, buscar, fechaInicio, fechaFin } = req.query;
    
    let filtro = {};
    
    // Filtro por unidad
    if (unidad && unidad !== 'todas') {
      filtro.unidad = { $regex: unidad, $options: 'i' };
    }
    
    // Búsqueda por nombre o comentarios
    if (buscar && buscar.trim() !== '') {
      filtro.$or = [
        { nombre: { $regex: buscar, $options: 'i' } },
        { comentarios: { $regex: buscar, $options: 'i' } },
        { unidad: { $regex: buscar, $options: 'i' } }
      ];
    }

    // ✅ NUEVO: Filtro por rango de fechas
    if (fechaInicio || fechaFin) {
      filtro.createdAt = {};
      
      if (fechaInicio) {
        const inicio = new Date(fechaInicio + "T00:00:00");
        filtro.createdAt.$gte = inicio;
      }
      
      if (fechaFin) {
        const fin = new Date(fechaFin + "T23:59:59.999");
        filtro.createdAt.$lte = fin;
      }
    }

    const objetos = await ObjetoVario.find(filtro).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: objetos,
      total: objetos.length
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo objetos varios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los objetos varios',
      error: error.message
    });
  }
};

// ✅ Obtener un objeto vario por ID
const obtenerObjetoVario = async (req, res) => {
  try {
    const { id } = req.params;
    
    const objeto = await ObjetoVario.findOne({ id: Number(id) });
    
    if (!objeto) {
      return res.status(404).json({
        success: false,
        message: 'Objeto no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: objeto
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo objeto vario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el objeto vario',
      error: error.message
    });
  }
};

// ✅ Crear nuevo objeto vario
const crearObjetoVario = async (req, res) => {
  try {
    const { nombre, unidad, comentarios } = req.body;
    
    console.log('🔍 DEBUG - Datos recibidos en el servidor:', req.body);
    
    // Validaciones básicas
    if (!nombre || !unidad) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y unidad son campos obligatorios'
      });
    }
    
    // Crear objeto SIN el middleware de auto-incremento por ahora
    const nuevoObjeto = new ObjetoVario({
      id: Date.now(), // ID temporal para pruebas
      nombre: nombre.trim(),
      unidad: unidad.trim(),
      comentarios: comentarios?.trim() || '',
    });
    
    console.log('🔍 DEBUG - Objeto a guardar:', nuevoObjeto);
    
    const objetoGuardado = await nuevoObjeto.save();
    
    console.log('✅ DEBUG - Objeto guardado exitosamente:', objetoGuardado);
    
    res.status(201).json({
      success: true,
      message: 'Objeto creado exitosamente',
      data: objetoGuardado
    });
    
  } catch (error) {
    console.error('❌ ERROR DETALLADO - Creando objeto vario:');
    console.error('Nombre del error:', error.name);
    console.error('Mensaje:', error.message);
    console.error('Stack completo:', error.stack);
    
    if (error.name === 'ValidationError') {
      console.error('Errores de validación:', error.errors);
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    if (error.code === 11000) {
      console.error('Error de duplicado:', error.keyValue);
      return res.status(400).json({
        success: false,
        message: 'Error de duplicación',
        field: Object.keys(error.keyValue)[0]
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al crear el objeto vario',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// ✅ Actualizar objeto vario
const actualizarObjetoVario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, unidad, comentarios } = req.body;
    
    const objetoActualizado = await ObjetoVario.findOneAndUpdate(
      { id: Number(id) },
      {
        ...(nombre && { nombre: nombre.trim() }),
        ...(unidad && { unidad: unidad.trim() }),
        ...(comentarios !== undefined && { comentarios: comentarios.trim() }),
      
      },
      { new: true, runValidators: true }
    );
    
    if (!objetoActualizado) {
      return res.status(404).json({
        success: false,
        message: 'Objeto no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Objeto actualizado exitosamente',
      data: objetoActualizado
    });
    
  } catch (error) {
    console.error('❌ Error actualizando objeto vario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el objeto vario',
      error: error.message
    });
  }
};

// ✅ Eliminar objeto vario
const eliminarObjetoVario = async (req, res) => {
  try {
    const { id } = req.params;
    
    const objetoEliminado = await ObjetoVario.findOneAndDelete({ id: Number(id) });
    
    if (!objetoEliminado) {
      return res.status(404).json({
        success: false,
        message: 'Objeto no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Objeto eliminado exitosamente',
      data: objetoEliminado
    });
    
  } catch (error) {
    console.error('❌ Error eliminando objeto vario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el objeto vario',
      error: error.message
    });
  }
};

module.exports = {
  obtenerObjetosVarios,
  obtenerObjetoVario,
  crearObjetoVario,
  actualizarObjetoVario,
  eliminarObjetoVario
};