import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export const analyzeResumeAgainstJD = async ({
    resumeText,
    jdText,
}) => {
    const prompt = `
You are an expert technical recruiter and resume parser.

First, identify the candidate's actual professional work experience from the RESUME.
Then compare that resume against the JOB DESCRIPTION.

JOB DESCRIPTION:
${jdText}

RESUME:
${resumeText}

For work experience:

- Extract every actual employment record.
- Include company name.
- Include job title.
- Include start date.
- Include end date.
- Preserve "Present", "Current", or "Now" when the candidate is currently employed.
- Only include actual employment/work experience.
- Do NOT include projects as work experience.
- Do NOT include education as work experience.
- Do NOT include certifications as work experience.
- Do NOT infer employment dates that are not present in the resume.
- Do NOT calculate total experience. The application will calculate it from the employment dates.
- If a date is unavailable, return an empty string.

For resume-to-job matching:

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
- Do not count education dates as employment experience.
- Do not count certification dates as employment experience.
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

                    workExperience: {
                        type: "array",

                        items: {
                            type: "object",

                            properties: {
                                company: {
                                    type: "string",
                                },

                                jobTitle: {
                                    type: "string",
                                },

                                startDate: {
                                    type: "string",
                                },

                                endDate: {
                                    type: "string",
                                },
                            },

                            required: [
                                "company",
                                "jobTitle",
                                "startDate",
                                "endDate",
                            ],
                        },
                    },
                },

                required: [
                    "score",
                    "matchedSkills",
                    "missingSkills",
                    "strengths",
                    "gaps",
                    "workExperience",
                ],
            },
        },
    });

    return JSON.parse(response.text);
};