// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './Components/privateRoute';
import AuthWrapper from './Components/AuthWrapper';
import AdminDashboard from './pages/adminDashboard';
import UserDashboard from './pages/dashboard';
import Login from './pages/login';
import { useAuth } from './hooks/useAuth';

function App() {
  const { user } = useAuth();
  const userKey = user?.publicMetadata?.id || user?.id || 'anonymous';

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/admin" element={
        <AuthWrapper>
          <PrivateRoute adminOnly={true}>
            <AdminDashboard key={`admin-${userKey}`} />
          </PrivateRoute>
        </AuthWrapper>
      } />

      <Route path="/user" element={
        <AuthWrapper>
          <PrivateRoute adminOnly={false}>
            <UserDashboard key={`user-${userKey}`} />
          </PrivateRoute>
        </AuthWrapper>
      } />

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
