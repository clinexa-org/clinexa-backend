import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import doctorRoutes from "./routes/doctor.routes.js";
import clinicRoutes from "./routes/clinic.routes.js";
import patientRoutes from "./routes/patient.routes.js";
import appointmentRoutes from "./routes/appointment.routes.js";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Root
app.get("/", (req, res) => {
  res.send("Clinexa API Running...");
});

// Routes
app.use("/api/auth", authRoutes);

app.use("/api/clinics", clinicRoutes);

app.use("/api/doctors", doctorRoutes);


app.use("/api/patients", patientRoutes);

app.use("/api/appointments", appointmentRoutes);
export default app;
