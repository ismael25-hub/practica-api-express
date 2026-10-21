// ============================================
// Conexión a MongoDB con Mongoose
// ============================================
const mongoose = require('mongoose');

const conectarDB = async () => {
  try {
    console.log('🔌 Intentando conectar...');
    console.log('📋 URI:', process.env.MONGO_URI?.substring(0, 60) + '...');
    
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('✅ Conectado exitosamente a MongoDB');
    console.log('📊 Base de datos:', mongoose.connection.db.databaseName);
    console.log('📦 Host:', mongoose.connection.host);
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = conectarDB;