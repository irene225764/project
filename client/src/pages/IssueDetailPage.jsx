import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Send, Trash2 } from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

const categories = ['Electrical', 'Plumbing', 'Network', 'Furniture', 'Cleanliness', 'Other'];

export default function IssueDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [issueResult, commentResult] = await Promise.all([api.getIssue(id), api.listComments(id)]);
      setIssue(issueResult.data);
      setValues({ title: issueResult.data.title, description: issueResult.data.description, category: issueResult.data.category, location: issueResult.data.location, priority: issueResult.data.priority });
      setComments(commentResult.data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  const isOwner = issue?.reportedBy?._id === user?.id;
  const canEdit = isOwner && issue?.status === 'Open';

  async function submitComment(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const result = await api.createComment(id, text);
      setComments((current) => [...current, result.data]);
      setText('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function saveIssue(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const result = await api.updateIssue(id, values);
      setIssue(result.data);
      setEditing(false);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteIssue() {
    if (!window.confirm('Delete this issue and its comments?')) return;
    setSubmitting(true);
    try {
      await api.deleteIssue(id);
      navigate(user.role === 'admin' ? '/admin' : '/issues', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
      setSubmitting(false);
    }
  }

  if (loading) return <div className="state-panel" role="status">Loading issue…</div>;
  if (error && !issue) return <div className="alert alert-error" role="alert">{error} <button className="text-button" onClick={load}>Try again</button></div>;
  if (!issue) return <div className="empty-state"><h1>Issue not found</h1><Link to="/issues">Return to issues</Link></div>;

  return (
    <section className="detail-page">
      <Link to={user.role === 'admin' ? '/admin' : '/issues'} className="back-link"><ArrowLeft size={16} /> {user.role === 'admin' ? 'Admin queue' : 'My issues'}</Link>
      {error && <div className="alert alert-error" role="alert">{error}</div>}
      <div className="detail-heading">
        <div><p className="eyebrow">{issue.category.toUpperCase()} / REPORTED {new Date(issue.createdAt).toLocaleDateString()}</p><h1>{issue.title}</h1><p className="detail-location"><MapPin size={16} /> {issue.location}</p></div>
        <div className="detail-badges"><span className={`priority-mark priority-${issue.priority.toLowerCase()}`}>{issue.priority} priority</span><StatusBadge status={issue.status} /></div>
      </div>
      <div className="detail-grid">
        <article className="detail-main">
          <section className="content-section"><div className="section-title"><h2>Description</h2>{canEdit && !editing && <button className="text-button" onClick={() => setEditing(true)}>Edit issue</button>}</div>
            {editing ? <form className="issue-form compact-form" onSubmit={saveIssue}>
              <label className="field-label">Title<input value={values.title} maxLength="100" minLength="5" required onChange={(event) => setValues({ ...values, title: event.target.value })} /></label>
              <label className="field-label">Category<select value={values.category} onChange={(event) => setValues({ ...values, category: event.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
              <label className="field-label">Location<input value={values.location} maxLength="160" required onChange={(event) => setValues({ ...values, location: event.target.value })} /></label>
              <label className="field-label">Priority<select value={values.priority} onChange={(event) => setValues({ ...values, priority: event.target.value })}><option>Low</option><option>Medium</option><option>High</option></select></label>
              <label className="field-label">Description<textarea value={values.description} maxLength="1000" required rows="5" onChange={(event) => setValues({ ...values, description: event.target.value })} /></label>
              <div className="form-actions"><button className="button button-quiet" type="button" onClick={() => setEditing(false)}>Cancel</button><button className="button button-primary" disabled={submitting}>Save changes</button></div>
            </form> : <p className="description-copy">{issue.description}</p>}
          </section>
          <section className="content-section comments-section"><div className="section-title"><h2>Conversation</h2><span className="comment-count">{comments.length}</span></div>
            {comments.length === 0 ? <p className="muted-copy">No comments yet.</p> : <ol className="comment-list">{comments.map((comment) => <li className="comment" key={comment._id}><div className="comment-meta"><strong>{comment.author?.name || 'CampusFix user'}</strong><time>{new Date(comment.createdAt).toLocaleString()}</time></div><p>{comment.text}</p></li>)}</ol>}
            <form className="comment-form" onSubmit={submitComment}><label className="field-label" htmlFor="comment-text">Add a comment</label><textarea id="comment-text" value={text} onChange={(event) => setText(event.target.value)} maxLength="1000" rows="3" required placeholder="Share an update or ask a question" /><div className="form-actions"><small>{text.length}/1000</small><button className="button button-primary" disabled={submitting || !text.trim()}><Send size={16} /> Comment</button></div></form>
          </section>
        </article>
        <aside className="detail-sidebar"><h2>Report details</h2><dl><div><dt>Reported by</dt><dd>{issue.reportedBy?.name || 'You'}</dd></div><div><dt>Created</dt><dd>{new Date(issue.createdAt).toLocaleDateString()}</dd></div><div><dt>Last updated</dt><dd>{new Date(issue.updatedAt).toLocaleDateString()}</dd></div></dl>
          {(isOwner || user.role === 'admin') && <button className="button button-danger button-wide" disabled={submitting} onClick={deleteIssue}><Trash2 size={16} /> Delete issue</button>}
        </aside>
      </div>
    </section>
  );
}