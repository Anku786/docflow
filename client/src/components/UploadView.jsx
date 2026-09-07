import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import DocumentUploader from "./UploadComponent";
import DocumentPreview from "./DocumentPreview";
import { saveDocument } from "../utils/documentApi";
import { saveResume } from "../utils/resumeApi";
import { extractTotalAmount } from "../utils/parseInvoice";
import { extractResumePayload } from "../utils/parseResume";

const UploadView = ({ onViewAll, onBack }) => {
  const [showReview, setShowReview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [documentType, setDocumentType] = useState("invoice");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [extractionResult, setExtractionResult] = useState(null);
  const [extractedFields, setExtractedFields] = useState([]);

  const handleProcessed = useCallback(({ file, previewUrl: nextPreviewUrl, fields, extractionResult: nextExtraction }) => {
    setUploadedFile(file);
    setPreviewUrl(nextPreviewUrl);
    setExtractedFields(fields);
    setExtractionResult(nextExtraction);
    setShowReview(true);
  }, []);

  const handleSave = async (status) => {
    if (documentType === "resume") {
      await handleSaveResume(status);
    } else {
      await handleSaveDocument(status);
    }
  };

  const handleSaveDocument = async (status) => {
    const totalAmount = extractTotalAmount(extractionResult?.text);
    try {
      const result = await saveDocument({
        file: uploadedFile,
        extractedData: extractedFields,
        status,
        documentType,
        amount: totalAmount,
      });

      if (result?.success) {
        toast.success("Document saved successfully!");
        onViewAll ? onViewAll() : onBack();
      }
    } catch (error) {
      toast.error("Failed to save document!");
    }
  };

  const handleSaveResume = async (status) => {
    try {
      const payload = extractResumePayload(extractedFields);
      const result = await saveResume({
        ...payload,
        file: uploadedFile,
        extractedData: extractedFields,
        status,
        documentType,
      });

      if (result?.success) {
        toast.success("Resume saved successfully!");
        onViewAll ? onViewAll() : onBack();
      }
    } catch (error) {
      toast.error("Failed to save resume!");
    }
  };

  return (
    <div className="upload-view">
      <section className="upload-header">
        <h1>Upload documents</h1>
        <p>Turn messy documents into structured, queryable data.</p>
      </section>

      <DocumentUploader
        documentType={documentType}
        onDocumentTypeChange={setDocumentType}
        onProcessed={handleProcessed}
      />

      {showReview && (
        <DocumentPreview
          preview={{
            fileUrl: previewUrl,
            fileName: uploadedFile?.name,
            extractedData: extractedFields,
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default UploadView;
