const { Schema, model } = require('mongoose');

const actaSchema = new Schema({
    // Clave primaria lógica
    id_acta: { 
        type: String, 
        required: true, 
        unique: true // varchar -> String
    },
    fecha: { 
        type: Date, 
        default: Date.now // date -> Date
    },
    num_acta: { 
        type: Number, 
        required: true, 
        unique: true // int4 -> Number
    },
    // Relación al técnico que genera/firma el acta
    rut: { 
        type: String, 
        ref: 'Tecnico', // Referencia al modelo Tecnico
        required: true 
    },
}, { timestamps: true });

const Acta = model('Acta', actaSchema);

module.exports = Acta;