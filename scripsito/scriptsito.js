const mongoose = require('mongoose');

(async () => {
  try {
    // 🔹 Conexión directa a tu base en Atlas
    await mongoose.connect(
      'mongodb+srv://nexmart11:GSr6gRMssaPMDAeu@cluster0.eukmbtr.mongodb.net/GenchiReg?retryWrites=true&w=majority&appName=Cluster0',
      {}
    );

    console.log('✅ Conectado a MongoDB');

    // Referencia a la colección equipos
    const db = mongoose.connection.db;

    // 1. Revisar índices de la colección
    const indexes = await db.collection('equipos').indexes();
    console.log('📌 Índices actuales:', indexes);

    // 2. Borrar índices de ip y serie si existen
    const dropSafe = async (col, indexName) => {
      try {
        await db.collection(col).dropIndex(indexName);
        console.log(`🗑️ Índice eliminado: ${indexName}`);
      } catch (err) {
        if (err.codeName === 'IndexNotFound') {
          console.log(`ℹ️ Índice ${indexName} no existe, ignorado`);
        } else {
          throw err;
        }
      }
    };

    await dropSafe('equipos', 'ip_1');
    await dropSafe('equipos', 'serie_1');

    // 3. Resetear el contador de autoincremento si existe
    const counters = db.collection('counters');
    const deleted = await counters.deleteOne({ _id: 'equipo_id_counter' });

    if (deleted.deletedCount > 0) {
      console.log('🗑️ Contador de id reseteado');
    } else {
      console.log('ℹ️ No había contador de id para resetear');
    }

    console.log('✅ Limpieza terminada');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
})();
