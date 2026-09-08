import React from "react";


const EmptyWrapper = ({ onUpload }) => {
    return (
        <div>
            <section className="empty-state">
                <div className="empty-icon">
                    📄
                </div>
                <h2>No documents yet</h2>
                <p>
                    Upload your first document and DocFlow will extract
                    important information and organize it into structured data.
                </p>
                <button className="primary-button" onClick={onUpload}>
                    Upload your first document
                </button>
                <div className="file-info">
                    Supports PDF documents
                </div>
            </section>

            <section className="section">
                <div className="section-header">
                    <h3>How it works</h3>
                    <p>
                        From messy documents to structured data in a few steps.
                    </p>
                </div>
                <div className="steps">
                    <div className="step">
                        <div className="step-number">1</div>
                        <h4>Upload a document</h4>
                        <p>
                            Upload a PDF such as a resume, invoice,
                            receipt, or other business document.
                        </p>
                    </div>
                    <div className="step">
                        <div className="step-number">2</div>
                        <h4>Extract information</h4>
                        <p>
                            DocFlow reads the document, detects its type,
                            and extracts important fields.
                        </p>
                    </div>
                    <div className="step">
                        <div className="step-number">3</div>
                        <h4>Review and query</h4>
                        <p>
                            Review the extracted information and search
                            across your processed documents.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default EmptyWrapper;
