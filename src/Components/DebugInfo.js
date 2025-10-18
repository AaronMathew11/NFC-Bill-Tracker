import { useUser, useAuth, useClerk } from '@clerk/clerk-react';

export default function DebugInfo() {
  const { user, isSignedIn, isLoaded } = useUser();
  const { isSignedIn: authSignedIn } = useAuth();
  const clerk = useClerk();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-sm">
      <h3 className="font-bold mb-2">🔧 Debug Info</h3>
      <div className="space-y-1">
        <div>User Loaded: {isLoaded ? '✅' : '❌'}</div>
        <div>Is Signed In (useUser): {isSignedIn ? '✅' : '❌'}</div>
        <div>Is Signed In (useAuth): {authSignedIn ? '✅' : '❌'}</div>
        <div>Clerk Instance: {clerk ? '✅' : '❌'}</div>
        {user && (
          <>
            <div>Email: {user.primaryEmailAddress?.emailAddress || 'N/A'}</div>
            <div>Name: {user.firstName} {user.lastName}</div>
            <div>User ID: {user.id}</div>
          </>
        )}
        <div>Publishable Key: {process.env.REACT_APP_CLERK_PUBLISHABLE_KEY ? '✅' : '❌'}</div>
      </div>
    </div>
  );
}