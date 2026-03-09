import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';

export default function SchoolAdmin() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [school, setSchool] = useState(null);
  const [form, setForm] = useState({ name: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [joinForm, setJoinForm] = useState({ code: '' });

  useEffect(() => {
    API.get('/school/overview/').then(r => setOverview(r.data)).catch(() => {});
    API.get('/school/me/').then(r => setSchool(r.data)).catch(() => {});
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const { data } = await API.post('/school/register/', form);
      setSchool(data); toast.success(`School registered! Code: ${data.code}`);
      API.get('/school/overview/').then(r => setOverview(r.data)).catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to register school.');
    } finally { setLoading(false); }
  };

  if (!school) return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🏫 Register Your School</h1>
        <p className="page-subtitle">Set up your school on WitzClass. You'll get a unique school code for teachers to join.</p>
      </div>
      <div className="card" style={{ maxWidth: 500 }}>
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label className="form-label">School Name *</label>
            <input className="form-control" placeholder="e.g. Greenfield Academy" required
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea className="form-control" placeholder="School address..."
              value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Registering...' : '🏫 Register School'}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">🏫 {school.name}</h1>
        <p className="page-subtitle">School administration overview</p>
      </div>

      <div className="join-code-box" style={{ maxWidth: 400, marginBottom: 28 }}>
        <div className="label">📢 Share this code with your teachers</div>
        <div className="code">{school.code}</div>
        <div className="hint">Teachers use this code to join your school on WitzClass</div>
      </div>

      {overview && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👨‍🏫</div>
              <div className="stat-value">{overview.teacher_count}</div>
              <div className="stat-label">Teachers</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🏫</div>
              <div className="stat-value">{overview.classroom_count}</div>
              <div className="stat-label">Classrooms</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎒</div>
              <div className="stat-value">{overview.student_count}</div>
              <div className="stat-label">Students</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📥</div>
              <div className="stat-value">{overview.submission_count}</div>
              <div className="stat-label">Submissions</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
            <div className="card">
              <h3 style={{ fontWeight: 800, marginBottom: 16 }}>👨‍🏫 Teachers ({overview.teacher_count})</h3>
              {overview.teachers.length === 0
                ? <p style={{ color: 'var(--text2)', fontSize: 14 }}>No teachers yet. Share your school code!</p>
                : overview.teachers.map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div className="user-avatar">{t.teacher?.username?.[0]?.toUpperCase()}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{t.teacher?.first_name || t.teacher?.username}</div>
                      {t.subject && <div style={{ fontSize: 12, color: 'var(--text3)' }}>📖 {t.subject}</div>}
                    </div>
                  </div>
                ))}
            </div>

            <div className="card">
              <h3 style={{ fontWeight: 800, marginBottom: 16 }}>🏫 Classrooms ({overview.classroom_count})</h3>
              {overview.classrooms.length === 0
                ? <p style={{ color: 'var(--text2)', fontSize: 14 }}>No classrooms yet.</p>
                : overview.classrooms.map(c => (
                  <div key={c.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                      {c.subject && `📖 ${c.subject} • `}👥 {c.student_count} students • 👨‍🏫 {c.teacher?.username}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
