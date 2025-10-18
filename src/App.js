// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './Components/privateRoute';
import AuthWrapper from './Components/AuthWrapper';
import AdminDashboard from './pages/adminDashboard';
import UserDashboard from './pages/dashboard';
import Login from './pages/login';
import { useAuth } from './hooks/useAuth';

function App() {
  const { user, isSignedIn } = useAuth();
  const userKey = user?.publicMetadata?.id || user?.id || 'anonymous';

  // Auto-redirect logic for root path
  const AutoRedirect = () => {
    if (!isSignedIn) {
      return <Navigate to="/login" replace />;
    }
    
    const role = user?.publicMetadata?.role || user?.role || "user";
    if (role === "admin") {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/user" replace />;
    }
  };

  return (
    <Routes>
      <Route path="/login" element={
        isSignedIn ? <AutoRedirect /> : <Login />
      } />

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

      <Route path="/" element={<AutoRedirect />} />
      <Route path="*" element={<AutoRedirect />} />
    </Routes>
  );
}

export default App;
