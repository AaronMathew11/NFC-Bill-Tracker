import { useAuth } from '../hooks/useAuth';

export default function DebugInfo() {
  const { user, isSignedIn, authType, loading } = useAuth();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-sm">
      <h3 className="font-bold mb-2">🔥 Firebase Debug Info</h3>
      <div className="space-y-1">
        <div>Loading: {loading ? '⏳' : '✅'}</div>
        <div>Is Signed In: {isSignedIn ? '✅' : '❌'}</div>
        <div>Auth Type: {authType}</div>
        {user && (
          <>
            <div>Email: {user.primaryEmailAddress?.emailAddress || 'N/A'}</div>
            <div>Name: {user.firstName} {user.lastName}</div>
            <div>User ID: {user.id}</div>
            <div>Role: {user.publicMetadata?.role || 'N/A'}</div>
          </>
        )}
        <div>Firebase Config: {process.env.REACT_APP_FIREBASE_API_KEY ? '✅' : '❌'}</div>
      </div>
    </div>
  );
}