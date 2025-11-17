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

// 🛠️ CONFIGURACIÓN CORS CORREGIDA
const corsOptions = {
    origin: 'http://localhost:3000', // Origen de tu frontend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204,
    // 🔥 CLAVE: Exponer la cabecera Content-Disposition para que el frontend la lea
    exposedHeaders: ['Content-Disposition'] 
};
app.use(cors(corsOptions));

app.use(express.json());

// ✅ MIDDLEWARE DE LOGGING PARA DEBUG
app.use((req, res, next) => {
    console.log(`📨 [${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl}`);
    next();
});

conectarMongo(); // Conexión a MongoDB

// ✅ CARGAR RUTAS CON VERIFICACIÓN
console.log('🔍 Cargando rutas...');

try {
    app.use('/api/unidades', unidadRoutes);
    console.log('✅ Ruta /api/unidades cargada');
} catch (error) {
    console.error('❌ Error cargando unidades:', error);
}

try {
    app.use('/api/equipos', equipoRoutes);
    console.log('✅ Ruta /api/equipos cargada');
} catch (error) {
    console.error('❌ Error cargando equipos:', error);
}

try {
    app.use('/api/reparaciones', reparacionesRoutes);
    console.log('✅ Ruta /api/reparaciones cargada');
} catch (error) {
    console.error('❌ Error cargando reparaciones:', error);
}

try {
    app.use('/api/actas', actaRoutes);
    console.log('✅ Ruta /api/actas cargada');
} catch (error) {
    console.error('❌ Error cargando actas:', error);
}

try {
    app.use('/api/objetos-varios', objetosVariosRoutes);
    console.log('✅ Ruta /api/objetos-varios cargada');
} catch (error) {
    console.error('❌ Error cargando objetos varios:', error);
}

// ✅ RUTA DE HEALTH CHECK
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date(),
        message: 'Servidor funcionando correctamente'
    });
});

// ✅ MANEJO DE RUTAS NO ENCONTRADAS - CORREGIDO
app.use((req, res, next) => {
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

// ✅ MANEJO DE ERRORES GLOBAL
app.use((err, req, res, next) => {
    console.error('💥 Error no manejado:', err);
    res.status(500).json({ 
        error: 'Error interno del servidor',
        message: err.message 
    });
});

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