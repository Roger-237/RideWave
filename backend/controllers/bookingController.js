const Booking = require('../models/Booking');
const Car = require('../models/Car');
const { put } = require('@vercel/blob');
const path = require('path');


exports.createBooking = async (req, res) => {
    try {
        const { carId, phone, pickupLocation, startDate, endDate, totalPrice } = req.body;

        if (!req.files || !req.files['driverLicense'] || !req.files['idCard']) {
            return res.status(400).json({ SUCCESS: false, message: 'Veuillez télécharger tous les documents requis' });
        }
        
        // Upload Driver License to Blob
        const licenseFile = req.files['driverLicense'][0];
        const licenseExt = path.extname(licenseFile.originalname);
        const licenseBlob = await put(`documents/${req.user._id}-license-${Date.now()}${licenseExt}`, licenseFile.buffer, {
            access: 'public',
            contentType: licenseFile.mimetype,
        });

        // Upload ID Card to Blob
        const idCardFile = req.files['idCard'][0];
        const idCardExt = path.extname(idCardFile.originalname);
        const idCardBlob = await put(`documents/${req.user._id}-id-${Date.now()}${idCardExt}`, idCardFile.buffer, {
            access: 'public',
            contentType: idCardFile.mimetype,
        });

        const booking = new Booking({
            user: req.user._id,
            car: carId,
            phone,
            pickupLocation,
            startDate,
            endDate,
            totalPrice,
            driverLicense: licenseBlob.url,
            idCard: idCardBlob.url
        });

        await booking.save();
        res.status(201).json({ SUCCESS: true, message: 'Réservation effectuée avec succès' });
    } catch (err) {
        console.error('Erreur réservation:', err);
        res.status(500).json({ SUCCESS: false, message: 'Erreur serveur lors de la réservation' });
    }
};

exports.getUserBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .populate('car')
            .sort({ createdAt: -1 });
        res.status(200).json({ SUCCESS: true, data: bookings });
    } catch (err) {
        res.status(500).json({ SUCCESS: false, message: 'Erreur serveur' });
    }
};

exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('user', 'name email')
            .populate('car')
            .sort({ createdAt: -1 });
        res.status(200).json({ SUCCESS: true, data: bookings });
    } catch (err) {
        res.status(500).json({ SUCCESS: false, message: 'Erreur serveur' });
    }
};

exports.updateBookingStatus = async (req, res) => {
    try {
        const { status, cancelReason } = req.body;
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status, cancelReason },
            { new: true }
        );

        if (booking) {
            if (status === 'confirmé') {
                await Car.findByIdAndUpdate(booking.car, { status: 'en service' });
            } else if (status === 'terminé') {
                await Car.findByIdAndUpdate(booking.car, { status: 'disponible' });
            }
        }

        res.status(200).json({ SUCCESS: true, data: booking });


    } catch (err) {
        res.status(500).json({ SUCCESS: false, message: 'Erreur serveur' });
    }
};

exports.getAdminStats = async (req, res) => {
    try {
        const cars = await Car.find();
        const totalCars = cars.length;
        const carsInService = cars.filter(c => c.status === 'en service').length;

        const bookings = await Booking.find();

        const totalBookings = bookings.length;
        const pendingBookings = bookings.filter(b => b.status === 'en attente').length;
        const totalRevenue = bookings
            .filter(b => b.status === 'confirmé')
            .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

        res.status(200).json({
            SUCCESS: true,
            data: {
                totalCars,
                totalBookings,
                pendingBookings,
                totalRevenue,
                carsInService
            }
        });

    } catch (err) {
        console.error('Erreur stats:', err);
        res.status(500).json({ SUCCESS: false, message: 'Erreur serveur lors de la récupération des stats' });
    }
};


exports.deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ SUCCESS: false, message: 'Réservation non trouvée' });
        }

        // Check ownership
        if (booking.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ SUCCESS: false, message: 'Action non autorisée' });
        }

        // Only allow deletion if:
        // 1. User is the owner
        // 2. Booking is NOT 'en service' (confirmé)
        if (booking.status === 'confirmé') {
            return res.status(400).json({ SUCCESS: false, message: 'Impossible de supprimer une réservation en cours' });
        }

        await Booking.findByIdAndDelete(req.params.id);
        res.status(200).json({ SUCCESS: true, message: 'Réservation supprimée' });

    } catch (err) {
        res.status(500).json({ SUCCESS: false, message: 'Erreur serveur' });
    }
};
