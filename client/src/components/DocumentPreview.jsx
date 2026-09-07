import { BASE_URL } from "../utils/documentApi";

const getPreviewSrc = (fileUrl) => {
    if (!fileUrl) return null;
    if (fileUrl.startsWith("blob:") || fileUrl.startsWith("http")) {
        return fileUrl;
    }
    return `${BASE_URL}${fileUrl}`;
};

const DocumentPreview = ({ preview, onSave }) => {
    const fields = Array.isArray(preview?.extractedData)
        ? preview.extractedData
        : [];
    const previewSrc = getPreviewSrc(preview?.fileUrl);

    return (
        <section className="upload-review-panel show">
            <div className="upload-review-header">
                <div className="upload-review-title">
                    <span>📄</span>
                    <strong>{preview?.fileName}</strong>
                </div>
                <div className="button-container">
                    <button onClick={() => onSave("draft")} type="button" className="draft-btn">
                        📄 Save Draft
                    </button>
                    <button onClick={() => onSave("approved")} type="button" className="approve-btn">
                        ✓ Approve
                    </button>
                    <button onClick={() => onSave("declined")} type="button" className="decline-btn">
                        x Decline
                    </button>
                </div>
            </div>
            <div className="review-body">
                <div className="document-preview">
                    {previewSrc ? (
                        <iframe
                            src={previewSrc}
                            title={preview?.fileName}
                            className="pdf-viewer"
                        />
                    ) : (
                        <div className="empty-preview">
                            No document selected
                        </div>
                    )}
                </div>

                <div className="extracted">
                    <h3>Extracted data</h3>
                    {fields.length > 0 ? (
                        fields.map((field, index) => (
                            <div
                                className="upload-field"
                                key={`${field.label}-${index}`}
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
    );
};

export default DocumentPreview;
