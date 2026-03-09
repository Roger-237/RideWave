const mongoose = require('mongoose');
require('dotenv').config();

// Cache the connection across serverless function invocations
let cached = global.mongooseCache;

if (!cached) {
    cached = global.mongooseCache = { conn: null, promise: null };
}

const connectDB = async () => {
    // Return existing connection if already established
    if (cached.conn) {
        return cached.conn;
    }

    // Create a new connection promise if one doesn't exist
    if (!cached.promise) {
        const opts = {
            bufferCommands: false, // Fail immediately instead of buffering on Vercel
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        };

        cached.promise = mongoose
            .connect(process.env.MONGO_URI, opts)
            .then((mongooseInstance) => {
                console.log('MONGODB CONNECTED SUCCESSFULLY!');
                return mongooseInstance;
            });
    }

    try {
        cached.conn = await cached.promise;
    } catch (error) {
        // Reset promise so next invocation retries
        cached.promise = null;
        console.error('Error connecting to MONGODB:', error);
        throw error;
    }

    return cached.conn;
};

module.exports = { connectDB };
