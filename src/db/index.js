import mongoose, { connect } from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(
      `\n🎉 Successfully connected to MongoDB! Database Host: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error(
      `Failed to connect to MongoDB. Error Details: ${error.message}`
    );
    throw error;
    process.exit(1);
  }
};

export default connectDB;
