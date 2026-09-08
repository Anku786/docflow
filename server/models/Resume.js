import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
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
            required: true,
        },

        candidateName: {
            type: String,
            default: "",
        },

        email: {
            type: String,
            default: "",
        },

        phone: {
            type: String,
            default: "",
        },

        experience: {
            type: String,
            default: 0,
        },

        skills: {
            type: [String],
            default: [],
        },

        extractedData: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },

        confidence: {
            type: Number,
            default: 0,
        },
        match: {
            type: Object,
            default: {}
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

export default mongoose.model("Resume", resumeSchema);