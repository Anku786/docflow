import Resume from "../models/Resume.js";
import { uploadToCloudinary } from "../services/cloudinaryService.js";
import { analyzeResumeAgainstJD } from "../services/geminiService.js";
import { getZampJD } from "../services/jobDescriptionService.js";

export const getResumes = async (req, res) => {
    try {
        const resumes = await Resume.find()
            .sort({ createdAt: -1 })

        res.status(200).json({
            success: true,
            data: resumes,
        });
    } catch (error) {
        console.log("Get resumes error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch resumes",
        });
    }
};

export const createResume = async (req, res) => {
    try {
        const {
            candidateName,
            email,
            phone,
            experience,
            skills,
            education,
            summary,
            rawText,
            extractedData,
            match
        } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Resume file is required",
            });
        }

        const cloudinaryResult = await uploadToCloudinary(
            req.file.buffer,
            req.file.originalname
        );

        const fileUrl = cloudinaryResult.secure_url;
        const resume = await Resume.create({
            fileName: req.file.originalname,
            fileType: req.file.mimetype,
            fileUrl,
            candidateName: candidateName || "",
            email: email || "",
            phone: phone || "",
            experience: (experience) || 0,
            skills: skills ? JSON.parse(skills) : [],
            extractedData: JSON.parse(extractedData),
            match: JSON.parse(match),
            status: "draft",
        });

        return res.status(201).json({
            success: true,
            message: "Resume saved successfully",
            resume,
        });
    } catch (error) {
        console.error("Save resume error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to save resume",
            error: error.message,
        });
    }
};

export const updateResume = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const resume = await Resume.findByIdAndUpdate(
            id,
            { status },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!resume) {
            return res.status(404).json({
                success: false,
                message: "Resume not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Resume updated successfully",
            resume,
        });

    } catch (error) {
        console.error("Update resume error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update resume",
            error: error.message,
        });
    }
};

export const deleteResumes = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: "ids must be a non-empty array",
            });
        }

        const resumes = await Resume.find({
            _id: { $in: ids },
        });

        const result = await Resume.deleteMany({
            _id: { $in: ids },
        });

        return res.status(200).json({
            success: true,
            message: `${result.deletedCount} resume(s) deleted successfully`,
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        console.error("Delete resumes error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete resumes",
            error: error.message,
        });
    }
};

export const calculateResumeMatch = async (req, res) => {
    try {
        const { resumeText } = req.body;

        if (!resumeText) {
            return res.status(400).json({
                success: false,
                message: "Resume text is required",
            });
        }

        const jdText = await getZampJD();

        const match = await analyzeResumeAgainstJD({
            resumeText,
            jdText,
        });

        return res.status(200).json({
            success: true,
            data: match,
        });
    } catch (error) {
        console.error("Resume match error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to calculate resume match",
            error: error.message,
        });
    }
};