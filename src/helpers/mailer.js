import { User } from "../Models/user.models.js";
import nodemailer from "nodemailer";

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
        throw new Error("User not found");
      }

      user.verifyToken = token;
      user.verifyTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
      await user.save();
    }

    const transport = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      secure: false,
      auth: {
        user: "d435d26f63d03b",
        pass: "64eea3d9831444",
      },
    });

    const mailOptions = {
      from: "shiv@gmail.com",
      to: email,
      subject:
        emailType === "VERIFY" ? "Verify your email" : "Reset your password",
      html: `<p>
        <a href="${process.env.DOMAIN}/api/v1/users/${
          emailType === "VERIFY" ? "verify-email" : "reset-password"
        }?token=${token}">Click here</a> 
        to ${emailType === "VERIFY" ? "verify your email" : "reset your password"} 
        or copy and paste the link below in your browser.
        <br>
        ${process.env.DOMAIN}/api/v1/users/${
          emailType === "VERIFY" ? "verify-email" : "reset-password"
        }?token=${token}
      </p>`,
    };

    const mailResponse = await transport.sendMail(mailOptions);
    return mailResponse;
  } catch (error) {
    throw new Error(error.message);
  }
};
