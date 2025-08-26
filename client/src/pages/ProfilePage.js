import React from 'react';
import { Helmet } from 'react-helmet-async';

const ProfilePage = () => {
  return (
    <>
      <Helmet>
        <title>Profile - MechLocator</title>
        <meta name="description" content="Manage your MechLocator profile and preferences." />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Profile
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Profile page coming soon...
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;