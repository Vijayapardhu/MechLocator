import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sample admin credentials (in production, this would be handled by a backend)
  const ADMIN_CREDENTIALS = {
    email: 'admin@mechlocator.com',
    password: 'admin123',
  };

  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async () => {
    try {
      const userData = await SecureStore.getItemAsync('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAdmin(parsedUser.isAdmin || false);
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveUserToStorage = async (userData) => {
    try {
      await SecureStore.setItemAsync('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if it's admin login
      if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        const adminUser = {
          id: 'admin-1',
          email: email,
          name: 'Admin User',
          isAdmin: true,
          createdAt: new Date().toISOString(),
        };
        
        setUser(adminUser);
        setIsAdmin(true);
        await saveUserToStorage(adminUser);
        
        return { success: true, user: adminUser };
      }

      // Regular user login (simplified for demo)
      if (email && password.length >= 6) {
        const regularUser = {
          id: `user-${Date.now()}`,
          email: email,
          name: email.split('@')[0],
          isAdmin: false,
          createdAt: new Date().toISOString(),
        };
        
        setUser(regularUser);
        setIsAdmin(false);
        await saveUserToStorage(regularUser);
        
        return { success: true, user: regularUser };
      }

      throw new Error('Invalid credentials');
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, name) => {
    try {
      setLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (!email || !password || !name) {
        throw new Error('All fields are required');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const newUser = {
        id: `user-${Date.now()}`,
        email: email,
        name: name,
        isAdmin: false,
        createdAt: new Date().toISOString(),
      };
      
      setUser(newUser);
      setIsAdmin(false);
      await saveUserToStorage(newUser);
      
      return { success: true, user: newUser };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await SecureStore.deleteItemAsync('user');
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('No user logged in');
      
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      await saveUserToStorage(updatedUser);
      
      return { success: true, user: updatedUser };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      if (!user) throw new Error('No user logged in');
      
      // In a real app, you would verify the current password with the backend
      if (newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters');
      }

      // Simulate password change
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert('Success', 'Password changed successfully');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (!email) {
        throw new Error('Email is required');
      }

      // In a real app, this would send a password reset email
      Alert.alert(
        'Password Reset',
        'If an account with that email exists, a password reset link has been sent.',
        [{ text: 'OK' }]
      );
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    isAdmin,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};