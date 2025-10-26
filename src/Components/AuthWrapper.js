import { useAuth } from '../hooks/useAuth';
import UnauthorizedAccess from './UnauthorizedAccess';
import { Navigate } from 'react-router-dom';

export default function AuthWrapper({ children }) {
  const { isSignedIn, authType, loading, user } = useAuth();
  
  // Show loading while checking auth
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
  
  // Handle unauthorized access
  if (authType === 'unauthorized') {
    const userEmail = user?.primaryEmailAddress?.emailAddress || 'Unknown';
    return <UnauthorizedAccess userEmail={userEmail} />;
  }
  
  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}