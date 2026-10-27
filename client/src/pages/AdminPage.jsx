import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Search } from 'lucide-react';
import { api } from '../services/api.js';
import StatusBadge from '../components/StatusBadge.jsx';

const categories = ['Electrical', 'Plumbing', 'Network', 'Furniture', 'Cleanliness', 'Other'];

export default function AdminPage() {
  const [filters, setFilters] = useState({ status: '', category: '', priority: '', search: '' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ data: [], pagination: { pages: 1, total: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadIssues(nextPage = page, nextFilters = filters) {
    setLoading(true);
    setError('');
    try {
      setResult(await api.listIssues({ ...nextFilters, page: nextPage, limit: 20 }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadIssues(page, filters); }, [filters, page]);

  function applySearch(event) {
    event.preventDefault();
    setPage(1);
    setFilters((current) => ({ ...current, search }));
  }

  async function changeStatus(issue, status) {
    try {
      await api.updateStatus(issue._id, status);
      loadIssues();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function changePriority(issue, priority) {
    try {
      await api.updatePriority(issue._id, priority);
      loadIssues();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function removeIssue(issue) {
    if (!window.confirm(`Delete “${issue.title}” and its comments?`)) return;
    try {
      await api.deleteIssue(issue._id);
      loadIssues();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  const pages = Math.max(1, result.pagination?.pages || 1);

  return (
    <section>
      <div className="page-heading"><div><p className="eyebrow">FACILITIES / OPERATIONS</p><h1>Issue queue</h1><p className="page-subtitle">Review reports and keep campus work moving.</p></div><span className="queue-total">{result.pagination?.total || 0} total reports</span></div>
      <form className="admin-toolbar" onSubmit={applySearch}>
        <label className="search-field"><Search size={17} /><span className="sr-only">Search issue titles</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search issue titles" /></label>
        <label className="select-wrap"><span className="sr-only">Filter by status</span><select value={filters.status} onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, status: event.target.value })); }}><option value="">All statuses</option><option>Open</option><option>In Progress</option><option>Resolved</option></select></label>
        <label className="select-wrap"><span className="sr-only">Filter by category</span><select value={filters.category} onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, category: event.target.value })); }}><option value="">All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
        <label className="select-wrap"><span className="sr-only">Filter by priority</span><select value={filters.priority} onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, priority: event.target.value })); }}><option value="">All priorities</option><option>Low</option><option>Medium</option><option>High</option></select></label>
        <button className="button button-primary" type="submit">Search</button>
      </form>
      {error && <div className="alert alert-error" role="alert">{error} <button className="text-button" onClick={() => loadIssues()}>Try again</button></div>}
      {loading ? <div className="state-panel" role="status">Loading issue queue…</div> : result.data.length === 0 ? <div className="empty-state"><h2>No reports match</h2><p>Clear a filter or check back when new reports arrive.</p></div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Issue</th><th>Reporter</th><th>Priority</th><th>Status</th><th>Manage</th></tr></thead><tbody>{result.data.map((issue) => {
        const nextStatus = issue.status === 'Open' ? 'In Progress' : issue.status === 'In Progress' ? 'Resolved' : null;
        return <tr key={issue._id}><td><Link className="admin-issue-title" to={`/issues/${issue._id}`}>{issue.title}</Link><span className="table-subline">{issue.category} · {issue.location}</span></td><td>{issue.reportedBy?.name || 'Unknown'}<span className="table-subline">{new Date(issue.createdAt).toLocaleDateString()}</span></td><td><label><span className="sr-only">Priority for {issue.title}</span><select className="table-select" value={issue.priority} onChange={(event) => changePriority(issue, event.target.value)}><option>Low</option><option>Medium</option><option>High</option></select></label></td><td><StatusBadge status={issue.status} /></td><td className="manage-cell"><label><span className="sr-only">Update status for {issue.title}</span><select className="table-select" value={issue.status} disabled={!nextStatus} onChange={(event) => changeStatus(issue, event.target.value)}><option value={issue.status}>{issue.status}</option>{nextStatus && <option value={nextStatus}>{nextStatus}</option>}</select></label><button className="text-button delete-action" type="button" onClick={() => removeIssue(issue)}>Delete</button></td></tr>;
      })}</tbody></table></div>}
      {!loading && result.data.length > 0 && <nav className="pagination" aria-label="Issue pages"><span>Page {page} of {pages}</span><div><button className="icon-button" aria-label="Previous page" title="Previous page" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}><ArrowLeft size={17} /></button><button className="icon-button" aria-label="Next page" title="Next page" disabled={page >= pages} onClick={() => setPage((current) => current + 1)}><ArrowRight size={17} /></button></div></nav>}
    </section>
  );
}