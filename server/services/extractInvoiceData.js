import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export const extractInvoiceData = async (rawText) => {
    const prompt = `
You are an invoice extraction system.

The invoice can be one of:
- airfare
- hotel/stay
- cab/taxi
- meal
- other expense

Extract the relevant information from the invoice.

Rules:
- Do not invent information.
- If a value is not present, return null.
- Confidence must be between 0 and 1.
- Evidence must contain the exact relevant text from the invoice when possible.
- Return ONLY a JSON object.
- Do NOT use markdown.
- Do NOT wrap the JSON in code fences.

Return this structure:

{
  "invoiceType": "airfare | stay | cab | meal | other",
  "overallConfidence": 0,
  "fields": {
    "vendorName": {
      "value": null,
      "confidence": 0,
      "evidence": null
    },
    "invoiceNumber": {
      "value": null,
      "confidence": 0,
      "evidence": null
    },
    "invoiceDate": {
      "value": null,
      "confidence": 0,
      "evidence": null
    },
    "totalAmount": {
      "value": null,
      "confidence": 0,
      "evidence": null
    },
    "currency": {
      "value": null,
      "confidence": 0,
      "evidence": null
    }
  }
}

Invoice text:

${rawText}
`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
        },
    });

    console.log("Gemini response:", response.text);

    try {
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Invalid JSON returned by Gemini:", response.text);
        throw new Error("AI returned invalid JSON");
    }
};