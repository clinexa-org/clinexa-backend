import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);
    console.error("Hint: Ensure MongoDB is running locally or check your MONGO_URI");
    process.exit(1);
  }
};

export default connectDB;
