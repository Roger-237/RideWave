const express = require('express');
const router = express.Router();
const carController = require('../controllers/carController');
const { verifyToken } = require('../middleware/verifyToken');
const fs = require('fs');

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
        const uploadDir = isVercel ? '/tmp/uploads/cars/' : 'uploads/';

        try {
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
        } catch (error) {
            console.error("Erreur création dossier car:", error);
        }

        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Middleware to check if user is admin
const verifyAdmin = (req, res, next) => {
    // verifyToken middleware must run before this to set req.user
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ SUCCESS: false, message: 'Access denied: Admin only' });
    }
};

router.get('/', carController.getCars);
router.post('/', verifyToken, verifyAdmin, carController.addCar);
router.put('/:id', verifyToken, verifyAdmin, carController.updateCar);
router.put('/:id/status', verifyToken, verifyAdmin, carController.updateCarStatus);
router.delete('/:id', verifyToken, verifyAdmin, carController.deleteCar);


// Upload endpoint
router.post('/upload', verifyToken, verifyAdmin, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ SUCCESS: false, message: 'No file uploaded' });
    }
    res.status(200).json({ SUCCESS: true, imageUrl: `uploads/${req.file.filename}` });
});

module.exports = router;
