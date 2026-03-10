import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';

export default function Dashboard() {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const isTeacher = ['teacher', 'independent_tutor'].includes(user?.role);
  const isAdmin = user?.role === 'school_admin';

  useEffect(() => {
  API.get('/classrooms/')
    .then(r => {
      const data = Array.isArray(r.data) ? r.data : r.data.results;
      setClassrooms(data || []);
    })
    .catch(console.error);

  API.get('/notifications/')
    .then(r => {
      const data = Array.isArray(r.data) ? r.data : r.data.results;
      setNotifs(data || []);
    })
    .catch(console.error);
}, []);

  const unread = notifs.filter(n => !n.is_read).length;
  const roleEmoji = { school_admin: '🏫', teacher: '👨‍🏫', independent_tutor: '🧑‍💻', student: '🎒' };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{roleEmoji[user?.role]} Hello, {user?.first_name || user?.username}!</h1>
        <p className="page-subtitle">
          {isAdmin && 'Manage your school, teachers, and classrooms from here.'}
          {isTeacher && 'Create classrooms, post assignments, and track submissions.'}
          {user?.role === 'student' && 'View your classes, submit assignments, and check your grades.'}
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🏫</div>
          <div className="stat-value">{classrooms.length}</div>
          <div className="stat-label">{isTeacher ? 'My Classrooms' : 'My Classes'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔔</div>
          <div className="stat-value">{unread}</div>
          <div className="stat-label">Unread Notifications</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-value">{classrooms.reduce((a, c) => a + (c.assignment_count || 0), 0)}</div>
          <div className="stat-label">Total Assignments</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{classrooms.reduce((a, c) => a + (c.student_count || 0), 0)}</div>
          <div className="stat-label">{isTeacher ? 'Total Students' : 'Classmates'}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ fontWeight: 800 }}>Recent Classrooms</h3>
            <Link to="/classrooms" style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none', fontWeight: 700 }}>View all →</Link>
          </div>
          {classrooms.slice(0, 4).map(c => (
            <Link to={`/classrooms/${c.id}`} key={c.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none', color: 'inherit' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, var(--primary), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>📚</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>{c.subject} • {c.student_count} students</div>
              </div>
              <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--primary)', fontWeight: 700, background: 'var(--primary-light)', padding: '3px 7px', borderRadius: 6 }}>{c.join_code}</span>
            </Link>
          ))}
          {classrooms.length === 0 && <p style={{ color: 'var(--text2)', fontSize: 14 }}>No classrooms yet.</p>}
        </div>

        <div className="card">
          <h3 style={{ fontWeight: 800, marginBottom: 16 }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Link to="/classrooms" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              🏫 {isTeacher ? 'Create a Classroom' : isAdmin ? 'View All Classrooms' : 'Join a Classroom'}
            </Link>
            <Link to="/notifications" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
              🔔 Notifications {unread > 0 && `(${unread} unread)`}
            </Link>
            {isAdmin && (
              <Link to="/school" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                📊 School Overview
              </Link>
            )}
          </div>

          {unread > 0 && (
            <div style={{ marginTop: 18, padding: 14, background: 'var(--primary-light)', borderRadius: 10, border: '1px solid var(--primary)' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary)', marginBottom: 8 }}>🔔 Recent Notifications</div>
              {notifs.filter(n => !n.is_read).slice(0, 3).map(n => (
                <div key={n.id} style={{ fontSize: 13, color: 'var(--text)', padding: '5px 0', borderBottom: '1px solid rgba(92,110,248,0.15)' }}>{n.message}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
