const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['Sedan', 'SUV', 'Sports']
    },
    name: {
        type: String,
        required: true
    },
    transmission: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['disponible', 'en service'],
        default: 'disponible'
    }

}, { timestamps: true });

module.exports = mongoose.model('Car', carSchema);
