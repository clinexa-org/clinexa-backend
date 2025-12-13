flowchart TD

START([Start Clinexa V1]) --> S1

%% Sprint 1
subgraph S1[Sprint 1 Auth]
  A1[Register<br/>POST auth register] --> A2[Login<br/>POST auth login]
  A2 --> A3[Me<br/>GET auth me]
  A2 --> TOK[JWT Token]
  TOK --> ROLE{Role}
  ROLE -->|patient| R_PAT[Patient Access]
  ROLE -->|doctor| R_DOC[Doctor Access]
  ROLE -->|admin| R_ADM[Admin Access]
end

S1 --> S2

%% Sprint 2
subgraph S2[Sprint 2 Doctor and Clinic]
  D1[Doctor Profile Upsert<br/>POST doctors]
  D2[Doctor Profile Me<br/>GET doctors me]
  C1[Clinic Upsert<br/>POST clinics]
  C2[Clinic Me<br/>GET clinics me]
  PUB1[Public Doctors<br/>GET doctors]
  PUB2[Public Clinic by Doctor<br/>GET clinics by doctorId]

  R_DOC --> D1 --> D2
  R_DOC --> C1 --> C2
  PUB1 --> PUB2
end

S2 --> S3

%% Sprint 3
subgraph S3[Sprint 3 Patients]
  P1[Patient Profile Upsert<br/>POST patients]
  P2[Patient Profile Me<br/>GET patients me]
  ADM_P1[Admin Get Patients<br/>GET patients]
  DOC_P1[Doctor Get Patient<br/>GET patients by id]

  R_PAT --> P1 --> P2
  R_ADM --> ADM_P1
  R_DOC --> DOC_P1
end

S3 --> S4

%% Sprint 4
subgraph S4[Sprint 4 Appointments Core]
  AP1[Book Appointment<br/>POST appointments]
  AP2[My Appointments<br/>GET appointments my]
  AP3[Doctor Appointments<br/>GET appointments doctor]
  AP4[Confirm Appointment<br/>PATCH confirm id]
  AP5[Cancel Appointment<br/>PATCH cancel id]
  AP6[Complete Appointment<br/>PATCH complete id]

  AUTO[Auto Assign Doctor<br/>Single doctor V1]
  STATUS[(Appointment Status)]
  ST1[pending]
  ST2[confirmed]
  ST3[cancelled]
  ST4[completed]

  R_PAT --> AP1 --> AUTO --> STATUS
  R_PAT --> AP2
  R_DOC --> AP3

  R_DOC --> AP4
  R_ADM --> AP4

  R_PAT --> AP5
  R_DOC --> AP5
  R_ADM --> AP5

  R_DOC --> AP6
  R_ADM --> AP6

  STATUS --> ST1
  ST1 -->|confirm| ST2
  ST1 -->|cancel| ST3
  ST2 -->|cancel| ST3
  ST2 -->|complete| ST4
end

S4 --> S5

%% Sprint 5
subgraph S5[Sprint 5 Prescriptions]
  PR1[Create Prescription<br/>POST prescriptions]
  PR2[Update Prescription<br/>PUT prescriptions id]
  PR3[Patient My Prescriptions<br/>GET prescriptions my]
  PR4[By Patient<br/>GET prescriptions patient id]
  PR5[By Appointment<br/>GET prescriptions appointment id]
  PR6[Admin All Prescriptions<br/>GET prescriptions]

  R_DOC --> PR1 --> PR2
  R_PAT --> PR3
  R_DOC --> PR4
  R_ADM --> PR4
  R_DOC --> PR5
  R_ADM --> PR5
  R_ADM --> PR6
end

S5 --> S6

%% Sprint 6
subgraph S6[Sprint 6 Admin]
  AS1[Stats<br/>GET admin stats]
  AS2[Patients List<br/>GET admin patients]
  AS3[Toggle Patient Active<br/>PATCH admin patient toggle]
  AS4[Appointments List<br/>GET admin appointments]
  AS5[Update Appointment Status<br/>PATCH admin appointment status]
  AS6[Prescriptions Overview<br/>GET admin prescriptions]
  AS7[Clinic Get<br/>GET admin clinic]
  AS8[Clinic Update<br/>PUT admin clinic]

  R_ADM --> AS1
  R_ADM --> AS2 --> AS3
  R_ADM --> AS4 --> AS5
  R_ADM --> AS6
  R_ADM --> AS7 --> AS8
end

S6 --> S7

%% Sprint 7
subgraph S7[Sprint 7 Notifications Email]
  N0[Email Service<br/>Nodemailer SMTP]
  N1[Trigger Appointment Created]
  N2[Trigger Appointment Confirmed]
  N3[Trigger Appointment Cancelled]

  ED[Email to Doctor]
  EP1[Email to Patient Confirmed]
  EP2[Email to Patient Cancelled]

  N1 --> ED
  N2 --> EP1
  N3 --> EP2

  AP1 -. triggers .-> N1
  AP4 -. triggers .-> N2
  AP5 -. triggers .-> N3

  N0 --- N1
  N0 --- N2
  N0 --- N3
end

S7 --> DONE([Clinexa Backend V1 Completed])
