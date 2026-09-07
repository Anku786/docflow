const labels = {
  draft: "Draft",
  approved: "Approved",
  declined: "Declined",
};

const StatusBadge = ({ status }) => {
  return (
    <span className={`status ${status}`}>
      <span className="status-dot" />
      {labels[status]}
    </span>
  );
};

export default StatusBadge;
