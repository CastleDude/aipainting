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

const ADMIN_EMAIL = "490247862@qq.com";

export async function sendAdminAlert(subject: string, body: string) {
  try {
    await transporter.sendMail({
      from: `"AI Painting Admin" <${process.env.SMTP_USER}>`,
      to: ADMIN_EMAIL,
      subject: `[Admin] ${subject}`,
      html: `<div style="font-family:Arial;max-width:480px;margin:0 auto;padding:20px;background:#1a1a2e;color:#e0e0e0">
        <h2 style="color:#8b5cf6">${subject}</h2>
        <div style="background:#16213e;padding:16px;border-radius:8px;font-size:14px;line-height:1.6">${body}</div>
        <p style="color:#666;margin-top:16px;font-size:12px">AI Painting System Notification — ${new Date().toISOString()}</p>
      </div>`,
    });
  } catch { /* non-critical */ }
}

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
      <p style="color:#888;margin-top:20px;font-size:13px">Or copy the token below and paste it on the reset page:</p>
      <p style="background:#f3f4f6;padding:12px;border-radius:8px;font-family:monospace;font-size:12px;word-break:break-all;color:#374151;user-select:all;-webkit-user-select:all;-moz-user-select:all" title="Click to select, then Ctrl+C to copy">${token}</p>
      <p style="color:#888;margin-top:20px;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
    </div>`,
  });
}
