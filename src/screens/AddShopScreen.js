import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Card,
  Title,
  TextInput,
  Button,
  Chip,
  Divider,
  Switch,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';

import { useShop } from '../contexts/ShopContext';
import { useAuth } from '../contexts/AuthContext';
import WorkingHoursModal from '../components/WorkingHoursModal';

const AddShopScreen = () => {
  const navigation = useNavigation();
  const { addShop } = useShop();
  const { isAdmin } = useAuth();

  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    description: '',
    services: [],
    workingHours: {
      monday: { open: '09:00', close: '17:00' },
      tuesday: { open: '09:00', close: '17:00' },
      wednesday: { open: '09:00', close: '17:00' },
      thursday: { open: '09:00', close: '17:00' },
      friday: { open: '09:00', close: '17:00' },
      saturday: { open: '09:00', close: '16:00' },
      sunday: { open: 'closed', close: 'closed' },
    },
    isOpen: true,
  });

  const [workingHoursModalVisible, setWorkingHoursModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);

  const availableServices = [
    'Oil Change',
    'Brake Repair',
    'Engine Diagnostic',
    'Tire Change',
    'AC Repair',
    'Battery Replacement',
    'Luxury Car Service',
    'Performance Tuning',
    'Body Work',
    'Transmission Repair',
    'Electrical Repair',
    'Wheel Alignment',
  ];

  const handleServiceToggle = (service) => {
    const currentServices = form.services;
    const newServices = currentServices.includes(service)
      ? currentServices.filter(s => s !== service)
      : [...currentServices, service];
    
    setForm({
      ...form,
      services: newServices,
    });
  };

  const handleGetLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to get coordinates.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      Alert.alert('Location Set', 'Current location coordinates have been set.');
    } catch (error) {
      Alert.alert('Error', 'Failed to get current location. Please enter coordinates manually.');
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!form.name.trim()) {
      Alert.alert('Error', 'Shop name is required.');
      return;
    }

    if (!form.address.trim()) {
      Alert.alert('Error', 'Shop address is required.');
      return;
    }

    if (!location) {
      Alert.alert('Error', 'Please set the shop location coordinates.');
      return;
    }

    if (form.services.length === 0) {
      Alert.alert('Error', 'Please select at least one service.');
      return;
    }

    try {
      setLoading(true);
      
      const shopData = {
        ...form,
        latitude: location.latitude,
        longitude: location.longitude,
        isOpen: form.isOpen ? 1 : 0,
      };

      await addShop(shopData);
      
      Alert.alert(
        'Success',
        'Shop added successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add shop. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkingHoursUpdate = (workingHours) => {
    setForm({
      ...form,
      workingHours,
    });
    setWorkingHoursModalVisible(false);
  };

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#ef4444', '#dc2626']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <Ionicons name="shield-checkmark" size={64} color="#ffffff" />
            <Text style={styles.headerTitle}>Admin Access Required</Text>
            <Text style={styles.headerSubtitle}>
              You need admin privileges to add new shops.
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <Button
            mode="contained"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            buttonColor="#ef4444"
          >
            Go Back
          </Button>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={['#2563eb', '#1d4ed8']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Ionicons name="add-circle" size={64} color="#ffffff" />
          <Text style={styles.headerTitle}>Add New Shop</Text>
          <Text style={styles.headerSubtitle}>
            Enter the details for the new mechanic shop
          </Text>
        </View>
      </LinearGradient>

      {/* Form */}
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Basic Information</Title>
            
            <TextInput
              label="Shop Name *"
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
              style={styles.input}
              mode="outlined"
              placeholder="Enter shop name"
            />
            
            <TextInput
              label="Address *"
              value={form.address}
              onChangeText={(text) => setForm({ ...form, address: text })}
              style={styles.input}
              mode="outlined"
              placeholder="Enter shop address"
              multiline
              numberOfLines={2}
            />
            
            <TextInput
              label="Phone Number"
              value={form.phone}
              onChangeText={(text) => setForm({ ...form, phone: text })}
              style={styles.input}
              mode="outlined"
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
            
            <TextInput
              label="Email"
              value={form.email}
              onChangeText={(text) => setForm({ ...form, email: text })}
              style={styles.input}
              mode="outlined"
              placeholder="Enter email address"
              keyboardType="email-address"
            />
            
            <TextInput
              label="Description"
              value={form.description}
              onChangeText={(text) => setForm({ ...form, description: text })}
              style={styles.input}
              mode="outlined"
              placeholder="Enter shop description"
              multiline
              numberOfLines={3}
            />
          </Card.Content>
        </Card>

        {/* Location */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Location</Title>
            
            <Button
              mode="outlined"
              onPress={handleGetLocation}
              style={styles.locationButton}
              icon="location"
            >
              Get Current Location
            </Button>
            
            {location && (
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>Coordinates:</Text>
                <Text style={styles.locationText}>
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </Text>
              </View>
            )}
            
            <Text style={styles.locationNote}>
              * Location coordinates are required to display the shop on the map
            </Text>
          </Card.Content>
        </Card>

        {/* Services */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Services *</Title>
            <Text style={styles.cardSubtitle}>
              Select the services this shop provides
            </Text>
            
            <View style={styles.servicesContainer}>
              {availableServices.map((service) => (
                <Chip
                  key={service}
                  mode={form.services.includes(service) ? "flat" : "outlined"}
                  selected={form.services.includes(service)}
                  onPress={() => handleServiceToggle(service)}
                  style={styles.serviceChip}
                  selectedColor="#2563eb"
                >
                  {service}
                </Chip>
              ))}
            </View>
            
            {form.services.length > 0 && (
              <Text style={styles.selectedCount}>
                {form.services.length} service(s) selected
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Working Hours */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Working Hours</Title>
            
            <Button
              mode="outlined"
              onPress={() => setWorkingHoursModalVisible(true)}
              style={styles.workingHoursButton}
              icon="clock"
            >
              Set Working Hours
            </Button>
            
            <View style={styles.workingHoursPreview}>
              {Object.entries(form.workingHours).map(([day, hours]) => (
                <View key={day} style={styles.hoursRow}>
                  <Text style={styles.dayLabel}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
                  <Text style={styles.hoursText}>
                    {hours.open === 'closed' ? 'Closed' : `${hours.open} - ${hours.close}`}
                  </Text>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Status */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Status</Title>
            
            <View style={styles.statusContainer}>
              <Text style={styles.statusLabel}>Shop is Open</Text>
              <Switch
                value={form.isOpen}
                onValueChange={(value) => setForm({ ...form, isOpen: value })}
                color="#2563eb"
              />
            </View>
            
            <Text style={styles.statusNote}>
              * You can change this later from the admin panel
            </Text>
          </Card.Content>
        </Card>

        {/* Submit Button */}
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
          buttonColor="#2563eb"
          loading={loading}
          disabled={loading}
        >
          Add Shop
        </Button>
      </View>

      {/* Working Hours Modal */}
      <WorkingHoursModal
        visible={workingHoursModalVisible}
        workingHours={form.workingHours}
        onApply={handleWorkingHoursUpdate}
        onDismiss={() => setWorkingHoursModalVisible(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerGradient: {
    padding: 20,
    paddingTop: 40,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e2e8f0',
    textAlign: 'center',
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardSubtitle: {
    color: '#64748b',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  locationButton: {
    marginBottom: 16,
  },
  locationInfo: {
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'monospace',
  },
  locationNote: {
    fontSize: 12,
    color: '#ef4444',
    fontStyle: 'italic',
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  serviceChip: {
    marginBottom: 8,
  },
  selectedCount: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  workingHoursButton: {
    marginBottom: 16,
  },
  workingHoursPreview: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  hoursText: {
    fontSize: 14,
    color: '#64748b',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  statusNote: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 32,
  },
  backButton: {
    marginTop: 16,
  },
});

export default AddShopScreen;