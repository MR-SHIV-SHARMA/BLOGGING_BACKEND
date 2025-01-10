import { User } from "../Models/user.models.js";
import nodemailer from "nodemailer";
import bcryptjs from "bcryptjs";

export const sendEmail = async ({
  email,
  emailType,
  userId,
  message,
  token,
}) => {
  try {
    if (userId && emailType === "VERIFY") {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error("उपयोगकर्ता नहीं मिला");
      }

      user.verifyToken = token;
      user.verifyTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
      await user.save();
    }

    const transport = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      secure: false, // Use false for Mailtrap sandbox
      auth: {
        user: "d435d26f63d03b", // Replace with your Mailtrap credentials
        pass: "64eea3d9831444", // Replace with your Mailtrap credentials
      },
      debug: true, // Enable debugging
    });
    transport.on("log", console.log); // Log detailed SMTP interactions

    const mailOptions = {
      from: "shiv@gmail.com",
      to: email,
      subject: emailType === "VERIFY" ? "ईमेल सत्यापित करें" : "पासवर्ड रीसेट करें",
      html: `<p>
        <a href="${process.env.DOMAIN}/api/v1/users/verify-email?token=${token}">यहाँ क्लिक करें</a> 
        ${emailType === "VERIFY" ? "ईमेल सत्यापित करने" : "पासवर्ड रीसेट करने"} के लिए या नीचे दिए गए लिंक को अपने ब्राउज़र में कॉपी-पेस्ट करें।
        <br>
        ${process.env.DOMAIN}/api/v1/users/verify-email?token=${token}
      </p>`,
    };

    const mailResponse = await transport.sendMail(mailOptions);
    return mailResponse;
  } catch (error) {
    throw new Error(error.message);
  }
};
