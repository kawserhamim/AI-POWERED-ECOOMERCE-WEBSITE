import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/ecommerce_db";

export const connectDB = async () => {
  try {
    if (!process.env.MONGO_URL) {
      console.warn(`MONGO_URL not set in .env; falling back to ${MONGO_URL}`);
    }
    await mongoose.connect(MONGO_URL, {
      dbName: "ecommerce",
    });
    console.log(`Connected to MongoDB at ${MONGO_URL}`);
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
};
