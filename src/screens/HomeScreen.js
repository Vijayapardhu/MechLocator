import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, Title, Paragraph, Chip, Button, Searchbar, FAB } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useLocation } from '../contexts/LocationContext';
import { useShop } from '../contexts/ShopContext';
import { useAuth } from '../contexts/AuthContext';
import FilterModal from '../components/FilterModal';
import ShopCard from '../components/ShopCard';

const HomeScreen = () => {
  const navigation = useNavigation();
  const { location, loading: locationLoading, getCurrentLocation, getNearbyShops } = useLocation();
  const { shops, loading: shopsLoading, filters, updateFilters, filterShops } = useShop();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filteredShops, setFilteredShops] = useState([]);

  useEffect(() => {
    if (location && shops.length > 0) {
      const nearbyShops = getNearbyShops(shops, filters.distance);
      const filtered = filterShops(nearbyShops);
      setFilteredShops(filtered);
    }
  }, [location, shops, filters]);

  const onRefresh = async () => {
    setRefreshing(true);
    await getCurrentLocation();
    setRefreshing(false);
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

  const handleShopPress = (shop) => {
    navigation.navigate('ShopDetail', { shopId: shop.id });
  };

  const handleFilterPress = () => {
    setFilterModalVisible(true);
  };

  const handleFilterApply = (newFilters) => {
    updateFilters(newFilters);
    setFilterModalVisible(false);
  };

  const renderShopItem = ({ item }) => {
    const distance = location ? 
      getNearbyShops([item], 1000)[0] ? 
        getNearbyShops([item], 1000)[0].distance : null : null;

    return (
      <ShopCard
        shop={item}
        distance={distance}
        onPress={() => handleShopPress(item)}
        onCallPress={() => handleCallShop(item)}
      />
    );
  };

  const renderEmptyState = () => {
    if (locationLoading || shopsLoading) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="location" size={64} color="#94a3b8" />
          <Text style={styles.emptyStateTitle}>Finding nearby shops...</Text>
          <Text style={styles.emptyStateSubtitle}>
            We're detecting your location and loading mechanic shops in your area.
          </Text>
        </View>
      );
    }

    if (!location) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="location-off" size={64} color="#94a3b8" />
          <Text style={styles.emptyStateTitle}>Location Access Required</Text>
          <Text style={styles.emptyStateSubtitle}>
            Please enable location access to find nearby mechanic shops.
          </Text>
          <Button
            mode="contained"
            onPress={getCurrentLocation}
            style={styles.retryButton}
          >
            Enable Location
          </Button>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name="car-outline" size={64} color="#94a3b8" />
        <Text style={styles.emptyStateTitle}>No Shops Found</Text>
        <Text style={styles.emptyStateSubtitle}>
          No mechanic shops found in your area. Try adjusting your filters or expanding the search radius.
        </Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient
        colors={['#2563eb', '#1d4ed8']}
        style={styles.headerGradient}
      >
        <Text style={styles.welcomeText}>
          {user ? `Welcome back, ${user.name}!` : 'Welcome to MechLocator'}
        </Text>
        <Text style={styles.subtitleText}>
          Find the best mechanic shops near you
        </Text>
        
        <Searchbar
          placeholder="Search shops..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          iconColor="#94a3b8"
        />
        
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={handleFilterPress}
          >
            <Ionicons name="filter" size={20} color="#2563eb" />
            <Text style={styles.filterButtonText}>Filters</Text>
            {(filters.rating > 0 || filters.services.length > 0 || filters.isOpen) && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>
                  {[filters.rating > 0, filters.services.length > 0, filters.isOpen].filter(Boolean).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          
          <View style={styles.locationInfo}>
            <Ionicons name="location" size={16} color="#ffffff" />
            <Text style={styles.locationText}>
              {location ? `${filters.distance}km radius` : 'Location unavailable'}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredShops}
        renderItem={renderShopItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2563eb']}
          />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
      
      <FilterModal
        visible={filterModalVisible}
        filters={filters}
        onApply={handleFilterApply}
        onDismiss={() => setFilterModalVisible(false)}
      />
      
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
    backgroundColor: '#f8fafc',
  },
  header: {
    marginBottom: 16,
  },
  headerGradient: {
    padding: 20,
    paddingTop: 40,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 16,
    color: '#e2e8f0',
    marginBottom: 20,
  },
  searchBar: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
    elevation: 0,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    position: 'relative',
  },
  filterButtonText: {
    marginLeft: 8,
    color: '#2563eb',
    fontWeight: '600',
  },
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    color: '#ffffff',
    marginLeft: 4,
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: '#2563eb',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2563eb',
  },
});

export default HomeScreen;