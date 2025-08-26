import React from 'react';
import { Helmet } from 'react-helmet-async';

const SearchPage = () => {
  return (
    <>
      <Helmet>
        <title>Find Mechanics - MechLocator</title>
        <meta name="description" content="Search for nearby mechanic shops with ratings and contact information." />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Find Nearby Mechanics
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Search page coming soon...
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchPage;