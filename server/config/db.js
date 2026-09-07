import mongoose from "mongoose";

let cachedConnection = null;

const connectDB = async () => {
    if (cachedConnection) {
        return cachedConnection;
    }

    try {
        cachedConnection = await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected");

        return cachedConnection;
    } catch (error) {
        cachedConnection = null;

        console.error("MongoDB connection failed:", error.message);

        throw error;
    }
};

export default connectDB;