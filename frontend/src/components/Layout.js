import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import API from '../api/client';
import { MdDashboard, MdClass, MdNotifications, MdLogout, MdSchool, MdMenu, MdClose } from 'react-icons/md';

function JoinSchoolInline() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);

  const handleJoin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/school/join/', { code: code.toUpperCase() });
      toast.success('Joined school successfully!');
      setJoined(true);
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid school code.');
    } finally {
      setLoading(false);
    }
  };

  if (joined) return (
    <div style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 700, padding: 12 }}>
      ✅ Joined school!
    </div>
  );

  return (
    <div style={{ margin: '12px 0', padding: 12, background: 'var(--primary-light)', borderRadius: 10, border: '1px solid var(--primary)' }}>
      <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 13, marginBottom: 8 }}>
        🏫 Join a School
      </div>
      <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input
          style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 2 }}
          placeholder="SCH-XXXXX"
          value={code}
          onChange={e => setCode(e.target.value)}
          required
        />
        <button className="btn btn-primary" type="submit" disabled={loading}
          style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}>
          {loading ? 'Joining...' : 'Join School'}
        </button>
      </form>
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const isTeacher = ['teacher', 'independent_tutor'].includes(user?.role);
  const isAdmin = user?.role === 'school_admin';

  useEffect(() => {
    API.get('/notifications/')
      .then(r => setUnread(r.data.filter(n => !n.is_read).length))
      .catch(() => {});

    try {
      const wsUrl = `wss://witzclass.onrender.com/ws/notifications/?token=${localStorage.getItem('access')}`;
      const ws = new WebSocket(wsUrl);
      ws.onmessage = () => setUnread(p => p + 1);
      return () => ws.close();
    } catch (e) {}
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = (
    <>
      <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>
        <MdDashboard /> Dashboard
      </NavLink>
      <NavLink to="/classrooms" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>
        <MdClass /> {isTeacher ? 'My Classrooms' : isAdmin ? 'All Classrooms' : 'My Classes'}
      </NavLink>
      {isAdmin && (
        <NavLink to="/school" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>
          <MdSchool /> School Overview
        </NavLink>
      )}
      <NavLink to="/notifications" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>
        <MdNotifications /> Notifications
        {unread > 0 && <span className="nav-badge">{unread}</span>}
      </NavLink>

      {/* Show for ALL teacher types */}
      {isTeacher && <JoinSchoolInline />}
    </>
  );

  return (
    <div className="layout">
      {/* Desktop Sidebar */}
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
            {navLinks}
          </div>
        </nav>
        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{user?.username?.[0]?.toUpperCase()}</div>
            <div className="user-info">
              <div className="user-name">{user?.first_name || user?.username}</div>
              <div className="user-role">{user?.role?.replace('_', ' ')}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <MdLogout size={17} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="mobile-header">
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
        </button>
        <span className="mobile-logo">WitzClass</span>
        <span style={{ fontSize: 13, fontWeight: 600 }}>👋 {user?.first_name || user?.username}</span>
      </div>

      {/* Mobile Overlay Menu */}
      {menuOpen && (
        <div className="mobile-overlay" onClick={() => setMenuOpen(false)}>
          <div className="mobile-menu" onClick={e => e.stopPropagation()}>
            <div className="user-card" style={{ marginBottom: 20 }}>
              <div className="user-avatar">{user?.username?.[0]?.toUpperCase()}</div>
              <div className="user-info">
                <div className="user-name">{user?.first_name || user?.username}</div>
                <div className="user-role">{user?.role?.replace('_', ' ')}</div>
              </div>
            </div>
            <nav className="sidebar-nav">{navLinks}</nav>
            <button className="btn btn-secondary" style={{ marginTop: 20, width: '100%' }} onClick={handleLogout}>
              <MdLogout /> Logout
            </button>
          </div>
        </div>
      )}

      <div className="main-content">
        <header className="topbar desktop-topbar">
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
