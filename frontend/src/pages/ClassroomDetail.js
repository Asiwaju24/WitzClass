import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';

function CreateAssignmentModal({ classroomId, onClose, onSaved }) {
  const [form, setForm] = useState({ title: '', description: '', instructions: '', max_score: 100, has_deadline: true, due_date: '', allow_late: false, is_open: true });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append('attachment', file);
      await API.post(`/classrooms/${classroomId}/assignments/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Assignment posted! Students have been notified.'); onSaved(); onClose();
    } catch { toast.error('Failed to create assignment.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">📝 Post Assignment</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Assignment Title *</label>
            <input className="form-control" placeholder="e.g. Chapter 3 Exercise" required
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea className="form-control" placeholder="What is this assignment about?" required
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Detailed Instructions</label>
            <textarea className="form-control" placeholder="Step by step instructions for students..."
              value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Max Score</label>
              <input className="form-control" type="number" value={form.max_score}
                onChange={e => setForm({ ...form, max_score: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Attachment (optional)</label>
              <input className="form-control" type="file" onChange={e => setFile(e.target.files[0])} />
            </div>
          </div>

          <div style={{ background: 'var(--bg)', borderRadius: 10, padding: 14, marginBottom: 16, border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>⏰ Deadline Settings</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 14, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.has_deadline} onChange={e => setForm({ ...form, has_deadline: e.target.checked })} />
              Set a deadline
            </label>
            {form.has_deadline && (
              <div className="form-group" style={{ marginBottom: 10 }}>
                <input className="form-control" type="datetime-local"
                  value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
              </div>
            )}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.allow_late} onChange={e => setForm({ ...form, allow_late: e.target.checked })} />
              Allow late submissions (marked as late)
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Posting...' : 'Post Assignment'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ClassroomDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [classroom, setClassroom] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [tab, setTab] = useState('assignments');
  const [showModal, setShowModal] = useState(false);
  const isTeacher = ['teacher', 'independent_tutor'].includes(user?.role);

  const load = () => {
    API.get(`/classrooms/${id}/`).then(r => setClassroom(r.data)).catch(() => {});
    API.get(`/classrooms/${id}/assignments/`).then(r => setAssignments(r.data)).catch(() => {});
    API.get(`/classrooms/${id}/students/`).then(r => setStudents(r.data)).catch(() => {});
  };

  useEffect(() => { load(); }, [id]);

  const toggleAssignment = async (assignmentId) => {
    try {
      const { data } = await API.post(`/assignments/${assignmentId}/toggle/`);
      toast.success(data.message); load();
    } catch { toast.error('Failed to update assignment.'); }
  };

  if (!classroom) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📚 {classroom.name}</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8, marginBottom: 8 }}>
          {classroom.subject && <span className="badge badge-primary">📖 {classroom.subject}</span>}
          {classroom.level && <span className="badge badge-primary">🎓 {classroom.level}</span>}
          <span className="badge badge-success">👥 {classroom.student_count} students</span>
        </div>
        {isTeacher && (
          <div className="join-code-box" style={{ maxWidth: 360, marginTop: 12 }}>
            <div className="label">📢 Share this code with your students</div>
            <div className="code">{classroom.join_code}</div>
            <div className="hint">Students enter this code to join your classroom</div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
        <div className="tabs" style={{ marginBottom: 0 }}>
          <button className={`tab${tab === 'assignments' ? ' active' : ''}`} onClick={() => setTab('assignments')}>
            Assignments ({assignments.length})
          </button>
          <button className={`tab${tab === 'students' ? ' active' : ''}`} onClick={() => setTab('students')}>
            Students ({students.length})
          </button>
        </div>
        {isTeacher && tab === 'assignments' && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>+ Post Assignment</button>
        )}
      </div>

      {tab === 'assignments' && (
        assignments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <div className="empty-title">No assignments yet</div>
            <div className="empty-desc">{isTeacher ? 'Post your first assignment.' : 'Your teacher has not posted any assignments yet.'}</div>
          </div>
        ) : (
          <div className="card-grid">
            {assignments.map(a => {
              const due = a.due_date ? new Date(a.due_date) : null;
              const overdue = due && due < new Date();
              return (
                <div key={a.id} className="assignment-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div className="assignment-title">{a.title}</div>
                    <span className={`badge ${a.is_accepting ? 'badge-success' : 'badge-danger'}`}>
                      {a.is_accepting ? '🟢 Open' : '🔴 Closed'}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 10, lineHeight: 1.5 }}>{a.description}</p>

                  {due && (
                    <div style={{ fontSize: 12, fontWeight: 700, color: overdue ? 'var(--danger)' : 'var(--warning)', marginBottom: 6 }}>
                      ⏰ Due: {due.toLocaleDateString()} {due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {a.allow_late && <span style={{ color: 'var(--late)', marginLeft: 6 }}>(Late allowed)</span>}
                    </div>
                  )}

                  {isTeacher && (
                    <div style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text3)', marginBottom: 10, fontWeight: 600 }}>
                      <span>✅ {a.submission_count} submitted</span>
                      <span>⏳ {a.not_submitted} pending</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                    <Link to={`/assignments/${a.id}`} className="btn btn-primary btn-sm">
                      {isTeacher ? 'View Submissions' : 'Submit / View'}
                    </Link>
                    {isTeacher && (
                      <button className={`btn btn-sm ${a.is_open ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => toggleAssignment(a.id)}>
                        {a.is_open ? '🔒 Close' : '🔓 Reopen'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {tab === 'students' && (
        students.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <div className="empty-title">No students yet</div>
            <div className="empty-desc">Share the code <strong>{classroom.join_code}</strong> with your students.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {students.map(s => (
              <div key={s.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16 }}>
                <div className="user-avatar" style={{ width: 42, height: 42, fontSize: 16 }}>{s.username?.[0]?.toUpperCase()}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{s.full_name || s.username}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{s.email}</div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {showModal && <CreateAssignmentModal classroomId={id} onClose={() => setShowModal(false)} onSaved={load} />}
    </div>
  );
}
