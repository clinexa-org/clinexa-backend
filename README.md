%% =========================================================
%% Clinexa V1 — Mermaid (Sprint 1 → Sprint 7) — ONE CODE BLOCK
%% =========================================================

%% -----------------------------
%% 0) System Overview (V1)
%% -----------------------------
flowchart LR
  subgraph Client
    PA[Patient App\nFlutter Mobile]
    DW[Doctor Dashboard\nFlutter Web]
    AD[Admin Panel\nClinic Owner]
  end

  subgraph Backend
    API[Node.js + Express API]
    AUTH[JWT Auth + Role Middleware]
    SRV[Services:\nEmail (Nodemailer)]
  end

  subgraph DB
    M[(MongoDB)]
  end

  PA --> API
  DW --> API
  AD --> API
  API --> AUTH
  API --> SRV
  API --> M

%% =========================================================
%% 1) Git Workflow (Sprint branches → development → main)
%% =========================================================
flowchart LR
  MAIN[main] <-- Release PR/Merge -- DEV[development]

  DEV --> S1[sprint-1-auth]
  DEV --> S2[sprint-2-doctor-clinic]
  DEV --> S3[sprint-3-patients]
  DEV --> S4[sprint-4-appointments]
  DEV --> S5[sprint-5-prescriptions]
  DEV --> S6[sprint-6-admin]
  DEV --> S7[sprint-7-notifications]

  S1 -->|PR| DEV
  S2 -->|PR| DEV
  S3 -->|PR| DEV
  S4 -->|PR| DEV
  S5 -->|PR| DEV
  S6 -->|PR| DEV
  S7 -->|PR| DEV

%% =========================================================
%% 2) Request Lifecycle (MVC + Middleware)
%% =========================================================
sequenceDiagram
  participant C as Client (Postman/Flutter)
  participant RT as Routes
  participant AU as Auth Middleware
  participant RO as Role Middleware
  participant CT as Controller
  participant DB as MongoDB
  participant SV as Services (Email)

  C->>RT: HTTP Request
  RT->>AU: verify JWT
  AU-->>RT: req.user {id, role}
  RT->>RO: role check (if needed)
  RO-->>RT: allowed
  RT->>CT: controller action
  CT->>DB: query/write
  DB-->>CT: result
  CT->>SV: optional email trigger
  SV-->>CT: ok/fail (non-blocking)
  CT-->>C: {success,message,data}

%% =========================================================
%% Sprint 1 — Auth Module
%% =========================================================
sequenceDiagram
  participant U as User
  participant API as Auth API
  participant DB as MongoDB

  U->>API: POST /auth/register (name,email,password,role)
  API->>DB: Check email unique
  DB-->>API: OK
  API->>DB: Hash password + Create User
  DB-->>API: user created
  API-->>U: token + user

  U->>API: POST /auth/login (email,password)
  API->>DB: Find user by email
  DB-->>API: user
  API->>API: compare password
  API-->>U: token + user

  U->>API: GET /auth/me (JWT)
  API->>API: decode token
  API->>DB: Find user by id
  DB-->>API: user
  API-->>U: user

%% =========================================================
%% Sprint 2 — Doctor Profile Upsert
%% =========================================================
sequenceDiagram
  participant D as Doctor User
  participant API as Doctor API
  participant DB as MongoDB

  D->>API: POST /doctors (JWT doctor)
  API->>DB: Find Doctor by user_id
  alt exists
    API->>DB: Update Doctor
  else new
    API->>DB: Create Doctor
  end
  DB-->>API: doctor
  API-->>D: doctor profile

%% =========================================================
%% Sprint 2 — Clinic Upsert (linked to doctor)
%% =========================================================
sequenceDiagram
  participant D as Doctor User
  participant API as Clinic API
  participant DB as MongoDB

  D->>API: POST /clinics (JWT doctor)
  API->>DB: Find Doctor by user_id
  DB-->>API: doctor
  API->>DB: Find Clinic by doctor_id / doctor.clinic_id
  alt exists
    API->>DB: Update Clinic
  else new
    API->>DB: Create Clinic
    API->>DB: Update Doctor.clinic_id
  end
  DB-->>API: clinic
  API-->>D: clinic

%% =========================================================
%% Sprint 3 — Patient Profile Upsert
%% =========================================================
sequenceDiagram
  participant P as Patient User
  participant API as Patient API
  participant DB as MongoDB

  P->>API: POST /patients (JWT patient)
  API->>DB: Find Patient by user_id
  alt exists
    API->>DB: Update Patient
  else new
    API->>DB: Create Patient
  end
  DB-->>API: patient
  API-->>P: patient profile

%% =========================================================
%% Sprint 4 — Appointment Booking (Single Doctor Auto-Assign)
%% =========================================================
sequenceDiagram
  participant P as Patient
  participant API as Appointments API
  participant DB as MongoDB

  P->>API: POST /appointments {start_time, reason}
  API->>DB: Find Patient by user_id
  DB-->>API: patient
  API->>DB: Find ONLY Doctor (V1 single-doctor)
  DB-->>API: doctor
  API->>DB: Find Clinic for doctor (optional)
  DB-->>API: clinic/null
  API->>DB: Create Appointment (status=pending)
  DB-->>API: appointment
  API-->>P: appointment created

%% =========================================================
%% Sprint 4 — Appointment Status State Machine
%% =========================================================
stateDiagram-v2
  [*] --> pending
  pending --> confirmed: doctor/admin confirm
  pending --> cancelled: patient/doctor/admin cancel
  confirmed --> cancelled: patient/doctor/admin cancel
  confirmed --> completed: doctor/admin complete
  cancelled --> [*]
  completed --> [*]

%% =========================================================
%% Sprint 4 — Doctor Appointments (optional date filter)
%% =========================================================
sequenceDiagram
  participant D as Doctor
  participant API as Appointments API
  participant DB as MongoDB

  D->>API: GET /appointments/doctor?date=YYYY-MM-DD
  API->>DB: Find Doctor by user_id
  DB-->>API: doctor
  API->>DB: Find appointments by doctor_id + date range
  DB-->>API: list
  API-->>D: appointments

%% =========================================================
%% Sprint 5 — Prescription Create (Doctor)
%% =========================================================
sequenceDiagram
  participant D as Doctor
  participant API as Prescriptions API
  participant DB as MongoDB

  D->>API: POST /prescriptions {patient_id, appointment_id, notes, items[]}
  API->>DB: Validate Patient exists
  DB-->>API: OK
  API->>DB: Validate Appointment exists (optional)
  DB-->>API: OK
  API->>DB: Create Prescription
  DB-->>API: prescription
  API-->>D: prescription created

%% =========================================================
%% Sprint 5 — Patient Views Prescriptions
%% =========================================================
sequenceDiagram
  participant P as Patient
  participant API as Prescriptions API
  participant DB as MongoDB

  P->>API: GET /prescriptions/my (JWT patient)
  API->>DB: Find Patient by user_id
  DB-->>API: patient
  API->>DB: Find prescriptions by patient_id
  DB-->>API: list
  API-->>P: prescriptions

%% =========================================================
%% Sprint 6 — Admin Dashboard (Clinic Owner)
%% =========================================================
flowchart TD
  A[Admin] --> S[GET /admin/stats]
  A --> PList[GET /admin/patients]
  PList --> Toggle[PATCH /admin/patients/:id/toggle-active]
  A --> ApList[GET /admin/appointments?filters]
  ApList --> ApStatus[PATCH /admin/appointments/:id/status]
  A --> PrList[GET /admin/prescriptions]
  A --> CGet[GET /admin/clinic]
  A --> CPut[PUT /admin/clinic]

%% =========================================================
%% Sprint 6 — Toggle Patient Active
%% =========================================================
sequenceDiagram
  participant A as Admin
  participant API as Admin API
  participant DB as MongoDB

  A->>API: PATCH /admin/patients/:patientId/toggle-active
  API->>DB: Find Patient by _id
  DB-->>API: patient
  API->>DB: Find User by patient.user_id
  DB-->>API: user
  API->>DB: Toggle user.is_active
  DB-->>API: updated user
  API-->>A: success

%% =========================================================
%% Sprint 7 — Notifications (Email Triggers Map)
%% =========================================================
flowchart LR
  C1[Appointment Created] --> E1[Email to Doctor]
  C2[Appointment Confirmed] --> E2[Email to Patient]
  C3[Appointment Cancelled] --> E3[Email to Patient]

%% =========================================================
%% Sprint 7 — Appointment Created → Email to Doctor
%% =========================================================
sequenceDiagram
  participant P as Patient
  participant API as Appointments API
  participant DB as MongoDB
  participant ES as Email Service
  participant SMTP as SMTP Provider (Gmail)

  P->>API: POST /appointments
  API->>DB: Create appointment (pending)
  DB-->>API: appointment
  API->>DB: Load doctor + doctor.user email
  DB-->>API: doctor email
  API->>ES: sendEmail(to=doctor.email)
  ES->>SMTP: SMTP send
  SMTP-->>ES: OK
  ES-->>API: done
  API-->>P: success response

%% =========================================================
%% Sprint 7 — Appointment Confirmed → Email to Patient
%% =========================================================
sequenceDiagram
  participant D as Doctor/Admin
  participant API as Appointments API
  participant DB as MongoDB
  participant ES as Email Service
  participant SMTP as SMTP Provider (Gmail)

  D->>API: PATCH /appointments/confirm/:id
  API->>DB: Update status=confirmed
  DB-->>API: appointment
  API->>DB: Load patient + patient.user email
  DB-->>API: patient email
  API->>ES: sendEmail(to=patient.email)
  ES->>SMTP: SMTP send
  SMTP-->>ES: OK
  ES-->>API: done
  API-->>D: success response

%% =========================================================
%% Sprint 7 — Appointment Cancelled → Email to Patient
%% =========================================================
sequenceDiagram
  participant X as Patient/Doctor/Admin
  participant API as Appointments API
  participant DB as MongoDB
  participant ES as Email Service
  participant SMTP as SMTP Provider (Gmail)

  X->>API: PATCH /appointments/cancel/:id
  API->>DB: Update status=cancelled
  DB-->>API: appointment
  API->>DB: Load patient + patient.user email
  DB-->>API: patient email
  API->>ES: sendEmail(to=patient.email)
  ES->>SMTP: SMTP send
  SMTP-->>ES: OK
  ES-->>API: done
  API-->>X: success response
