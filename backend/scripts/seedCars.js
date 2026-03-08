const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Car = require('../models/Car');
const { connectDB } = require('../db/connectDb');

dotenv.config();

const cars = [
    {
        type: 'Sedan',
        name: 'Rolls-Royce',
        transmission: 'Automatic',
        price: 12000000,
        image: 'images/rental-1.png'
    },
    {
        type: 'Sedan',
        name: 'Macan 4',
        transmission: 'Automatic',
        price: 12000000,
        image: 'images/rental-2.png'
    },
    {
        type: 'Sedan',
        name: 'cayenne S E-hybrid',
        transmission: 'Automatic/Manu',
        price: 12000000,
        image: 'images/rental-3.png'
    },
    {
        type: 'Sedan',
        name: 'Nisan GT-R',
        transmission: 'Automatic',
        price: 12000000,
        image: 'images/rental-4.png'
    },
    {
        type: 'Sedan',
        name: 'Panamera Turbo',
        transmission: 'Automatic',
        price: 12000000,
        image: 'images/rental-5.png'
    },
    {
        type: 'Sedan',
        name: 'Nissan Ariya',
        transmission: 'Automatic',
        price: 12000000,
        image: 'images/rental-6.png'
    }
];

const seedDB = async () => {
    try {
        await connectDB();
        await Car.deleteMany(); // Clear existing cars
        await Car.insertMany(cars);
        console.log('Database Seeded with Cars!');
        process.exit();
    } catch (err) {
        console.error('CRITICAL ERROR DURING SEEDING:');
        console.error(err);
        process.exit(1);
    }
};

seedDB();
