const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return res.status(401).json({ msg: "Acceso denegado. No hay token" });
    }

    try {
        // Limpiamos "Bearer " con espacio incluido
        const token = authHeader.replace(/^Bearer\s+/i, '');
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch (err) {
        res.status(401).json({ msg: "Token no válido o expiró" });
    }
};