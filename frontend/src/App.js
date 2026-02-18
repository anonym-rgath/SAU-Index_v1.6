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
import AuditLogs from './pages/AuditLogs';

// Redirect based on role
const RoleBasedRedirect = () => {
  const { isVorstand, isMitglied } = useAuth();
  if (isVorstand) {
    return <Navigate to="/members" replace />;
  }
  if (isMitglied) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

// Protect routes that vorstand shouldn't access (but mitglied can)
const DashboardRoute = ({ children }) => {
  const { isVorstand } = useAuth();
  if (isVorstand) {
    return <Navigate to="/members" replace />;
  }
  return children;
};

// Routes that mitglied cannot access
const NoMitgliedRoute = ({ children }) => {
  const { isMitglied } = useAuth();
  if (isMitglied) {
    return <Navigate to="/dashboard" replace />;
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
            <Route path="dashboard" element={<DashboardRoute><Dashboard /></DashboardRoute>} />
            <Route path="members" element={<NoMitgliedRoute><Members /></NoMitgliedRoute>} />
            <Route path="fine-types" element={<NoMitgliedRoute><FineTypes /></NoMitgliedRoute>} />
            <Route path="fines" element={<DashboardRoute><Fines /></DashboardRoute>} />
            <Route path="statistics" element={<NoMitgliedRoute><Statistics /></NoMitgliedRoute>} />
            <Route path="users" element={<AdminRoute><UserManagement /></AdminRoute>} />
            <Route path="audit" element={<AdminRoute><AuditLogs /></AdminRoute>} />
          </Route>
          
          <Route path="*" element={<RoleBasedRedirect />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}

export default App;