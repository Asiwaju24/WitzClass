import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import API from '../api/client';
import { MdDashboard, MdClass, MdAssignment, MdNotifications, MdLogout, MdSchool } from 'react-icons/md';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    API.get('/notifications/').then(r => setUnread(r.data.filter(n => !n.is_read).length)).catch(() => {});
    const ws = new WebSocket(`ws://${window.location.host}/ws/notifications/`);
    ws.onmessage = () => setUnread(p => p + 1);
    return () => ws.close();
  }, []);

  const isTeacher = ['teacher', 'independent_tutor'].includes(user?.role);
  const isAdmin = user?.role === 'school_admin';

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">W</div>
          <div>
            <div className="logo-name">Witz<span>Class</span></div>
            <div className="logo-tagline">No More Excuses</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Navigation</div>
            <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <MdDashboard /> Dashboard
            </NavLink>
            <NavLink to="/classrooms" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <MdClass /> {isTeacher ? 'My Classrooms' : isAdmin ? 'All Classrooms' : 'My Classes'}
            </NavLink>
            {(isTeacher || user?.role === 'student') && (
              <NavLink to="/assignments" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <MdAssignment /> Assignments
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/school" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <MdSchool /> School Overview
              </NavLink>
            )}
            <NavLink to="/notifications" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <MdNotifications /> Notifications
              {unread > 0 && <span className="nav-badge">{unread}</span>}
            </NavLink>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{user?.username?.[0]?.toUpperCase()}</div>
            <div className="user-info">
              <div className="user-name">{user?.first_name || user?.username}</div>
              <div className="user-role">{user?.role?.replace('_', ' ')}</div>
            </div>
            <button className="logout-btn" onClick={() => { logout(); navigate('/login'); }}>
              <MdLogout size={17} />
            </button>
          </div>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-title">WitzClass</div>
          <span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 600 }}>
            👋 {user?.first_name || user?.username}
          </span>
        </header>
        <main className="page"><Outlet /></main>
      </div>
    </div>
  );
}
