import { useMemo, useState, useEffect } from 'react'
import StatusBadge from './StatusBadge'
import UploadComponent from './UploadComponent'
import EmptyWrapper from './EmptyWrapper'
import DocumentTable from './DocumentTable'
import ReviewView from './ReviewView'
import { deleteDocuments, getDocuments } from '../utils/documentApi'
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import toast from "react-hot-toast";
import { deleteResumes, getResumes } from '../utils/resumeApi'



const typeFilters = [
  { value: 'invoice', label: 'Invoice' },
  { value: 'resume', label: 'Resume' },
]


const Dashboard = ({ documents, title, subtitle, onOpen, onUpload }) => {
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [type, setType] = useState("");

  useEffect(() => {
    if (type === "resume") {
      fetchResumeData()
    } else {
      fetchData()
    }
  }, [type]);

  const fetchData = async () => {
    try {
      const result = await getDocuments();
      console.log(result?.data)
      setTableData(result?.data || []);
    } catch (error) {
      console.error("Fetch documents failed:", error);
    }
  };

  const fetchResumeData = async () => {
    try {
      const result = await getResumes();
      console.log(result?.data)
      setTableData(result?.data || []);
    } catch (error) {
      console.error("Fetch documents failed:", error);
    }
  }

  const handleBulkDelete = async () => {
    try {
      const callAPI =
        type === "resume"
          ? deleteResumes
          : deleteDocuments;

      const response = await callAPI(selectedDocuments);

      if (response?.success) {
        setSelectedDocuments([])
        if (type === "resume") {
          fetchResumeData()
        } else {
          fetchData()
        }
        toast.success("Document deleted successfully!");
      }

    } catch (error) {
      toast.error("Failed to delete document!");
    }
  }

  return (
    <section>
      <div className="page-header">
        <div className="page-title">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <button type="button" className="primary-button" onClick={onUpload}>
          + Upload document
        </button>
      </div>
      {selectedDoc && (<ReviewView document={selectedDoc} onBack={() => setSelectedDoc(null)} />)}

      <section className="documents-section">

        <div className="documents-header">
          <div className="header">

            <h3>Recent documents</h3>
            <div className='filters'>
              <select
                className="filter"
                value={type}
                onChange={(event) => setType(event.target.value)}
                aria-label="Filter by type"
              >
                {typeFilters.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <IconButton
                color="error"
                onClick={handleBulkDelete}
                disabled={selectedDocuments.length === 0}
                aria-label="delete selected documents"
              >
                <DeleteIcon />
              </IconButton>
            </div>
          </div>
        </div>
        {tableData?.length ?
          <DocumentTable type={type} tableData={tableData} setTableData={setTableData} setSelectedDoc={setSelectedDoc} setSelectedDocuments={setSelectedDocuments} />
          :
          <EmptyWrapper onUpload={onUpload} />
        }
      </section>



    </section>
  )
}

export default Dashboard





















