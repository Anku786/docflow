import React, { useState, useRef, useEffect } from "react";
import { parseDocument } from "../utils/parseDocument";
import { extractPdfText } from "../utils/extractPdfText";
import { extractInvoice } from "../utils/documentApi";

const ACCEPTED = '.pdf,.doc,.docx,.xlsx,.csv';
const STEPS = [
    'Document uploaded',
    'Extracting text',
    'Identifying entities',
    'Validating extracted fields',
];

const UploadComponent = (props) => {
    const [dragging, setDragging] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [processingName, setProcessingName] = useState('Processing document');
    const [progress, setProgress] = useState(0)

    const inputRef = useRef(null);

    useEffect(() => {
        if (!processing) return

        const interval = window.setInterval(() => {
            setProgress((current) => {
                const next = Math.min(current + 10, 100)
                if (next >= 100) window.clearInterval(interval)
                return next
            })
        }, 350)

        return () => window.clearInterval(interval)
    }, [processing, processingName])

    useEffect(() => {
        if (!processing || progress < 100) return

        const timeout = window.setTimeout(() => {
            props?.setShowReview(true)
        }, 500)

        return () => window.clearTimeout(timeout)
    }, [processing, progress, processingName])

    const onDrop = (event) => {
        event.preventDefault()
        setDragging(false)
        onFiles(event.dataTransfer.files)
    }

    const onFiles = (files) => {
        if (!files?.length) return;
        startProcessing(files[0])
    }

    const startProcessing = async (file) => {
        props?.setShowReview(false)
        setProgress(0)
        setProcessingName(file.name)
        setProcessing(true);
        try {
            props?.setUploadedFile(file);

            const url = URL.createObjectURL(file);
            props?.setPdfUrl(url);

            // Extract actual text from PDF (Using the newly updated fallback pipeline)
            const result = await extractPdfText(file);
            props?.setExtractedData(result)

            const fields = parseDocument(
                result.text,
                props?.documentType
            );
            // const extracted = await extractInvoice(result.text);
            const extracted = {
                "invoiceType": "airfare",
                "overallConfidence": 1,
                "fields": {
                    "vendorName": {
                        "value": "Paytm",
                        "confidence": 1,
                        "evidence": "Paytm Booking ID : 27083967612"
                    },
                    "invoiceNumber": {
                        "value": "PF2026A001541613",
                        "confidence": 1,
                        "evidence": "Invoice no: PF2026A001541613"
                    },
                    "invoiceDate": {
                        "value": "27 May 2026",
                        "confidence": 1,
                        "evidence": "Invoice Date: 27 May 2026"
                    },
                    "totalAmount": {
                        "value": "10978",
                        "confidence": 1,
                        "evidence": "Total Booking Amount   ₹ 10978"
                    },
                    "currency": {
                        "value": "INR",
                        "confidence": 1,
                        "evidence": "₹"
                    }
                }
            }

            props?.setExtractedFields(fields);

        } catch (error) {
        }
    }

    const parseExtractedText = (text) => {
        const fields = [];

        // Email
        const emailMatch = text.match(
            /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
        );

        if (emailMatch) {
            fields.push({
                label: "Email",
                value: emailMatch[0],
                confidence: "99%",
            });
        }

        // Name - first non-empty line
        const lines = text
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);

        const nameMatch = text.match(
            /^\s*\**([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\**(?=\s+(?:A|a|Web|Developer|Engineer|Software)|\s*$)/m
        );

        if (nameMatch) {
            fields.push({
                label: "Name",
                value: nameMatch[0],
                confidence: "95%",
            });
        }

        return fields;
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
                            checked={props?.documentType === "invoice"}
                            onChange={() => props?.setDocumentType("invoice")}
                        />  <label>Invoice</label>
                    </div>
                    <div className="document-type-selector">
                        <input
                            type="radio"
                            name="documentType"
                            value="resume"
                            checked={props?.documentType === "resume"}
                            onChange={() => props?.setDocumentType("resume")}
                        />  <label>Resume</label>
                    </div>

                </div>
                <div
                    className={`drop-zone${dragging ? " dragging" : ""}`}
                    onDragOver={(event) => {
                        event.preventDefault()
                        setDragging(true)
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                >
                    <div className="upload-icon">↑</div>
                    <h2>Drag & drop your documents here</h2>
                    <p>Upload PDFs, Word documents, spreadsheets or CSV files</p>
                    <button type="button" className="browse-btn" onClick={() => inputRef.current?.click()}>
                        Browse files
                    </button>
                    <input
                        ref={inputRef}
                        id="fileInput"
                        type="file"
                        multiple
                        accept={ACCEPTED}
                        onChange={(event) => {
                            onFiles(event.target.files)
                            event.target.value = ''
                        }}
                    />
                    <div className="file-info">PDF,DOCX,XLSX ,CSV · Maximum25 MB per file</div>
                </div>
            </section>
            {
                (processing || progress > 0) && (
                    <section className="processing-card show">
                        <div className="processing-header">
                            <h3>Processing {processingName}</h3>
                            <span className="percentage">{progress}%</span>
                        </div>
                        <div className="progress">
                            <div className="progress-bar" style={{ width: `${progress}%` }} />
                        </div>
                        <div className="steps">
                            {STEPS.map((label, index) => {
                                const threshold = (index + 1) * 25
                                const completed = progress >= threshold
                                const current = progress >= threshold - 20 && progress < threshold
                                return (
                                    <div key={label} className={`step${completed ? " completed" : current ? " current" : " "}`}>
                                        <div className="step-icon">{completed ? "✓" : index + 1}</div>
                                        {label}
                                    </div>)
                            })}
                        </div>
                    </section>)}
        </div>

    )
}

export default UploadComponent;