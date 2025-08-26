import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  TouchableOpacity,
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
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useShop } from '../contexts/ShopContext';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';

const ShopDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { shopId } = route.params;
  
  const { getShopById, getReviews, addReview } = useShop();
  const { user } = useAuth();
  const { location, calculateDistance } = useLocation();

  const [shop, setShop] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState(null);

  const [bookingForm, setBookingForm] = useState({
    service: '',
    date: new Date(),
    time: '09:00',
    notes: '',
  });

  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
  });

  useEffect(() => {
    loadShopDetails();
  }, [shopId]);

  const loadShopDetails = async () => {
    try {
      setLoading(true);
      const shopData = getShopById(shopId);
      setShop(shopData);

      if (shopData && location) {
        const dist = calculateDistance(
          location.coords.latitude,
          location.coords.longitude,
          shopData.latitude,
          shopData.longitude
        );
        setDistance(dist);
      }

      const shopReviews = await getReviews(shopId);
      setReviews(shopReviews);
    } catch (error) {
      Alert.alert('Error', 'Failed to load shop details.');
    } finally {
      setLoading(false);
    }
  };

  const handleCallShop = () => {
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

  const handleDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`;
    Linking.openURL(url);
  };

  const handleBookService = () => {
    if (!user) {
      Alert.alert(
        'Login Required',
        'Please sign in to book a service.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Profile') },
        ]
      );
      return;
    }
    setBookingModalVisible(true);
  };

  const handleSubmitBooking = async () => {
    if (!bookingForm.service) {
      Alert.alert('Error', 'Please select a service.');
      return;
    }

    try {
      setLoading(true);
      // Here you would call the booking API
      Alert.alert(
        'Booking Submitted',
        'Your booking has been submitted successfully! The shop will contact you to confirm.',
        [{ text: 'OK', onPress: () => setBookingModalVisible(false) }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddReview = () => {
    if (!user) {
      Alert.alert(
        'Login Required',
        'Please sign in to add a review.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Profile') },
        ]
      );
      return;
    }
    setReviewModalVisible(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewForm.comment.trim()) {
      Alert.alert('Error', 'Please enter a review comment.');
      return;
    }

    try {
      setLoading(true);
      await addReview(shopId, {
        userId: user.id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
      
      Alert.alert(
        'Review Submitted',
        'Thank you for your review!',
        [{ text: 'OK', onPress: () => setReviewModalVisible(false) }]
      );
      
      // Reload reviews
      const shopReviews = await getReviews(shopId);
      setReviews(shopReviews);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDistance = (dist) => {
    if (!dist) return null;
    if (dist < 1) {
      return `${Math.round(dist * 1000)}m`;
    }
    return `${dist.toFixed(1)}km`;
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return '#10b981';
    if (rating >= 4.0) return '#f59e0b';
    if (rating >= 3.5) return '#f97316';
    return '#ef4444';
  };

  const getStatusColor = (isOpen) => {
    return isOpen ? '#10b981' : '#ef4444';
  };

  if (loading || !shop) {
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
          <Title style={styles.shopName}>{shop.name}</Title>
          <Paragraph style={styles.shopAddress}>{shop.address}</Paragraph>
          
          <View style={styles.headerStats}>
            <View style={styles.ratingContainer}>
              <Ionicons 
                name="star" 
                size={20} 
                color={getRatingColor(shop.rating)} 
              />
              <Text style={[styles.rating, { color: getRatingColor(shop.rating) }]}>
                {shop.rating.toFixed(1)}
              </Text>
              <Text style={styles.reviewCount}>
                ({shop.reviewCount} reviews)
              </Text>
            </View>
            
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(shop.isOpen) }]} />
              <Text style={[styles.statusText, { color: getStatusColor(shop.isOpen) }]}>
                {shop.isOpen ? 'Open' : 'Closed'}
              </Text>
            </View>
          </View>

          {distance && (
            <View style={styles.distanceContainer}>
              <Ionicons name="location" size={16} color="#ffffff" />
              <Text style={styles.distanceText}>{formatDistance(distance)} away</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          mode="contained"
          onPress={handleCallShop}
          style={[styles.actionButton, styles.callButton]}
          buttonColor="#10b981"
          icon="phone"
        >
          Call Now
        </Button>
        
        <Button
          mode="outlined"
          onPress={handleDirections}
          style={styles.actionButton}
          icon="directions"
        >
          Directions
        </Button>
        
        <Button
          mode="contained"
          onPress={handleBookService}
          style={[styles.actionButton, styles.bookButton]}
          buttonColor="#2563eb"
          icon="calendar"
        >
          Book Service
        </Button>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Contact Information */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Contact Information</Title>
            
            {shop.phone && (
              <List.Item
                title="Phone"
                description={shop.phone}
                left={(props) => <List.Icon {...props} icon="phone" />}
                onPress={handleCallShop}
                style={styles.listItem}
              />
            )}
            
            {shop.email && (
              <List.Item
                title="Email"
                description={shop.email}
                left={(props) => <List.Icon {...props} icon="email" />}
                onPress={() => Linking.openURL(`mailto:${shop.email}`)}
                style={styles.listItem}
              />
            )}
            
            <List.Item
              title="Address"
              description={shop.address}
              left={(props) => <List.Icon {...props} icon="map-marker" />}
              onPress={handleDirections}
              style={styles.listItem}
            />
          </Card.Content>
        </Card>

        {/* Services */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Services</Title>
            <View style={styles.servicesContainer}>
              {shop.services.map((service, index) => (
                <Chip key={index} mode="outlined" style={styles.serviceChip}>
                  {service}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Working Hours */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Working Hours</Title>
            {Object.entries(shop.workingHours).map(([day, hours]) => (
              <View key={day} style={styles.hoursRow}>
                <Text style={styles.dayLabel}>
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </Text>
                <Text style={styles.hoursText}>
                  {hours.open === 'closed' ? 'Closed' : `${hours.open} - ${hours.close}`}
                </Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Description */}
        {shop.description && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>About</Title>
              <Paragraph style={styles.description}>{shop.description}</Paragraph>
            </Card.Content>
          </Card>
        )}

        {/* Reviews */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.reviewsHeader}>
              <Title style={styles.cardTitle}>Reviews</Title>
              <Button
                mode="text"
                onPress={handleAddReview}
                textColor="#2563eb"
                compact
              >
                Add Review
              </Button>
            </View>
            
            {reviews.length > 0 ? (
              reviews.slice(0, 3).map((review, index) => (
                <View key={review.id} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewRating}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= review.rating ? "star" : "star-outline"}
                          size={16}
                          color="#f59e0b"
                        />
                      ))}
                    </View>
                    <Text style={styles.reviewDate}>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                  {index < Math.min(reviews.length, 3) - 1 && (
                    <Divider style={styles.reviewDivider} />
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.noReviews}>No reviews yet. Be the first to review!</Text>
            )}
            
            {reviews.length > 3 && (
              <Button
                mode="outlined"
                onPress={() => navigation.navigate('Reviews', { shopId })}
                style={styles.viewAllReviewsButton}
              >
                View All Reviews ({reviews.length})
              </Button>
            )}
          </Card.Content>
        </Card>
      </View>

      {/* Booking Modal */}
      <Portal>
        <Modal
          visible={bookingModalVisible}
          onDismiss={() => setBookingModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Title style={styles.modalTitle}>Book a Service</Title>
          
          <TextInput
            label="Service"
            value={bookingForm.service}
            onChangeText={(text) => setBookingForm({ ...bookingForm, service: text })}
            style={styles.input}
            mode="outlined"
            placeholder="Select a service"
          />
          
          <TextInput
            label="Date"
            value={bookingForm.date.toLocaleDateString()}
            style={styles.input}
            mode="outlined"
            right={<TextInput.Icon icon="calendar" />}
            onPressIn={() => {
              // Show date picker
            }}
          />
          
          <TextInput
            label="Time"
            value={bookingForm.time}
            onChangeText={(text) => setBookingForm({ ...bookingForm, time: text })}
            style={styles.input}
            mode="outlined"
            placeholder="09:00"
          />
          
          <TextInput
            label="Notes (Optional)"
            value={bookingForm.notes}
            onChangeText={(text) => setBookingForm({ ...bookingForm, notes: text })}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={3}
            placeholder="Any special requirements or notes"
          />
          
          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setBookingModalVisible(false)}
              style={styles.modalButton}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmitBooking}
              style={styles.modalButton}
              buttonColor="#2563eb"
              loading={loading}
            >
              Book Service
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Review Modal */}
      <Portal>
        <Modal
          visible={reviewModalVisible}
          onDismiss={() => setReviewModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Title style={styles.modalTitle}>Add a Review</Title>
          
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>Rating:</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setReviewForm({ ...reviewForm, rating: star })}
                >
                  <Ionicons
                    name={star <= reviewForm.rating ? "star" : "star-outline"}
                    size={24}
                    color="#f59e0b"
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <TextInput
            label="Review Comment"
            value={reviewForm.comment}
            onChangeText={(text) => setReviewForm({ ...reviewForm, comment: text })}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={4}
            placeholder="Share your experience with this shop"
          />
          
          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setReviewModalVisible(false)}
              style={styles.modalButton}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmitReview}
              style={styles.modalButton}
              buttonColor="#2563eb"
              loading={loading}
            >
              Submit Review
            </Button>
          </View>
        </Modal>
      </Portal>
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
  shopName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  shopAddress: {
    fontSize: 16,
    color: '#e2e8f0',
    textAlign: 'center',
    marginBottom: 16,
  },
  headerStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 14,
    color: '#e2e8f0',
    marginLeft: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
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
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    color: '#ffffff',
    marginLeft: 4,
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  callButton: {
    backgroundColor: '#10b981',
  },
  bookButton: {
    backgroundColor: '#2563eb',
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
    marginBottom: 12,
  },
  listItem: {
    paddingVertical: 8,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceChip: {
    marginBottom: 8,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  hoursText: {
    fontSize: 16,
    color: '#64748b',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewItem: {
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: '#64748b',
  },
  reviewComment: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  reviewDivider: {
    marginTop: 16,
  },
  noReviews: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  viewAllReviewsButton: {
    marginTop: 16,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default ShopDetailScreen;