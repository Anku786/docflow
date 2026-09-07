import * as pdfjsLib from "pdfjs-dist";

import pdfjsWorker from
    "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc =
    pdfjsWorker;


export const extractPdfText = async (file) => {
    try {
        const arrayBuffer = await file.arrayBuffer();

        const pdf = await pdfjsLib.getDocument({
            data: arrayBuffer,
        }).promise;

        const pages = [];

        for (
            let pageNumber = 1;
            pageNumber <= pdf.numPages;
            pageNumber++
        ) {
            const page = await pdf.getPage(pageNumber);

            const content =
                await page.getTextContent();

            const text = content.items
                .map((item) =>
                    "str" in item ? item.str : ""
                )
                .join(" ");

            pages.push({
                page: pageNumber,
                text,
            });
        }

        return {
            success: true,
            pageCount: pdf.numPages,
            pages,
            text: pages
                .map((page) => page.text)
                .join("\n"),
        };

    } catch (error) {

        return {
            success: false,
            error: error.message,
            text: "",
            pages: [],
        };
    }
};

export const extractResumePayload = (fields) => {
    const getValue = (label) => {
        return fields.find(
            (field) => field.label.toLowerCase() === label.toLowerCase()
        )?.value || "";
    };

    return {
        candidateName: getValue("Name"),
        email: getValue("Email"),
        phone: getValue("Phone"),
        skills: getValue("Skills"),
        experience: getValue("Total Experience")
    };
};