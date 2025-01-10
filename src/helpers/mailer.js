import { User } from "../Models/user.models.js";
import nodemailer from "nodemailer";

export const sendEmail = async ({
  email,
  emailType,
  userId,
  message,
  token,
  restorationDeadline,
}) => {
  try {
    let user;
    if (userId) {
      user = await User.findById(userId);
      if (!user && emailType === "VERIFY") {
        throw new Error("User not found");
      }

      if (emailType === "VERIFY") {
        user.verifyToken = token;
        user.verifyTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
        await user.save();
      }
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
        emailType === "VERIFY"
          ? "Verify your email"
          : emailType === "RESET"
            ? "Reset your password"
            : emailType === "ACCOUNT_DELETED"
              ? "Account Deactivation Confirmation"
              : emailType === "RESTORATION_REQUEST"
                ? "Account Restoration Instructions"
                : "Account Restored Successfully",
      html:
        emailType === "ACCOUNT_DELETED"
          ? `<p>
              Your account has been deactivated as requested.
              <br><br>
              If you wish to restore your account within the next 30 days, you can do so by visiting:
              <br>
              ${process.env.DOMAIN}/restore-account
              <br><br>
              After 30 days, your account and all associated data will be permanently deleted.
              <br><br>
              If you did not request this action, please contact our support team immediately.
            </p>`
          : emailType === "RESTORATION_REQUEST"
            ? `<p>
                Here's your account restoration link:
                <br><br>
                <a href="${process.env.DOMAIN}/api/v1/users/restore-account/${token}">Restore My Account</a>
                <br><br>
                This link will be valid only until ${new Date(restorationDeadline).toLocaleString()}.
                After that, your account and all associated data will be permanently deleted.
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
