import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export const analyzeResumeAgainstJD = async ({
    resumeText,
    jdText,
}) => {
    const prompt = `
You are an expert technical recruiter.

Compare the following RESUME against the JOB DESCRIPTION.

JOB DESCRIPTION:
${jdText}

RESUME:
${resumeText}

Calculate a resume-to-job-description match score from 0 to 100.

Evaluate:
- Required technical skills
- Frontend experience
- Years of experience
- Frontend architecture
- Performance optimization
- Responsive design
- Accessibility
- UI/UX
- Leadership / mentoring
- Git / Agile
- Responsibilities and overall relevance

Important:
- Only consider skills and experience actually present in the resume.
- Do not assume a skill just because it is related to another skill.
- Angular/Vue should not heavily penalize a strong React candidate because the JD
  lists them as alternative frontend frameworks.
- Do not count project dates as employment experience.
- Give a transparent explanation for the score.

Return JSON only.
`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "object",
                properties: {
                    score: {
                        type: "number",
                    },
                    matchedSkills: {
                        type: "array",
                        items: {
                            type: "string",
                        },
                    },
                    missingSkills: {
                        type: "array",
                        items: {
                            type: "string",
                        },
                    },
                    strengths: {
                        type: "array",
                        items: {
                            type: "string",
                        },
                    },
                    gaps: {
                        type: "array",
                        items: {
                            type: "string",
                        },
                    },
                },
                required: [
                    "score",
                    "matchedSkills",
                    "missingSkills",
                    "strengths",
                    "gaps",
                ],
            },
        },
    });

    return JSON.parse(response.text);
};