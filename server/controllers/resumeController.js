import Resume from "../models/Resume.js";

export const getResumes = async (req, res) => {
    console.log("🔥 GET /api/resumes HIT");
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
            extractedData
        } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Resume file is required",
            });
        }

        const fileUrl = `/uploads/${req.file.filename}`;
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
            confidence,
            matchScore,
            status,
        } = req.body;

        const updateData = {
            candidateName,
            email,
            phone,
            experience: experience !== undefined
                ? Number(experience)
                : undefined,
            skills: skills
                ? JSON.parse(skills)
                : undefined,
            education: education
                ? JSON.parse(education)
                : undefined,
            summary,
            rawText,
            extractedData: extractedData
                ? JSON.parse(extractedData)
                : undefined,
            confidence: confidence !== undefined
                ? Number(confidence)
                : undefined,
            matchScore:
                matchScore !== undefined && matchScore !== ""
                    ? Number(matchScore)
                    : null,
            status,
        };

        // Remove undefined fields
        Object.keys(updateData).forEach((key) => {
            if (updateData[key] === undefined) {
                delete updateData[key];
            }
        });

        // If a new resume file is uploaded
        if (req.file) {
            updateData.fileName = req.file.originalname;
            updateData.fileType = req.file.mimetype;
            updateData.fileUrl =
                `${process.env.API_BASE_URL}/uploads/${req.file.filename}`;
        }

        const resume = await Resume.findByIdAndUpdate(
            id,
            updateData,
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