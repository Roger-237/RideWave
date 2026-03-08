const jwt = require('jsonwebtoken');

const generateTokenAndSetCookie = (res, userId) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1d' });

    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('token', token, {
        httpOnly: true,
        secure: true, // Cookies must be secure for sameSite: 'none'
        sameSite: 'none', // Allow cross-domain cookies
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
    return token;
};

module.exports = { generateTokenAndSetCookie };
