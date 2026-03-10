import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import API from '../api/client';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post('/auth/login/', form);
      const me = await API.get('/auth/me/', {
        headers: { Authorization: `Bearer ${data.access}` }
      });
      login(me.data, data.access, data.refresh);
      navigate('/');
    } catch {
      toast.error('Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="auth-brand">Witz<span>Class</span></div>
          <div className="auth-tagline">No More "I Forgot My Assignment"</div>
          <div className="auth-desc">The smartest way to collect, track, and grade assignments — for schools and independent tutors.</div>
          <div className="auth-features">
            <div className="auth-feature">✅ Students submit digitally — no more excuses</div>
            <div className="auth-feature">🏫 Schools manage all teachers and classes</div>
            <div className="auth-feature">📊 Grade at your leisure with instant feedback</div>
            <div className="auth-feature">🔔 Real-time notifications for everyone</div>
          </div>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <div style={{ fontSize: 28, marginBottom: 8 }}>👋</div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-sub">Sign in to your WitzClass account</p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-control" type="text" placeholder="Enter username"
                value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-control" type="password" placeholder="Enter password"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '13px' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="auth-footer">No account? <Link to="/register" className="auth-link">Create one</Link></p>
        </div>
      </div>
    </div>
  );
                                      }}
