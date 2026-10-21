// ============================================
// Modelo de Recurso para MongoDB
// ============================================
const mongoose = require('mongoose');

const RecursoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true
    },
    precio: {
      type: Number,
      default: 0,
      min: [0, 'El precio no puede ser negativo']
    },
    categoria: {
      type: String,
      default: 'General',
      trim: true
    }
  },
  {
    timestamps: true,           // Agrega createdAt y updatedAt
    collection: 'recursos'      // Nombre de la colección en MongoDB
  }
);

module.exports = mongoose.model('Recurso', RecursoSchema);