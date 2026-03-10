import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';

const ROLES = [
  { value: 'student', emoji: '🎒', label: 'Student', desc: 'Join classes & submit assignments' },
  { value: 'teacher', emoji: '👨‍🏫', label: 'Teacher', desc: 'Part of a school, create classrooms' },
  { value: 'independent_tutor', emoji: '🧑‍💻', label: 'Independent Tutor', desc: 'Solo tutor, no school affiliation' },
  { value: 'school_admin', emoji: '🏫', label: 'School Admin', desc: 'Register & manage your school' },
];

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', first_name: '', last_name: '', role: 'student' });
  const [loading, setLoading] = useState(false);
  const [showSchoolJoin, setShowSchoolJoin] = useState(false);
  const [schoolCode, setSchoolCode] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post('/auth/register/', form);
      login(data.user, data.access, data.refresh);
      toast.success('Account created! Welcome to WitzClass');
      if (form.role === 'teacher') {
        setShowSchoolJoin(true);
      } else {
        navigate('/');
      }
    } catch (err) {
      const msg = err.response?.data;
      if (typeof msg === 'object') {
        const first = Object.values(msg)[0];
        toast.error(Array.isArray(first) ? first[0] : first);
      } else {
        toast.error('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSchool = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/school/join/', { code: schoolCode.toUpperCase() });
      toast.success('Joined school successfully!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid school code. Try again or skip.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-brand">Witz<span>Class</span></div>
          <div className="auth-tagline">Join the smarter classroom</div>
          <div className="auth-desc">Whether you are a school, a teacher, or a student - WitzClass has a role for you.</div>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-card" style={{ maxWidth: 480 }}>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-sub">Choose your role to get started</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
            {ROLES.map(r => (
              <label key={r.value} style={{
                display: 'flex', flexDirection: 'column', padding: '12px', borderRadius: 10, cursor: 'pointer',
                border: '2px solid ' + (form.role === r.value ? 'var(--primary)' : 'var(--border)'),
                background: form.role === r.value ? 'var(--primary-light)' : 'var(--bg)',
                transition: 'all 0.15s'
              }}>
                <input type="radio" name="role" value={r.value} checked={form.role === r.value}
                  onChange={e => setForm({ ...form, role: e.target.value })} style={{ display: 'none' }} />
                <span style={{ fontSize: 20, marginBottom: 4 }}>{r.emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: form.role === r.value ? 'var(--primary)' : 'var(--text)' }}>{r.label}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, lineHeight: 1.4 }}>{r.desc}</span>
              </label>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input className="form-control" placeholder="John"
                  value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input className="form-control" placeholder="Doe"
                  value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-control" placeholder="username" required
                value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" placeholder="you@email.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-control" type="password" placeholder="Min. 6 characters" required
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '13px' }}>
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
          <p className="auth-footer">Already have an account? <Link to="/login" className="auth-link">Sign in</Link></p>
        </div>
      </div>

      {showSchoolJoin && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">Join Your School</h2>
            <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 22 }}>
              Enter the school code from your admin. You can skip this and join later from your dashboard.
            </p>
            <form onSubmit={handleJoinSchool}>
              <div className="form-group">
                <label className="form-label">School Code</label>
                <input
                  className="form-control"
                  placeholder="e.g. SCH-AB12X"
                  style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontSize: 18, letterSpacing: 3, textAlign: 'center', fontWeight: 700 }}
                  value={schoolCode}
                  onChange={e => setSchoolCode(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>
                  Skip for now
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Joining...' : 'Join School'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
  }
