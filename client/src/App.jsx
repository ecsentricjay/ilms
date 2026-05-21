import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentCourse from './pages/student/StudentCourse';
import LecturerDashboard from './pages/lecturer/LecturerDashboard';
import LecturerCourse from './pages/lecturer/LecturerCourse';
import AdminDashboard from './pages/admin/AdminDashboard';

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role}`} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<RootRedirect />} />
          <Route path="/student" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/course/:courseId" element={<ProtectedRoute role="student"><StudentCourse /></ProtectedRoute>} />
          <Route path="/lecturer" element={<ProtectedRoute role="lecturer"><LecturerDashboard /></ProtectedRoute>} />
          <Route path="/lecturer/course/:courseId" element={<ProtectedRoute role="lecturer"><LecturerCourse /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
