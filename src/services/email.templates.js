// Template للإيميل اللي بيروح للدكتور لما مريض يحجز موعد
export const appointmentCreatedTemplate = ({ patientName, date }) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h2 style="color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px;">
        🔔 New Appointment Booked
      </h2>
      <p style="font-size: 16px; color: #555; line-height: 1.6;">
        A new appointment has been booked by patient <strong style="color: #2c3e50;">${patientName}</strong>.
      </p>
      <div style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0; color: #7f8c8d;">📅 <strong>Date:</strong></p>
        <p style="margin: 5px 0 0 0; font-size: 18px; color: #2c3e50;"><strong>${date}</strong></p>
      </div>
      <p style="font-size: 14px; color: #7f8c8d; margin-top: 30px;">
        Please log in to your dashboard to confirm or manage this appointment.
      </p>
    </div>
  </div>
`;

// Template للإيميل اللي بيروح للمريض لما الدكتور يأكد الموعد
export const appointmentConfirmedTemplate = ({ doctorName, date }) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h2 style="color: #27ae60; border-bottom: 3px solid #27ae60; padding-bottom: 10px;">
        ✅ Appointment Confirmed
      </h2>
      <p style="font-size: 16px; color: #555; line-height: 1.6;">
        Great news! Your appointment with <strong style="color: #2c3e50;">Dr. ${doctorName}</strong> has been confirmed.
      </p>
      <div style="background-color: #d5f4e6; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #27ae60;">
        <p style="margin: 0; color: #27ae60;">📅 <strong>Appointment Date:</strong></p>
        <p style="margin: 5px 0 0 0; font-size: 18px; color: #2c3e50;"><strong>${date}</strong></p>
      </div>
      <p style="font-size: 14px; color: #7f8c8d; margin-top: 30px;">
        Please arrive 10 minutes early. If you need to reschedule or cancel, please contact us as soon as possible.
      </p>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
        <p style="font-size: 12px; color: #95a5a6; margin: 0;">
          This is an automated message from Clinexa Clinic System.
        </p>
      </div>
    </div>
  </div>
`;

// Template للإيميل اللي بيروح للمريض لما يتلغى الموعد
export const appointmentCancelledTemplate = ({ date }) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h2 style="color: #e74c3c; border-bottom: 3px solid #e74c3c; padding-bottom: 10px;">
        ❌ Appointment Cancelled
      </h2>
      <p style="font-size: 16px; color: #555; line-height: 1.6;">
        Your appointment has been cancelled.
      </p>
      <div style="background-color: #fadbd8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #e74c3c;">
        <p style="margin: 0; color: #c0392b;">📅 <strong>Cancelled Appointment Date:</strong></p>
        <p style="margin: 5px 0 0 0; font-size: 18px; color: #2c3e50;"><strong>${date}</strong></p>
      </div>
      <p style="font-size: 14px; color: #7f8c8d; margin-top: 30px;">
        If you would like to book a new appointment, please contact us or use our online booking system.
      </p>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
        <p style="font-size: 12px; color: #95a5a6; margin: 0;">
          This is an automated message from Clinexa Clinic System.
        </p>
      </div>
    </div>
  </div>
`;

// Template للإيميل اللي بيروح للمريض لما يطلب reset password
export const passwordResetOtpTemplate = ({ otp, expiresInMinutes }) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h2 style="color: #3498db; border-bottom: 3px solid #3498db; padding-bottom: 10px;">
        🔐 Password Reset Request
      </h2>
      <p style="font-size: 16px; color: #555; line-height: 1.6;">
        You have requested to reset your password. Use the following OTP code:
      </p>
      <div style="background-color: #ebf5fb; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center; border-left: 4px solid #3498db;">
        <p style="margin: 0; font-size: 32px; letter-spacing: 8px; color: #2c3e50; font-weight: bold;">${otp}</p>
      </div>
      <p style="font-size: 14px; color: #e74c3c; margin-top: 20px;">
        ⚠️ This code will expire in <strong>${expiresInMinutes} minutes</strong>.
      </p>
      <p style="font-size: 14px; color: #7f8c8d; margin-top: 30px;">
        If you did not request this password reset, please ignore this email or contact support.
      </p>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
        <p style="font-size: 12px; color: #95a5a6; margin: 0;">
          This is an automated message from Clinexa Clinic System.
        </p>
      </div>
    </div>
  </div>
`;