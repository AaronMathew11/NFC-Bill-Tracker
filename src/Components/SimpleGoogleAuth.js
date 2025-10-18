import { useState } from 'react';
import { useSignIn, useClerk, useUser } from '@clerk/clerk-react';

export default function SimpleGoogleAuth() {
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signOut } = useClerk();
  const { isSignedIn, user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already signed in, show sign out option
  if (isSignedIn) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 w-full max-w-sm">
        <div className="text-center mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Already Signed In</h2>
          <p className="text-gray-600 text-xs">Signed in as: {user?.primaryEmailAddress?.emailAddress}</p>
        </div>
        
        <button
          onClick={() => {
            signOut();
            window.location.reload();
          }}
          className="w-full bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 transition-all shadow-sm text-sm"
        >
          Sign Out & Try Again
        </button>
      </div>
    );
  }

  const handleGoogleSignIn = async () => {
    if (!signInLoaded) {
      setError('Authentication not ready. Please refresh the page.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      console.log('Starting Google sign-in with Clerk...');
      
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: window.location.origin,
        redirectUrlComplete: window.location.origin,
      });
      
      // The page will redirect, so we shouldn't reach here normally
      console.log('Redirect initiated...');
      
    } catch (err) {
      console.error('Google sign in error:', err);
      
      let errorMessage = 'Google sign in failed';
      
      if (err.errors && err.errors.length > 0) {
        errorMessage = err.errors[0].message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  if (!signInLoaded) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 w-full max-w-sm">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Loading authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 w-full max-w-sm">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-3">
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Welcome</h2>
        <p className="text-gray-600 text-xs">Sign in with your Google account to continue</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading || !signInLoaded}
        className="w-full bg-white border border-gray-200 text-gray-700 py-4 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all shadow-sm text-sm flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            Signing in...
          </div>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </>
        )}
      </button>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          Only authorized church members can access this application
        </p>
      </div>
    </div>
  );
}