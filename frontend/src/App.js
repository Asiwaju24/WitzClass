import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Classrooms from './pages/Classrooms';
import ClassroomDetail from './pages/ClassroomDetail';
import AssignmentDetail from './pages/AssignmentDetail';
import Notifications from './pages/Notifications';
import SchoolAdmin from './pages/SchoolAdmin';
import './App.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="classrooms" element={<Classrooms />} />
            <Route path="classrooms/:id" element={<ClassroomDetail />} />
            <Route path="assignments/:id" element={<AssignmentDetail />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="school" element={<SchoolAdmin />} />
          </Route>
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
      </BrowserRouter>
    </AuthProvider>
  );
}
