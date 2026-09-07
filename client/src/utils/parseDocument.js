import { parseResume } from "./parseResume";
import { parseInvoice } from "./parseInvoice";

export const parseDocument = (text, documentType) => {
    if (documentType === "resume") {
        return parseResume(text);
    }

    if (documentType === "invoice") {
        return parseInvoice(text);
    }

    return [];
};

export const normalizeFields = (fields) => {
    const extractedData = {};
    const confidence = {};

    fields.forEach((field) => {
        const key = field.label
            .toLowerCase()
            .replace(/\s+/g, "");

        extractedData[key] = field.value;

        if (field.confidence) {
            confidence[key] = Number(
                String(field.confidence).replace("%", "")
            );
        }
    });

    return {
        extractedData,
        confidence,
    };
};