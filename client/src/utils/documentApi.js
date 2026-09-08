import { DELETE_DOCUMENT, EXTRACT_INVOICE, GET_DOCUMENT, SAVE_DOCUMENT } from "../constants/route-constants";

export const saveDocument = async ({
    file,
    documentType,
    extractedData,
    amount,
    status,
}) => {
    const formData = new FormData();

    formData.append("file", file);
    formData.append("documentType", documentType);
    formData.append("amount", amount ?? "");
    formData.append("status", status || "draft");
    formData.append("extractedData", JSON.stringify(extractedData));

    const response = await fetch(`${SAVE_DOCUMENT}`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save document");
    }

    return response.json();
};

export const getDocuments = async (signal) => {
    const response = await fetch(GET_DOCUMENT, { signal });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message || "Failed to fetch documents"
        );
    }

    return result;
};

export const deleteDocuments = async (ids) => {
    const response = await fetch(`${DELETE_DOCUMENT}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete documents");
    }

    return response.json();
};

export const updateDocumentStatus = async (id, status) => {
    const response = await fetch(
        `${UPDATE_DOCUMENT}/${id}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ status }),
        }
    );

    if (!response.ok) {
        const error = await response.json();

        throw new Error(
            error.message || "Failed to update status"
        );
    }

    return response.json();
};

export const extractInvoice = async (rawText) => {
    const response = await fetch(
        `${EXTRACT_INVOICE}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                rawText,
            }),
        }
    );

    if (!response.ok) {
        const error = await response.json();

        throw new Error(
            error.message || "Failed to extract invoice"
        );
    }

    return response.json();
};