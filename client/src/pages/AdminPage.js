import React from 'react';
import { Helmet } from 'react-helmet-async';

const AdminPage = () => {
  return (
    <>
      <Helmet>
        <title>Admin Dashboard - MechLocator</title>
        <meta name="description" content="Admin dashboard for managing mechanic shops and system settings." />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Admin Dashboard
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Admin dashboard coming soon...
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminPage;