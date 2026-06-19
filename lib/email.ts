import * as nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.qq.com",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.aipainting.top"}/auth/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"AI Painting" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Reset your password — AI Painting",
    html: `<div style="font-family:Arial;max-width:480px;margin:0 auto;padding:20px">
      <h2>Reset Your Password</h2>
      <p>Click the button below to set a new password. This link expires in 1 hour.</p>
      <a href="${resetUrl}" style="display:inline-block;background:#8b5cf6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">Reset Password</a>
      <p style="color:#888;margin-top:20px;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
    </div>`,
  });
}
