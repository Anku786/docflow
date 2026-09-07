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

const INVOICE_FIELD_LABELS = {
    vendorName: "Vendor",
    invoiceNumber: "Invoice Number",
    invoiceDate: "Invoice Date",
    totalAmount: "Total Amount",
    currency: "Currency",
};

export const mapInvoiceExtractionToFields = (extracted) => {
    if (!extracted?.fields) return [];

    const fields = [];

    if (extracted.invoiceType) {
        fields.push({
            label: "Expense Type",
            value: extracted.invoiceType,
            confidence: `${Math.round((extracted.overallConfidence || 0) * 100)}%`,
        });
    }

    Object.entries(extracted.fields).forEach(([key, data]) => {
        if (!data?.value) return;

        fields.push({
            label: INVOICE_FIELD_LABELS[key] || key,
            value: String(data.value),
            confidence: `${Math.round((data.confidence || 0) * 100)}%`,
        });
    });

    return fields;
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