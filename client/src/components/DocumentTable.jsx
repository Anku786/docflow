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
  pagination: true,
  paginationPageSize: 10,
  paginationPageSizeSelector: [10, 20, 50],
};

const FileNameCell = memo((params) => {
  const handleClick = (event) => {
    event.preventDefault();
    event.stopPropagation();

    params.context?.onOpen?.(params.data);
  };
  return (<div className="document-name" onClick={handleClick}>
    <span className="file-icon">PDF  ↗</span>
    <strong>{params.data.fileName}</strong>
  </div>)
});

const SkillListCell = memo(({ value, type = "default" }) => {
  const skills = Array.isArray(value)
    ? value
      .map((skill) => skill.trim())
      .filter(Boolean)
    : (value || "")
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

  const visibleSkills = skills.slice(0, 5);
  const remainingSkills = skills.slice(5);
  return (
    <div className={`skills-cell ${type}`}>
      {visibleSkills.map((skill) => (
        <span className="skill-chip" key={skill}>
          {skill}
        </span>
      ))}

      {remainingSkills.length > 0 && (
        <span
          className="skills-more"
          title={skills.join(", ")}
        >
          +{remainingSkills.length} more
        </span>
      )}
    </div>
  );
});

const SkillCell = memo((params) => {
  return (
    <SkillListCell
      value={params?.data?.skills}
      type="default"
    />
  );
});


const MatchedSkillCell = memo((params) => {
  return (
    <SkillListCell
      value={params?.data?.match?.matched_skill}
      type="matched"
    />
  );
});

const MissingSkillCell = memo((params) => {
  return (
    <SkillListCell
      value={params?.data?.match?.missing_skills}
      type="missing"
    />
  );
});

const MatchScoreCell = memo((params) => {
  const score = params.value?.match_score;
  if (score == null) return "-";
  return (
    <span className={`score ${score >= 80 ? "high" : "low"}`}>
      {score}
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
  const columnDefs = useMemo(() => {
    const fileNameColumn = {
      field: "fileName",
      headerName: documentType === "resume" ? "Resume" : "Document",
      filter: "agTextColumnFilter",
      headerComponent: SearchHeader,
      cellRenderer: FileNameCell,
      minWidth: 270,
    };

    if (documentType === "resume") {
      return [
        {
          headerName: "",
          width: 50,
          minWidth: 50,
          maxWidth: 50,
          checkboxSelection: true,
        },
        fileNameColumn,
        {
          field: "candidateName",
          headerName: "Candidate",
          minWidth: 150,
        },
        {
          field: "experience",
          headerName: "Experience",
          width: 180,
          minWidth: 180,
          valueFormatter: formatExperience,
        },
        {
          field: "match",
          headerName: "Match Score",
          width: 130,
          minWidth: 130,
          maxWidth: 160,
          cellRenderer: MatchScoreCell,
        },
        {
          field: "skills",
          headerName: "Skills",
          cellRenderer: SkillCell,
          minWidth: 400,
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
          field: "matched_skills",
          headerName: "Matched Skills",
          cellRenderer: MatchedSkillCell,
          minWidth: 400,
          tooltipValueGetter: (params) => {
            const rawSkills = params.data?.match?.matched_skill || [];

            const skills = (Array.isArray(rawSkills) ? rawSkills : [rawSkills])
              .flatMap((item) => item.split(/,\s*|\s{2,}/))
              .map((skill) => skill.trim())
              .filter(Boolean);

            return skills.join(", ");
          },
        },
        {
          field: "missing_skills",
          headerName: "Missing Skills",
          cellRenderer: MissingSkillCell,
          minWidth: 400,
          tooltipValueGetter: (params) => {
            const rawSkills = params.data?.match?.missing_skills || [];

            const skills = (Array.isArray(rawSkills) ? rawSkills : [rawSkills])
              .flatMap((item) => item.split(/,\s*|\s{2,}/))
              .map((skill) => skill.trim())
              .filter(Boolean);

            return skills.join(", ");
          },
        },
        {
          field: "status",
          headerName: "Status",
          width: 130,
          minWidth: 130,
          maxWidth: 160,
          cellRenderer: StatusCell,
        },
        {
          field: "createdAt",
          headerName: "Uploaded",
          width: 150,
          minWidth: 150,
          valueFormatter: formatUploadedDate,
        },
      ];
    }

    return [
      {
        headerName: "",
        width: 50,
        minWidth: 50,
        maxWidth: 50,
        checkboxSelection: true,
      },
      fileNameColumn,
      {
        headerName: "Confidence",
        field: "confidence",
        cellDataType: "text",
        minWidth: 150,
      },
      {
        headerName: "Vendor",
        field: "vendor",
        headerComponent: SearchHeader,
        minWidth: 300,
      },
      {
        headerName: "Expense Type",
        field: "stay",
        minWidth: 150,
      },
      {
        headerName: "Status",
        field: "status",
        filter: "agTextColumnFilter",
        headerComponent: SearchHeader,
        cellRenderer: StatusCell,
        minWidth: 150,
      },
      {
        headerName: "Amount",
        field: "amount",
        minWidth: 150,
      },
      {
        headerName: "Invoice Date",
        field: "date",
        minWidth: 150,
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
