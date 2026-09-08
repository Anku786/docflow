import dotenv from "dotenv";

dotenv.config();

import express from "express";
import cors from "cors";

import documentRoutes from "./routes/documentRoutes.js";
import resumeRoutes from "./routes/resumeRoutes.js";

const app = express();

app.use(
    cors({
        origin: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.json({
        message: "Document Parser API is running",
    });
});

app.use("/documents", documentRoutes);
app.use("/resumes", resumeRoutes);

export default app;