import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import MechanicDetailPage from './pages/MechanicDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';

import { useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';

function App() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Helmet>
        <title>MechLocator - Find Nearby Mechanic Shops</title>
        <meta name="description" content="Find nearby mechanic shops with ease. Get directions, contact information, and ratings for automotive services in your area." />
        <meta name="keywords" content="mechanic, auto repair, car service, automotive, nearby, location" />
        <meta property="og:title" content="MechLocator - Find Nearby Mechanic Shops" />
        <meta property="og:description" content="Find nearby mechanic shops with ease. Get directions, contact information, and ratings for automotive services in your area." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="MechLocator - Find Nearby Mechanic Shops" />
        <meta name="twitter:description" content="Find nearby mechanic shops with ease. Get directions, contact information, and ratings for automotive services in your area." />
      </Helmet>

      <Header />
      
      <main className="flex-1">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/mechanics/:id" element={<MechanicDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected routes */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin routes */}
          <Route 
            path="/admin/*" 
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            } 
          />
          
          {/* 404 route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;