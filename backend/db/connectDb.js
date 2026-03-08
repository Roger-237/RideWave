const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MONGODB CONNECTED SUCCESSFULLY!');
    } catch (error) {
        console.error('Error connecting to MONGODB', error);
        // Do not use process.exit(1) on Vercel
        throw error;
    }
};

module.exports = { connectDB };
