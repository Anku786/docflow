import { memo, useCallback, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import "./AgGrid.css";
import StatusBadge from "./StatusBadge";
import { SearchHeader } from "./SearchHeader";

ModuleRegistry.registerModules([AllCommunityModule]);

const GRID_OPTIONS = {
  rowHeight: 60,
  headerHeight: 80,
  rowBuffer: 8,
  suppressRowVirtualisation: false,
  suppressColumnVirtualisation: false,
  animateRows: false,
};

const FileNameCell = memo((params) => (
  <div className="document-name" onClick={() => params.context?.onOpen?.(params.data)}>
    <span className="file-icon">PDF  ↗</span>
      <strong>{params.data.fileName}</strong>
  </div>
));

const SkillCell = memo((params) => {
  const rawSkills = params?.data?.skills || [];

  const skills = (Array.isArray(rawSkills) ? rawSkills : [rawSkills])
    .flatMap((item) => item.split(/,\s*|\s{2,}/))
    .map((skill) => skill.trim())
    .filter(Boolean);

  const visibleSkills = skills.slice(0, 5);
  const remainingSkills = skills.slice(5);

  return (
    <div className="skills-cell">
      {visibleSkills.map((skill) => (
        <span className="skill-chip" key={skill}>
          {skill}
        </span>
      ))}

      {remainingSkills.length > 0 && (
        <span className="skills-more">
          +{remainingSkills.length} more
        </span>
      )}
    </div>
  );
});

const MatchScoreCell = memo((params) => {
  const score = params.value;
  if (score == null) return "-";
  return (
    <span className={`score ${score >= 80 ? "high" : "low"}`}>
      {score}%
    </span>
  );
});

const StatusCell = memo((params) => <StatusBadge status={params.value} />);

const formatExperience = (params) =>
  params.value ? `${params.value}` : "-";

const formatSkills = (params) => {
  if (!Array.isArray(params.value)) return "-";
  const skills = params.value.slice(0, 3);
  const remaining = params.value.length - skills.length;
  return `${skills.join(", ")}${remaining > 0 ? ` +${remaining}` : ""}`;
};

const formatUploadedDate = (params) => {
  if (!params.value) return "-";
  return new Date(params.value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const DocumentTable = ({ documentType, rows, onOpen, onSelectionChange }) => {
  console.log(rows)
  const columnDefs = useMemo(() => {
    const fileNameColumn = {
      field: "fileName",
      headerName: documentType === "resume" ? "Resume" : "Document",
      flex: documentType === "resume" ? 1.5 : 2,
      filter: "agTextColumnFilter",
      headerComponent: SearchHeader,
      cellRenderer: FileNameCell,
    };

    if (documentType === "resume") {
      return [
        {
          headerName: "",
          width: 50,
          checkboxSelection: true,
        },
        fileNameColumn,
        {
          field: "candidateName",
          headerName: "Candidate",
          flex: 1,
        },
        {
          field: "experience",
          headerName: "Experience",
          width: 120,
          valueFormatter: formatExperience,
        },
        {
          field: "skills",
          headerName: "Skills",
          flex: 1.5,
          cellRenderer: SkillCell,
          tooltipValueGetter: (params) => {
            const rawSkills = params.data?.skills || [];

            const skills = (Array.isArray(rawSkills) ? rawSkills : [rawSkills])
              .flatMap((item) => item.split(/,\s*|\s{2,}/))
              .map((skill) => skill.trim())
              .filter(Boolean);

            return skills.join(", ");
          },
        },
        {
          field: "matchScore",
          headerName: "Match Score",
          width: 130,
          cellRenderer: MatchScoreCell,
        },
        {
          field: "status",
          headerName: "Status",
          width: 130,
          cellRenderer: StatusCell,
        },
        {
          field: "createdAt",
          headerName: "Uploaded",
          width: 130,
          valueFormatter: formatUploadedDate,
        },
      ];
    }

    return [
      {
        headerName: "",
        width: 50,
        checkboxSelection: true,
      },
      fileNameColumn,
      {
        headerName: "Type",
        field: "documentType",
        filter: "agTextColumnFilter",
        headerComponent: SearchHeader,
        flex: 1,
      },
      {
        headerName: "Status",
        field: "status",
        filter: "agTextColumnFilter",
        headerComponent: SearchHeader,
        flex: 1,
        cellRenderer: StatusCell,
      },
      {
        headerName: "Amount",
        field: "amount",
        flex: 1,
      },
    ];
  }, [documentType]);

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      resizable: true,
    }),
    []
  );

  const context = useMemo(() => ({ onOpen }), [onOpen]);

  const onSelectionChanged = useCallback(
    (event) => {
      const selectedRows = event.api.getSelectedRows();
      onSelectionChange(selectedRows.map((row) => row._id).filter(Boolean));
    },
    [onSelectionChange]
  );

  const getRowId = useCallback((params) => params.data._id, []);

  return (
    <div
      className="ag-theme-quartz documents-grid"
      style={{ width: "100%", height: 500 }}
    >
      <AgGridReact
        rowData={rows}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        gridOptions={GRID_OPTIONS}
        context={context}
        rowSelection="multiple"
        onSelectionChanged={onSelectionChanged}
        getRowId={getRowId}
        tooltipShowDelay={300}
      />
    </div>
  );
};

export default memo(DocumentTable);
