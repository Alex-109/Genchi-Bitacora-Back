const { Schema, model } = require('mongoose');
const autoIncrement = require('mongoose-sequence')(require('mongoose'));

const reparacionesSchema = new Schema({
    // Clave primaria lógica
    id_repa: { 
        type: Number,
        unique: true

    },
    id_equipo: {
        type: Number,
    
     },
    obs: { 
        type: String // text -> String (Observaciones)
    },
    
    
    // Relación al Técnico que hizo la reparación (Foreign Key)
    rut: { 
        type: String, 
        ref: 'Tecnico', 
    },
    // Cambios realizados (antes y después)
    cambios: { 
        type: Object, 
        required: true 
    },
    fecha: {
        type: Date,
        default: Date.now
    }
    

}, { timestamps: true });

reparacionesSchema.plugin(autoIncrement, { inc_field: 'id_repa' });
const Reparaciones = model('Reparaciones', reparacionesSchema); // ✅ después del plugin


module.exports = Reparaciones;