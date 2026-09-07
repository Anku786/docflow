import { useState } from "react";
import Dashboard from "./components/Dashboard";
import ReviewView from "./components/ReviewView";
import { Topbar } from "./components/Topbar";
import UploadView from "./components/UploadView";
import { Toaster } from "react-hot-toast";

const crumbs = {
  documents: "Documents",
  search: "Search",
  "review-queue": "Review queue",
};

const App = () => {
  const [currentView, setCurrentView] = useState("documents");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const title =
    currentView === "review-queue"
      ? "Review queue"
      : currentView === "search"
        ? "Search"
        : "Documents";
  const subtitle =
    currentView === "review-queue"
      ? "Documents that need attention before they can be verified."
      : "Review and manage your extracted documents.";

  const openReview = (record) => {
    if (record.status === "processing") return;
    setSelectedRecord(record);
  };

  return (
    <div className="app">
      <main className="main">
        <Topbar
          crumb={
            isUploading
              ? "Upload"
              : selectedRecord
                ? selectedRecord.fileName || selectedRecord.name
                : crumbs[currentView]
          }
        />
        <div className={`content${isUploading ? " upload-content" : ""}`}>
          {isUploading ? (
            <UploadView
              onViewAll={() => {
                setIsUploading(false);
                setCurrentView("documents");
              }}
              onBack={() => setIsUploading(false)}
            />
          ) : selectedRecord ? (
            <ReviewView
              document={selectedRecord}
              onBack={() => setSelectedRecord(null)}
            />
          ) : (
            <Dashboard
              title={title}
              subtitle={subtitle}
              onOpen={openReview}
              onUpload={() => setIsUploading(true)}
            />
          )}
        </div>
      </main>
      <Toaster position="top-right" />
    </div>
  );
};

export default App;
