import { memo, useCallback, useEffect, useMemo, useState } from "react";
import Dashboard from "./components/Dashboard";
import ReviewView from "./components/ReviewView";
import { Topbar } from "./components/Topbar";
import UploadView from "./components/UploadView";
import { Toaster } from "react-hot-toast";
import Loader from "./components/common/LoadingOverlay";

const crumbs = {
  documents: "Documents",
  search: "Search",
  "review-queue": "Review queue",
};

const App = () => {
  const [currentView, setCurrentView] = useState("documents");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const title = useMemo(
    () =>
      currentView === "review-queue"
        ? "Review queue"
        : currentView === "search"
          ? "Search"
          : "Documents",
    [currentView]
  );

  const subtitle = useMemo(
    () =>
      currentView === "review-queue"
        ? "Documents that need attention before they can be verified."
        : "Review and manage your extracted documents.",
    [currentView]
  );

  const crumb = useMemo(() => {
    if (isUploading) return "Upload";
    if (selectedRecord) return selectedRecord.fileName || selectedRecord.name;
    return crumbs[currentView];
  }, [currentView, isUploading, selectedRecord]);

  const contentClassName = useMemo(
    () => `content${isUploading ? " upload-content" : ""}`,
    [isUploading]
  );

  const openReview = useCallback((record) => {
    if (record.status === "processing") return;
    setSelectedRecord(record);
  }, []);

  const handleUpload = useCallback(() => {
    setIsUploading(true);
  }, []);

  const handleUploadBack = useCallback(() => {
    setIsUploading(false);
  }, []);

  const handleViewAll = useCallback(() => {
    setIsUploading(false);
    setCurrentView("documents");
  }, []);

  const handleReviewBack = useCallback(() => {
    setSelectedRecord(null);
  }, []);
  const handleLoading = useCallback((value) => {
    setIsLoading(value);
  }, []);
  return (
    <Loader isActive={isLoading}>
      <div className="app">
        <main className="main">
          <Topbar crumb={crumb} />
          <div className={contentClassName}>
            {isUploading ? (
              <UploadView
                onViewAll={handleViewAll}
                onBack={handleUploadBack}
                setLoading={handleLoading}
              />
            ) : selectedRecord ? (
              <ReviewView
                document={selectedRecord}
                onBack={handleReviewBack}
                setLoading={handleLoading}
              />
            ) : (
              <Dashboard
                title={title}
                subtitle={subtitle}
                onOpen={openReview}
                onUpload={handleUpload}
                onLoadingChange={handleLoading}
              />
            )}
          </div>
        </main>
        <Toaster position="top-right" />
      </div>
    </Loader>
  );
};

export default App;
