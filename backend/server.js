const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { connectDB } = require('./db/connectDb');
const authRoutes = require('./routes/authRoutes');
const carRoutes = require('./routes/carRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5500',
    credentials: true
}));

// Ensure MongoDB is connected before every request (critical for Vercel serverless)
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error('DB connection failed:', error);
        res.status(500).json({ success: false, message: 'Database connection failed' });
    }
});

// Serve static files from the Frontend folder
app.use(express.static(path.join(__dirname, '..', 'Frontend')));
// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Auth Routes
app.use('/api/auth', authRoutes);

// Car Routes
app.use('/api/cars', carRoutes);

// Booking Routes
app.use('/api/bookings', bookingRoutes);

// Basic health check
app.get('/', (req, res) => {
    res.json({ message: "RideWave API is running", status: "online" });
});

// Local development only
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`RideWave server running at http://localhost:${PORT}`);
    });
}

module.exports = app;
