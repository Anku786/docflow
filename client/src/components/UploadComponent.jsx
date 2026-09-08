import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { parseDocument, mapInvoiceExtractionToFields } from "../utils/parseDocument";
import { extractPdfText } from "../utils/extractPdfText";
import { extractInvoice } from "../utils/documentApi";
import { extractResumeMatch } from "../utils/resumeApi";
import { mapResumeMatchToFields } from "../utils/parseResume";

const ACCEPTED = ".pdf";
const MAX_FILE_BYTES = 25 * 1024 * 1024;
const PROCESSING_STEPS = [
    "Document uploaded",
    "Extracting text",
    "Identifying entities",
    "Validating extracted fields",
];

const DocumentUploader = ({
    documentType,
    onDocumentTypeChange,
    onProcessed,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [fileName, setFileName] = useState("");
    const [progress, setProgress] = useState(0);
    const inputRef = useRef(null);
    const previewUrlRef = useRef(null);
    const isProcessingRef = useRef(false);

    useEffect(() => {
        return () => {
            if (previewUrlRef.current) {
                URL.revokeObjectURL(previewUrlRef.current);
            }
        };
    }, []);

    const revokePreviewUrl = useCallback(() => {
        if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
            previewUrlRef.current = null;
        }
    }, []);

    const processFile = useCallback(async (file) => {
        if (file.size > MAX_FILE_BYTES) {
            toast.error("File exceeds 25 MB");
            return;
        }

        revokePreviewUrl();
        setFileName(file.name);
        isProcessingRef.current = true;
        setIsProcessing(true);
        setProgress(25);

        try {
            const previewUrl = URL.createObjectURL(file);
            previewUrlRef.current = previewUrl;

            const extractionResult = await extractPdfText(file);
            if (!extractionResult.success) {
                throw new Error(extractionResult.error || "Failed to extract text");
            }
            setProgress(50);

            let fields = parseDocument(extractionResult.text, documentType);
            setProgress(75);

            try {
                if (documentType === "resume") {
                    // const matchResult = await extractResumeMatch(extractionResult.text);
                    const matchResult = {
                        "success": true,
                        "data": {
                            "score": 78,
                            "matchedSkills": [
                                "HTML",
                                "CSS",
                                "JavaScript",
                                "React.js",
                                "Next.js",
                                "Redux",
                                "Git",
                                "Node.js",
                                "Express.js",
                                "MongoDB",
                                "MySQL",
                                "Bootstrap"
                            ],
                            "missingSkills": [
                                "Leadership/Mentoring",
                                "Agile development methodologies",
                                "Accessibility standards",
                                "User testing/feedback loops",
                                "Performance optimization techniques (explicit)",
                                "Cross-browser compatibility (explicit details)",
                                "UI/UX design principles (explicit details)"
                            ],
                            "strengths": [
                                "Strong proficiency in core web technologies including HTML, CSS, JavaScript, and React.js.",
                                "Solid 3 years 7 months of relevant front-end development experience, perfectly aligning with the job description's requirement.",
                                "Proven track record of delivering multiple complex front-end and full-stack solutions.",
                                "Experience building scalable web applications.",
                                "Proficiency with modern frameworks like Next.js and state management with Redux.",
                                "Full-stack development experience demonstrates a holistic understanding of web application development and backend collaboration.",
                                "Strong problem-solving abilities and a proactive approach, evident from diverse project work.",
                                "Experience with version control systems, specifically Git.",
                                "A clear passion for creating user experiences, as indicated by her profile."
                            ],
                            "gaps": [
                                "Lack of explicit experience or mention of leadership or mentoring roles.",
                                "Absence of explicit experience with agile development methodologies.",
                                "No stated experience or commitment to championing accessibility standards.",
                                "Limited explicit detail on collaborating with UX/UI designers specifically for user feedback and user testing to make data-driven decisions.",
                                "While scalability is mentioned, detailed experience with performance optimization techniques is not explicitly highlighted.",
                                "Cross-browser compatibility and responsive design principles are implied by experience but not explicitly emphasized as strong knowledge points."
                            ]
                        }
                    }
                    fields = [
                        ...fields,
                        ...mapResumeMatchToFields(matchResult?.data),
                    ];
                } else {
                    const invoiceResult = await extractInvoice(extractionResult.text);
                    const mapped = mapInvoiceExtractionToFields(invoiceResult?.data);
                    if (mapped.length) {
                        fields = mapped;
                    }
                }
            } catch (enrichmentError) {
                console.error("Enrichment failed, using local parse:", enrichmentError);
            }

            setProgress(100);
            onProcessed({
                file,
                previewUrl,
                fields,
                extractionResult,
            });
        } catch (error) {
            revokePreviewUrl();
            toast.error(error.message || "Failed to process document");
            setProgress(0);
        } finally {
            isProcessingRef.current = false;
            setIsProcessing(false);
        }
    }, [documentType, onProcessed, revokePreviewUrl]);

    const onFiles = useCallback((files) => {
        if (!files?.length || isProcessingRef.current) return;
        processFile(files[0]);
    }, [processFile]);

    const handleSelectInvoice = useCallback(
        () => onDocumentTypeChange("invoice"),
        [onDocumentTypeChange]
    );
    const handleSelectResume = useCallback(
        () => onDocumentTypeChange("resume"),
        [onDocumentTypeChange]
    );

    const handleDragOver = useCallback((event) => {
        event.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((event) => {
        event.preventDefault();
        setIsDragging(false);
        onFiles(event.dataTransfer.files);
    }, [onFiles]);

    const handleBrowseClick = useCallback(() => {
        inputRef.current?.click();
    }, []);

    const handleFileChange = useCallback((event) => {
        onFiles(event.target.files);
        event.target.value = "";
    }, [onFiles]);

    const dropZoneClassName = useMemo(
        () => `drop-zone${isDragging ? " dragging" : ""}`,
        [isDragging]
    );

    const stepStates = useMemo(
        () =>
            PROCESSING_STEPS.map((label, index) => {
                const threshold = (index + 1) * 25;
                return {
                    label,
                    completed: progress >= threshold,
                    current: progress >= threshold - 20 && progress < threshold,
                };
            }),
        [progress]
    );

    return (
        <div>
            <section className="upload-card">
                <div className="selector">
                    <div className="document-type-selector">
                        <input
                            type="radio"
                            name="documentType"
                            value="invoice"
                            checked={documentType === "invoice"}
                            onChange={handleSelectInvoice}
                        />
                        <label>Invoice</label>
                    </div>
                    <div className="document-type-selector">
                        <input
                            type="radio"
                            name="documentType"
                            value="resume"
                            checked={documentType === "resume"}
                            onChange={handleSelectResume}
                        />
                        <label>Resume</label>
                    </div>
                </div>
                <div
                    className={dropZoneClassName}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div className="upload-icon">↑</div>
                    <h2>Drag & drop your documents here</h2>
                    <p>Upload PDF invoices or resumes</p>
                    <button
                        type="button"
                        className="browse-btn"
                        onClick={handleBrowseClick}
                    >
                        Browse files
                    </button>
                    <input
                        ref={inputRef}
                        id="fileInput"
                        type="file"
                        accept={ACCEPTED}
                        onChange={handleFileChange}
                    />
                    <div className="file-info">PDF · Maximum 25 MB per file</div>
                </div>
            </section>
            {(isProcessing || progress > 0) && (
                <section className="processing-card show">
                    <div className="processing-header">
                        <h3>Processing {fileName}</h3>
                        <span className="percentage">{progress}%</span>
                    </div>
                    <div className="progress">
                        <div className="progress-bar" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="steps">
                        {stepStates.map((step, index) => (
                            <div
                                key={step.label}
                                className={`step${step.completed ? " completed" : step.current ? " current" : ""}`}
                            >
                                <div className="step-icon">{step.completed ? "✓" : index + 1}</div>
                                {step.label}
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default memo(DocumentUploader);
