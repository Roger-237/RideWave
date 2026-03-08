const jwt = require('jsonwebtoken');
const { User } = require('../models/User');

const verifyToken = async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ SUCCESS: false, message: 'Non autorisé' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) return res.status(401).json({ SUCCESS: false, message: 'Token invalide' });

        const user = await User.findById(decoded.userId).select('-password');
        if (!user) return res.status(401).json({ SUCCESS: false, message: 'Utilisateur non trouvé' });

        req.user = user;
        next();
    } catch (error) {
        console.error("Erreur verifyToken:", error);
        return res.status(500).json({ SUCCESS: false, message: 'Erreur serveur' });
    }
};

module.exports = { verifyToken };
