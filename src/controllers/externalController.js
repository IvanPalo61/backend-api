const pool = require('../config/db');


// =====================================================
// CARGA MASIVA DESDE API EXTERNA
// =====================================================
const poblarProductos = async (req, res) => {
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

            // Buscar categoría
            const buscarCategoria = `
                SELECT id FROM categoria
                WHERE nombre = $1
            `;

            const categoriaResult = await pool.query(
                buscarCategoria,
                [category]
            );

            let idCategoria;

            // Crear si no existe
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
                idCategoria = categoriaResult.rows[0].id;
            }

            // Insertar producto
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

        res.status(200).json({
            mensaje: "Carga masiva exitosa",
            cantidad: inserciones
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};


// =====================================================
// OBTENER PRODUCTOS (búsqueda opcional ?q=)
// =====================================================
const getProductos = async (req, res) => {
    try {

        const { q } = req.query;

        let query = `
            SELECT p.*, c.nombre AS categoria
            FROM productos p
            JOIN categoria c ON p.id_categoria = c.id
        `;

        let params = [];

        if (q && q.trim() !== "") {
            query += " WHERE p.nombre ILIKE $1";
            params.push(`%${q}%`);
        }

        const { rows } = await pool.query(query, params);

        res.json(rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al leer BD" });
    }
};


// =====================================================
// OBTENER CATEGORÍAS (?k=)
// =====================================================
const getCategoria = async (req, res) => {
    try {

        const { k } = req.query;

        if (!k || k.trim() === "") {
            return res.status(400).json({
                error: "Debes enviar un parámetro de búsqueda: ?k=palabra"
            });
        }

        const sql = `
            SELECT * FROM categoria
            WHERE nombre ILIKE $1
        `;

        const result = await pool.query(sql, [`%${k}%`]);

        res.json(result.rows);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al leer BD" });
    }
};


const crearProducto = async (request, response) => {
  const { nombre, precio, stock, descripcion, image_url, id_categoria } = request.body;

  try {

    if (!nombre || !precio || !stock || !id_categoria) {
      return response.status(400).json({
        error: "Faltan campos obligatorios"
      });
    }

    const categoriaExiste = await pool.query(
      "SELECT id FROM categoria WHERE id = $1",
      [id_categoria]
    );

    if (categoriaExiste.rows.length === 0) {
      return response.status(400).json({
        error: "La categoría no existe"
      });
    }

    const result = await pool.query(
      `INSERT INTO productos 
       (nombre, precio, stock, descripcion, image_url, id_categoria) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id`,
      [nombre, precio, stock, descripcion, image_url, id_categoria]
    );

    response.status(201).json({
      message: "Producto creado correctamente",
      id: result.rows[0].id
    });

  } catch (error) {
     response.status(500).json({ error: error.message });
  }
};


module.exports = {
    poblarProductos,
    getProductos,
    getCategoria,
    crearProducto
};