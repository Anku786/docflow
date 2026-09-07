import express from "express";
import { upload } from "../middleware/upload.js";
import { createResume, deleteResumes, getResumes, updateResume } from "../controllers/resumeController.js";

const router = express.Router();

router.get("/", getResumes);

router.post(
    "/resumes",
    upload.single("file"),
    createResume
);

router.patch("/:id", updateResume);

router.delete("/delete", deleteResumes);

export default router;