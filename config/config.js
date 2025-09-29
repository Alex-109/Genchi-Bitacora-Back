// config/config.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const uri = process.env.MONGO_URI;

const conectarMongo = async () => {
    try {
        // Usa mongoose.connect() en lugar de MongoClient
        await mongoose.connect(uri, {
            // Opciones recomendadas por Mongoose
            useNewUrlParser: true,
            useUnifiedTopology: true
            // NOTA: Las opciones ServerApiVersion, strict, etc. del driver nativo NO son necesarias aquí
        });
        
        console.log("✅ MongoDB conectado correctamente (Mongoose)");

        // Opcional: Escucha eventos para manejar desconexiones
        mongoose.connection.on('error', err => {
            console.error('❌ Mongoose connection error:', err);
        });

    } catch (error) {
        console.error("❌ Error al conectar a MongoDB (Mongoose)", error);
        process.exit(1);
    }
};

module.exports = conectarMongo;