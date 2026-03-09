import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';

function CreateClassroomModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: '', subject: '', level: '', description: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await API.post('/classrooms/', form);
      toast.success('Classroom created!'); onSaved(); onClose();
    } catch { toast.error('Failed to create classroom.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">📚 Create New Classroom</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Classroom Name *</label>
            <input className="form-control" placeholder="e.g. Mathematics Class A" required
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Subject</label>
              <input className="form-control" placeholder="e.g. Mathematics"
                value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Level / Class</label>
              <input className="form-control" placeholder="e.g. Grade 10, JSS2"
                value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-control" placeholder="Brief description of this classroom..."
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div style={{ background: 'var(--primary-light)', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>
            🔑 A unique join code (e.g. WTZ-AB12X) will be auto-generated. Share it with your students to join.
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create Classroom'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function JoinClassroomModal({ onClose, onSaved }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const { data } = await API.post('/classrooms/join/', { code: code.toUpperCase() });
      toast.success(data.message); onSaved(); onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid code. Please check and try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">🔑 Join a Classroom</h2>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 22 }}>Enter the join code given to you by your teacher.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Classroom Join Code</label>
            <input className="form-control" placeholder="e.g. WTZ-AB12X" required
              style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontSize: 18, letterSpacing: 3, textAlign: 'center', fontWeight: 700 }}
              value={code} onChange={e => setCode(e.target.value)} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Joining...' : 'Join Classroom'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Classrooms() {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const isTeacher = ['teacher', 'independent_tutor'].includes(user?.role);

  const load = () => API.get('/classrooms/').then(r => setClassrooms(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Classrooms</h1>
          <p className="page-subtitle">{isTeacher ? 'Manage your classrooms and share join codes with students.' : 'Your enrolled classrooms.'}</p>
        </div>
        {isTeacher
          ? <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Create Classroom</button>
          : <button className="btn btn-primary" onClick={() => setShowJoin(true)}>🔑 Join with Code</button>
        }
      </div>

      {classrooms.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">{isTeacher ? '📚' : '🔑'}</div>
          <div className="empty-title">{isTeacher ? 'No classrooms yet' : 'No classes yet'}</div>
          <div className="empty-desc">{isTeacher ? 'Create your first classroom and share the join code with students.' : 'Ask your teacher for a join code to get started.'}</div>
          <div style={{ marginTop: 20 }}>
            {isTeacher
              ? <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Create First Classroom</button>
              : <button className="btn btn-primary" onClick={() => setShowJoin(true)}>🔑 Enter Join Code</button>
            }
          </div>
        </div>
      ) : (
        <div className="card-grid">
          {classrooms.map(c => (
            <Link to={`/classrooms/${c.id}`} key={c.id} className="classroom-card">
              <div className="classroom-header">
                <div className="classroom-icon">📚</div>
                <span className="classroom-code">{c.join_code}</span>
              </div>
              <div className="classroom-name">{c.name}</div>
              {c.subject && <div className="classroom-subject">📖 {c.subject}</div>}
              {c.level && <div className="classroom-level">🎓 {c.level}</div>}
              {c.school_name && <div className="classroom-level">🏫 {c.school_name}</div>}
              <div className="classroom-meta">
                <span>👥 {c.student_count} students</span>
                <span>📝 {c.assignment_count} assignments</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreate && <CreateClassroomModal onClose={() => setShowCreate(false)} onSaved={load} />}
      {showJoin && <JoinClassroomModal onClose={() => setShowJoin(false)} onSaved={load} />}
    </div>
  );
}
