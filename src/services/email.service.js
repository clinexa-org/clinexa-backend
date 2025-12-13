import nodemailer from "nodemailer";

// دالة إرسال الإيميل
export const sendEmail = async ({ to, subject, html }) => {
  try {
    console.log("\n🔍 Creating email transporter with:");
    console.log("   Host:", process.env.SMTP_HOST);
    console.log("   Port:", process.env.SMTP_PORT);
    console.log("   User:", process.env.SMTP_USER);
    console.log("   Pass:", process.env.SMTP_PASS ? "✅ Present" : "❌ Missing");
    
    // إنشاء الـ transporter داخل الدالة (مش برا!)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    console.log("\n📤 Sending email to:", to);
    
    const info = await transporter.sendMail({
      from: `"Clinexa Clinic" <${process.env.SMTP_FROM}>`,
      to,
      subject,
      html
    });
    
    console.log("✅ Email sent successfully:", info.messageId);
    return info;
  } catch (err) {
    console.error("❌ Email error:", err.message);
    throw err;
  }
};