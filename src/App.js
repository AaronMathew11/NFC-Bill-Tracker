// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider, RedirectToSignIn } from '@clerk/clerk-react';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import PrivateRoute from './Components/privateRoute';
import AdminDashboard from './pages/adminDashboard';
import UserDashboard from './pages/dashboard';
import Login from './pages/login';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/admin" element={
        <SignedIn>
          <PrivateRoute adminOnly={true}>
            <AdminDashboard />
          </PrivateRoute>
        </SignedIn>
      } />

      <Route path="/user" element={
        <SignedIn>
          <PrivateRoute adminOnly={false}>
            <UserDashboard />
          </PrivateRoute>
        </SignedIn>
      } />

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
