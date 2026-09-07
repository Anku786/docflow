import React, { useEffect, useMemo, useState } from 'react'
import { AgGridReact } from 'ag-grid-react'
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community'

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import "./AgGrid.css";
import StatusBadge from './StatusBadge';
import { SearchHeader } from '../utils/SearchHeader';

ModuleRegistry.registerModules([AllCommunityModule])

const gridOptions = {
    rowHeight: 50,
    headerHeight: 80,
};


const DocumentTable = ({ type, tableData, setTableData, setSelectedDoc, setSelectedDocuments }) => {
    const ResumeColumnDefs = [
        {
            headerName: "",
            width: 50,
            checkboxSelection: true,
        },
        {
            field: "fileName",
            headerName: "Resume",
            flex: 1.5,
            cellRenderer: (params) => (
                <div className="document-name">
                    <div onClick={() => setSelectedDoc(params?.data)} className="file-icon">PDF</div>

                    <div>
                        <strong>{params.data.fileName}</strong>
                    </div>
                </div>
            )
        },
        {
            field: "candidateName",
            headerName: "Candidate",
            flex: 1,
        },
        {
            field: "experience",
            headerName: "Experience",
            width: 120,
            valueFormatter: (params) =>
                params.value ? `${params.value} years` : "-",
        },
        {
            field: "skills",
            headerName: "Skills",
            flex: 1.5,
            valueFormatter: (params) => {
                if (!Array.isArray(params.value)) return "-";

                const skills = params.value.slice(0, 3);
                const remaining = params.value.length - skills.length;

                return `${skills.join(", ")}${remaining > 0 ? ` +${remaining}` : ""}`;
            },
        },
        {
            field: "matchScore",
            headerName: "Match Score",
            width: 130,
            cellRenderer: (params) => {
                const score = params.value;

                if (score == null) return "-";

                return (
                    <span className={`score ${score >= 80 ? "high" : "low"}`}>
                        {score}%
                    </span>
                );
            },
        },
        {
            field: "status",
            headerName: "Status",
            width: 130,
            cellRenderer: (params) => (
                <span className={`status ${params.value}`}>
                    <span className="status-dot" />
                    {params.value}
                </span>
            ),
        },
        {
            field: "createdAt",
            headerName: "Uploaded",
            width: 130,
            valueFormatter: (params) => {
                if (!params.value) return "-";

                return new Date(params.value).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                });
            },
        },
    ];

    const InvoiceColumnDefs = [
        {
            headerName: "",
            width: 50,
            checkboxSelection: true,
        },
        {
            headerName: 'Document',
            field: 'fileName',
            filter: 'agTextColumnFilter',
            headerComponent: SearchHeader,
            flex: 2,
            cellRenderer: (params) => (
                <div className="document-name">
                    <div onClick={() => setSelectedDoc(params?.data)} className="file-icon">PDF</div>

                    <div>
                        <strong>{params.data.fileName}</strong>
                    </div>
                </div>
            )
        },
        {
            headerName: 'Type',
            field: 'documentType',
            filter: 'agTextColumnFilter',
            headerComponent: SearchHeader,
            flex: 1,
        }, {
            headerName: 'Status',
            field: 'status',
            filter: 'agTextColumnFilter',
            headerComponent: SearchHeader,
            flex: 1,
            cellRenderer: (params) => (
                <StatusBadge status={params.value} />
            ),
        },
        {
            headerName: 'Amount',
            field: 'amount',
            flex: 1,
        },
    ]

    const onSelectionChanged = (event) => {
        const selectedRows = event.api.getSelectedRows();
        setSelectedDocuments(selectedRows);
    };

    return (

        <div
            className="ag-theme-quartz documents-grid"
            style={{ width: "100%", height: 500 }}
        >
            <AgGridReact
                rowData={tableData}
                columnDefs={type === "resume" ? ResumeColumnDefs : InvoiceColumnDefs}
                gridOptions={gridOptions}
                rowSelection="multiple"
                onSelectionChanged={onSelectionChanged}
                animateRows
            />
        </div>


    );
};

export default DocumentTable;