const API_BASE_URL = "http://localhost:5001/api/resumes";

export const getResumes = async () => {
    const response = await fetch(`${API_BASE_URL}`);
    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.message || "Failed to fetch documents"
        );
    }

    return result;
};


export const saveResume = async ({
    file,
    candidateName,
    email,
    phone,
    experience,
    skills,
    extractedData,
    confidence,
    status
}) => {
    const formData = new FormData();

    formData.append("file", file);

    formData.append("candidateName", candidateName || "");
    formData.append("email", email || "");
    formData.append("phone", phone || "");
    formData.append("experience", experience || 0);
    formData.append("status",status)

    formData.append(
        "skills",
        JSON.stringify(skills || [])
    );


    formData.append(
        "extractedData",
        JSON.stringify(extractedData || {})
    );

    formData.append("confidence", confidence || 0);
    const response = await fetch(
        `${API_BASE_URL}/resumes`,
        {
            method: "POST",
            body: formData,
        }
    );

    if (!response.ok) {
        const error = await response.json();

        throw new Error(
            error.message || "Failed to save resume"
        );
    }

    return response.json();
};

export const updateResume = async (id, status) => {
    const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Failed to update resume status");
    }

    return result;
};

export const deleteResumes = async (ids) => {
    const response = await fetch(
        `${API_BASE_URL}/delete`,
        {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ ids }),
        }
    );

    if (!response.ok) {
        const error = await response.json();

        throw new Error(
            error.message || "Failed to delete resumes"
        );
    }

    return response.json();
};

export const extractResumeMatch = async (resumeText) => {
    const response = await fetch(
        `${API_BASE_URL}/match`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                resumeText,
            }),
        }
    );

    if (!response.ok) {
        const error = await response.json();

        throw new Error(
            error.message || "Failed to extract resume"
        );
    }

    return response.json();
};