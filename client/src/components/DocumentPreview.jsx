import React from "react";
import { BASE_URL } from "../utils/documentApi";

const DocumentPreview = ({ document, handleSaveDocument }) => {
console.log(document)
    return (
        <section className="upload-review-panel show">
            <div className="upload-review-header">
                <div className="upload-review-title">
                    <span>📄</span>
                    <strong>{document?.fileName}</strong>
                </div>
                <div className='button-container'>
                    <button onClick={() => handleSaveDocument("draft")} type="button" className="draft-btn">
                        📄 Save Draft
                    </button>
                    <button onClick={() => handleSaveDocument("approved")} type="button" className="approve-btn">
                        ✓ Approve
                    </button>
                    <button onClick={() => handleSaveDocument("declined")} type="button" className="decline-btn">
                        x Decline
                    </button>
                </div>
            </div>
            <div className="review-body">

                {/* LEFT SIDE — Actual PDF */}

                <div className="document-preview">

                    {document?.fileUrl ? (
                        <iframe
                            src={`${BASE_URL}${document.fileUrl}`}
                            title={document?.fileName}
                            className="pdf-viewer"
                        />
                    ) : (
                        <div className="empty-preview">
                            No document selected
                        </div>
                    )}

                </div>


                {/* RIGHT SIDE — Extracted Data */}

                <div className="extracted">
                    <h3>Extracted data</h3>

                    {document?.extractedData.length > 0 ? (
                        document?.extractedData.map((field) => (
                            <div
                                className="upload-field"
                                key={field.label}
                            >
                                <div className="upload-field-label">
                                    {field.label}
                                </div>

                                <div className="upload-field-value">
                                    <span>{field.value}</span>

                                    <span className="upload-confidence">
                                        {field.confidence}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>No data extracted yet.</p>
                    )}
                </div>

            </div>
        </section>
    )
}

export default DocumentPreview;