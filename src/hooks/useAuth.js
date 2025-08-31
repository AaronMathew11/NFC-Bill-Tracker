import { useUser } from '@clerk/clerk-react';
import { useDevMode } from '../contexts/DevModeContext';

export function useAuth() {
  const { user: clerkUser, isSignedIn } = useUser();
  const { devUser, isDevMode } = useDevMode();

  // Return dev mode user if in dev mode, otherwise Clerk user
  if (isDevMode && devUser) {
    return {
      user: devUser,
      isSignedIn: true,
      isDevMode: true
    };
  }

  return {
    user: clerkUser,
    isSignedIn,
    isDevMode: false
  };
}