import { Admin } from "../models/admin.models.js";
import nodemailer from "nodemailer";
import bcryptjs from "bcryptjs";

export const sendEmail = async ({ email, emailType, adminId, message }) => {
  try {
    let hashedToken = null;

    if (adminId) {
      hashedToken = await bcryptjs.hash(adminId.toString(), 10);
      if (emailType === "VERIFY") {
        await Admin.findByIdAndUpdate(adminId, {
          verifyToken: hashedToken,
          verifyTokenExpiry: Date.now() + 3600000,
        });
      } else if (emailType === "RESET") {
        await Admin.findByIdAndUpdate(adminId, {
          forgotPasswordToken: hashedToken,
          forgotPasswordTokenExpiry: Date.now() + 3600000,
        });
      }
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
      subject: emailType
        ? emailType === "VERIFY"
          ? "Verify your email"
          : "Reset your password"
        : "Default Super Admin Created",
      html: message
        ? message
        : `<p>Click <a href="${process.env.DOMAIN}/verifyemail?token=${hashedToken}">here</a> to ${
            emailType === "VERIFY" ? "verify your email" : "reset your password"
          } or copy and paste the link below in your browser. <br>${process.env.DOMAIN}/verifyemail?token=${hashedToken}</p>`,
    };

    const mailResponse = await transport.sendMail(mailOptions);
    return mailResponse;
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw new Error(error.message);
  }
};
