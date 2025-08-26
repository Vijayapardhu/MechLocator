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
import { useNavigation } from '@react-navigation/native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  FAB,
  Chip,
  Divider,
  List,
  IconButton,
  Menu,
  Portal,
  Modal,
  TextInput,
  Switch,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useAuth } from '../contexts/AuthContext';
import { useShop } from '../contexts/ShopContext';
import WorkingHoursModal from '../components/WorkingHoursModal';

const AdminScreen = () => {
  const navigation = useNavigation();
  const { user, isAdmin, logout } = useAuth();
  const { shops, loading, deleteShop, updateShop, loadShops } = useShop();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);
  const [menuVisible, setMenuVisible] = useState({});
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [workingHoursModalVisible, setWorkingHoursModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    if (!isAdmin) {
      Alert.alert(
        'Access Denied',
        'You need admin privileges to access this screen.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [isAdmin]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadShops();
    setRefreshing(false);
  };

  const handleAddShop = () => {
    navigation.navigate('AddShop');
  };

  const handleEditShop = (shop) => {
    setSelectedShop(shop);
    setEditForm({
      name: shop.name,
      address: shop.address,
      phone: shop.phone || '',
      email: shop.email || '',
      description: shop.description || '',
      isOpen: shop.isOpen === 1,
    });
    setEditModalVisible(true);
  };

  const handleUpdateShop = async () => {
    try {
      await updateShop(selectedShop.id, {
        ...editForm,
        isOpen: editForm.isOpen ? 1 : 0,
      });
      setEditModalVisible(false);
      setSelectedShop(null);
      Alert.alert('Success', 'Shop updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update shop. Please try again.');
    }
  };

  const handleDeleteShop = (shop) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    Alert.alert(
      'Delete Shop',
      `Are you sure you want to delete "${shop.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteShop(shop.id);
              Alert.alert('Success', 'Shop deleted successfully!');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete shop. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleWorkingHours = (shop) => {
    setSelectedShop(shop);
    setWorkingHoursModalVisible(true);
  };

  const handleUpdateWorkingHours = async (workingHours) => {
    try {
      await updateShop(selectedShop.id, { workingHours });
      setWorkingHoursModalVisible(false);
      setSelectedShop(null);
      Alert.alert('Success', 'Working hours updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update working hours. Please try again.');
    }
  };

  const handleLogout = () => {
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

  const renderShopItem = ({ item }) => {
    const isMenuVisible = menuVisible[item.id] || false;

    return (
      <Card style={styles.shopCard} mode="outlined">
        <Card.Content>
          <View style={styles.shopHeader}>
            <View style={styles.shopInfo}>
              <Title style={styles.shopName}>{item.name}</Title>
              <Paragraph style={styles.shopAddress}>{item.address}</Paragraph>
              <View style={styles.shopStats}>
                <Chip
                  icon="star"
                  mode="outlined"
                  style={styles.ratingChip}
                >
                  {item.rating.toFixed(1)} ({item.reviewCount})
                </Chip>
                <Chip
                  icon={item.isOpen ? "check-circle" : "close-circle"}
                  mode="outlined"
                  style={[
                    styles.statusChip,
                    { backgroundColor: item.isOpen ? '#dcfce7' : '#fef2f2' }
                  ]}
                >
                  {item.isOpen ? 'Open' : 'Closed'}
                </Chip>
              </View>
            </View>
            
            <Menu
              visible={isMenuVisible}
              onDismiss={() => setMenuVisible({ ...menuVisible, [item.id]: false })}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  onPress={() => setMenuVisible({ ...menuVisible, [item.id]: true })}
                />
              }
            >
              <Menu.Item
                onPress={() => {
                  setMenuVisible({ ...menuVisible, [item.id]: false });
                  handleEditShop(item);
                }}
                title="Edit Shop"
                leadingIcon="pencil"
              />
              <Menu.Item
                onPress={() => {
                  setMenuVisible({ ...menuVisible, [item.id]: false });
                  handleWorkingHours(item);
                }}
                title="Working Hours"
                leadingIcon="clock"
              />
              <Menu.Item
                onPress={() => {
                  setMenuVisible({ ...menuVisible, [item.id]: false });
                  handleDeleteShop(item);
                }}
                title="Delete Shop"
                leadingIcon="delete"
                titleStyle={{ color: '#ef4444' }}
              />
            </Menu>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.servicesContainer}>
            <Text style={styles.servicesTitle}>Services:</Text>
            <View style={styles.servicesList}>
              {item.services.slice(0, 3).map((service, index) => (
                <Chip key={index} mode="outlined" style={styles.serviceChip}>
                  {service}
                </Chip>
              ))}
              {item.services.length > 3 && (
                <Chip mode="outlined" style={styles.serviceChip}>
                  +{item.services.length - 3} more
                </Chip>
              )}
            </View>
          </View>
          
          <View style={styles.contactInfo}>
            {item.phone && (
              <View style={styles.contactItem}>
                <Ionicons name="call" size={16} color="#64748b" />
                <Text style={styles.contactText}>{item.phone}</Text>
              </View>
            )}
            {item.email && (
              <View style={styles.contactItem}>
                <Ionicons name="mail" size={16} color="#64748b" />
                <Text style={styles.contactText}>{item.email}</Text>
              </View>
            )}
          </View>
        </Card.Content>
        
        <Card.Actions style={styles.cardActions}>
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('ShopDetail', { shopId: item.id })}
            style={styles.actionButton}
          >
            View Details
          </Button>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Reviews', { shopId: item.id })}
            style={styles.actionButton}
          >
            Reviews ({item.reviewCount})
          </Button>
        </Card.Actions>
      </Card>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient
        colors={['#1e293b', '#334155']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Admin Panel</Text>
            <Text style={styles.headerSubtitle}>
              Manage mechanic shops and settings
            </Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{shops.length}</Text>
            <Text style={styles.statLabel}>Total Shops</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {shops.filter(shop => shop.isOpen === 1).length}
            </Text>
            <Text style={styles.statLabel}>Open Now</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {shops.reduce((total, shop) => total + shop.reviewCount, 0)}
            </Text>
            <Text style={styles.statLabel}>Total Reviews</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  if (!isAdmin) {
    return (
      <View style={styles.unauthorizedContainer}>
        <Ionicons name="shield-checkmark" size={64} color="#94a3b8" />
        <Text style={styles.unauthorizedTitle}>Admin Access Required</Text>
        <Text style={styles.unauthorizedSubtitle}>
          You need admin privileges to access this panel.
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={shops}
        renderItem={renderShopItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1e293b']}
          />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
      
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={handleAddShop}
        label="Add Shop"
      />
      
      {/* Edit Shop Modal */}
      <Portal>
        <Modal
          visible={editModalVisible}
          onDismiss={() => setEditModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>Edit Shop</Text>
          
          <TextInput
            label="Shop Name"
            value={editForm.name}
            onChangeText={(text) => setEditForm({ ...editForm, name: text })}
            style={styles.input}
            mode="outlined"
          />
          
          <TextInput
            label="Address"
            value={editForm.address}
            onChangeText={(text) => setEditForm({ ...editForm, address: text })}
            style={styles.input}
            mode="outlined"
          />
          
          <TextInput
            label="Phone"
            value={editForm.phone}
            onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
            style={styles.input}
            mode="outlined"
            keyboardType="phone-pad"
          />
          
          <TextInput
            label="Email"
            value={editForm.email}
            onChangeText={(text) => setEditForm({ ...editForm, email: text })}
            style={styles.input}
            mode="outlined"
            keyboardType="email-address"
          />
          
          <TextInput
            label="Description"
            value={editForm.description}
            onChangeText={(text) => setEditForm({ ...editForm, description: text })}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={3}
          />
          
          <View style={styles.switchContainer}>
            <Text>Shop is Open</Text>
            <Switch
              value={editForm.isOpen}
              onValueChange={(value) => setEditForm({ ...editForm, isOpen: value })}
            />
          </View>
          
          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setEditModalVisible(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleUpdateShop}
              style={styles.modalButton}
            >
              Update
            </Button>
          </View>
        </Modal>
      </Portal>
      
      {/* Working Hours Modal */}
      <WorkingHoursModal
        visible={workingHoursModalVisible}
        workingHours={selectedShop?.workingHours || {}}
        onApply={handleUpdateWorkingHours}
        onDismiss={() => setWorkingHoursModalVisible(false)}
      />
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#cbd5e1',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 12,
    color: '#cbd5e1',
    marginTop: 4,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  shopCard: {
    marginBottom: 16,
    elevation: 2,
  },
  shopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  shopAddress: {
    color: '#64748b',
    marginBottom: 8,
  },
  shopStats: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingChip: {
    backgroundColor: '#fef3c7',
  },
  statusChip: {
    backgroundColor: '#dcfce7',
  },
  divider: {
    marginVertical: 12,
  },
  servicesContainer: {
    marginBottom: 12,
  },
  servicesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  servicesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceChip: {
    marginBottom: 4,
  },
  contactInfo: {
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactText: {
    marginLeft: 8,
    color: '#64748b',
    fontSize: 14,
  },
  cardActions: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#1e293b',
  },
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  unauthorizedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  unauthorizedSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#1e293b',
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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

export default AdminScreen;