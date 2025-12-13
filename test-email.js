import dotenv from "dotenv";
dotenv.config();

import { sendEmail } from "./src/services/email.service.js";

const testEmail = async () => {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📧 اختبار نظام الإيميلات - Clinexa");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  
  console.log("🔄 جاري الإرسال إلى: faressamyin@gmail.com...\n");
  
  try {
    await sendEmail({
      to: "faressamyin@gmail.com",
      subject: "✅ نظام Clinexa جاهز للعمل!",
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🏥 Clinexa</h1>
            <p style="color: #f0f0f0; margin: 10px 0 0 0;">نظام إدارة المواعيد الطبية</p>
          </div>
          
          <!-- Body -->
          <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e0e0e0; border-top: none;">
            
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-block; background: #4CAF50; color: white; padding: 15px 30px; border-radius: 50px; font-size: 18px; font-weight: bold;">
                ✅ نجح الاختبار!
              </div>
            </div>
            
            <h2 style="color: #333; margin-bottom: 20px;">مبروك يا فارس! 🎉</h2>
            
            <p style="color: #555; line-height: 1.8; font-size: 16px;">
              إعداد نظام الإيميلات تم بنجاح! دلوقتي النظام بتاعك جاهز لإرسال إيميلات تلقائياً.
            </p>
            
            <!-- Info Box -->
            <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 30px 0; border-radius: 5px;">
              <h3 style="color: #667eea; margin-top: 0;">📋 معلومات الإعداد:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>SMTP Server:</strong></td>
                  <td style="padding: 8px 0; color: #333;">${process.env.SMTP_HOST}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Port:</strong></td>
                  <td style="padding: 8px 0; color: #333;">${process.env.SMTP_PORT}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>From:</strong></td>
                  <td style="padding: 8px 0; color: #333;">${process.env.SMTP_FROM}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666;"><strong>Status:</strong></td>
                  <td style="padding: 8px 0; color: #4CAF50;"><strong>✅ Active</strong></td>
                </tr>
              </table>
            </div>
            
            <!-- Features List -->
            <div style="margin: 30px 0;">
              <h3 style="color: #333; margin-bottom: 15px;">🚀 الإيميلات هتتبعت تلقائياً عند:</h3>
              <div style="background: #fff; padding: 15px; border-radius: 8px;">
                <div style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="color: #4CAF50; font-size: 20px;">✓</span>
                  <span style="color: #555; margin-left: 10px;">حجز موعد جديد (إيميل للدكتور)</span>
                </div>
                <div style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                  <span style="color: #4CAF50; font-size: 20px;">✓</span>
                  <span style="color: #555; margin-left: 10px;">تأكيد موعد (إيميل للمريض)</span>
                </div>
                <div style="padding: 10px 0;">
                  <span style="color: #4CAF50; font-size: 20px;">✓</span>
                  <span style="color: #555; margin-left: 10px;">إلغاء موعد (إيميل للمريض)</span>
                </div>
              </div>
            </div>
            
            <!-- Success Message -->
            <div style="background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%); padding: 20px; border-radius: 10px; text-align: center; margin-top: 30px;">
              <p style="color: #333; font-size: 18px; margin: 0; font-weight: bold;">
                🎊 النظام جاهز تماماً للاستخدام!
              </p>
            </div>
            
          </div>
          
          <!-- Footer -->
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              This email was sent from <strong>Clinexa Appointment System</strong>
            </p>
            <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">
              Developed with ❤️ by Fares
            </p>
          </div>
          
        </div>
      `
    });
    
    console.log("✅ تم إرسال الإيميل بنجاح!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log("📬 افتح إيميلك: faressamyin@gmail.com");
    console.log("🔍 لو مش لاقي الإيميل، شوف Spam/Junk\n");
    console.log("🎉 مبروك! النظام شغال 100%");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    
  } catch (error) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("❌ حصل خطأ في إرسال الإيميل!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.error("📋 تفاصيل الخطأ:", error.message);
    console.log("\n🔧 الحلول المحتملة:");
    console.log("─────────────────────────────────────");
    console.log("1️⃣  تأكد إن ملف .env موجود في root folder");
    console.log("2️⃣  تأكد إن App Password صحيح (16 حرف)");
    console.log("3️⃣  تأكد إن 2-Step Verification مفعّل في Gmail");
    console.log("4️⃣  جرب تعمل App Password جديد");
    console.log("5️⃣  تأكد من اتصال الإنترنت\n");
    console.log("🔗 لينك App Passwords:");
    console.log("   https://myaccount.google.com/apppasswords\n");
  }
};

testEmail();