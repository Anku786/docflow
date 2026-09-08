import { useCallback } from "react";
import toast from "react-hot-toast";
import DocumentPreview from "./DocumentPreview";
import { updateDocumentStatus } from "../utils/documentApi";
import { updateResume } from "../utils/resumeApi";

const ReviewView = ({ document: record, onBack, setLoading }) => {
  const updateRecord = useCallback(async (status) => {
    setLoading(true)
    try {
      const isResume = Array.isArray(record.skills) || "candidateName" in record;
      const result = isResume
        ? await updateResume(record._id, status)
        : await updateDocumentStatus(record._id, status);
      setLoading(false)
      if (result?.success) {
        toast.success("Document updated successfully!");
        onBack();
      }
    } catch (error) {
      setLoading(false)
      toast.error("Failed to update document!");
    }
  }, [onBack, record]);

  return (
    <section className="review-view">
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

      <DocumentPreview preview={record} onSave={updateRecord} />
    </section>
  );
};

export default ReviewView;
