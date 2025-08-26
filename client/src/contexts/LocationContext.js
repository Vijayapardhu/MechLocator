import React, { createContext, useContext, useReducer, useEffect } from 'react';
import toast from 'react-hot-toast';

const LocationContext = createContext();

const initialState = {
  latitude: null,
  longitude: null,
  isLoading: false,
  error: null,
  permission: 'prompt' // 'granted', 'denied', 'prompt'
};

const locationReducer = (state, action) => {
  switch (action.type) {
    case 'LOCATION_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case 'LOCATION_SUCCESS':
      return {
        ...state,
        latitude: action.payload.latitude,
        longitude: action.payload.longitude,
        isLoading: false,
        error: null
      };
    case 'LOCATION_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };
    case 'SET_PERMISSION':
      return {
        ...state,
        permission: action.payload
      };
    case 'CLEAR_LOCATION':
      return {
        ...state,
        latitude: null,
        longitude: null,
        error: null
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

export const LocationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(locationReducer, initialState);

  // Check geolocation support and permission on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      dispatch({
        type: 'LOCATION_FAILURE',
        payload: 'Geolocation is not supported by this browser'
      });
      return;
    }

    // Check permission status
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        dispatch({ type: 'SET_PERMISSION', payload: result.state });
        
        // Listen for permission changes
        result.addEventListener('change', () => {
          dispatch({ type: 'SET_PERMISSION', payload: result.state });
        });
      });
    }
  }, []);

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = 'Geolocation is not supported by this browser';
        dispatch({ type: 'LOCATION_FAILURE', payload: error });
        reject(new Error(error));
        return;
      }

      dispatch({ type: 'LOCATION_START' });

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          dispatch({
            type: 'LOCATION_SUCCESS',
            payload: { latitude, longitude }
          });
          
          resolve({ latitude, longitude });
        },
        (error) => {
          let errorMessage = 'Failed to get location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
              dispatch({ type: 'SET_PERMISSION', payload: 'denied' });
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again.';
              break;
            default:
              errorMessage = 'An unknown error occurred while getting location.';
          }
          
          dispatch({ type: 'LOCATION_FAILURE', payload: errorMessage });
          reject(new Error(errorMessage));
        },
        options
      );
    });
  };

  const requestLocation = async () => {
    try {
      const coords = await getCurrentLocation();
      toast.success('Location obtained successfully!');
      return coords;
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const setLocation = (latitude, longitude) => {
    dispatch({
      type: 'LOCATION_SUCCESS',
      payload: { latitude, longitude }
    });
  };

  const clearLocation = () => {
    dispatch({ type: 'CLEAR_LOCATION' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    latitude: state.latitude,
    longitude: state.longitude,
    isLoading: state.isLoading,
    error: state.error,
    permission: state.permission,
    hasLocation: !!(state.latitude && state.longitude),
    getCurrentLocation,
    requestLocation,
    setLocation,
    clearLocation,
    clearError
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};