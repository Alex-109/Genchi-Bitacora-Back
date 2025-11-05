// server.js o app.js
const express = require('express');
const dotenv = require('dotenv');
const conectarMongo = require('./config/config');
const unidadRoutes = require('./routes/unidadRoute');
const equipoRoutes = require('./routes/equipoRoute');
const reparacionesRoutes = require('./routes/reparacion');
const actaRoutes = require('./routes/actaRoute');

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

conectarMongo(); // Conexión a MongoDB

// Rutas
app.use('/api/unidades', unidadRoutes);
app.use('/api/equipos', equipoRoutes);
app.use('/api/reparaciones', reparacionesRoutes);
app.use('/api/actas', actaRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});