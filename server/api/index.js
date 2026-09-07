import app from "../app.js";
import connectDB from "../config/db.js";

const handler = async (req, res) => {
    try {
        await connectDB();
        return app(req, res);
    } catch (error) {
        console.error("API startup error:", error);

        return res.status(500).json({
            success: false,
            message: "Database connection failed",
            error: error.message,
        });
    }
};

export default handler;