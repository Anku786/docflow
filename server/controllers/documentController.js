import Document from "../models/Document.js";
import { uploadToCloudinary } from "../services/cloudinaryService.js";

export const createDocument = async (req, res) => {
    try {
        const {
            documentType,
            extractedData,
            status,
            amount
        } = req.body;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "File is required",
            });
        }

        const cloudinaryResult = await uploadToCloudinary(
            req.file.buffer,
            req.file.originalname
        );

        const fileUrl = cloudinaryResult.secure_url;

        const document = await Document.create({
            fileName: req.file.originalname,
            fileType: req.file.mimetype,
            fileUrl,
            documentType,
            extractedData: JSON.parse(extractedData),
            status,
            amount
        });

        res.status(201).json({
            success: true,
            document,
        });
    } catch (error) {
        console.error("Save document error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to save document",
        });
    }
};

export const getDocuments = async (req, res) => {
    try {
        const documents = await Document.find()
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: documents,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch documents",
        });
    }
};

export const getDocumentById = async (req, res) => {
    try {
        const document = await Document.findById(
            req.params.id
        );

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found",
            });
        }

        res.status(200).json({
            success: true,
            data: document,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch document",
        });
    }
};

export const deleteDocuments = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: "ids must be a non-empty array",
            });
        }

        const result = await Document.deleteMany({
            _id: { $in: ids },
        });

        res.status(200).json({
            success: true,
            message: `${result.deletedCount} document(s) deleted successfully`,
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        console.error("Delete documents error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete documents",
            error: error.message,
        });
    }
};

export const updateDocumentStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const document = await Document.findByIdAndUpdate(
            req.params.id,
            status,
            {
                new: true,
                runValidators: true,
            }
        );

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Document status updated successfully",
            document,
        });
    } catch (error) {
        console.error("Update document status error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update document status",
            error: error.message,
        });
    }
};