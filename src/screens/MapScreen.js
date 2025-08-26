import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { Card, Title, Paragraph, Button, Chip, FAB } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useLocation } from '../contexts/LocationContext';
import { useShop } from '../contexts/ShopContext';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

const MapScreen = () => {
  const navigation = useNavigation();
  const { location, loading: locationLoading, getCurrentLocation } = useLocation();
  const { shops, filters, filterShops } = useShop();
  const { user } = useAuth();

  const mapRef = useRef(null);
  const [selectedShop, setSelectedShop] = useState(null);
  const [region, setRegion] = useState(null);
  const [filteredShops, setFilteredShops] = useState([]);

  useEffect(() => {
    if (location) {
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      setRegion(newRegion);
      
      // Animate to user location
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
    }
  }, [location]);

  useEffect(() => {
    if (shops.length > 0) {
      const filtered = filterShops(shops);
      setFilteredShops(filtered);
    }
  }, [shops, filters]);

  const handleMarkerPress = (shop) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedShop(shop);
  };

  const handleCallShop = (shop) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (shop.phone) {
      Alert.alert(
        'Call Shop',
        `Call ${shop.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Call',
            onPress: () => {
              Linking.openURL(`tel:${shop.phone}`);
            },
          },
        ]
      );
    } else {
      Alert.alert('No Phone Number', 'This shop does not have a phone number listed.');
    }
  };

  const handleDirections = (shop) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`;
    Linking.openURL(url);
  };

  const handleShopPress = (shop) => {
    navigation.navigate('ShopDetail', { shopId: shop.id });
  };

  const handleMyLocation = () => {
    if (location) {
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      mapRef.current?.animateToRegion(newRegion, 1000);
    } else {
      getCurrentLocation();
    }
  };

  const getMarkerColor = (shop) => {
    if (shop.rating >= 4.5) return '#10b981';
    if (shop.rating >= 4.0) return '#f59e0b';
    if (shop.rating >= 3.5) return '#f97316';
    return '#ef4444';
  };

  const getStatusColor = (isOpen) => {
    return isOpen ? '#10b981' : '#ef4444';
  };

  if (locationLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="location" size={64} color="#94a3b8" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        onRegionChangeComplete={setRegion}
      >
        {filteredShops.map((shop) => (
          <Marker
            key={shop.id}
            coordinate={{
              latitude: shop.latitude,
              longitude: shop.longitude,
            }}
            onPress={() => handleMarkerPress(shop)}
          >
            <View style={[styles.marker, { backgroundColor: getMarkerColor(shop) }]}>
              <Ionicons name="car" size={16} color="#ffffff" />
            </View>
            
            <Callout tooltip>
              <View style={styles.calloutContainer}>
                <LinearGradient
                  colors={['#ffffff', '#f8fafc']}
                  style={styles.calloutGradient}
                >
                  <Title style={styles.calloutTitle}>{shop.name}</Title>
                  <Paragraph style={styles.calloutAddress}>{shop.address}</Paragraph>
                  
                  <View style={styles.calloutStats}>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={14} color="#f59e0b" />
                      <Text style={styles.ratingText}>{shop.rating.toFixed(1)}</Text>
                    </View>
                    
                    <View style={styles.statusContainer}>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(shop.isOpen) }]} />
                      <Text style={[styles.statusText, { color: getStatusColor(shop.isOpen) }]}>
                        {shop.isOpen ? 'Open' : 'Closed'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.calloutActions}>
                    <TouchableOpacity
                      style={styles.calloutButton}
                      onPress={() => handleShopPress(shop)}
                    >
                      <Ionicons name="information-circle" size={16} color="#2563eb" />
                      <Text style={styles.calloutButtonText}>Details</Text>
                    </TouchableOpacity>
                    
                    {shop.phone && (
                      <TouchableOpacity
                        style={[styles.calloutButton, styles.callButton]}
                        onPress={() => handleCallShop(shop)}
                      >
                        <Ionicons name="call" size={16} color="#ffffff" />
                        <Text style={[styles.calloutButtonText, styles.callButtonText]}>
                          Call
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </LinearGradient>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Selected Shop Card */}
      {selectedShop && (
        <View style={styles.selectedShopContainer}>
          <Card style={styles.selectedShopCard}>
            <Card.Content>
              <View style={styles.selectedShopHeader}>
                <View style={styles.selectedShopInfo}>
                  <Title style={styles.selectedShopName}>{selectedShop.name}</Title>
                  <Paragraph style={styles.selectedShopAddress}>
                    {selectedShop.address}
                  </Paragraph>
                  
                  <View style={styles.selectedShopStats}>
                    <Chip
                      icon="star"
                      mode="outlined"
                      style={styles.ratingChip}
                    >
                      {selectedShop.rating.toFixed(1)} ({selectedShop.reviewCount})
                    </Chip>
                    <Chip
                      icon={selectedShop.isOpen ? "check-circle" : "close-circle"}
                      mode="outlined"
                      style={[
                        styles.statusChip,
                        { backgroundColor: selectedShop.isOpen ? '#dcfce7' : '#fef2f2' }
                      ]}
                    >
                      {selectedShop.isOpen ? 'Open' : 'Closed'}
                    </Chip>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setSelectedShop(null)}
                >
                  <Ionicons name="close" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.selectedShopServices}>
                {selectedShop.services.slice(0, 3).map((service, index) => (
                  <Chip key={index} mode="outlined" style={styles.serviceChip}>
                    {service}
                  </Chip>
                ))}
                {selectedShop.services.length > 3 && (
                  <Chip mode="outlined" style={styles.serviceChip}>
                    +{selectedShop.services.length - 3} more
                  </Chip>
                )}
              </View>
            </Card.Content>
            
            <Card.Actions style={styles.selectedShopActions}>
              <Button
                mode="outlined"
                onPress={() => handleShopPress(selectedShop)}
                style={styles.actionButton}
              >
                View Details
              </Button>
              <Button
                mode="contained"
                onPress={() => handleDirections(selectedShop)}
                style={styles.actionButton}
                buttonColor="#2563eb"
              >
                Directions
              </Button>
              {selectedShop.phone && (
                <Button
                  mode="contained"
                  onPress={() => handleCallShop(selectedShop)}
                  style={styles.actionButton}
                  buttonColor="#10b981"
                >
                  Call Now
                </Button>
              )}
            </Card.Actions>
          </Card>
        </View>
      )}

      {/* My Location Button */}
      <TouchableOpacity
        style={styles.myLocationButton}
        onPress={handleMyLocation}
      >
        <Ionicons name="locate" size={24} color="#2563eb" />
      </TouchableOpacity>

      {/* Add Shop FAB for Admin */}
      {user?.isAdmin && (
        <FAB
          style={styles.fab}
          icon="plus"
          onPress={() => navigation.navigate('AddShop')}
          label="Add Shop"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width,
    height,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
  },
  marker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    elevation: 4,
  },
  calloutContainer: {
    width: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  calloutGradient: {
    padding: 12,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  calloutAddress: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  calloutStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  calloutActions: {
    flexDirection: 'row',
    gap: 8,
  },
  calloutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flex: 1,
    justifyContent: 'center',
  },
  calloutButtonText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  callButton: {
    backgroundColor: '#10b981',
  },
  callButtonText: {
    color: '#ffffff',
  },
  selectedShopContainer: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
  },
  selectedShopCard: {
    elevation: 8,
    borderRadius: 12,
  },
  selectedShopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  selectedShopInfo: {
    flex: 1,
  },
  selectedShopName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  selectedShopAddress: {
    color: '#64748b',
    marginBottom: 8,
  },
  selectedShopStats: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingChip: {
    backgroundColor: '#fef3c7',
  },
  statusChip: {
    backgroundColor: '#dcfce7',
  },
  closeButton: {
    padding: 4,
  },
  selectedShopServices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  serviceChip: {
    marginBottom: 4,
  },
  selectedShopActions: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  myLocationButton: {
    position: 'absolute',
    top: 100,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2563eb',
  },
});

export default MapScreen;