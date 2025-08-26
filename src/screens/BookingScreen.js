import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  Divider,
  List,
  Portal,
  Modal,
  TextInput,
  Switch,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';

import { useShop } from '../contexts/ShopContext';
import { useAuth } from '../contexts/AuthContext';

const BookingScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { shopId } = route.params;
  
  const { getShopById, addBooking } = useShop();
  const { user } = useAuth();

  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(true);

  const [form, setForm] = useState({
    service: '',
    date: new Date(),
    time: '09:00',
    notes: '',
    vehicleInfo: '',
    emergencyContact: '',
  });

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

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30',
  ];

  useEffect(() => {
    loadShopDetails();
  }, [shopId]);

  const loadShopDetails = () => {
    const shopData = getShopById(shopId);
    setShop(shopData);
  };

  const handleServiceSelect = (service) => {
    setForm({ ...form, service });
  };

  const handleTimeSelect = (time) => {
    setForm({ ...form, time });
  };

  const handleSubmit = async () => {
    if (!form.service) {
      Alert.alert('Error', 'Please select a service.');
      return;
    }

    if (!form.vehicleInfo.trim()) {
      Alert.alert('Error', 'Please enter vehicle information.');
      return;
    }

    try {
      setLoading(true);
      
      const bookingData = {
        shopId,
        userId: user.id,
        service: form.service,
        date: form.date.toISOString().split('T')[0],
        time: form.time,
        notes: form.notes,
        vehicleInfo: form.vehicleInfo,
        emergencyContact: form.emergencyContact,
      };

      await addBooking(bookingData);

      // Schedule notification if enabled
      if (notificationEnabled) {
        await scheduleBookingNotification();
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Alert.alert(
        'Booking Confirmed!',
        'Your service booking has been submitted successfully. The shop will contact you to confirm the appointment.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const scheduleBookingNotification = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      // Schedule notification for 1 hour before appointment
      const notificationDate = new Date(form.date);
      const [hours, minutes] = form.time.split(':');
      notificationDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      notificationDate.setHours(notificationDate.getHours() - 1);

      if (notificationDate > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Upcoming Service Appointment',
            body: `Your ${form.service} appointment at ${shop.name} is in 1 hour.`,
            data: { shopId, bookingType: 'reminder' },
          },
          trigger: {
            date: notificationDate,
          },
        });
      }
    } catch (error) {
      console.log('Failed to schedule notification:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      default: return '#64748b';
    }
  };

  if (!shop) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="car" size={64} color="#94a3b8" />
        <Text style={styles.loadingText}>Loading shop details...</Text>
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
          <Ionicons name="calendar-check" size={64} color="#ffffff" />
          <Text style={styles.headerTitle}>Book Service</Text>
          <Text style={styles.headerSubtitle}>
            Schedule your appointment with {shop.name}
          </Text>
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={styles.content}>
        {/* Shop Information */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Shop Details</Title>
            
            <View style={styles.shopInfo}>
              <Text style={styles.shopName}>{shop.name}</Text>
              <Text style={styles.shopAddress}>{shop.address}</Text>
              
              <View style={styles.shopStats}>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#f59e0b" />
                  <Text style={styles.ratingText}>{shop.rating.toFixed(1)}</Text>
                </View>
                
                <View style={styles.statusContainer}>
                  <View style={[styles.statusDot, { backgroundColor: shop.isOpen ? '#10b981' : '#ef4444' }]} />
                  <Text style={[styles.statusText, { color: shop.isOpen ? '#10b981' : '#ef4444' }]}>
                    {shop.isOpen ? 'Open' : 'Closed'}
                  </Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Service Selection */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Select Service *</Title>
            <Text style={styles.cardSubtitle}>
              Choose the service you need
            </Text>
            
            <View style={styles.servicesContainer}>
              {availableServices.map((service) => (
                <Chip
                  key={service}
                  mode={form.service === service ? "flat" : "outlined"}
                  selected={form.service === service}
                  onPress={() => handleServiceSelect(service)}
                  style={styles.serviceChip}
                  selectedColor="#2563eb"
                >
                  {service}
                </Chip>
              ))}
            </View>
            
            {form.service && (
              <Text style={styles.selectedService}>
                Selected: {form.service}
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Date and Time */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Appointment Details</Title>
            
            <TextInput
              label="Date"
              value={form.date.toLocaleDateString()}
              style={styles.input}
              mode="outlined"
              right={<TextInput.Icon icon="calendar" />}
              onPressIn={() => {
                // Show date picker
                Alert.alert('Date Picker', 'Date picker functionality would be implemented here.');
              }}
            />
            
            <Text style={styles.timeLabel}>Preferred Time *</Text>
            <View style={styles.timeContainer}>
              {timeSlots.map((time) => (
                <Chip
                  key={time}
                  mode={form.time === time ? "flat" : "outlined"}
                  selected={form.time === time}
                  onPress={() => handleTimeSelect(time)}
                  style={styles.timeChip}
                  selectedColor="#2563eb"
                >
                  {time}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Vehicle Information */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Vehicle Information *</Title>
            
            <TextInput
              label="Vehicle Details"
              value={form.vehicleInfo}
              onChangeText={(text) => setForm({ ...form, vehicleInfo: text })}
              style={styles.input}
              mode="outlined"
              placeholder="e.g., 2020 Toyota Camry, White, License Plate: ABC123"
              multiline
              numberOfLines={3}
            />
            
            <TextInput
              label="Emergency Contact (Optional)"
              value={form.emergencyContact}
              onChangeText={(text) => setForm({ ...form, emergencyContact: text })}
              style={styles.input}
              mode="outlined"
              placeholder="Name and phone number"
            />
          </Card.Content>
        </Card>

        {/* Additional Notes */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Additional Notes</Title>
            
            <TextInput
              label="Special Requirements"
              value={form.notes}
              onChangeText={(text) => setForm({ ...form, notes: text })}
              style={styles.input}
              mode="outlined"
              placeholder="Any special requirements, issues, or notes for the mechanic"
              multiline
              numberOfLines={4}
            />
          </Card.Content>
        </Card>

        {/* Notifications */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Notifications</Title>
            
            <View style={styles.notificationContainer}>
              <View>
                <Text style={styles.notificationTitle}>Reminder Notifications</Text>
                <Text style={styles.notificationSubtitle}>
                  Get notified 1 hour before your appointment
                </Text>
              </View>
              <Switch
                value={notificationEnabled}
                onValueChange={setNotificationEnabled}
                color="#2563eb"
              />
            </View>
          </Card.Content>
        </Card>

        {/* Booking Summary */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Booking Summary</Title>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Service:</Text>
              <Text style={styles.summaryValue}>{form.service || 'Not selected'}</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Date:</Text>
              <Text style={styles.summaryValue}>{form.date.toLocaleDateString()}</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Time:</Text>
              <Text style={styles.summaryValue}>{form.time}</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Shop:</Text>
              <Text style={styles.summaryValue}>{shop.name}</Text>
            </View>
            
            <Divider style={styles.summaryDivider} />
            
            <Text style={styles.summaryNote}>
              * The shop will contact you to confirm the appointment and provide pricing details.
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
          disabled={loading || !form.service || !form.vehicleInfo.trim()}
        >
          Book Appointment
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
  shopInfo: {
    marginBottom: 8,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  shopAddress: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  shopStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
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
  selectedService: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  input: {
    marginBottom: 16,
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    marginBottom: 8,
  },
  notificationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  notificationSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  summaryValue: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
    textAlign: 'right',
  },
  summaryDivider: {
    marginVertical: 12,
  },
  summaryNote: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 32,
  },
});

export default BookingScreen;