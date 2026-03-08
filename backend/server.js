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
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        // Accept localhost, vercel domains, and the explicit CLIENT_URL
        if (origin.startsWith('http://localhost:') || origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }

        if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) {
            return callback(null, true);
        }

        // If we reach here, log it but still allow it to prevent 500 crashes
        console.warn(`CORS Warning: Unrecognized origin ${origin}`);
        callback(null, true); // Permissive during debugging
    },
    credentials: true
}));

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

// Basic health check or API identification for the root route
app.get('/', (req, res) => {
    res.json({ message: "RideWave API is running", status: "online" });
});

// Database connection & Server start
const startServer = async () => {
    try {
        await connectDB();
        if (process.env.NODE_ENV !== 'production') {
            app.listen(PORT, () => {
                console.log(`RideWave server running at http://localhost:${PORT}`);
            });
        }
    } catch (error) {
        console.error('Sever startup error:', error);
    }
};

startServer();

module.exports = app;
