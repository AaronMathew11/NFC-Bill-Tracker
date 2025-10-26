// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import UnauthorizedAccess from './Components/UnauthorizedAccess';
import AdminDashboard from './pages/adminDashboard';
import UserDashboard from './pages/dashboard';
import Login from './pages/login';
import { useAuth } from './hooks/useAuth';

function App() {
  const { user, isSignedIn, authType, loading } = useAuth();
  const userKey = user?.publicMetadata?.id || user?.id || 'anonymous';
  
  console.log('App.js - Firebase Auth state:', { 
    user, 
    isSignedIn, 
    authType,
    loading,
    currentPath: window.location.pathname
  });
  
  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Handle unauthorized users
  if (authType === 'unauthorized') {
    const userEmail = user?.primaryEmailAddress?.emailAddress || 'Unknown';
    return <UnauthorizedAccess userEmail={userEmail} />;
  }

  // If not signed in, show login page
  if (!isSignedIn) {
    return <Login />;
  }

  // User is signed in - show appropriate dashboard based on role
  const role = user?.publicMetadata?.role || user?.role || "user";
  
  return (
    <Routes>
      <Route path="/login" element={<Navigate to={role === "admin" ? "/admin" : "/user"} replace />} />
      
      <Route path="/admin" element={
        role === "admin" ? 
          <AdminDashboard key={`admin-${userKey}`} /> :
          <Navigate to="/user" replace />
      } />

      <Route path="/user" element={
        role === "admin" ? 
          <Navigate to="/admin" replace /> :
          <UserDashboard key={`user-${userKey}`} />
      } />

      <Route path="/" element={<Navigate to={role === "admin" ? "/admin" : "/user"} replace />} />
      <Route path="*" element={<Navigate to={role === "admin" ? "/admin" : "/user"} replace />} />
    </Routes>
  );
}

export default App;
