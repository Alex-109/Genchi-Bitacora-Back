const express = require('express');
const dotenv = require('dotenv');
const conectarMongo = require('./config/config');
const unidadRoutes = require('./routes/unidadRoute');
const equipoRoutes = require('./routes/equipoRoute');
const reparacionesRoutes = require('./routes/reparacion');

const cors = require('cors'); 

dotenv.config();

const app = express();

// Configuración CORS
const corsOptions = {
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

app.use(express.json());

conectarMongo(); // Conexión a MongoDB

// --- Sincronizar índices de Equipo para unique + sparse ---
const Equipo = require('./models/equipo');
Equipo.syncIndexes()
  .then(() => console.log('✅ Índices de Equipo sincronizados'))
  .catch(err => console.error('❌ Error sincronizando índices de Equipo:', err));

// Rutas
app.use('/api/unidades', unidadRoutes);
app.use('/api/equipos', equipoRoutes);
app.use('/api/reparaciones', reparacionesRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
