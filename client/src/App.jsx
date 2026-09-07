import { useMemo, useState } from 'react'
import Dashboard from './components/Dashboard'
import ReviewView from './components/ReviewView'
import { Topbar } from './components/Topbar'
import UploadView from './components/UploadView'
import { Toaster } from "react-hot-toast";


const crumbs = {
  documents: 'Documents',
  search: 'Search',
  'review-queue': 'Review queue',
}

const App = () => {
  const [nav, setNav] = useState('documents')
  const [selected, setSelected] = useState(null)
  const [uploading, setUploading] = useState(false)


  const title =
    nav === 'review-queue' ? 'Review queue' : nav === 'search' ? 'Search' : 'Documents'
  const subtitle =
    nav === 'review-queue'
      ? 'Documents that need attention before they can be verified.'
      : 'Review and manage your extracted documents.'

  const openReview = (doc) => {
    if (doc.status === 'processing') return;
    setSelected(doc)
  }

  return (
    <div className="app">
      <main className="main">
        <Topbar crumb={uploading ? 'Upload' : selected ? selected.name : crumbs[nav]} />
        <div className={`content${uploading ? ' upload-content' : ''}`}>
          {uploading ? (
            <UploadView
              onViewAll={() => {
                setUploading(false)
                setNav('documents')
              }}
              onBack={() => setUploading(false)}
            />
          ) : selected ? (
            <ReviewView document={selected} onBack={() => setSelected(null)} />
          ) : (
            <Dashboard
              title={title}
              subtitle={subtitle}
              onOpen={openReview}
              onUpload={() => setUploading(true)}
            />
          )}
        </div>
      </main>
      <Toaster position="top-right" />
    </div>
  )
}

export default App