import dotenv from "dotenv";
dotenv.config();

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🔍 فحص ملف .env");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

console.log("📋 المتغيرات المقروءة:\n");

console.log("SMTP_HOST:", process.env.SMTP_HOST);
console.log("SMTP_PORT:", process.env.SMTP_PORT);
console.log("SMTP_USER:", process.env.SMTP_USER);
console.log("SMTP_PASS:", process.env.SMTP_PASS ? `موجود (${process.env.SMTP_PASS.length} حرف)` : "❌ مش موجود");
console.log("SMTP_FROM:", process.env.SMTP_FROM);

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

if (process.env.SMTP_HOST === "smtp.gmail.com") {
  console.log("✅ SMTP_HOST صحيح");
} else {
  console.log("❌ SMTP_HOST غلط!");
  console.log("   المتوقع: smtp.gmail.com");
  console.log("   الموجود:", process.env.SMTP_HOST);
}

if (process.env.SMTP_PORT === "587") {
  console.log("✅ SMTP_PORT صحيح");
} else {
  console.log("❌ SMTP_PORT غلط!");
  console.log("   المتوقع: 587");
  console.log("   الموجود:", process.env.SMTP_PORT);
}

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");