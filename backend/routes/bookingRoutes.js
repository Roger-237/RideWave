const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyToken } = require('../middleware/verifyToken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Use memory storage for Vercel Blob
const storage = multer.memoryStorage();
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
