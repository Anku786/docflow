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
    const nameMatch = normalizedText.match(
        /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\s+(?=A\s+web|PROFILE|SUMMARY|EXPERIENCE)/i
    );

    if (nameMatch) {
        fields.push({
            label: "Name",
            value: nameMatch[1].trim(),
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
    // Calculate experience
    // -------------------------

    const months = {
        january: 0,
        february: 1,
        march: 2,
        april: 3,
        may: 4,
        june: 5,
        july: 6,
        august: 7,
        september: 8,
        october: 9,
        november: 10,
        december: 11,
    };

    const parseDate = (value) => {
        if (/present|current/i.test(value)) {
            return new Date();
        }

        const match = value.match(
            new RegExp(`(${monthPattern})\\s+(\\d{4})`, "i")
        );

        if (!match) return null;

        return new Date(
            Number(match[2]),
            months[match[1].toLowerCase()],
            1
        );
    };

    const ranges = [];

    for (const match of experienceRanges) {
        const start = parseDate(match[1]);
        const end = parseDate(match[2]);

        if (start && end) {
            ranges.push({ start, end });
        }
    }

    // Merge overlapping employment periods
    ranges.sort((a, b) => a.start - b.start);

    const merged = [];

    for (const range of ranges) {
        if (!merged.length) {
            merged.push(range);
            continue;
        }

        const previous = merged[merged.length - 1];

        if (range.start <= previous.end) {
            if (range.end > previous.end) {
                previous.end = range.end;
            }
        } else {
            merged.push(range);
        }
    }

    let totalMonths = 0;

    for (const range of merged) {
        totalMonths +=
            (range.end.getFullYear() - range.start.getFullYear()) * 12 +
            (range.end.getMonth() - range.start.getMonth());
    }

    if (totalMonths > 0) {
        const years = Math.floor(totalMonths / 12);
        const remainingMonths = totalMonths % 12;

        let experienceValue = "";

        if (years > 0) {
            experienceValue += `${years} year${years > 1 ? "s" : ""}`;
        }

        if (remainingMonths > 0) {
            experienceValue +=
                `${experienceValue ? " " : ""}${remainingMonths} month${remainingMonths > 1 ? "s" : ""}`;
        }

        fields.push({
            label: "Total Experience",
            value: experienceValue,
            confidence: "95%",
        });
    }

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