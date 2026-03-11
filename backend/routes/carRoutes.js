const express = require('express');
const router = express.Router();
const carController = require('../controllers/carController');
const { verifyToken } = require('../middleware/verifyToken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { put } = require('@vercel/blob');

// Use memory storage for Vercel Blob
const storage = multer.memoryStorage();
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
router.post('/upload', verifyToken, verifyAdmin, upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ SUCCESS: false, message: 'No file uploaded' });
    }

    try {
        const filename = `${Date.now()}${path.extname(req.file.originalname)}`;
        
        // Upload to Vercel Blob
        const blob = await put(`cars/${filename}`, req.file.buffer, {
            access: 'public',
            contentType: req.file.mimetype,
        });

        res.status(200).json({ SUCCESS: true, imageUrl: blob.url });
    } catch (error) {
        console.error('Error uploading to Vercel Blob:', error);
        res.status(500).json({ SUCCESS: false, message: 'Failed to upload image' });
    }
});

module.exports = router;
