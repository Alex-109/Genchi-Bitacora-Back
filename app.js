// server.js o app.js
const express = require('express');
const dotenv = require('dotenv');
const conectarMongo = require('./config/config');
const unidadRoutes = require('./routes/unidadRoute');
const equipoRoutes = require('./routes/equipoRoute');
const reparacionesRoutes = require('./routes/reparacion');
const actaRoutes = require('./routes/actaRoute');
const objetosVariosRoutes = require('./routes/objetosVarios');

const cors = require('cors');

dotenv.config();

const app = express();

/* -----------------------------------------------------
   🔐 CORS CONFIGURACIÓN CORRECTA PARA PRODUCCIÓN + DEV
------------------------------------------------------*/

const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://genchi-inv.netlify.app'
];

const corsOptions = {
    origin: function (origin, callback) {
        // Permite Postman, Curl, o requests sin origin
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log('⛔ CORS bloqueado para:', origin);
            callback(new Error('CORS no permitido para este origen'));
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    exposedHeaders: ['Content-Disposition'], // Necesario para descargas
};

app.use(cors(corsOptions));

/* -----------------------------------------------------
   🔧 MIDDLEWARES
------------------------------------------------------*/

app.use(express.json());

// 👀 Logging de peticiones
app.use((req, res, next) => {
    console.log(`📨 [${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`);
    next();
});

/* -----------------------------------------------------
   📌 CONEXIÓN A MONGO
------------------------------------------------------*/

conectarMongo();

/* -----------------------------------------------------
   📌 RUTAS
------------------------------------------------------*/

console.log('🔍 Cargando rutas...');

try {
    app.use('/api/unidades', unidadRoutes);
    console.log('✅ /api/unidades');
} catch (error) {
    console.error('❌ Error en unidades:', error);
}

try {
    app.use('/api/equipos', equipoRoutes);
    console.log('✅ /api/equipos');
} catch (error) {
    console.error('❌ Error en equipos:', error);
}

try {
    app.use('/api/reparaciones', reparacionesRoutes);
    console.log('✅ /api/reparaciones');
} catch (error) {
    console.error('❌ Error en reparaciones:', error);
}

try {
    app.use('/api/actas', actaRoutes);
    console.log('✅ /api/actas');
} catch (error) {
    console.error('❌ Error en actas:', error);
}

try {
    app.use('/api/objetos-varios', objetosVariosRoutes);
    console.log('✅ /api/objetos-varios');
} catch (error) {
    console.error('❌ Error en objetos varios:', error);
}

/* -----------------------------------------------------
   ❤️ HEALTH CHECK
------------------------------------------------------*/

app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date(),
        message: 'Servidor funcionando correctamente'
    });
});

/* -----------------------------------------------------
   ❌ RUTA NO ENCONTRADA
------------------------------------------------------*/

app.use((req, res) => {
    console.log(`❌ Ruta no encontrada: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        error: `Ruta ${req.method} ${req.originalUrl} no encontrada`,
        availableRoutes: [
            'GET  /api/health',
            'POST /api/equipos/buscar',
            'GET  /api/equipos/ultimos',
            'GET  /api/unidades',
            'GET  /api/objetos-varios'
        ]
    });
});

/* -----------------------------------------------------
   💥 MANEJO GLOBAL DE ERRORES
------------------------------------------------------*/

app.use((err, req, res, next) => {
    console.error('💥 Error no manejado:', err);
    res.status(500).json({
        error: 'Error interno del servidor',
        message: err.message
    });
});

/* -----------------------------------------------------
   🚀 SERVIDOR
------------------------------------------------------*/

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`\n🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`📡 Endpoints disponibles:`);
    console.log(`   GET  /api/health`);
    console.log(`   POST /api/equipos/buscar`);
    console.log(`   GET  /api/equipos/ultimos`);
    console.log(`   GET  /api/objetos-varios`);
    console.log(`\n🔍 Listo para recibir peticiones...\n`);
});
