const express = require('express');
const router = express.Router();
const {
    Signup,
    Login,
    Logout,
    VerifyEmail,
    ForgotPassword,
    ResetPassword,
    CheckAuth
} = require('../controllers/authController');
const { verifyToken } = require("../middleware/verifyToken");

router.get('/check-auth', verifyToken, CheckAuth);
router.post('/signup', Signup);
router.post('/verify-email', VerifyEmail);
router.post('/login', Login);
router.post('/logout', Logout);
router.post('/forgot-password', ForgotPassword);
router.post('/reset-password/:token', ResetPassword);

module.exports = router;
