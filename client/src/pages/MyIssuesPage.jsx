import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Plus, Search } from 'lucide-react';
import { api } from '../services/api.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function MyIssuesPage() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api.listIssues({ page: 1, limit: 50, status: filter })
      .then((result) => { if (active) setIssues(result.data); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filter, refresh]);

  return (
    <section>
      <div className="page-heading">
        <div><p className="eyebrow">YOUR CAMPUS, IN PROGRESS</p><h1>My issues</h1><p className="page-subtitle">Keep an eye on the things you’ve reported.</p></div>
        <Link className="button button-primary" to="/report"><Plus size={18} /> Report an issue</Link>
      </div>
      <div className="toolbar">
        <div className="toolbar-title"><Search size={17} /><span>{issues.length} {issues.length === 1 ? 'report' : 'reports'}</span></div>
        <label className="select-wrap"><span className="sr-only">Filter by status</span><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="">All statuses</option><option>Open</option><option>In Progress</option><option>Resolved</option></select></label>
      </div>
      {loading ? <div className="state-panel" role="status">Loading your issues…</div> : error ? <div className="alert alert-error" role="alert">{error} <button className="text-button" onClick={() => setRefresh((value) => value + 1)}>Try again</button></div> : issues.length === 0 ? (
        <div className="empty-state"><span className="empty-icon"><Search size={24} /></span><h2>{filter ? 'No matching reports' : 'Nothing reported yet'}</h2><p>{filter ? 'Try another status filter.' : 'When something needs attention, it’ll show up here.'}</p>{!filter && <Link className="button button-secondary" to="/report"><Plus size={17} /> Create your first report</Link>}</div>
      ) : (
        <div className="issue-list">{issues.map((issue) => <Link className="issue-row" to={`/issues/${issue._id}`} key={issue._id}>
          <span className="issue-category">{issue.category}</span><div className="issue-row-main"><h2>{issue.title}</h2><p><MapPin size={14} /> {issue.location} <span className="meta-dot">·</span> {new Date(issue.createdAt).toLocaleDateString()}</p></div>
          <span className={`priority-mark priority-${issue.priority.toLowerCase()}`}>{issue.priority}</span><StatusBadge status={issue.status} /><ArrowRight className="row-arrow" size={17} />
        </Link>)}</div>
      )}
    </section>
  );
}