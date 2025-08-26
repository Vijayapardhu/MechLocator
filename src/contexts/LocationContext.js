import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';

const LocationContext = createContext();

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setPermissionGranted(true);
        return true;
      } else {
        setPermissionGranted(false);
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to find nearby mechanic shops.',
          [{ text: 'OK' }]
        );
        return false;
      }
    } catch (err) {
      setError('Failed to request location permission');
      return false;
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      });

      setLocation(currentLocation);
    } catch (err) {
      setError('Failed to get current location');
      console.error('Location error:', err);
    } finally {
      setLoading(false);
    }
  };

  const watchLocation = async () => {
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) return;

      const locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000,
          distanceInterval: 50,
        },
        (newLocation) => {
          setLocation(newLocation);
        }
      );

      return locationSubscription;
    } catch (err) {
      setError('Failed to watch location');
      console.error('Watch location error:', err);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance;
  };

  const getNearbyShops = (shops, radius = 10) => {
    if (!location || !shops) return [];
    
    return shops.filter(shop => {
      const distance = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        shop.latitude,
        shop.longitude
      );
      return distance <= radius;
    }).sort((a, b) => {
      const distanceA = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        a.latitude,
        a.longitude
      );
      const distanceB = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        b.latitude,
        b.longitude
      );
      return distanceA - distanceB;
    });
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const value = {
    location,
    loading,
    error,
    permissionGranted,
    getCurrentLocation,
    watchLocation,
    calculateDistance,
    getNearbyShops,
    requestLocationPermission,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};