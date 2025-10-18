import { useUser } from '@clerk/clerk-react';
import { useDevMode } from '../contexts/DevModeContext';
import { enhanceUserWithRole, isAuthorizedUser } from '../utils/roleUtils';

export function useAuth() {
  const { user: clerkUser, isSignedIn } = useUser();
  const { devUser, isDevMode } = useDevMode();

  // Priority: Dev Mode (for testing) > Google Auth via Clerk
  if (isDevMode && devUser) {
    return {
      user: devUser,
      isSignedIn: true,
      isDevMode: true,
      authType: 'dev'
    };
  }

  // Google authentication via Clerk
  if (isSignedIn && clerkUser) {
    const email = clerkUser.primaryEmailAddress?.emailAddress;
    
    // Check if user is authorized
    if (!isAuthorizedUser(email)) {
      return {
        user: clerkUser,
        isSignedIn: false,
        isDevMode: false,
        authType: 'unauthorized',
        error: 'You are not authorized to access this application'
      };
    }

    // Enhance user with role information
    const enhancedUser = enhanceUserWithRole(clerkUser);
    
    return {
      user: enhancedUser,
      isSignedIn: true,
      isDevMode: false,
      authType: 'google'
    };
  }

  return {
    user: null,
    isSignedIn: false,
    isDevMode: false,
    authType: 'none'
  };
}