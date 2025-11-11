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
const allowedOrigins = [
  'http://localhost:3000',
  'https://genchibitacora.netlify.app'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204,
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
