import { useAuth } from '../hooks/useAuth';
import UnauthorizedAccess from './UnauthorizedAccess';

export default function AuthWrapper({ children }) {
  const { isSignedIn, authType, error, user } = useAuth();
  
  // Handle unauthorized access
  if (authType === 'unauthorized') {
    const userEmail = user?.primaryEmailAddress?.emailAddress || 'Unknown';
    return <UnauthorizedAccess userEmail={userEmail} />;
  }
  
  if (!isSignedIn) {
    return null;
  }
  
  return children;
}