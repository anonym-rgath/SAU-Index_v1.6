import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import FineTypes from './pages/FineTypes';
import Fines from './pages/Fines';
import Statistics from './pages/Statistics';
import UserManagement from './pages/UserManagement';

// Redirect based on role
const RoleBasedRedirect = () => {
  const { isVorstand } = useAuth();
  return <Navigate to={isVorstand ? "/members" : "/dashboard"} replace />;
};

// Protect routes that vorstand shouldn't access
const AdminOnlyRoute = ({ children }) => {
  const { isVorstand } = useAuth();
  if (isVorstand) {
    return <Navigate to="/members" replace />;
  }
  return children;
};

// Only admin can access
const AdminRoute = ({ children }) => {
  const { isAdmin } = useAuth();
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<RoleBasedRedirect />} />
            <Route path="dashboard" element={<AdminOnlyRoute><Dashboard /></AdminOnlyRoute>} />
            <Route path="members" element={<Members />} />
            <Route path="fine-types" element={<FineTypes />} />
            <Route path="fines" element={<AdminOnlyRoute><Fines /></AdminOnlyRoute>} />
            <Route path="statistics" element={<Statistics />} />
            <Route path="users" element={<AdminRoute><UserManagement /></AdminRoute>} />
          </Route>
          
          <Route path="*" element={<RoleBasedRedirect />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}

export default App;