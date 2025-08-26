import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import MapScreen from './src/screens/MapScreen';
import ShopDetailScreen from './src/screens/ShopDetailScreen';
import AdminScreen from './src/screens/AdminScreen';
import AddShopScreen from './src/screens/AddShopScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import BookingScreen from './src/screens/BookingScreen';
import ReviewsScreen from './src/screens/ReviewsScreen';

// Import context providers
import { LocationProvider } from './src/contexts/LocationContext';
import { ShopProvider } from './src/contexts/ShopContext';
import { AuthProvider } from './src/contexts/AuthContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Custom theme
const theme = {
  colors: {
    primary: '#2563eb',
    accent: '#f59e0b',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#1e293b',
    placeholder: '#94a3b8',
    border: '#e2e8f0',
    error: '#ef4444',
    success: '#10b981',
  },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Admin') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.placeholder,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Nearby Shops' }}
      />
      <Tab.Screen 
        name="Map" 
        component={MapScreen}
        options={{ title: 'Map View' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Tab.Screen 
        name="Admin" 
        component={AdminScreen}
        options={{ title: 'Admin Panel' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <LocationProvider>
          <ShopProvider>
            <NavigationContainer>
              <StatusBar style="light" />
              <Stack.Navigator
                screenOptions={{
                  headerStyle: {
                    backgroundColor: theme.colors.primary,
                  },
                  headerTintColor: '#ffffff',
                  headerTitleStyle: {
                    fontWeight: 'bold',
                  },
                }}
              >
                <Stack.Screen 
                  name="MainTabs" 
                  component={MainTabs}
                  options={{ headerShown: false }}
                />
                <Stack.Screen 
                  name="ShopDetail" 
                  component={ShopDetailScreen}
                  options={{ title: 'Shop Details' }}
                />
                <Stack.Screen 
                  name="AddShop" 
                  component={AddShopScreen}
                  options={{ title: 'Add New Shop' }}
                />
                <Stack.Screen 
                  name="Booking" 
                  component={BookingScreen}
                  options={{ title: 'Book Service' }}
                />
                <Stack.Screen 
                  name="Reviews" 
                  component={ReviewsScreen}
                  options={{ title: 'Reviews' }}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </ShopProvider>
        </LocationProvider>
      </AuthProvider>
    </PaperProvider>
  );
}