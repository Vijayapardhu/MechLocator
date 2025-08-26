import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  TextInput,
  Switch,
  Divider,
  List,
  Portal,
  Modal,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';

import { useAuth } from '../contexts/AuthContext';
import { useShop } from '../contexts/ShopContext';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user, isAdmin, logout, updateProfile, changePassword } = useAuth();
  const { getBookings } = useShop();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleEditProfile = () => {
    setEditForm({
      name: user?.name || '',
      email: user?.email || '',
    });
    setEditModalVisible(true);
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const result = await updateProfile(editForm);
      if (result.success) {
        setEditModalVisible(false);
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setPasswordModalVisible(true);
  };

  const handleUpdatePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      const result = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      if (result.success) {
        setPasswordModalVisible(false);
        Alert.alert('Success', 'Password changed successfully!');
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const handleNotificationToggle = async (value) => {
    setNotificationsEnabled(value);
    
    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive updates.',
          [{ text: 'OK' }]
        );
        setNotificationsEnabled(false);
      }
    }
  };

  const handleViewBookings = async () => {
    try {
      setLoading(true);
      const userBookings = await getBookings(user.id);
      setBookings(userBookings);
      // Navigate to bookings screen or show in modal
      Alert.alert('Bookings', `You have ${userBookings.length} booking(s)`);
    } catch (error) {
      Alert.alert('Error', 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminAccess = () => {
    if (isAdmin) {
      navigation.navigate('Admin');
    } else {
      Alert.alert(
        'Admin Access',
        'You need admin privileges to access the admin panel.',
        [{ text: 'OK' }]
      );
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#2563eb', '#1d4ed8']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <Ionicons name="person-circle" size={80} color="#ffffff" />
            <Text style={styles.headerTitle}>Welcome to MechLocator</Text>
            <Text style={styles.headerSubtitle}>
              Sign in to access your profile and manage your preferences
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Get Started</Title>
              <Paragraph style={styles.cardSubtitle}>
                Create an account or sign in to access all features
              </Paragraph>
              
              <Button
                mode="contained"
                onPress={() => navigation.navigate('Login')}
                style={styles.button}
                buttonColor="#2563eb"
              >
                Sign In / Register
              </Button>
            </Card.Content>
          </Card>
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
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color="#ffffff" />
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          {isAdmin && (
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={16} color="#ffffff" />
              <Text style={styles.adminText}>Admin</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Profile Actions */}
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Profile</Title>
            
            <List.Item
              title="Edit Profile"
              description="Update your personal information"
              left={(props) => <List.Icon {...props} icon="account-edit" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleEditProfile}
              style={styles.listItem}
            />
            
            <Divider />
            
            <List.Item
              title="Change Password"
              description="Update your account password"
              left={(props) => <List.Icon {...props} icon="lock" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleChangePassword}
              style={styles.listItem}
            />
            
            <Divider />
            
            <List.Item
              title="My Bookings"
              description="View your service bookings"
              left={(props) => <List.Icon {...props} icon="calendar" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleViewBookings}
              style={styles.listItem}
            />
          </Card.Content>
        </Card>

        {/* Settings */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Settings</Title>
            
            <List.Item
              title="Push Notifications"
              description="Receive updates about offers and services"
              left={(props) => <List.Icon {...props} icon="bell" />}
              right={() => (
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleNotificationToggle}
                  color="#2563eb"
                />
              )}
              style={styles.listItem}
            />
            
            <Divider />
            
            <List.Item
              title="Location Services"
              description="Allow location access for nearby shops"
              left={(props) => <List.Icon {...props} icon="location" />}
              right={(props) => <List.Icon {...props} icon="check-circle" color="#10b981" />}
              style={styles.listItem}
            />
          </Card.Content>
        </Card>

        {/* Admin Section */}
        {isAdmin && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Admin Panel</Title>
              
              <List.Item
                title="Manage Shops"
                description="Add, edit, or delete mechanic shops"
                left={(props) => <List.Icon {...props} icon="store" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={handleAdminAccess}
                style={styles.listItem}
              />
              
              <Divider />
              
              <List.Item
                title="View Analytics"
                description="Shop performance and user statistics"
                left={(props) => <List.Icon {...props} icon="chart-line" />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => Alert.alert('Analytics', 'Analytics feature coming soon!')}
                style={styles.listItem}
              />
            </Card.Content>
          </Card>
        )}

        {/* Account Actions */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Account</Title>
            
            <List.Item
              title="Help & Support"
              description="Get help with the app"
              left={(props) => <List.Icon {...props} icon="help-circle" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert('Help', 'Help and support feature coming soon!')}
              style={styles.listItem}
            />
            
            <Divider />
            
            <List.Item
              title="About MechLocator"
              description="App version and information"
              left={(props) => <List.Icon {...props} icon="information" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert('About', 'MechLocator v1.0.0\nFind the best mechanic shops near you!')}
              style={styles.listItem}
            />
            
            <Divider />
            
            <List.Item
              title="Logout"
              description="Sign out of your account"
              left={(props) => <List.Icon {...props} icon="logout" color="#ef4444" />}
              onPress={handleLogout}
              style={[styles.listItem, styles.logoutItem]}
              titleStyle={styles.logoutText}
            />
          </Card.Content>
        </Card>
      </View>

      {/* Edit Profile Modal */}
      <Portal>
        <Modal
          visible={editModalVisible}
          onDismiss={() => setEditModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Title style={styles.modalTitle}>Edit Profile</Title>
          
          <TextInput
            label="Name"
            value={editForm.name}
            onChangeText={(text) => setEditForm({ ...editForm, name: text })}
            style={styles.input}
            mode="outlined"
          />
          
          <TextInput
            label="Email"
            value={editForm.email}
            onChangeText={(text) => setEditForm({ ...editForm, email: text })}
            style={styles.input}
            mode="outlined"
            keyboardType="email-address"
          />
          
          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setEditModalVisible(false)}
              style={styles.modalButton}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleUpdateProfile}
              style={styles.modalButton}
              buttonColor="#2563eb"
              loading={loading}
            >
              Update
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Change Password Modal */}
      <Portal>
        <Modal
          visible={passwordModalVisible}
          onDismiss={() => setPasswordModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Title style={styles.modalTitle}>Change Password</Title>
          
          <TextInput
            label="Current Password"
            value={passwordForm.currentPassword}
            onChangeText={(text) => setPasswordForm({ ...passwordForm, currentPassword: text })}
            style={styles.input}
            mode="outlined"
            secureTextEntry
          />
          
          <TextInput
            label="New Password"
            value={passwordForm.newPassword}
            onChangeText={(text) => setPasswordForm({ ...passwordForm, newPassword: text })}
            style={styles.input}
            mode="outlined"
            secureTextEntry
          />
          
          <TextInput
            label="Confirm New Password"
            value={passwordForm.confirmPassword}
            onChangeText={(text) => setPasswordForm({ ...passwordForm, confirmPassword: text })}
            style={styles.input}
            mode="outlined"
            secureTextEntry
          />
          
          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setPasswordModalVisible(false)}
              style={styles.modalButton}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleUpdatePassword}
              style={styles.modalButton}
              buttonColor="#2563eb"
              loading={loading}
            >
              Change Password
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
  headerGradient: {
    padding: 20,
    paddingTop: 40,
  },
  headerContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#e2e8f0',
    marginBottom: 8,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  adminText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
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
  button: {
    marginTop: 8,
  },
  listItem: {
    paddingVertical: 8,
  },
  logoutItem: {
    backgroundColor: '#fef2f2',
  },
  logoutText: {
    color: '#ef4444',
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
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default ProfileScreen;