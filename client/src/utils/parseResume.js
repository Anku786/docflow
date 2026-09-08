export const parseResume = (text) => {
    const fields = [];

    // Normalize PDF.js output
    const normalizedText = text
        .replace(/\s+/g, " ")
        .replace(/[–—]/g, "-")
        .trim();

    // -------------------------
    // Name
    // -------------------------
    const nameMatch = extractName(normalizedText);
    if (nameMatch) {
        fields.push({
            label: "Name",
            value: nameMatch?.split(" ")?.[0],
            confidence: "95%",
        });
    }

    // -------------------------
    // Email
    // -------------------------
    const emailMatch = normalizedText.match(
        /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
    );

    if (emailMatch) {
        fields.push({
            label: "Email",
            value: emailMatch[0],
            confidence: "99%",
        });
    }

    // -------------------------
    // Phone
    // -------------------------
    const phoneMatch = normalizedText.match(
        /(?:\+91[\s-]?)?\d{10}\b/
    );

    if (phoneMatch) {
        fields.push({
            label: "Phone",
            value: phoneMatch[0],
            confidence: "98%",
        });
    }

    // -------------------------
    // LinkedIn
    // -------------------------
    const linkedinMatch = normalizedText.match(
        /(?:linkedin\.com\/in\/|https?:\/\/(?:www\.)?linkedin\.com\/in\/)([A-Za-z0-9_-]+)/i
    );

    if (linkedinMatch) {
        fields.push({
            label: "LinkedIn",
            value: `linkedin.com/in/${linkedinMatch[1]}`,
            confidence: "95%",
        });
    }

    // -------------------------
    // GitHub
    // -------------------------
    const githubMatch = normalizedText.match(
        /(?:github\.com\/|https?:\/\/(?:www\.)?github\.com\/)([A-Za-z0-9_-]+)/i
    );

    if (githubMatch) {
        fields.push({
            label: "GitHub",
            value: `github.com/${githubMatch[1]}`,
            confidence: "95%",
        });
    }

    // -------------------------
    // EXPERIENCE SECTION
    // -------------------------

    const experienceStart = normalizedText.search(/\bEXPERIENCE\b/i);
    const skillsStart = normalizedText.search(/\bSKILLS\b/i);

    let experienceText = "";

    if (experienceStart !== -1) {
        const end =
            skillsStart !== -1 && skillsStart > experienceStart
                ? skillsStart
                : normalizedText.length;

        experienceText = normalizedText.slice(
            experienceStart,
            end
        );
    }

    // Date pattern
    const monthPattern =
        "(?:January|February|March|April|May|June|July|August|September|October|November|December)";

    const datePattern =
        `(?:${monthPattern}\\s+\\d{4}|\\d{4})`;

    const experienceRegex = new RegExp(
        `(${datePattern})\\s*-\\s*(present(?:\\s+date)?|current|${datePattern})`,
        "gi"
    );

    const experienceRanges = [
        ...experienceText.matchAll(experienceRegex),
    ];


    // -------------------------
    // SKILLS SECTION
    // -------------------------

    let skillsText = "";

    if (skillsStart !== -1) {
        const projectsStart = normalizedText.search(/\bPROJECTS\b/i);

        const end =
            projectsStart !== -1 && projectsStart > skillsStart
                ? projectsStart
                : normalizedText.length;

        skillsText = normalizedText.slice(
            skillsStart,
            end
        );
    }

    // Remove "SKILLS"
    skillsText = skillsText.replace(/^SKILLS\s*/i, "").trim();

    // Remove category names such as:
    // Programming:
    // Development:
    skillsText = skillsText
        .replace(/\bProgramming\s*:/gi, "")
        .replace(/\bDevelopment\s*:/gi, "");

    // Now split only the actual skills by comma
    const skills = skillsText
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);

    if (skills.length) {
        fields.push({
            label: "Skills",
            value: [...new Set(skills)].join(", "),
            confidence: "95%",
        });
    }

    return fields;
};

// -------------------------
// Dynamic Name Extraction
// -------------------------

const extractName = (text) => {
    const header = text.slice(0, 500).trim();

    // Remove common contact information from the header
    let cleaned = header
        // email
        .replace(
            /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
            ""
        )

        // phone numbers
        .replace(
            /(?:\+?\d[\d\s().-]{7,}\d)/g,
            ""
        )

        // URLs
        .replace(
            /https?:\/\/\S+/gi,
            ""
        )

        // LinkedIn / GitHub without protocol
        .replace(
            /\b(?:linkedin|github)\.com\/\S+/gi,
            ""
        )

        // separators
        .replace(/[|•·]+/g, " ")

        .replace(/\s+/g, " ")
        .trim();


    // Remove common location patterns from the end
    cleaned = cleaned
        .replace(
            /\s+[A-Za-z .'-]+,\s*[A-Za-z .'-]+$/,
            ""
        )
        .trim();

    // Split into words
    const words = cleaned.split(/\s+/);

    /*
     * Name is normally the first 2-4 words.
     *
     * Stop if we encounter common resume section/title words.
     */
    const stopWords = new Set([
        "summary",
        "profile",
        "experience",
        "professional",
        "education",
        "skills",
        "technical",
        "projects",
        "certifications",
        "objective",
        "contact",
        "about",
        "frontend",
        "backend",
        "developer",
        "engineer",
        "software",
        "designer",
        "manager",
    ]);

    const nameWords = [];

    for (const word of words) {
        const normalizedWord = word
            .replace(/[^a-zA-Z]/g, "")
            .toLowerCase();

        if (!normalizedWord) {
            continue;
        }

        if (stopWords.has(normalizedWord)) {
            break;
        }

        nameWords.push(word);

        if (nameWords.length === 4) {
            break;
        }
    }

    // A person's name should generally have at least 2 words
    if (nameWords.length >= 2) {
        return nameWords.join(" ").trim();
    }

    return "";
};

export const extractResumePayload = (fields = []) => {
    const getValue = (label) =>
        fields.find(
            (field) => field.label.toLowerCase() === label.toLowerCase()
        )?.value || "";

    const skillsValue = getValue("Skills");

    return {
        candidateName: getValue("Name"),
        email: getValue("Email"),
        phone: getValue("Phone"),
        skills: skillsValue
            ? skillsValue.split(",").map((skill) => skill.trim()).filter(Boolean)
            : [],
        experience: getValue("Total Experience"),
        match: {
            match_score: getValue("Match Score"),
            matched_skill: getValue("Matched Skills"),
            missing_skills: getValue("Missing Skills")
        }
    };
};

export const mapResumeMatchToFields = (match) => {
    if (!match) return [];

    const fields = [];

    if (match.score != null) {
        fields.push({
            label: "Match Score",
            value: `${match.score}%`,
            confidence: "100%",
        });
    }

    if (Array.isArray(match.matchedSkills) && match.matchedSkills.length) {
        fields.push({
            label: "Matched Skills",
            value: match.matchedSkills.join(", "),
            confidence: "95%",
        });
    }

    if (Array.isArray(match.missingSkills) && match.missingSkills.length) {
        fields.push({
            label: "Missing Skills",
            value: match.missingSkills.join(", "),
            confidence: "95%",
        });
    }

    if(Array.isArray(match.workExperience)){
        const result = calculateTotalExperience(match.workExperience);
        fields.push({
            label: "Total Experience",
            value: result?.formatted,
            confidence: "95%",
        });
    }

    return fields;
};

const calculateTotalExperience = (experienceArray) => {
    let totalMonths = 0;

    experienceArray.forEach(exp => {
        const start = new Date(exp.startDate);
        // If endDate is "Present", use the current system date
        const end = exp.endDate.toLowerCase() === 'present' ? new Date() : new Date(exp.endDate);

        // Calculate the difference in months
        const yearDiff = end.getFullYear() - start.getFullYear();
        const monthDiff = end.getMonth() - start.getMonth();

        totalMonths += (yearDiff * 12) + monthDiff;
    });

    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;

    return {
        totalMonths,
        formatted: `${years} years and ${months} months`
    };
}


