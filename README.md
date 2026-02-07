# Clinexa Backend (V1) — Node.js + Express + MongoDB

Clinexa is a **single-doctor clinic SaaS backend (V1)** built to support:
- **Patient Mobile App** (Flutter)
- **Doctor Web Dashboard** (Flutter Web/Mobile)
- **Admin Panel** (Clinic Owner Admin)
- Unified backend (Node.js + MongoDB)

> ✅ Current Release: **v1.0.0**

---

## ✅ Features (V1)

### 🔐 Authentication & Users
- Register / Login with role-based access control (`admin`, `doctor`, `patient`)
- JWT Authentication & Session management
- User profile management with **Cloudinary** integration for avatars
- Device token registration for push notifications

### 🏥 Doctor & Clinic Management
- Doctor profile creation and updates
- Clinic setup linked to doctor profile
- **Dynamic Working Hours**: Manage availability per doctor
- Public endpoints for listing doctors and clinic details

### 👥 Patient Features
- Patient profile setup and viewing
- View own appointments and medical history
- View prescriptions issued by doctor

### 📅 Appointment System (Core)
- Patient books appointments (Auto-assigns doctor in V1)
- **Status Workflow**: Pending → Confirmed / Completed / Cancelled
- Real-time updates via **Firebase Realtime Database (RTDB)** and **Socket.io**
- Filtering appointments by date and status

### 💊 Prescriptions
- Doctor creates and updates prescriptions
- Support for multiple prescription items (medicine, dose, frequency, etc.)
- View prescriptions by patient or appointment
- Admin overview of all medical records

### 🛠️ Admin Panel
- Comprehensive dashboard stats (Total patients, appointments, revenue indicators)
- Manage patients (Activate/Deactivate)
- Update any appointment status
- Manage global clinic settings
- System-wide prescriptions overview

### 🔔 Notifications & Automation
- **Multi-channel Notifications**:
  - **FCM Push Notifications**: Native mobile alerts
  - **Firebase RTDB**: Instant foreground UI updates
  - **Socket.io**: Real-time event emission
  - **Email (Nodemailer)**: Triggers for creation, confirmation, and cancellation
- **Automated Tasks (Node-cron)**:
  - **Appointment Reminders**: Automated alerts sent 10 minutes before the start time

---

## 🧱 Tech Stack
- **Runtime**: Node.js + Express
- **Database**: MongoDB + Mongoose
- **Real-time**: Firebase Realtime DB + Socket.io
- **Push Notifications**: Firebase Admin SDK (FCM)
- **Storage**: Cloudinary (Image management)
- **Email**: Nodemailer (SMTP/Gmail)
- **Automation**: Node-cron
- **File Handling**: Multer + Multer-Storage-Cloudinary

---

## 📁 Project Structure

```text
src/
├── config/         # DB, Firebase, Cloudinary, Socket configurations
├── controllers/    # Business logic for all modules
├── jobs/           # Scheduled tasks (Reminders)
├── middleware/     # Auth, Role validation, File upload handling
├── models/         # Mongoose schemas
├── routes/         # API endpoints per module
├── services/       # Email & Notification orchestration
├── utils/          # Standard response helpers & validation
├── app.js          # Express application setup
└── server.js       # Server bootstrap & socket initialization
```

---

## ⚙️ Setup (Local)

### 1) Install Dependencies
```bash
npm install
```

### 2) Environment Variables (.env)
Create a `.env` file in the project root:

```env
PORT=5000
MONGO_URI="your_mongo_connection_string"
JWT_SECRET="your_jwt_secret"

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

# Firebase Admin (Environment Option)
FIREBASE_PROJECT_ID=your_id
FIREBASE_CLIENT_EMAIL=your_email@...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://your-app.firebaseio.com

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM=your_email@gmail.com
```

### 3) Run Application
```bash
npm run dev
```

API base: `http://localhost:5000/api`

---

## 🧪 Response Format & Testing

All endpoints respond with a standard JSON format:
```json
{
  "success": true,
  "message": "Success message",
  "data": {}
}
```

### Postman Testing
Import `clinexa-postman.json` from the root directory. Recommended flow:
1. **Auth**: Register/Login/Me
2. **Doctor/Clinic**: Setup profile & availability
3. **Patient**: Create profile & book appointment
4. **Lifecycle**: Confirm/Complete appointment → Check Notifications/RTDB

---

## 🚀 Release Workflow
- **Branches**: `development` (WIP), `main` (Stable), `sprint-*` (Features)
- **Deployment**: Automatic deployment from `main` to production.

---

## 📌 Notes (V1 Constraints)
- **Single-doctor system (V1)**: Backend currently assumes a primary clinic context.
- **V3 Roadmap**: Support for multi-doctor, multi-branch, and advanced analytics.
