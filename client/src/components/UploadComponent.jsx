import { useEffect, useRef, useState } from "react";
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

    useEffect(() => {
        return () => {
            if (previewUrlRef.current) {
                URL.revokeObjectURL(previewUrlRef.current);
            }
        };
    }, []);

    const revokePreviewUrl = () => {
        if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
            previewUrlRef.current = null;
        }
    };

    const processFile = async (file) => {
        if (file.size > MAX_FILE_BYTES) {
            toast.error("File exceeds 25 MB");
            return;
        }

        revokePreviewUrl();
        setFileName(file.name);
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
                    const matchResult = await extractResumeMatch(extractionResult.text);
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
            setIsProcessing(false);
        }
    };

    const onFiles = (files) => {
        if (!files?.length || isProcessing) return;
        processFile(files[0]);
    };

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
                            onChange={() => onDocumentTypeChange("invoice")}
                        />
                        <label>Invoice</label>
                    </div>
                    <div className="document-type-selector">
                        <input
                            type="radio"
                            name="documentType"
                            value="resume"
                            checked={documentType === "resume"}
                            onChange={() => onDocumentTypeChange("resume")}
                        />
                        <label>Resume</label>
                    </div>
                </div>
                <div
                    className={`drop-zone${isDragging ? " dragging" : ""}`}
                    onDragOver={(event) => {
                        event.preventDefault();
                        setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(event) => {
                        event.preventDefault();
                        setIsDragging(false);
                        onFiles(event.dataTransfer.files);
                    }}
                >
                    <div className="upload-icon">↑</div>
                    <h2>Drag & drop your documents here</h2>
                    <p>Upload PDF invoices or resumes</p>
                    <button
                        type="button"
                        className="browse-btn"
                        onClick={() => inputRef.current?.click()}
                    >
                        Browse files
                    </button>
                    <input
                        ref={inputRef}
                        id="fileInput"
                        type="file"
                        accept={ACCEPTED}
                        onChange={(event) => {
                            onFiles(event.target.files);
                            event.target.value = "";
                        }}
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
                        {PROCESSING_STEPS.map((label, index) => {
                            const threshold = (index + 1) * 25;
                            const completed = progress >= threshold;
                            const current = progress >= threshold - 20 && progress < threshold;
                            return (
                                <div
                                    key={label}
                                    className={`step${completed ? " completed" : current ? " current" : ""}`}
                                >
                                    <div className="step-icon">{completed ? "✓" : index + 1}</div>
                                    {label}
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}
        </div>
    );
};

export default DocumentUploader;
