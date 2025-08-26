import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  Divider,
  Portal,
  Modal,
  TextInput,
  Avatar,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

import { useShop } from '../contexts/ShopContext';
import { useAuth } from '../contexts/AuthContext';

const ReviewsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { shopId } = route.params;
  
  const { getShopById, getReviews, addReview } = useShop();
  const { user } = useAuth();

  const [shop, setShop] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addReviewModalVisible, setAddReviewModalVisible] = useState(false);

  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
    images: [],
  });

  useEffect(() => {
    loadReviews();
  }, [shopId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const shopData = getShopById(shopId);
      setShop(shopData);
      
      const shopReviews = await getReviews(shopId);
      setReviews(shopReviews);
    } catch (error) {
      Alert.alert('Error', 'Failed to load reviews.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReviews();
    setRefreshing(false);
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
    setAddReviewModalVisible(true);
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
        images: reviewForm.images,
      });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Alert.alert(
        'Review Submitted',
        'Thank you for your review!',
        [{ text: 'OK', onPress: () => setAddReviewModalVisible(false) }]
      );
      
      // Reset form and reload reviews
      setReviewForm({ rating: 5, comment: '', images: [] });
      await loadReviews();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please allow access to your photo library to add images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setReviewForm({
          ...reviewForm,
          images: [...reviewForm.images, result.assets[0].uri],
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add image. Please try again.');
    }
  };

  const handleRemoveImage = (index) => {
    const newImages = reviewForm.images.filter((_, i) => i !== index);
    setReviewForm({ ...reviewForm, images: newImages });
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return '#10b981';
    if (rating >= 4.0) return '#f59e0b';
    if (rating >= 3.5) return '#f97316';
    return '#ef4444';
  };

  const renderReviewItem = ({ item, index }) => (
    <Card style={styles.reviewCard}>
      <Card.Content>
        <View style={styles.reviewHeader}>
          <View style={styles.reviewerInfo}>
            <Avatar.Text 
              size={40} 
              label={item.userId ? item.userId.charAt(0).toUpperCase() : 'U'} 
              style={styles.avatar}
            />
            <View style={styles.reviewerDetails}>
              <Text style={styles.reviewerName}>
                {item.userId ? `User ${item.userId.slice(-4)}` : 'Anonymous'}
              </Text>
              <Text style={styles.reviewDate}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
          
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= item.rating ? "star" : "star-outline"}
                size={16}
                color="#f59e0b"
              />
            ))}
          </View>
        </View>
        
        <Text style={styles.reviewComment}>{item.comment}</Text>
        
        {item.images && item.images.length > 0 && (
          <View style={styles.imagesContainer}>
            {item.images.map((image, imageIndex) => (
              <View key={imageIndex} style={styles.imageContainer}>
                <Text style={styles.imageText}>📷 Image {imageIndex + 1}</Text>
              </View>
            ))}
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient
        colors={['#2563eb', '#1d4ed8']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Title style={styles.shopName}>{shop?.name}</Title>
          <Text style={styles.reviewsCount}>
            {reviews.length} review{reviews.length !== 1 ? 's' : ''}
          </Text>
          
          <View style={styles.ratingSummary}>
            <View style={styles.overallRating}>
              <Ionicons 
                name="star" 
                size={24} 
                color={getRatingColor(shop?.rating || 0)} 
              />
              <Text style={[styles.ratingText, { color: getRatingColor(shop?.rating || 0) }]}>
                {shop?.rating.toFixed(1) || '0.0'}
              </Text>
            </View>
            <Text style={styles.ratingLabel}>Overall Rating</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubble-outline" size={64} color="#94a3b8" />
      <Text style={styles.emptyStateTitle}>No Reviews Yet</Text>
      <Text style={styles.emptyStateSubtitle}>
        Be the first to review this shop and help others make informed decisions.
      </Text>
      <Button
        mode="contained"
        onPress={handleAddReview}
        style={styles.addReviewButton}
        buttonColor="#2563eb"
      >
        Write First Review
      </Button>
    </View>
  );

  if (loading && !shop) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="chatbubbles" size={64} color="#94a3b8" />
        <Text style={styles.loadingText}>Loading reviews...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reviews}
        renderItem={renderReviewItem}
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
      
      <Button
        mode="contained"
        onPress={handleAddReview}
        style={styles.fab}
        buttonColor="#2563eb"
        icon="plus"
      >
        Add Review
      </Button>

      {/* Add Review Modal */}
      <Portal>
        <Modal
          visible={addReviewModalVisible}
          onDismiss={() => setAddReviewModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Title style={styles.modalTitle}>Write a Review</Title>
          
          <View style={styles.ratingSection}>
            <Text style={styles.ratingLabel}>Your Rating:</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setReviewForm({ ...reviewForm, rating: star })}
                >
                  <Ionicons
                    name={star <= reviewForm.rating ? "star" : "star-outline"}
                    size={32}
                    color="#f59e0b"
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingValue}>{reviewForm.rating} out of 5</Text>
          </View>
          
          <TextInput
            label="Your Review"
            value={reviewForm.comment}
            onChangeText={(text) => setReviewForm({ ...reviewForm, comment: text })}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={4}
            placeholder="Share your experience with this shop..."
          />
          
          <View style={styles.imagesSection}>
            <Text style={styles.imagesLabel}>Add Photos (Optional)</Text>
            <View style={styles.imagesList}>
              {reviewForm.images.map((image, index) => (
                <View key={index} style={styles.imageItem}>
                  <Text style={styles.imageName}>Image {index + 1}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveImage(index)}
                    style={styles.removeImageButton}
                  >
                    <Ionicons name="close-circle" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <Button
              mode="outlined"
              onPress={handleAddImage}
              style={styles.addImageButton}
              icon="camera"
            >
              Add Photo
            </Button>
          </View>
          
          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setAddReviewModalVisible(false)}
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
    </View>
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
  header: {
    marginBottom: 16,
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
  reviewsCount: {
    fontSize: 16,
    color: '#e2e8f0',
    marginBottom: 16,
  },
  ratingSummary: {
    alignItems: 'center',
  },
  overallRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  ratingLabel: {
    fontSize: 14,
    color: '#e2e8f0',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  reviewCard: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: 12,
  },
  reviewerDetails: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: '#64748b',
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 12,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imageContainer: {
    backgroundColor: '#f1f5f9',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  imageText: {
    fontSize: 12,
    color: '#64748b',
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
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  addReviewButton: {
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  ratingValue: {
    fontSize: 14,
    color: '#64748b',
  },
  input: {
    marginBottom: 20,
  },
  imagesSection: {
    marginBottom: 20,
  },
  imagesLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  imagesList: {
    marginBottom: 12,
  },
  imageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  imageName: {
    fontSize: 14,
    color: '#374151',
  },
  removeImageButton: {
    padding: 4,
  },
  addImageButton: {
    marginTop: 8,
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

export default ReviewsScreen;