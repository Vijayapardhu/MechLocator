import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import {
  Modal,
  Portal,
  Button,
  Chip,
  Slider,
  Switch,
  Divider,
  Title,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const FilterModal = ({ visible, filters, onApply, onDismiss }) => {
  const [localFilters, setLocalFilters] = useState(filters);

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
    const currentServices = localFilters.services || [];
    const newServices = currentServices.includes(service)
      ? currentServices.filter(s => s !== service)
      : [...currentServices, service];
    
    setLocalFilters({
      ...localFilters,
      services: newServices,
    });
  };

  const handleRatingChange = (value) => {
    setLocalFilters({
      ...localFilters,
      rating: value,
    });
  };

  const handleDistanceChange = (value) => {
    setLocalFilters({
      ...localFilters,
      distance: value,
    });
  };

  const handleOpenToggle = (value) => {
    setLocalFilters({
      ...localFilters,
      isOpen: value,
    });
  };

  const handleApply = () => {
    onApply(localFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      rating: 0,
      distance: 10,
      services: [],
      isOpen: false,
    };
    setLocalFilters(resetFilters);
  };

  const handleCancel = () => {
    setLocalFilters(filters);
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.header}>
          <Title style={styles.title}>Filter Shops</Title>
          <Button
            mode="text"
            onPress={handleReset}
            textColor="#64748b"
            compact
          >
            Reset
          </Button>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Rating Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Minimum Rating</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingValue}>
                {localFilters.rating > 0 ? `${localFilters.rating.toFixed(1)}+` : 'Any'}
              </Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= localFilters.rating ? "star" : "star-outline"}
                    size={20}
                    color={star <= localFilters.rating ? "#f59e0b" : "#d1d5db"}
                  />
                ))}
              </View>
            </View>
            <Slider
              value={localFilters.rating}
              onValueChange={handleRatingChange}
              minimumValue={0}
              maximumValue={5}
              step={0.5}
              minimumTrackTintColor="#2563eb"
              maximumTrackTintColor="#e2e8f0"
              thumbStyle={styles.sliderThumb}
            />
          </View>

          <Divider style={styles.divider} />

          {/* Distance Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Distance</Text>
            <Text style={styles.distanceValue}>
              Within {localFilters.distance}km
            </Text>
            <Slider
              value={localFilters.distance}
              onValueChange={handleDistanceChange}
              minimumValue={1}
              maximumValue={50}
              step={1}
              minimumTrackTintColor="#2563eb"
              maximumTrackTintColor="#e2e8f0"
              thumbStyle={styles.sliderThumb}
            />
          </View>

          <Divider style={styles.divider} />

          {/* Open Now Filter */}
          <View style={styles.section}>
            <View style={styles.switchContainer}>
              <View>
                <Text style={styles.sectionTitle}>Open Now</Text>
                <Text style={styles.sectionSubtitle}>
                  Only show shops that are currently open
                </Text>
              </View>
              <Switch
                value={localFilters.isOpen}
                onValueChange={handleOpenToggle}
                color="#2563eb"
              />
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Services Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Services</Text>
            <Text style={styles.sectionSubtitle}>
              Select services you're looking for
            </Text>
            <View style={styles.servicesContainer}>
              {availableServices.map((service) => (
                <Chip
                  key={service}
                  mode={localFilters.services.includes(service) ? "flat" : "outlined"}
                  selected={localFilters.services.includes(service)}
                  onPress={() => handleServiceToggle(service)}
                  style={styles.serviceChip}
                  textStyle={styles.serviceChipText}
                  selectedColor="#2563eb"
                >
                  {service}
                </Chip>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            mode="outlined"
            onPress={handleCancel}
            style={styles.footerButton}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleApply}
            style={styles.footerButton}
            buttonColor="#2563eb"
          >
            Apply Filters
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: '#ffffff',
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  content: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  distanceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
    marginBottom: 12,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceChip: {
    marginBottom: 8,
  },
  serviceChipText: {
    fontSize: 12,
  },
  sliderThumb: {
    backgroundColor: '#2563eb',
  },
  divider: {
    marginVertical: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default FilterModal;