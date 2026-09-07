export const BASE_URL = import.meta.env.VITE_API_URL;

const API_BASE_URL =   `${import.meta.env.VITE_API_URL}api/documents`;


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

    const response = await fetch(`${API_BASE_URL}`, {
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
    const response = await fetch(API_BASE_URL, { signal });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message || "Failed to fetch documents"
        );
    }

    return result;
};

export const deleteDocuments = async (ids) => {
    const response = await fetch(`${API_BASE_URL}/delete`, {
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
        `${API_BASE_URL}/documents/${id}`,
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
        `${API_BASE_URL}/extract-invoice`,
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