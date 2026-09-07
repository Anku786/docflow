const isPdf = (file) =>
    file?.type === "application/pdf" ||
    file?.name?.toLowerCase().endsWith(".pdf");

export const extractPdfText = async (file) => {
    if (!isPdf(file)) {
        return {
            success: false,
            error: "Only PDF files are supported",
            text: "",
            pages: [],
        };
    }

    try {
        const pdfjsLib = await import("pdfjs-dist");
        const { default: pdfjsWorker } = await import(
            "pdfjs-dist/build/pdf.worker.min.mjs?url"
        );

        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({
            data: arrayBuffer,
        }).promise;

        const pages = [];

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
            const page = await pdf.getPage(pageNumber);
            const content = await page.getTextContent();
            const text = content.items
                .map((item) => ("str" in item ? item.str : ""))
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
            text: pages.map((page) => page.text).join("\n"),
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
