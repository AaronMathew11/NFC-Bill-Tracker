import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function PrivateRoute({ children, adminOnly }) {
  const { isSignedIn, user } = useAuth();

  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  const role = user?.publicMetadata?.role || "user";

  if (adminOnly && role !== "admin") {
    return <Navigate to="/user" replace />;
  }

  if (!adminOnly && role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
