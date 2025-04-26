import { useUser } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children, adminOnly }) {
  const { isSignedIn, user } = useUser();

  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  const role = user?.publicMetadata?.role || "user"; // default role

  if (adminOnly && role !== "admin") {
    return <Navigate to="/user" replace />;
  }

  if (!adminOnly && role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
