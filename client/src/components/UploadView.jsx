import { memo, useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import DocumentUploader from "./UploadComponent";
import DocumentPreview from "./DocumentPreview";
import { saveDocument } from "../utils/documentApi";
import { saveResume } from "../utils/resumeApi";
import { extractTotalAmount } from "../utils/parseInvoice";
import { extractResumePayload } from "../utils/parseResume";

const UploadView = ({ onViewAll, onBack, setLoading }) => {
  const [showReview, setShowReview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [documentType, setDocumentType] = useState("invoice");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [extractionResult, setExtractionResult] = useState(null);
  const [extractedFields, setExtractedFields] = useState([]);

  const handleProcessed = useCallback(({ file, previewUrl: nextPreviewUrl, fields, extractionResult: nextExtraction, setLoading }) => {
    setUploadedFile(file);
    setPreviewUrl(nextPreviewUrl);
    setExtractedFields(fields);
    setExtractionResult(nextExtraction);
    setShowReview(true);
  }, []);

  const goBack = useCallback(() => {
    onViewAll ? onViewAll() : onBack();
  }, [onViewAll, onBack]);

  const handleSaveDocument = useCallback(async (status) => {
    setLoading(true)
    const totalAmount = extractTotalAmount(extractionResult?.text);
    try {
      const result = await saveDocument({
        file: uploadedFile,
        extractedData: extractedFields,
        status,
        documentType,
        amount: totalAmount,
      });
      setLoading(false)
      if (result?.success) {
        toast.success("Document saved successfully!");
        goBack();
      }
    } catch (error) {
      toast.error("Failed to save document!");
      setLoading(false)
    }
  }, [documentType, extractedFields, extractionResult, goBack, uploadedFile]);

  const handleSaveResume = useCallback(async (status) => {
    setLoading(true)
    try {
      const payload = extractResumePayload(extractedFields);
      const result = await saveResume({
        ...payload,
        file: uploadedFile,
        extractedData: extractedFields,
        status,
        documentType,
      });
      setLoading(false)
      if (result?.success) {
        toast.success("Resume saved successfully!");
        goBack();
      }
    } catch (error) {
      setLoading(false)
      toast.error("Failed to save resume!");
    }
  }, [documentType, extractedFields, goBack, uploadedFile]);

  const handleSave = useCallback(async (status) => {
    if (documentType === "resume") {
      await handleSaveResume(status);
    } else {
      await handleSaveDocument(status);
    }
  }, [documentType, handleSaveDocument, handleSaveResume]);

  const preview = useMemo(
    () => ({
      fileUrl: previewUrl,
      fileName: uploadedFile?.name,
      extractedData: extractedFields,
    }),
    [extractedFields, previewUrl, uploadedFile?.name]
  );

  return (
    <div className="upload-view">
      <div className="review-header">
        <button
          type="button"
          className="back-button"
          onClick={onBack}
          aria-label="Back to documents"
        >
          ←
        </button>
      </div>
      <section className="upload-header">
        <h1>Upload documents</h1>
        <p>Turn messy documents into structured, queryable data.</p>
      </section>

      <DocumentUploader
        documentType={documentType}
        onDocumentTypeChange={setDocumentType}
        onProcessed={handleProcessed}
        setLoading={setLoading}
      />

      {showReview && (
        <DocumentPreview
          preview={preview}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default memo(UploadView);
