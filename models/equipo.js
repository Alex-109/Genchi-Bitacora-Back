const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const AutoIncrement = require('mongoose-sequence')(mongoose);
const Reparaciones = require('./reparaciones'); // 👈 Importamos el modelo hijo

const equipoSchema = new Schema({
    // --- Campos de Identificación Base (Serie, Modelo, Ubicación) ---
    id: { 
        type: Number,
        unique: true
    },
    modelo: { 
        type: String
    },
    marca: { 
        type: String
    },
    num_inv: { 
        type: String,
        unique: true,
        sparse: true
    },
    serie: { 
        type: String,
        unique: true,
        sparse: true
    },
    ip: { 
        type: String,
        unique: true,
        sparse: true
    },

    // Relación a Unidad
    nombre_unidad: { 
        type: String,
        ref: 'Unidad'
    },

    comentarios: {
        type: String
    },
    estado: {
        type: String,
        enum: ['en proceso de reparacion', 'en espera de repuesto','entregado'],
    },

    // --- Campo clave para tipo de equipo ---
    tipo_equipo: {
        type: String,
        enum: ['pc', 'impresora'],
        required: [true, 'El tipo de equipo es obligatorio.'],
        lowercase: true,
        trim: true
    },

    // --- Campos específicos de PC ---
    nombre_equipo: { 
        type: String,
        unique: true,
        sparse: true
    },
    usuario: { type: String },
    ver_win: { type: String },
    windows: { type: String },
    antivirus: { type: String },
    cpu: { type: String },
    ram: { type: String },
    almacenamiento: { type: String },
    tipo_almacenamiento: { type: String },
    historial_ingresos: [
    {
      fecha: { type: Date, required: true },
    }
    ],

    // --- Campos específicos de Impresora ---
    toner: { type: String },
    drum: { type: String },
    conexion: { type: String }

}, { timestamps: true });

// 🔢 Plugin de autoincremento
equipoSchema.plugin(AutoIncrement, { inc_field: 'id', id: 'equipo_id_counter' });

/* 
-------------------------------------------------------
🧩 Eliminación en cascada de reparaciones asociadas
-------------------------------------------------------
- Este middleware se ejecuta automáticamente ANTES
  de eliminar un equipo con `findOneAndDelete`.
- Evita dejar reparaciones huérfanas en la base de datos.
*/
equipoSchema.pre('findOneAndDelete', async function (next) {
    try {
        const filtro = this.getFilter();
        const equipo = await this.model.findOne(filtro);
        if (equipo) {
            await Reparaciones.deleteMany({ id_equipo: equipo.id });
            console.log(`🧹 Reparaciones asociadas al equipo ${equipo.id} eliminadas correctamente.`);
        }
        next();
    } catch (err) {
        console.error('Error en eliminación en cascada:', err);
        next(err);
    }
});

const Equipo = model('Equipo', equipoSchema, 'equipos');
module.exports = Equipo;
