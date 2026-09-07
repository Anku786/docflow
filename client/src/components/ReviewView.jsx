import { useEffect, useState } from 'react'
import DocumentPreview from './DocumentPreview'
import { updateDocumentStatus } from '../utils/documentApi';
import toast from "react-hot-toast";

const ReviewView = ({ document, onBack }) => {
  

  const updateDocument = async (status) => {
    try {
      const result = await updateDocumentStatus(document._id, {
        status
      });

      if (result?.success) {
        toast.success("Document updated successfully!");
      }

    } catch (error) {
      toast.error("Failed to update document!");
    }
    
  };

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

      <DocumentPreview document={document} handleSaveDocument={updateDocument} />

    </section>
  )
}

export default ReviewView