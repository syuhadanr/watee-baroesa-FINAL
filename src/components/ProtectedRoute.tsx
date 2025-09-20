import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ProtectedRoute = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="container mx-auto p-8 text-center">Loading...</div>;
  }

  return session ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;