// controllers/aiController.js

import { extractInvoiceData } from "../services/extractInvoiceData.js";

export const extractInvoice = async (req, res) => {
    try {
        const { rawText } = req.body;

        if (!rawText) {
            return res.status(400).json({
                message: "rawText is required",
            });
        }

        const result = await extractInvoiceData(rawText);

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error("AI extraction error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to extract invoice data",
        });
    }
};