const { Schema, model } = require('mongoose');

const unidadSchema = new Schema({
    // La dirección podría ser el identificador lógico único, además del _id de Mongo
    direccion: { 
        type: String, 
        required: true, 
        unique: true // varchar -> String
    },
    nombre_u: { 
        type: String, 
        required: true // varchar -> String
    },
    area: { 
        type: String // varchar -> String
    },
    encargado_u: { 
        type: String // varchar -> String
    },
});

const unidad = model('Unidad', unidadSchema, 'unidad');

module.exports = unidad;