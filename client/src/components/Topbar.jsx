export function Topbar({ crumb }) {
  return (
    <header className="topbar">
      <div className="breadcrumb">
        Workspace / <strong>{crumb}</strong>
      </div>
    </header>
  )
}