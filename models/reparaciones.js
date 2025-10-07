const { Schema, model } = require('mongoose');

const reparacionesSchema = new Schema({
    // Clave primaria lógica
    id_repa: { 
        type: String, 
        required: true, 
        unique: true // varchar -> String
    },
    id_equipo: {
        type: Number,
    
     },
    obs: { 
        type: String // text -> String (Observaciones)
    },
    
    // Relación al Equipo reparado (Foreign Key)
    serie: { 
        type: String, 
        ref: 'Equipo', 
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
    
    // Relación al Acta donde se registra la reparación (Foreign Key, asumiendo 1:N)
    id_acta: { 
        type: String, 
        ref: 'Acta' 
        // No es required si la reparación puede existir sin estar en un acta todavía.
    },

}, { timestamps: true });

const Reparaciones = model('Reparaciones', reparacionesSchema);

module.exports = Reparaciones;