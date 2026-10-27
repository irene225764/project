import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthPage({ register = false }) {
  const { user, login, register: createAccount } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/issues'} replace />;

  function change(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const nextUser = await (register ? createAccount(values) : login({ email: values.email, password: values.password }));
      navigate(nextUser.role === 'admin' ? '/admin' : '/issues', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-aside">
        <div className="auth-brand"><span className="brand-mark"><Wrench size={18} /></span> campus<span>fix</span></div>
        <div className="auth-message">
          <p className="eyebrow">A BETTER CAMPUS STARTS HERE</p>
          <h1>Small fixes.<br />Big difference.</h1>
          <p>One place to report what needs attention and see what happens next.</p>
        </div>
        <span className="aside-index">01 / CAMPUS CARE</span>
      </section>
      <section className="auth-panel">
        <form className="auth-form" onSubmit={submit}>
          <p className="eyebrow">{register ? 'JOIN YOUR CAMPUS' : 'WELCOME BACK'}</p>
          <h2>{register ? 'Create your account' : 'Sign in to CampusFix'}</h2>
          <p className="form-intro">{register ? 'Start tracking the things that make campus work.' : 'Pick up where your campus left off.'}</p>
          {error && <div className="alert alert-error" role="alert">{error}</div>}
          {register && <label className="field-label">Full name<input name="name" autoComplete="name" value={values.name} onChange={change} minLength="2" maxLength="80" required /></label>}
          <label className="field-label">Email address<input name="email" type="email" autoComplete="email" value={values.email} onChange={change} required /></label>
          <label className="field-label">Password<input name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} value={values.password} onChange={change} minLength="8" maxLength="72" required /></label>
          <button className="button button-primary button-wide" disabled={submitting} type="submit">{submitting ? 'Please wait…' : register ? 'Create account' : 'Sign in'} <ArrowRight size={17} /></button>
          <p className="auth-switch">{register ? 'Already have an account?' : 'New to CampusFix?'} <Link to={register ? '/login' : '/register'}>{register ? 'Sign in' : 'Create an account'}</Link></p>
        </form>
      </section>
    </main>
  );
}