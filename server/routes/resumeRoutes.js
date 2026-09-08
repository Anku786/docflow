import express from "express";
import { upload } from "../middleware/upload.js";
import { calculateResumeMatch, createResume, deleteResumes, getResumes, updateResume } from "../controllers/resumeController.js";

const router = express.Router();

router.get("/", getResumes);

router.post(
    "/create",
    upload.single("file"),
    createResume
);

router.patch("/update/:id", updateResume);

router.delete("/delete", deleteResumes);

router.post("/match", calculateResumeMatch);

export default router;