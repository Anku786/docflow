import { DELETE_RESUME, EXTRACT_RESUME, GET_RESUME, SAVE_RESUME, UPDATE_RESUME } from "../constants/route-constants";

export const getResumes = async (signal) => {
    const response = await fetch(`${GET_RESUME}`, { signal });
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
    status,
    match
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
    formData.append("match", JSON.stringify(match) || {})
    const response = await fetch(
        `${SAVE_RESUME}`,
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
    const response = await fetch(`${UPDATE_RESUME}/${id}`, {
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
        `${DELETE_RESUME}`,
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
        `${EXTRACT_RESUME}`,
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