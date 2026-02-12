const pool = require('../config/db');

const poblarProductos = async (request, response) => {
    try {
       
        const apiFetch = await fetch('https://fakestoreapi.com/products');
        const products = await apiFetch.json();

        let inserciones = 0;

        for (const product of products) {

            const {
                title,
                price,
                description,
                image,
                category
            } = product;

            const stock = Math.floor(Math.random() * 50) + 1;

            // ===============================
            // 1. Buscar si ya existe categoría
            // ===============================
            const buscarCategoria = `
                SELECT id FROM categoria
                WHERE nombre = $1
            `;

            const categoriaResult = await pool.query(
                buscarCategoria,
                [category]
            );

            let idCategoria;

            // ===============================
            // 2. Si no existe → crearla
            // ===============================
            if (categoriaResult.rows.length === 0) {

                const insertarCategoria = `
                    INSERT INTO categoria (nombre)
                    VALUES ($1)
                    RETURNING id
                `;

                const nuevaCategoria = await pool.query(
                    insertarCategoria,
                    [category]
                );

                idCategoria = nuevaCategoria.rows[0].id;

            } else {
                // Ya existe
                idCategoria = categoriaResult.rows[0].id;
            }

            // ===============================
            // 3. Insertar producto
            // ===============================
            const insertarProducto = `
                INSERT INTO productos
                (nombre, precio, stock, descripcion, imagen_url, id_categoria)
                VALUES ($1, $2, $3, $4, $5, $6)
            `;

            await pool.query(insertarProducto, [
                title,
                price,
                stock,
                description,
                image,
                idCategoria
            ]);

            inserciones++;
        }

        response.status(200).json({
            mensaje: "Carga masiva exitosa",
            cantidad: inserciones
        });

    } catch (error) {
        console.error("Error:", error);
        response.status(500).json({
            error: error.message
        });
    }
};
const getProductos = async (req, res) => {
  try {

    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({
        error: "Debes enviar un parámetro de búsqueda: ?q=palabra"
      });
    }

    let sql = "SELECT * FROM productos WHERE nombre ILIKE $1";
    let values = [`%${q}%`];

    const result = await pool.query(sql, values);

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al leer BD' });
  }
};
const getCategoria = async (req, res) => {
  try {

    const { k } = req.query;

    if (!k || k.trim() === "") {
      return res.status(400).json({
        error: "Debes enviar un parámetro de búsqueda: ?q=palabra"
      });
    }

    let sql = "SELECT * FROM categoria WHERE nombre ILIKE $1";
    let values = [`%${k}%`];

    const result = await pool.query(sql, values);

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al leer BD' });
  }
};



module.exports = { poblarProductos, getProductos, getCategoria };
