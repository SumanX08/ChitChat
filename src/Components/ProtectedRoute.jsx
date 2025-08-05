import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

const ProtectedRoute = ({ children }) => {
  const { userData, isAuthLoading } = useContext(AppContext);

  if (isAuthLoading) return null; 
  return userData?.id ? children : <Navigate to="/" replace />;
};

export default ProtectedRoute;
