const { transporter, sender } = require("./nodemailer");
const { VERIFICATION_EMAIL_TEMPLATE, PASSWORD_RESET_REQUEST_TEMPLATE, PASSWORD_RESET_SUCCESS_TEMPLATE } = require("./emailTemplates");

// Helper function to send email with retries
const sendEmailWithRetry = async (emailOptions, maxRetries = 3) => {
    const mailOptions = {
        from: `"${sender.name}" <${sender.email}>`,
        to: emailOptions.to,
        subject: emailOptions.subject,
        html: emailOptions.html,
    };

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const info = await transporter.sendMail(mailOptions);
            console.log(`Email sent successfully on attempt ${attempt}:`, info.messageId);
            return info;
        } catch (error) {
            console.error(`Attempt ${attempt} failed:`, error.message);

            if (attempt === maxRetries) {
                throw new Error(`Failed to send email after ${maxRetries} attempts: ${error.message}`);
            }

            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        }
    }
};

// Send verification email
const sendVerificationEmail = async (email, verificationToken) => {
    try {
        await sendEmailWithRetry({
            to: email,
            subject: "Vérifiez votre e-mail - RideWave",
            html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken),
        });
    } catch (error) {
        console.error(`Error sending verification email`, error);
        throw new Error(`Error sending verification email: ${error}`);
    }
};

// Send welcome email
const sendWelcomeEmail = async (email, name) => {
    try {
        await sendEmailWithRetry({
            to: email,
            subject: "Bienvenue sur RideWave !",
            html: `<p>Bonjour ${name},</p><p>Bienvenue chez RideWave ! Nous sommes ravis de vous compter parmi nous.</p>`,
        });
    } catch (error) {
        console.error(`Error sending welcome email`, error);
        throw new Error(`Error sending welcome email: ${error}`);
    }
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetURL) => {
    try {
        await sendEmailWithRetry({
            to: email,
            subject: "Réinitialisez votre mot de passe - RideWave",
            html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
        });
    } catch (error) {
        console.error(`Error sending password reset email`, error);
        throw new Error(`Error sending password reset email: ${error}`);
    }
};

// Send email when password reset is successful
const sendResetSuccessEmail = async (email) => {
    try {
        await sendEmailWithRetry({
            to: email,
            subject: "Mot de passe réinitialisé avec succès - RideWave",
            html: PASSWORD_RESET_SUCCESS_TEMPLATE,
        });
    } catch (error) {
        console.error(`Error sending password reset success email`, error);
        throw new Error(`Error sending password reset success email: ${error}`);
    }
};

// Send notification to admin for new booking
const sendNewBookingAdminNotification = async (adminEmail, bookingDetails) => {
    try {
        await sendEmailWithRetry({
            to: adminEmail,
            subject: "Nouvelle réservation en attente d'approbation - RideWave",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #D42B2B;">Nouvelle Réservation RideWave</h2>
                    <p>Une nouvelle réservation a été effectuée et attend votre approbation.</p>
                    <hr>
                    <p><strong>Client:</strong> ${bookingDetails.userName} (${bookingDetails.userEmail})</p>
                    <p><strong>Véhicule:</strong> ${bookingDetails.carName}</p>
                    <p><strong>Période:</strong> Du ${new Date(bookingDetails.startDate).toLocaleDateString('fr-FR')} au ${new Date(bookingDetails.endDate).toLocaleDateString('fr-FR')}</p>
                    <p><strong>Lieu:</strong> ${bookingDetails.pickupLocation}</p>
                    <p><strong>Total:</strong> ${bookingDetails.totalPrice.toLocaleString()} F CFA</p>
                    <hr>
                    <p><a href="${process.env.CLIENT_URL}/admin.html" style="background: #D42B2B; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Accéder au Panel Admin</a></p>
                </div>
            `,
        });
    } catch (error) {
        console.error(`Error sending admin notification email`, error);
    }
};

module.exports = {
    sendVerificationEmail,
    sendWelcomeEmail,
    sendPasswordResetEmail,
    sendResetSuccessEmail,
    sendNewBookingAdminNotification
};
