const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    password: { type: String, required: true },
    lastlogin: { type: Date, default: Date.now },
    isverified: { type: Boolean, default: false },
    resetPasswordToken: { type: String },
    resetPasswordTokenExpireAt: { type: Date },
    verificationToken: { type: String },
    verificationTokenExpiresAt: { type: Date }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

module.exports = { User };
