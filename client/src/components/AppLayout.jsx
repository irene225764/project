import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { CircleUserRound, ClipboardList, LogOut, Plus, Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-frame">
      <header className="topbar">
        <NavLink to={user.role === 'admin' ? '/admin' : '/issues'} className="brand" aria-label="CampusFix home">
          <span className="brand-mark"><Wrench size={17} strokeWidth={2.5} /></span>
          <span>campus<span>fix</span></span>
        </NavLink>
        <nav className="main-nav" aria-label="Main navigation">
          {user.role === 'admin' ? (
            <NavLink to="/admin" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}><ClipboardList size={17} /> Admin queue</NavLink>
          ) : (
            <>
              <NavLink to="/issues" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}><ClipboardList size={17} /> My issues</NavLink>
              <NavLink to="/report" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}><Plus size={17} /> Report an issue</NavLink>
            </>
          )}
        </nav>
        <div className="user-menu">
          <span className="avatar" aria-hidden="true"><CircleUserRound size={20} /></span>
          <span className="user-name">{user.name}</span>
          <button className="icon-button logout-button" type="button" onClick={handleLogout} aria-label="Sign out" title="Sign out"><LogOut size={18} /></button>
        </div>
      </header>
      <main className="page-content"><Outlet /></main>
      <footer className="site-footer"><span>CampusFix</span><span>Facilities, moving forward.</span></footer>
    </div>
  );
}