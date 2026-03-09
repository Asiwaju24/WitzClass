import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import API from '../api/client';
import { formatDistanceToNow } from 'date-fns';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);

  const load = () => API.get('/notifications/').then(r => setNotifications(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const markAllRead = async () => {
    await API.post('/notifications/read/');
    toast.success('All marked as read'); load();
  };

  const unread = notifications.filter(n => !n.is_read).length;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{unread > 0 ? `${unread} unread` : 'All caught up!'}</p>
        </div>
        {unread > 0 && <button className="btn btn-secondary btn-sm" onClick={markAllRead}>✅ Mark all read</button>}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {notifications.length === 0
          ? <div className="empty-state"><div className="empty-icon">🔔</div><div className="empty-title">No notifications yet</div></div>
          : notifications.map(n => (
            <div key={n.id} className={`notif-item${!n.is_read ? ' unread' : ''}`}>
              {!n.is_read ? <div className="notif-dot" /> : <div style={{ width: 8 }} />}
              <div>
                <div className="notif-message">{n.message}</div>
                <div className="notif-time">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}
