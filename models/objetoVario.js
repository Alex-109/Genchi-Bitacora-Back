const mongoose = require('mongoose');

const objetoSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true,
    required: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  unidad: {
    type: String,
    required: true,
    trim: true
  },
  comentarios: {
    type: String,
    trim: true,
    default: ''
  },
}, {
  timestamps: true
});


module.exports = mongoose.model('ObjetoVario', objetoSchema);