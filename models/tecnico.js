const { Schema, model } = require('mongoose');

const tecnicoSchema = new Schema({
    // Clave primaria lógica
    rut: { 
        type: String, 
        required: true, 
        unique: true // varchar -> String
    },
    nombre: { 
        type: String, 
        required: true // varchar -> String
    },
    cargo: { 
        type: String // varchar -> String
    },
    // NOTA: 'auth_user_id' se ignora.
}, { timestamps: true });

const tecnico = model('Tecnico', tecnicoSchema);

module.exports = tecnico;