const mongoose = require('mongoose');

const ContadorSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    seq: {
        type: Number,
        default: 0
    }
});

const Contador = mongoose.model('Contador', ContadorSchema, 'contadores');

module.exports = Contador;