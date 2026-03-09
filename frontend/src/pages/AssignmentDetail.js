import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';

function GradeModal({ submission, maxScore, onClose, onSaved }) {
  const [form, setForm] = useState({ score: submission.score || '', feedback: submission.feedback || '' });
  const [loading, setLoading] = useState(false);
  const pct = form.score ? Math.round((form.score / maxScore) * 100) : null;

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await API.patch(`/submissions/${submission.id}/grade/`, form);
      toast.success('Graded! Student has been notified.'); onSaved(); onClose();
    } catch { toast.error('Failed to grade.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">🎯 Grade: {submission.student?.first_name || submission.student?.username}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Score (out of {maxScore})</label>
            <input className="form-control" type="number" min="0" max={maxScore} required
              value={form.score} onChange={e => setForm({ ...form, score: e.target.value })} />
            {pct !== null && (
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <span className="badge badge-primary">{pct}%</span>
                <span className="badge badge-success">{getGrade(pct)}</span>
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Feedback for Student</label>
            <textarea className="form-control" style={{ minHeight: 120 }} placeholder="Write personalized feedback..."
              value={form.feedback} onChange={e => setForm({ ...form, feedback: e.target.value })} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Save Grade'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getGrade(pct) {
  if (pct >= 90) return 'A+'; if (pct >= 80) return 'A';
  if (pct >= 75) return 'B+'; if (pct >= 70) return 'B';
  if (pct >= 65) return 'C+'; if (pct >= 60) return 'C';
  if (pct >= 50) return 'D'; return 'F';
}

export default function AssignmentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [notSubmitted, setNotSubmitted] = useState([]);
  const [grading, setGrading] = useState(null);
  const [tab, setTab] = useState('submitted');
  const [submitForm, setSubmitForm] = useState({ text_content: '', note: '' });
  const [file, setFile] = useState(null);
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const isTeacher = ['teacher', 'independent_tutor'].includes(user?.role);

  const load = () => {
    API.get(`/assignments/${id}/`).then(r => setAssignment(r.data)).catch(() => {});
    API.get(`/assignments/${id}/submissions/`).then(r => setSubmissions(r.data)).catch(() => {});
    if (isTeacher) API.get(`/assignments/${id}/not-submitted/`).then(r => setNotSubmitted(r.data)).catch(() => {});
  };

  useEffect(() => { load(); }, [id]);

  const mySubmission = submissions.find(s => s.student?.id === user?.id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file && !image && !submitForm.text_content.trim()) {
      return toast.error('Please provide a file, image, or typed response.');
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('text_content', submitForm.text_content);
      fd.append('note', submitForm.note);
      if (file) fd.append('file', file);
      if (image) fd.append('image', image);
      await API.post(`/assignments/${id}/submit/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('✅ Assignment submitted! Your teacher has been notified.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed.');
    } finally { setSubmitting(false); }
  };

  if (!assignment) return <div className="loading-screen"><div className="spinner" /></div>;

  const due = assignment.due_date ? new Date(assignment.due_date) : null;
  const overdue = due && due < new Date();

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📝 {assignment.title}</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          <span className={`badge ${assignment.is_accepting ? 'badge-success' : 'badge-danger'}`}>
            {assignment.is_accepting ? '🟢 Accepting Submissions' : '🔴 Closed'}
          </span>
          <span className="badge badge-primary">Max: {assignment.max_score} pts</span>
          {due && <span className={`badge ${overdue ? 'badge-danger' : 'badge-warning'}`}>
            ⏰ {overdue ? 'Was due' : 'Due'}: {due.toLocaleDateString()}
          </span>}
          {assignment.allow_late && <span className="badge badge-late">⚠️ Late submissions allowed</span>}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 22 }}>
        <h3 style={{ fontWeight: 800, marginBottom: 10 }}>📋 Description</h3>
        <p style={{ color: 'var(--text2)', lineHeight: 1.7, marginBottom: assignment.instructions ? 16 : 0 }}>{assignment.description}</p>
        {assignment.instructions && (
          <>
            <h4 style={{ fontWeight: 700, marginBottom: 8, marginTop: 12 }}>Instructions</h4>
            <p style={{ color: 'var(--text2)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{assignment.instructions}</p>
          </>
        )}
        {assignment.attachment && (
          <div style={{ marginTop: 14 }}>
            <a href={assignment.attachment} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">📎 Download Attachment</a>
          </div>
        )}
      </div>

      {/* STUDENT VIEW */}
      {!isTeacher && (
        <div className="card" style={{ marginBottom: 22 }}>
          {mySubmission ? (
            <div>
              <h3 style={{ fontWeight: 800, marginBottom: 16 }}>✅ Your Submission</h3>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                <span className={`badge ${mySubmission.status === 'graded' ? 'badge-success' : mySubmission.status === 'late' ? 'badge-late' : 'badge-warning'}`}>
                  {mySubmission.status === 'graded' ? '✅ Graded' : mySubmission.status === 'late' ? '⚠️ Late' : '⏳ Awaiting Grade'}
                </span>
                {mySubmission.status === 'graded' && (
                  <>
                    <span className="badge badge-primary">{mySubmission.score}/{assignment.max_score}</span>
                    <span className="badge badge-primary">{mySubmission.percentage}%</span>
                    <span className="badge badge-success">{mySubmission.letter_grade}</span>
                  </>
                )}
              </div>
              {mySubmission.text_content && (
                <div style={{ background: 'var(--bg)', borderRadius: 10, padding: 14, marginBottom: 12, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', marginBottom: 6 }}>YOUR RESPONSE</div>
                  <p style={{ fontSize: 14, lineHeight: 1.6 }}>{mySubmission.text_content}</p>
                </div>
              )}
              {mySubmission.feedback && (
                <div style={{ background: 'var(--primary-light)', borderRadius: 10, padding: 14, border: '1px solid var(--primary)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 6 }}>💬 TEACHER FEEDBACK</div>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text)' }}>{mySubmission.feedback}</p>
                </div>
              )}
              <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                {mySubmission.file && <a href={mySubmission.file} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">📄 View File</a>}
                {mySubmission.image && <a href={mySubmission.image} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">🖼️ View Image</a>}
              </div>
            </div>
          ) : (
            <div>
              <h3 style={{ fontWeight: 800, marginBottom: 16 }}>📤 Submit Your Assignment</h3>
              {!assignment.is_accepting ? (
                <div style={{ background: 'rgba(239,71,111,0.06)', borderRadius: 10, padding: 16, border: '1px solid rgba(239,71,111,0.2)', color: 'var(--danger)', fontWeight: 600 }}>
                  🔴 This assignment is closed. Submissions are no longer accepted.
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label className="form-label">📝 Typed Response</label>
                    <textarea className="form-control" style={{ minHeight: 120 }}
                      placeholder="Type your answer here..."
                      value={submitForm.text_content} onChange={e => setSubmitForm({ ...submitForm, text_content: e.target.value })} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div className="form-group">
                      <label className="form-label">📄 Upload File (PDF/Word)</label>
                      <input className="form-control" type="file" accept=".pdf,.doc,.docx"
                        onChange={e => setFile(e.target.files[0])} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">📷 Upload Image (photo of work)</label>
                      <input className="form-control" type="file" accept="image/*"
                        onChange={e => setImage(e.target.files[0])} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Note to Teacher (optional)</label>
                    <input className="form-control" placeholder="Any note you want to add..."
                      value={submitForm.note} onChange={e => setSubmitForm({ ...submitForm, note: e.target.value })} />
                  </div>
                  <div style={{ background: 'var(--primary-light)', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>
                    💡 You can submit a typed answer, upload a file, take a photo of your handwritten work, or all three!
                  </div>
                  <button className="btn btn-primary" type="submit" disabled={submitting}>
                    {submitting ? 'Submitting...' : '📤 Submit Assignment'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {/* TEACHER VIEW */}
      {isTeacher && (
        <>
          <div className="tabs">
            <button className={`tab${tab === 'submitted' ? ' active' : ''}`} onClick={() => setTab('submitted')}>
              ✅ Submitted ({submissions.length})
            </button>
            <button className={`tab${tab === 'pending' ? ' active' : ''}`} onClick={() => setTab('pending')}>
              ⏳ Not Submitted ({notSubmitted.length})
            </button>
          </div>

          {tab === 'submitted' && (
            submissions.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">📭</div><div className="empty-title">No submissions yet</div></div>
            ) : submissions.map(s => (
              <div key={s.id} className="submission-item">
                <div className="user-avatar" style={{ width: 42, height: 42, fontSize: 16, flexShrink: 0 }}>{s.student?.username?.[0]?.toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{s.student?.first_name || s.student?.username}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>Submitted: {new Date(s.submitted_at).toLocaleString()}</div>
                  {s.note && <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2, fontStyle: 'italic' }}>"{s.note}"</div>}
                  {s.text_content && <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4, background: 'var(--bg)', padding: '6px 10px', borderRadius: 6 }}>{s.text_content.substring(0, 100)}{s.text_content.length > 100 ? '...' : ''}</div>}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {s.status === 'late' && <span className="badge badge-late">⚠️ Late</span>}
                  {s.status === 'graded' && <span className="badge badge-success">{s.score}/{assignment.max_score} — {s.letter_grade}</span>}
                  {s.file && <a href={s.file} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">📄</a>}
                  {s.image && <a href={s.image} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">🖼️</a>}
                  <button className="btn btn-primary btn-sm" onClick={() => setGrading(s)}>
                    {s.status === 'graded' ? '✏️ Re-grade' : '🎯 Grade'}
                  </button>
                </div>
              </div>
            ))
          )}

          {tab === 'pending' && (
            notSubmitted.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">🎉</div><div className="empty-title">All students have submitted!</div></div>
            ) : notSubmitted.map(s => (
              <div key={s.id} className="not-submitted-item">
                <div className="user-avatar" style={{ width: 38, height: 38, background: 'var(--danger)' }}>{s.username?.[0]?.toUpperCase()}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{s.full_name || s.username}</div>
                  <div style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600 }}>❌ Has not submitted</div>
                </div>
              </div>
            ))
          )}
        </>
      )}

      {grading && <GradeModal submission={grading} maxScore={assignment.max_score} onClose={() => setGrading(null)} onSaved={load} />}
    </div>
  );
}
