import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const MFAGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, aal, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  // If not logged in, go to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If logged in as admin but only aal1, and we are not on the enrollment page, go to enrollment
  const isAdmin = useAuth().user?.role === 'admin';

  if (isAdmin && aal === 'aal1' && location.pathname !== '/mfa-enroll') {
    return <Navigate to="/mfa-enroll" replace />;
  }

  return <>{children}</>;
};
