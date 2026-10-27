const statusClass = {
  Open: 'status-open',
  'In Progress': 'status-progress',
  Resolved: 'status-resolved',
};

export default function StatusBadge({ status }) {
  return <span className={`status-badge ${statusClass[status] || ''}`}>{status}</span>;
}