// server.js (MODIFICADO)
const express = require('express');
const dotenv = require('dotenv');
const conectarMongo = require('./config/config');
const unidadRoutes = require('./routes/unidadRoute');
const equipoRoutes = require('./routes/equipoRoute');
const reparacionesRoutes = require('./routes/reparacion');
const cors = require('cors'); // 📌 Importar CORS

dotenv.config();

const app = express();

// 📌 CONFIGURACIÓN CORS (CLAVE)
// Esto permite peticiones desde tu frontend (http://localhost:3000)
const corsOptions = {
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions)); // 📌 Usar el middleware CORS con las opciones

app.use(express.json());

conectarMongo(); // Llamar conexión a MongoDB

// Rutas
app.use('/api/unidades', unidadRoutes);
app.use('/api/equipos', equipoRoutes);
app.use('/api/reparaciones', reparacionesRoutes);




const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});