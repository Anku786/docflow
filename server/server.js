import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import documentRoutes from "./routes/documentRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "uploads");


dotenv.config({
    path: "./server/.env",
});

const app = express();

console.log(
    "OpenAI key exists:",
    Boolean(process.env.OPENAI_API_KEY)
);

app.use(
    cors({
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type"],
    })
);

app.use(express.json());
app.use("/uploads", express.static(uploadDir));

app.get("/", (req, res) => {
    res.json({
        message: "Document Parser API is running",
    });
});

app.use("/api/documents", documentRoutes);
app.use("/api/resumes", resumeRoutes);

const PORT = process.env.PORT || 5001;

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Unable to start server:", error.message);
    }
};

startServer();