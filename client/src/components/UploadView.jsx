import { useEffect, useRef, useState } from 'react';
import { parseDocument } from "../utils/parseDocument";
import { saveDocument } from "../utils/documentApi";
import UploadComponent from './UploadComponent';
import { fileToBase64 } from '../utils/common';
import DocumentPreview from './DocumentPreview';
import { extractTotalAmount } from '../utils/parseInvoice';
import toast from "react-hot-toast";
import { saveResume } from '../utils/resumeApi';
import { extractResumePayload } from '../utils/extractPdfText';


const UploadView = ({ onViewAll, onBack }) => {
  const [showReview, setShowReview] = useState(false);
  const [reviewFile, setReviewFile] = useState('');
  const [pdfUrl, setPdfUrl] = useState(null);
  const [documentType, setDocumentType] = useState("invoice");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [extractedData, setExtractedData] = useState("");
  const [extractedFields, setExtractedFields] = useState([]);
  const reviewRef = useRef(null);

  const handleSave = async (status) => {
    if (documentType === "resume") {
      handleSaveResume(status)
    } else {
      handleSaveDocument(status)
    }
  };

  const handleSaveDocument = async (status) => {
    const totalAmount = extractTotalAmount(extractedData?.text);
    try {
      const result = await saveDocument({
        file: uploadedFile,
        extractedData: extractedFields,
        status,
        documentType,
        amount: totalAmount
      });

      if (result?.success) {
        toast.success("Document saved successfully!");
      }


    } catch (error) {
      toast.error("Failed to save document!");
    }
  };

  const handleSaveResume = async (status) => {
    try {
      const paylaod = extractResumePayload(extractedFields)
      const result = await saveResume({
        ...paylaod,
        file: uploadedFile,
        extractedData: extractedFields,
        status,
        documentType,
      });

      if (result?.success) {
        toast.success("Document saved successfully!");
        onBack()
      }

    } catch (error) {
      console.log(error)
      toast.error("Failed to save document!");
    }
  }


  return (
    <div className="upload-view">
      <section className="upload-header">
        <h1>Upload documents</h1>
        <p>Turn messy documents into structured, queryable data.</p>
      </section>

      <UploadComponent
        documentType={documentType}
        setDocumentType={setDocumentType}
        setShowReview={setShowReview}
        setPdfUrl={setPdfUrl}
        setExtractedFields={setExtractedFields}
        setUploadedFile={setUploadedFile}
        setExtractedData={setExtractedData}
      />

      {showReview && (
        <DocumentPreview
          document={{ ...document, url: pdfUrl, fileName: uploadedFile.name, extractedData: extractedFields }}
          handleSaveDocument={handleSave}
        />
      )}

    </div>
  )
}

export default UploadView
