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
      subject: emailType === "VERIFY" 
          ? "Verify your email" 
          : emailType === "RESET" 
              ? "Reset your password"
              : emailType === "DELETE"
                  ? "Account Deactivation Confirmation"
                  : "Account Restored Successfully",
      html: emailType === "DELETE" 
          ? `<p>
            Your account has been deactivated. It will be automatically deleted after 30 days.
            <br><br>
            If you want to restore your account, click the link below:
            <br>
            <a href="${process.env.DOMAIN}/api/v1/users/restore-account/${token}">Restore My Account</a>
            <br><br>
            This link will be valid for 30 days. After that, your account and all associated data will be permanently deleted.
            <br><br>
            If you did not request this action, please contact our support team immediately.
          </p>`
          : emailType === "RESTORE"
              ? `<p>
                  Your account has been successfully restored. You can now login with your previous credentials.
                  <br><br>
                  If you did not request this action, please contact our support team immediately.
                </p>`
              : `<p>
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
