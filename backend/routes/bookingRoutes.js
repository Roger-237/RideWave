const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyToken } = require('../middleware/verifyToken');
const fs = require('fs');

// Multer Config for multiple files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Detect Vercel environment explicitly
        const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
        const uploadDir = isVercel ? '/tmp/uploads/documents/' : 'uploads/documents/';

        try {
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
        } catch (error) {
            console.error("Erreur création dossier:", error);
        }

        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage: storage });

// Role check helper
const verifyAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ SUCCESS: false, message: 'Accès administrateur requis' });
    }
};

// Routes
router.post('/', verifyToken, upload.fields([
    { name: 'driverLicense', maxCount: 1 },
    { name: 'idCard', maxCount: 1 }
]), bookingController.createBooking);

router.get('/my-bookings', verifyToken, bookingController.getUserBookings);
router.delete('/:id', verifyToken, bookingController.deleteBooking);

// Admin Routes
router.get('/admin', verifyToken, verifyAdmin, bookingController.getAllBookings);
router.get('/stats', verifyToken, verifyAdmin, bookingController.getAdminStats);
router.put('/:id/status', verifyToken, verifyAdmin, bookingController.updateBookingStatus);


module.exports = router;
