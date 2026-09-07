import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
    {
        fileName: {
            type: String,
            required: true,
        },

        fileType: {
            type: String,
            required: true,
        },

        fileUrl: {
            type: String,
        },

        documentType: {
            type: String,
            enum: ["resume", "invoice"],
            required: true,
        },

        amount: {
            type: String
        },

        extractedData: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },

        confidence: {
            type: mongoose.Schema.Types.Mixed,
        },

        status: {
            type: String,
            enum: ["draft", "approved", "declined"],
            default: "draft",
        },
    },
    {
        timestamps: true,
    }
);

const Document = mongoose.model(
    "Document",
    documentSchema
);

export default Document;