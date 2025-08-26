import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Phone, 
  Star, 
  Search, 
  Clock, 
  Shield, 
  Users, 
  Zap,
  ArrowRight,
  Navigation
} from 'lucide-react';

import { useLocation } from '../contexts/LocationContext';
import { useAuth } from '../contexts/AuthContext';

const HomePage = () => {
  const navigate = useNavigate();
  const { requestLocation, hasLocation, latitude, longitude } = useLocation();
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleFindMechanics = async () => {
    if (!hasLocation) {
      setIsLoading(true);
      try {
        await requestLocation();
      } catch (error) {
        // If location fails, navigate to search page where user can enter manually
        navigate('/search');
        return;
      } finally {
        setIsLoading(false);
      }
    }
    
    if (hasLocation) {
      navigate(`/search?lat=${latitude}&lng=${longitude}`);
    }
  };

  const features = [
    {
      icon: <MapPin className="w-6 h-6" />,
      title: 'Find Nearby Mechanics',
      description: 'Discover mechanic shops in your area with real-time location services.'
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: 'Verified Ratings',
      description: 'Read reviews and ratings from real customers to make informed decisions.'
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: 'One-Click Calling',
      description: 'Call mechanics directly with a single tap - no need to copy numbers.'
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: 'Working Hours',
      description: 'Check when shops are open and plan your visit accordingly.'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Trusted & Secure',
      description: 'All mechanic shops are verified and your data is protected.'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Community Driven',
      description: 'Join thousands of users who trust MechLocator for their automotive needs.'
    }
  ];

  const stats = [
    { number: '1000+', label: 'Mechanic Shops' },
    { number: '50K+', label: 'Happy Users' },
    { number: '4.8', label: 'Average Rating' },
    { number: '24/7', label: 'Support' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 to-primary-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <motion.h1 
              className="text-4xl md:text-6xl font-bold mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Find the Best
              <span className="block text-primary-200">Mechanic Near You</span>
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl mb-8 text-primary-100 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Get instant access to nearby mechanic shops with ratings, reviews, and contact information. 
              Your car deserves the best care.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <button
                onClick={handleFindMechanics}
                disabled={isLoading}
                className="btn btn-lg bg-white text-primary-600 hover:bg-primary-50 flex items-center gap-2"
              >
                {isLoading ? (
                  <div className="animate-spin w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full"></div>
                ) : (
                  <Search className="w-5 h-5" />
                )}
                {isLoading ? 'Getting Location...' : 'Find Mechanics Now'}
              </button>
              
              {!isAuthenticated && (
                <Link
                  to="/register"
                  className="btn btn-lg btn-outline border-white text-white hover:bg-white hover:text-primary-600"
                >
                  Sign Up Free
                </Link>
              )}
            </motion.div>

            <motion.div 
              className="mt-12 flex justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <div className="flex items-center gap-2 text-primary-200">
                <Navigation className="w-4 h-4" />
                <span className="text-sm">Uses your location to find nearby mechanics</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-secondary-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              Why Choose MechLocator?
            </h2>
            <p className="text-xl text-secondary-600 max-w-3xl mx-auto">
              We make finding reliable automotive services simple and convenient
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="card p-6 text-center hover:shadow-lg transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-secondary-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-secondary-600">
              Get started in just three simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Allow Location Access',
                description: 'Grant permission to access your location for the best results'
              },
              {
                step: '2',
                title: 'Browse Nearby Shops',
                description: 'View mechanic shops with ratings, reviews, and contact info'
              },
              {
                step: '3',
                title: 'Contact & Get Service',
                description: 'Call directly or get directions to your chosen mechanic'
              }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-secondary-600">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Ready to Find Your Perfect Mechanic?
          </motion.h2>
          
          <motion.p 
            className="text-xl mb-8 text-primary-100"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            Join thousands of satisfied customers who trust MechLocator for their automotive needs
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <button
              onClick={handleFindMechanics}
              className="btn btn-lg bg-white text-primary-600 hover:bg-primary-50 flex items-center gap-2"
            >
              Start Searching
              <ArrowRight className="w-5 h-5" />
            </button>
            
            {!isAuthenticated && (
              <Link
                to="/register"
                className="btn btn-lg btn-outline border-white text-white hover:bg-white hover:text-primary-600"
              >
                Create Account
              </Link>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;