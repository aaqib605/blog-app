import mongoose from "mongoose";
import { cyan } from "console-log-colors";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      autoIndex: true,
    });
    console.log(
      cyan.bold.underline(`MongoDB connected: ${conn.connection.host}`)
    );
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

export default connectDB;
