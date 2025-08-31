import { useAuth } from '../hooks/useAuth';

export default function AuthWrapper({ children }) {
  const { isSignedIn } = useAuth();
  
  if (!isSignedIn) {
    return null;
  }
  
  return children;
}