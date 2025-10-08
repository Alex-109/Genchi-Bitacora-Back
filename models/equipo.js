const mongoose = require('mongoose'); // Primero importa Mongoose completo
const { Schema, model } = mongoose; // Luego desestructura (o usa require('mongoose') directamente)
const AutoIncrement = require('mongoose-sequence')(mongoose); // Ahora sí se puede usar 'mongoose'

const equipoSchema = new Schema({
    // --- Campos de Identificación Base (Serie, Modelo, Ubicación) ---
    //id
    id: { 
        type: Number,
        unique: true
       
    },
  
    modelo: { 
        type: String, 
         
    },
    marca: { 
        type: String, 
        
    },
    num_inv: { 
        type: String ,
          unique: true,   // si quieres que las series no se repitan
          sparse: true  
    },

    serie: { 
    type: String,  
    unique: true,   // si quieres que las series no se repitan
    sparse: true    // permite que haya documentos sin valor en serie
    },

    ip: { 
    type: String, 
    unique: true,   // si quieres que las IPs no se repitan
    sparse: true    // permite que haya documentos sin valor en ip
    },

    // Relación a Unidad
    nombre_unidad: { 
        type: String,
        ref: 'Unidad', 
        
    },

    // --- Campo para diferenciar el tipo de equipo (CLAVE) ---
    tipo_equipo: {
        type: String,
        
    },

    // --- Campos Específicos de PC (Solo se llenan si tipo_activo='PC') ---
    nombre_equipo: { 
        type: String, 
        unique: true,   // si quieres que los nombres de equipo no se repitan
        sparse: true    // permite que haya documentos sin valor en nombre_equipo
       
        
    },
    usuario: { 
        type: String 
    },
    ver_win: { 
        type: String // Versión de Windows
    },
    windows: {
        type: String
    },
    antivirus: { 
        type: String
    },
    cpu: {
        type: String
    },
    ram: {
        type: String
    },
    almacenamiento: {
        type: String
    },
    tipo_almacenamiento: {
        type: String
    },


    // --- Campos Específicos de Impresora (Solo se llenan si tipo_activo='Impresora') ---
    toner: { 
        type: String,
        // No es requerido globalmente, solo para Impresoras
    }, 
    drum: { 
        type: String 
    }, 
    conexion: { 
        type: String 
    },
    
});

// Configuración del plugin de auto-incremento para el campo 'id'
equipoSchema.plugin(AutoIncrement, { inc_field: 'id', id: 'equipo_id_counter' }); 


// Usamos 'equipos' como colección singular para todo el inventario
const Equipo = model('Equipo', equipoSchema, 'equipos'); 
module.exports = Equipo;