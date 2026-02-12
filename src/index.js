const express = require('express');
const cors = require('cors');
const  route  = require('./routes/productoRoute');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', route);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log("Servicio arriba"));