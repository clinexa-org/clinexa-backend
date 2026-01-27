
import mongoose from "mongoose";
import dotenv from "dotenv";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import Appointment from "../models/Appointment.js";
import User from "../models/User.js";

dotenv.config();

const cleanup = async () => {
  // Dynamically import db config so it picks up the loaded env vars
  const { default: connectDB } = await import("../config/db.js");
  await connectDB();
  console.log("Connected to DB");

  try {
    // 1. Find Patients with no User
    const patients = await Patient.find();
    console.log(`Checking ${patients.length} patients...`);
    
    let deletedPatients = 0;
    const patientIdsToDelete = [];

    for (const p of patients) {
      if (!p.user_id) {
         console.log(`Patient ${p._id} has null user_id`);
         patientIdsToDelete.push(p._id);
         continue;
      }
      const user = await User.findById(p.user_id);
      if (!user) {
        console.log(`Patient ${p._id} has missing user ${p.user_id}`);
        patientIdsToDelete.push(p._id);
      }
    }

    if (patientIdsToDelete.length > 0) {
      console.log(`Deleting ${patientIdsToDelete.length} orphaned patients...`);
      await Patient.deleteMany({ _id: { $in: patientIdsToDelete } });
      deletedPatients = patientIdsToDelete.length;
    }

    // 2. Find Doctors with no User
    const doctors = await Doctor.find();
    console.log(`Checking ${doctors.length} doctors...`);
    
    let deletedDoctors = 0;
    const doctorIdsToDelete = [];

    for (const d of doctors) {
        if (!d.user_id) {
            doctorIdsToDelete.push(d._id);
            continue;
        }
      const user = await User.findById(d.user_id);
      if (!user) {
        console.log(`Doctor ${d._id} has missing user ${d.user_id}`);
        doctorIdsToDelete.push(d._id);
      }
    }

    if (doctorIdsToDelete.length > 0) {
      console.log(`Deleting ${doctorIdsToDelete.length} orphaned doctors...`);
      await Doctor.deleteMany({ _id: { $in: doctorIdsToDelete } });
      deletedDoctors = doctorIdsToDelete.length;
    }

    // 3. Find Appointments with missing Patient or Doctor
    // We can just rely on the fact that if we deleted the Patient, their ID is now invalid.
    // However, it's better to check.
    
    console.log("Checking appointments for orphaned references...");
    const appointments = await Appointment.find();
    const appointmentIdsToDelete = [];

    for (const app of appointments) {
        let valid = true;
        // Check Patient
        if (app.patient_id) {
            const p = await Patient.findById(app.patient_id);
            if (!p) {
                console.log(`Appointment ${app._id} has missing patient ${app.patient_id}`);
                valid = false;
            }
        }
        
        // Check Doctor
        if (valid && app.doctor_id) {
            const d = await Doctor.findById(app.doctor_id);
            if (!d) {
                console.log(`Appointment ${app._id} has missing doctor ${app.doctor_id}`);
                valid = false;
            }
        }

        if (!valid) {
            appointmentIdsToDelete.push(app._id);
        }
    }

    if (appointmentIdsToDelete.length > 0) {
        console.log(`Deleting ${appointmentIdsToDelete.length} orphaned appointments...`);
        await Appointment.deleteMany({ _id: { $in: appointmentIdsToDelete } });
    }

    console.log("Cleanup Report:");
    console.log(`- Deleted Patients: ${deletedPatients}`);
    console.log(`- Deleted Doctors: ${deletedDoctors}`);
    console.log(`- Deleted Appointments: ${appointmentIdsToDelete.length}`);

  } catch (err) {
    console.error("Error during cleanup:", err);
  } finally {
    mongoose.disconnect();
    console.log("Done");
    process.exit();
  }
};

cleanup();
