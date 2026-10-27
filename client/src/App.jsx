import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import AppLayout from './components/AppLayout.jsx';
import AuthPage from './pages/AuthPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import IssueDetailPage from './pages/IssueDetailPage.jsx';
import MyIssuesPage from './pages/MyIssuesPage.jsx';
import ReportPage from './pages/ReportPage.jsx';

function ProtectedRoute({ adminOnly = false, reporterOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <main className="state-panel">Restoring your session…</main>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/issues" replace />;
  if (reporterOnly && user.role === 'admin') return <Navigate to="/admin" replace />;
  return <AppLayout />;
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <main className="state-panel">Restoring your session…</main>;
  return <Navigate to={user ? (user.role === 'admin' ? '/admin' : '/issues') : '/login'} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<AuthPage register />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/issues/:id" element={<IssueDetailPage />} />
      </Route>
      <Route element={<ProtectedRoute reporterOnly />}>
        <Route path="/issues" element={<MyIssuesPage />} />
        <Route path="/report" element={<ReportPage />} />
      </Route>
      <Route element={<ProtectedRoute adminOnly />}>
        <Route path="/admin" element={<AdminPage />} />
      </Route>
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}

export default function App() {
  return <BrowserRouter><AuthProvider><AppRoutes /></AuthProvider></BrowserRouter>;
}