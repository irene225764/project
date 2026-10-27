import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';

const initialValues = { title: '', category: '', location: '', priority: 'Medium', description: '' };

export default function ReportPage() {
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  function change(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await api.createIssue(values);
      navigate(`/issues/${result.data._id}`, { state: { created: true } });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="form-page">
      <Link to="/issues" className="back-link"><ArrowLeft size={16} /> My issues</Link>
      <div className="page-heading compact-heading"><div><p className="eyebrow">REPORT A FACILITY ISSUE</p><h1>What needs fixing?</h1><p className="page-subtitle">Give the campus team enough detail to get started.</p></div></div>
      <form className="issue-form" onSubmit={submit}>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <label className="field-label">Issue title<input name="title" value={values.title} onChange={change} minLength="5" maxLength="100" placeholder="e.g. Flickering lights in the west stairwell" required /><small>5–100 characters</small></label>
        <div className="form-grid">
          <label className="field-label">Category<select name="category" value={values.category} onChange={change} required><option value="" disabled>Select category</option>{['Electrical', 'Plumbing', 'Network', 'Furniture', 'Cleanliness', 'Other'].map((category) => <option key={category}>{category}</option>)}</select></label>
          <label className="field-label">Priority<select name="priority" value={values.priority} onChange={change}><option>Low</option><option>Medium</option><option>High</option></select></label>
        </div>
        <label className="field-label">Location<input name="location" value={values.location} onChange={change} maxLength="160" placeholder="Building, floor, room or nearby landmark" required /></label>
        <label className="field-label">Description<textarea name="description" value={values.description} onChange={change} maxLength="1000" rows="5" placeholder="What happened? When did you notice it?" required /><small>{values.description.length}/1000</small></label>
        <div className="form-actions"><Link className="button button-quiet" to="/issues">Cancel</Link><button className="button button-primary" disabled={submitting} type="submit">{submitting ? 'Submitting…' : 'Submit report'} {submitting ? <Check size={17} /> : <ArrowRight size={17} />}</button></div>
      </form>
    </section>
  );
}