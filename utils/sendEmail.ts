import nodemailer from 'nodemailer';

export const sendEmail = async (to: string, subject: string, html: string) => {
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp-relay.brevo.com",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.BREVO_USER, // Your Brevo login email
                pass: process.env.BREVO_PASS, // Your Brevo SMTP Key (Master Password)
            },
        });

        const mailOptions = {
            from: '"AfriqGig Support" <support@afriqgig.com>', // Use a verified sender in Brevo
            to: to,
            subject: subject,
            html: html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Message sent: %s", info.messageId);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
};