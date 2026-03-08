const Car = require('../models/Car');

exports.getCars = async (req, res) => {
    try {
        const cars = await Car.find();
        res.status(200).json({ SUCCESS: true, data: cars });
    } catch (err) {
        res.status(500).json({ SUCCESS: false, message: 'Server error' });
    }
};

exports.addCar = async (req, res) => {
    try {
        const { type, name, transmission, price, image } = req.body;
        const newCar = new Car({ type, name, transmission, price, image });
        await newCar.save();
        res.status(201).json({ SUCCESS: true, data: newCar });
    } catch (err) {
        res.status(400).json({ SUCCESS: false, message: 'Invalid data' });
    }
};

exports.deleteCar = async (req, res) => {
    try {
        await Car.findByIdAndDelete(req.params.id);
        res.status(200).json({ SUCCESS: true, message: 'Car deleted' });
    } catch (err) {
        res.status(500).json({ SUCCESS: false, message: 'Server error' });
    }
};

exports.updateCar = async (req, res) => {
    try {
        const updatedCar = await Car.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ SUCCESS: true, data: updatedCar });
    } catch (err) {
        res.status(500).json({ SUCCESS: false, message: 'Server error' });
    }
};

exports.updateCarStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const car = await Car.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.status(200).json({ SUCCESS: true, data: car });
    } catch (err) {
        res.status(500).json({ SUCCESS: false, message: 'Server error' });
    }
};

