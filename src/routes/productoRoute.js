const express = require('express');

const {
  poblarProductos,
  getProductos,
  getCategoria
} = require('../controllers/externalController');

const router = express.Router();

router.post('/poblar', poblarProductos);

router.get('/productos', getProductos);


router.get('/categoria', getCategoria);

module.exports = router;
