import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Chip, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const ShopCard = ({ shop, distance, onPress, onCallPress }) => {
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

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={styles.card} mode="outlined">
        <LinearGradient
          colors={['#ffffff', '#f8fafc']}
          style={styles.cardGradient}
        >
          <Card.Content style={styles.cardContent}>
            <View style={styles.header}>
              <View style={styles.titleSection}>
                <Title style={styles.shopName}>{shop.name}</Title>
                <View style={styles.ratingContainer}>
                  <Ionicons 
                    name="star" 
                    size={16} 
                    color={getRatingColor(shop.rating)} 
                  />
                  <Text style={[styles.rating, { color: getRatingColor(shop.rating) }]}>
                    {shop.rating.toFixed(1)}
                  </Text>
                  <Text style={styles.reviewCount}>
                    ({shop.reviewCount} reviews)
                  </Text>
                </View>
              </View>
              
              <View style={styles.statusContainer}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(shop.isOpen) }]} />
                <Text style={[styles.statusText, { color: getStatusColor(shop.isOpen) }]}>
                  {shop.isOpen ? 'Open' : 'Closed'}
                </Text>
              </View>
            </View>

            <Paragraph style={styles.address}>{shop.address}</Paragraph>

            {distance && (
              <View style={styles.distanceContainer}>
                <Ionicons name="location" size={14} color="#64748b" />
                <Text style={styles.distanceText}>{formatDistance(distance)} away</Text>
              </View>
            )}

            <View style={styles.servicesContainer}>
              {shop.services.slice(0, 3).map((service, index) => (
                <Chip
                  key={index}
                  mode="outlined"
                  style={styles.serviceChip}
                  textStyle={styles.serviceChipText}
                >
                  {service}
                </Chip>
              ))}
              {shop.services.length > 3 && (
                <Chip
                  mode="outlined"
                  style={styles.serviceChip}
                  textStyle={styles.serviceChipText}
                >
                  +{shop.services.length - 3} more
                </Chip>
              )}
            </View>

            <View style={styles.contactContainer}>
              {shop.phone && (
                <View style={styles.contactItem}>
                  <Ionicons name="call" size={16} color="#64748b" />
                  <Text style={styles.contactText}>{shop.phone}</Text>
                </View>
              )}
              {shop.email && (
                <View style={styles.contactItem}>
                  <Ionicons name="mail" size={16} color="#64748b" />
                  <Text style={styles.contactText}>{shop.email}</Text>
                </View>
              )}
            </View>
          </Card.Content>

          <Card.Actions style={styles.cardActions}>
            <Button
              mode="outlined"
              onPress={onPress}
              style={styles.actionButton}
              contentStyle={styles.actionButtonContent}
            >
              <Ionicons name="information-circle" size={16} color="#2563eb" />
              <Text style={styles.actionButtonText}>Details</Text>
            </Button>
            
            {shop.phone && (
              <Button
                mode="contained"
                onPress={onCallPress}
                style={[styles.actionButton, styles.callButton]}
                contentStyle={styles.actionButtonContent}
                buttonColor="#10b981"
              >
                <Ionicons name="call" size={16} color="#ffffff" />
                <Text style={[styles.actionButtonText, styles.callButtonText]}>
                  Call Now
                </Text>
              </Button>
            )}
          </Card.Actions>
        </LinearGradient>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    elevation: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardGradient: {
    borderRadius: 12,
  },
  cardContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleSection: {
    flex: 1,
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
  address: {
    color: '#64748b',
    fontSize: 14,
    marginBottom: 8,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  distanceText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  serviceChip: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  serviceChipText: {
    fontSize: 12,
    color: '#475569',
  },
  contactContainer: {
    marginBottom: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 6,
  },
  cardActions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  actionButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  callButton: {
    backgroundColor: '#10b981',
  },
  callButtonText: {
    color: '#ffffff',
  },
});

export default ShopCard;