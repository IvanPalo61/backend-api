const pool = require('../config/db');

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
        res.status(500).json({ message: error.message });
    }
};


// =====================================================
// OBTENER PRODUCTOS
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
        res.status(500).json({ message: "Error al leer BD" });
    }
};


// =====================================================
// OBTENER CATEGORÍAS
// =====================================================
const getCategoria = async (req, res) => {
    try {

        const { k } = req.query;

        if (!k || k.trim() === "") {
            return res.status(400).json({
                message: "Debes enviar un parámetro de búsqueda: ?k=palabra"
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
        res.status(500).json({ message: "Error al leer BD" });
    }
};


// =====================================================
// CREAR PRODUCTO (ARREGLADO)
// =====================================================
const crearProducto = async (req, res) => {
    const { nombre, precio, categoria, descripcion, imagen_url, youtube_url } = req.body;

    try {

        // Validación básica
        if (!nombre || !precio || !categoria) {
            return res.status(400).json({
                message: "Nombre, precio y categoría son obligatorios"
            });
        }

        // Buscar o crear categoría
        let categoriaResult = await pool.query(
            "SELECT id FROM categoria WHERE nombre ILIKE $1",
            [categoria.trim()]
        );

        let idCategoria;

        if (categoriaResult.rows.length === 0) {
            const nuevaCategoria = await pool.query(
                "INSERT INTO categoria (nombre) VALUES ($1) RETURNING id",
                [categoria.trim()]
            );

            idCategoria = nuevaCategoria.rows[0].id;

        } else {
            idCategoria = categoriaResult.rows[0].id;
        }

        // Insertar producto
        const result = await pool.query(
            `INSERT INTO productos 
            (nombre, precio, stock, descripcion, imagen_url, id_categoria, youtube_url) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING id`,
            [
                nombre.trim(),
                precio,
                0,
                descripcion || "",
                imagen_url || "",
                idCategoria,
                youtube_url || ""
            ]
        );

        res.status(201).json({
            message: "Producto creado correctamente",
            id: result.rows[0].id
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};


module.exports = {
    poblarProductos,
    getProductos,
    getCategoria,
    crearProducto
};