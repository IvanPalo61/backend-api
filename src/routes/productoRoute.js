// routes/productoRoute.js
const express = require('express');

const {
  poblarProductos,
  getProductos,
  getCategoria,
  crearProducto
} = require('../controllers/externalController');

const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/poblar', poblarProductos);

// Cambiar de '/productos' a '/'
router.get('/', getProductos);

router.get('/categoria', getCategoria);
router.post('/crear', authMiddleware, crearProducto);

module.exports = router;