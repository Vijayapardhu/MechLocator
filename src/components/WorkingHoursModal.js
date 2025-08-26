import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import {
  Modal,
  Portal,
  Button,
  TextInput,
  Title,
  Divider,
  Switch,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const WorkingHoursModal = ({ visible, workingHours, onApply, onDismiss }) => {
  const [localWorkingHours, setLocalWorkingHours] = useState(workingHours);

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

  const timeSlots = [
    '00:00', '00:30', '01:00', '01:30', '02:00', '02:30', '03:00', '03:30',
    '04:00', '04:30', '05:00', '05:30', '06:00', '06:30', '07:00', '07:30',
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
    '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00', '23:30',
  ];

  const handleDayToggle = (dayKey) => {
    const currentDay = localWorkingHours[dayKey];
    if (currentDay && currentDay.open !== 'closed') {
      // If day is open, close it
      setLocalWorkingHours({
        ...localWorkingHours,
        [dayKey]: { open: 'closed', close: 'closed' },
      });
    } else {
      // If day is closed, open it with default hours
      setLocalWorkingHours({
        ...localWorkingHours,
        [dayKey]: { open: '09:00', close: '17:00' },
      });
    }
  };

  const handleTimeChange = (dayKey, field, value) => {
    setLocalWorkingHours({
      ...localWorkingHours,
      [dayKey]: {
        ...localWorkingHours[dayKey],
        [field]: value,
      },
    });
  };

  const handleApply = () => {
    onApply(localWorkingHours);
  };

  const handleCancel = () => {
    setLocalWorkingHours(workingHours);
    onDismiss();
  };

  const handleReset = () => {
    const defaultHours = {
      monday: { open: '09:00', close: '17:00' },
      tuesday: { open: '09:00', close: '17:00' },
      wednesday: { open: '09:00', close: '17:00' },
      thursday: { open: '09:00', close: '17:00' },
      friday: { open: '09:00', close: '17:00' },
      saturday: { open: '09:00', close: '16:00' },
      sunday: { open: 'closed', close: 'closed' },
    };
    setLocalWorkingHours(defaultHours);
  };

  const isDayOpen = (dayKey) => {
    const day = localWorkingHours[dayKey];
    return day && day.open !== 'closed';
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.header}>
          <Title style={styles.title}>Working Hours</Title>
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
          {days.map((day) => (
            <View key={day.key} style={styles.dayContainer}>
              <View style={styles.dayHeader}>
                <View style={styles.dayInfo}>
                  <Text style={styles.dayLabel}>{day.label}</Text>
                  <Text style={styles.dayStatus}>
                    {isDayOpen(day.key) ? 'Open' : 'Closed'}
                  </Text>
                </View>
                <Switch
                  value={isDayOpen(day.key)}
                  onValueChange={() => handleDayToggle(day.key)}
                  color="#2563eb"
                />
              </View>

              {isDayOpen(day.key) && (
                <View style={styles.timeContainer}>
                  <View style={styles.timeInputContainer}>
                    <Text style={styles.timeLabel}>Open</Text>
                    <TextInput
                      mode="outlined"
                      value={localWorkingHours[day.key]?.open || '09:00'}
                      onChangeText={(text) => handleTimeChange(day.key, 'open', text)}
                      style={styles.timeInput}
                      dense
                      keyboardType="numeric"
                      placeholder="09:00"
                    />
                  </View>
                  
                  <View style={styles.timeSeparator}>
                    <Ionicons name="arrow-forward" size={16} color="#64748b" />
                  </View>
                  
                  <View style={styles.timeInputContainer}>
                    <Text style={styles.timeLabel}>Close</Text>
                    <TextInput
                      mode="outlined"
                      value={localWorkingHours[day.key]?.close || '17:00'}
                      onChangeText={(text) => handleTimeChange(day.key, 'close', text)}
                      style={styles.timeInput}
                      dense
                      keyboardType="numeric"
                      placeholder="17:00"
                    />
                  </View>
                </View>
              )}

              {day.key !== 'sunday' && <Divider style={styles.divider} />}
            </View>
          ))}
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
            Apply
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
  dayContainer: {
    marginBottom: 16,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayInfo: {
    flex: 1,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  dayStatus: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
  },
  timeInputContainer: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  timeInput: {
    backgroundColor: '#ffffff',
  },
  timeSeparator: {
    marginHorizontal: 12,
  },
  divider: {
    marginTop: 16,
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

export default WorkingHoursModal;