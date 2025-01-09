import { User } from "../Models/user.models";
import nodemailer from "nodemailer";
import bcryptjs from "bcryptjs";

export const sendEmail = async ({ email, emailType, userId, message }) => {
  try {
    let hashedToken = null;

    if (userId) {
      hashedToken = await bcryptjs.hash(userId.toString(), 10);
      if (emailType === "VERIFY") {
        await User.findByIdAndUpdate(userId, {
          verifyToken: hashedToken,
          verifyTokenExpiry: Date.now() + 3600000,
        });
      } else if (emailType === "RESET") {
        await User.findByIdAndUpdate(userId, {
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
        : "Default Super User Created",
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
