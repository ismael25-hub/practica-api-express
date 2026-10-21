require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const fs = require('fs'); // Módulo nativo para leer/escribir archivos
const path = require('path');
const multer = require('multer'); // Para subida de archivos
const csv = require('csv-parser'); // Para leer CSV
const { Parser } = require('json2csv'); // Para exportar a CSV

const conectarDB = require('./config/db');
const Recurso = require('./models/Recurso');

const app = express();
const PORT = process.env.PORT || 3000;

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// Configuración de Multer (Guarda en carpeta uploads)
const upload = multer({ dest: 'uploads/' });

// ============================================
// RUTAS CRUD ANTERIORES (No las borres)
// ============================================
app.get('/', (req, res) => res.send('API REST con MongoDB en línea'));
app.get('/api/recursos', async (req, res) => { const r = await Recurso.find(); res.json(r); });
app.post('/api/recursos', async (req, res) => { const r = await Recurso.create(req.body); res.status(201).json(r); });

// ============================================
// PARTE II: IMPORTACIÓN (POST)
// ============================================
app.post('/api/recursos/importar', upload.single('archivo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    const rutaArchivo = req.file.path;
    const extension = path.extname(req.file.originalname).toLowerCase();
    let datosImportados = [];

    // A) SI ES JSON
    if (extension === '.json') {
      const contenido = fs.readFileSync(rutaArchivo, 'utf-8');
      datosImportados = JSON.parse(contenido);
    } 
    // B) SI ES CSV
    else if (extension === '.csv') {
      await new Promise((resolve, reject) => {
        fs.createReadStream(rutaArchivo)
          .pipe(csv())
          .on('data', (fila) => {
            // Convertir precio a número
            if (fila.precio) fila.precio = Number(fila.precio);
            datosImportados.push(fila);
          })
          .on('end', resolve)
          .on('error', reject);
      });
    } else {
      fs.unlinkSync(rutaArchivo);
      return res.status(400).json({ error: 'Formato no soportado. Usa .json o .csv' });
    }

    // Insertar a MongoDB (ignorando el _id que venga en el archivo para evitar conflictos)
    if (datosImportados.length > 0) {
      await Recurso.insertMany(datosImportados);
    }

    // Eliminar archivo temporal
    fs.unlinkSync(rutaArchivo);

    res.status(200).json({
      mensaje: 'Importación exitosa',
      totalInsertados: datosImportados.length
    });

  } catch (error) {
    res.status(500).json({ error: 'Error al importar', detalle: error.message });
  }
});

// ============================================
// PARTE III: EXPORTACIÓN (GET)
// ============================================
app.get('/api/recursos/exportar/:formato', async (req, res) => {
  try {
    const formato = req.params.formato.toLowerCase();
    const recursos = await Recurso.find().lean(); // .lean() devuelve objetos JS puros

    if (recursos.length === 0) {
      return res.status(404).json({ error: 'No hay datos para exportar' });
    }

    if (formato === 'json') {
      // Descargar como JSON
      res.setHeader('Content-Disposition', 'attachment; filename=datos_exportados.json');
      res.setHeader('Content-Type', 'application/json');
      res.json(recursos);
    } 
    else if (formato === 'csv') {
      // Convertir a CSV usando json2csv
      const campos = ['nombre', 'precio', 'categoria']; // Evitamos _id y __v en el CSV
      const json2csvParser = new Parser({ fields: campos });
      const csvData = json2csvParser.parse(recursos);

      res.setHeader('Content-Disposition', 'attachment; filename=datos_exportados.csv');
      res.setHeader('Content-Type', 'text/csv');
      res.send(csvData);
    } 
    else {
      res.status(400).json({ error: 'Formato inválido. Usa json o csv' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al exportar', detalle: error.message });
  }
});

// --- INICIAR SERVIDOR ---
const iniciarServidor = async () => {
  await conectarDB();
  app.listen(PORT, () => console.log(`🚀 Servidor en http://localhost:${PORT}`));
};

iniciarServidor();