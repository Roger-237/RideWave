const { User } = require('../models/User');
const bcrypt = require('bcryptjs');
const { generateTokenAndSetCookie } = require('../utils/generateTokenAndSetCookie');
const {
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendResetSuccessEmail,
    sendWelcomeEmail,
} = require("../mailtrap/emails");
const crypto = require('crypto');

// =======================Signup function=======================================
const Signup = async (req, res) => {
    const { name, email, password, phone } = req.body;
    try {
        if (!name || !email || !password) {
            throw new Error('Veuillez remplir tous les champs obligatoires');
        }

        const userAlreadyExists = await User.findOne({ email });
        if (userAlreadyExists) {
            return res.status(400).json({ SUCCESS: false, message: 'L\'utilisateur existe déjà' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

        const user = new User({
            name,
            email,
            password: hashedPassword,
            phone,
            verificationToken,
            verificationTokenExpiresAt: Date.now() + 3600000 // 1 hour
        });

        await user.save();
        generateTokenAndSetCookie(res, user._id);

        await sendVerificationEmail(user.email, verificationToken);

        res.status(201).json({
            SUCCESS: true,
            message: 'Utilisateur créé avec succès',
            data: {
                user: {
                    ...user._doc,
                    password: undefined,
                },
            },
        })
    } catch (error) {
        res.status(500).json({ SUCCESS: false, message: error.message });
    }
};

//==========================verify email==========================================
const VerifyEmail = async (req, res) => {
    const { code } = req.body;
    try {
        const user = await User.findOne({
            verificationToken: code,
            verificationTokenExpiresAt: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ SUCCESS: false, message: 'Code de vérification invalide ou expiré' });
        }

        user.isverified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiresAt = undefined;
        await user.save();

        await sendWelcomeEmail(user.email, user.name);
        res.status(200).json({ SUCCESS: true, message: 'Email vérifié avec succès' });

    } catch (error) {
        console.error("Error verifying email:", error);
        res.status(500).json({ SUCCESS: false, message: error.message });
    }
};

// ============================Login function=====================================
const Login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ SUCCESS: false, message: 'Identifiants invalides' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ SUCCESS: false, message: 'Identifiants invalides' });
        }

        generateTokenAndSetCookie(res, user._id);

        user.lastlogin = new Date();
        await user.save();

        res.status(200).json({
            SUCCESS: true,
            message: 'Connexion réussie',
            data: {
                user: {
                    ...user._doc,
                    password: undefined,
                },
            },
        });

    } catch (error) {
        console.error("Error logging in user:", error);
        res.status(500).json({ SUCCESS: false, message: error.message });
    }
};

// ============================Logout function====================================
const Logout = async (req, res) => {
    res.clearCookie("token");
    res.status(200).json({ SUCCESS: true, message: "Déconnexion réussie" });
};

// ============================Forgot Password function=============================
const ForgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ SUCCESS: false, message: 'Utilisateur non trouvé' });
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        const resetPasswordTokenExpireAt = Date.now() + 3600000; // 1 hour
        user.resetPasswordToken = resetToken;
        user.resetPasswordTokenExpireAt = resetPasswordTokenExpireAt;
        await user.save();

        await sendPasswordResetEmail(user.email, `${process.env.CLIENT_URL}/reset-password.html?token=${resetToken}`);
        res.status(200).json({ SUCCESS: true, message: 'E-mail de réinitialisation envoyé' });

    } catch (error) {
        console.error("Error sending reset password email:", error);
        res.status(500).json({ SUCCESS: false, message: 'Échec de l\'envoi de l\'e-mail' });
    }
};

// ============================Reset Password function==============================
const ResetPassword = async (req, res) => {
    try {
        const { password } = req.body;
        const { token } = req.params;
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordTokenExpireAt: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ SUCCESS: false, message: 'Lien invalide ou expiré' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordTokenExpireAt = undefined;
        await user.save();

        await sendResetSuccessEmail(user.email);
        res.status(200).json({ SUCCESS: true, message: 'Mot de passe réinitialisé' });
    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ SUCCESS: false, message: error.message });
    }
};

// ============================Check Auth function==================================
const CheckAuth = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(404).json({ SUCCESS: false, message: 'Utilisateur non trouvé' });
        }

        res.status(200).json({
            SUCCESS: true,
            user: req.user
        });
    } catch (error) {
        return res.status(500).json({ SUCCESS: false, message: error.message });
    }
};

module.exports = {
    Signup,
    VerifyEmail,
    Login,
    Logout,
    ForgotPassword,
    ResetPassword,
    CheckAuth
};
