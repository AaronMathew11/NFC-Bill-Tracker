import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { isAuthorizedUser, enhanceUserWithRole } from '../utils/roleUtils';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('useAuth: Setting up Firebase auth listener');
    
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('🔥 Firebase auth state changed:', { 
        user: firebaseUser, 
        email: firebaseUser?.email,
        uid: firebaseUser?.uid 
      });
      
      if (firebaseUser) {
        const email = firebaseUser.email;
        console.log('📧 Checking authorization for email:', email);
        
        // Check if user is authorized
        if (!isAuthorizedUser(email)) {
          console.log('❌ User not authorized:', email);
          setUser(firebaseUser);
          setIsSignedIn(false);
          setLoading(false);
          return;
        }

        console.log('✅ User authorized, creating app user object');
        
        // Create a user object compatible with existing app
        const appUser = {
          id: firebaseUser.uid,
          primaryEmailAddress: {
            emailAddress: email
          },
          firstName: firebaseUser.displayName?.split(' ')[0] || 'User',
          lastName: firebaseUser.displayName?.split(' ')[1] || '',
          fullName: firebaseUser.displayName || email,
          photoURL: firebaseUser.photoURL
        };

        // Enhance user with role information
        const enhancedUser = enhanceUserWithRole(appUser);
        console.log('👤 Enhanced user:', enhancedUser);
        
        setUser(enhancedUser);
        setIsSignedIn(true);
        console.log('✅ User signed in successfully');
      } else {
        console.log('🚪 User signed out');
        setUser(null);
        setIsSignedIn(false);
      }
      
      setLoading(false);
      console.log('⏹️ Auth loading complete');
    });

    return () => unsubscribe();
  }, []);

  return {
    user,
    isSignedIn,
    loading,
    authType: isSignedIn ? 'firebase' : user ? 'unauthorized' : 'none'
  };
}

export function useUserId() {
  const { user } = useAuth();
  return user?.publicMetadata?.id || user?.id || null;
}