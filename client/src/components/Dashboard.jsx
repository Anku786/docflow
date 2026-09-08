import { memo, useCallback, useEffect, useMemo, useState } from "react";
import EmptyWrapper from "./EmptyWrapper";
import DocumentTable from "./DocumentTable";
import { deleteDocuments, getDocuments } from "../utils/documentApi";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import toast from "react-hot-toast";
import { deleteResumes, getResumes } from "../utils/resumeApi";

const TYPE_FILTERS = [
  { value: "invoice", label: "Invoice" },
  { value: "resume", label: "Resume" },
];

const Dashboard = ({ title, subtitle, onOpen, onUpload, onLoadingChange }) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [rows, setRows] = useState([]);
  const [documentType, setDocumentType] = useState("resume");

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const loadRows = async () => {
      onLoadingChange(true);
      try {
        const result =
          documentType === "resume"
            ? await getResumes(controller.signal)
            : await getDocuments(controller.signal);

        if (cancelled || controller.signal.aborted) {
          return;
        }

        setRows(result?.data || []);
        setSelectedIds([]);
      } catch (error) {
        if (cancelled || error.name === "AbortError") {
          return;
        }
        toast.error("Failed to load documents");
      } finally {
        if (!cancelled) {
          onLoadingChange(false);
        }
      }
    };

    loadRows();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [documentType, onLoadingChange]);

  const handleBulkDelete = useCallback(async () => {
    onLoadingChange(true)
    try {
      const deleteRecords =
        documentType === "resume" ? deleteResumes : deleteDocuments;
      const response = await deleteRecords(selectedIds);
      onLoadingChange(false)
      if (response?.success) {
        setSelectedIds([]);
        setRows((current) =>
          current.filter((row) => !selectedIds.includes(row._id))
        );
        toast.success("Document deleted successfully!");
      }
    } catch (error) {
      onLoadingChange(false)
      toast.error("Failed to delete document!");
    }
  }, [documentType, selectedIds]);

  const handleTypeChange = useCallback((event) => {
    setDocumentType(event.target.value);
  }, []);

  const hasRows = useMemo(() => rows.length > 0, [rows]);
  const isDeleteDisabled = useMemo(
    () => selectedIds.length === 0,
    [selectedIds]
  );

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

      <section className="documents-section">
        <div className="documents-header">
          <div className="header">
            <div className="filters">
              <h3>Recent documents</h3>
              <select
                className="filter"
                value={documentType}
                onChange={handleTypeChange}
                aria-label="Filter by type"
              >
                {TYPE_FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <IconButton
              color="error"
              onClick={handleBulkDelete}
              disabled={isDeleteDisabled}
              aria-label="delete selected documents"
            >
              <DeleteIcon />
            </IconButton>
          </div>
        </div>
        {hasRows ? (
          <DocumentTable
            documentType={documentType}
            rows={rows}
            onOpen={onOpen}
            onSelectionChange={setSelectedIds}
          />
        ) : (
          <EmptyWrapper onUpload={onUpload} />
        )}
      </section>
    </section>
  );
};

export default memo(Dashboard);
