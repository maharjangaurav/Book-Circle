import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Modal,
  Switch
} from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import { NotificationsAPI } from "../api/notifications";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    newBooks: true,
    authorUpdates: true,
    readingMilestones: true,
    recommendations: true
  });

  useEffect(() => {
    fetchNotifications();
    loadPreferences();
  }, []);
  
  const loadPreferences = async () => {
    try {
      const savedPreferences = await AsyncStorage.getItem('notificationPreferences');
      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences));
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  };
  
  const savePreferences = async (newPreferences) => {
    try {
      await AsyncStorage.setItem('notificationPreferences', JSON.stringify(newPreferences));
      setPreferences(newPreferences);
      Alert.alert('Success', 'Notification preferences updated');
    } catch (error) {
      console.error('Error saving notification preferences:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      // For now, we'll use mock data since the API is marked as "future"
      // const data = await NotificationsAPI.list();
      // setNotifications(data);
      
      // Mock data for demonstration
      setTimeout(() => {
        const mockNotifications = [
          { id: 1, title: 'New book available', message: 'Check out the latest release in your favorite genre!', read: false, created_at: '2023-06-15T10:30:00Z' },
          { id: 2, title: 'Reading milestone', message: 'Congratulations! You have read 5 books this month.', read: true, created_at: '2023-06-10T14:20:00Z' },
          { id: 3, title: 'Author update', message: 'An author you follow has published a new book.', read: false, created_at: '2023-06-05T09:15:00Z' },
          { id: 4, title: 'Book recommendation', message: 'Based on your reading history, you might enjoy "The Great Novel".', read: true, created_at: '2023-06-01T16:45:00Z' },
        ];
        setNotifications(mockNotifications);
        setLoading(false);
        setRefreshing(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAsRead = async (id) => {
    try {
      // In a real implementation, we would call the API
      // await NotificationsAPI.markAsRead(id);
      
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      Alert.alert('Error', 'Failed to update notification');
    }
  };

  const markAllAsRead = async () => {
    try {
      // In a real implementation, we would call the API
      // await NotificationsAPI.markAllAsRead();
      
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      Alert.alert('Error', 'Failed to update notifications');
    }
  };

  const deleteNotification = async (id) => {
    try {
      // In a real implementation, we would call the API
      // await NotificationsAPI.delete(id);
      
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.filter(notification => notification.id !== id)
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
      Alert.alert('Error', 'Failed to delete notification');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const renderNotificationItem = ({ item }) => (
    <View style={[styles.notificationCard, item.read && styles.readNotification]}>
      <View style={styles.notificationContent}>
        {!item.read && <View style={styles.unreadDot} />}
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationDate}>{formatDate(item.created_at)}</Text>
      </View>
      <View style={styles.notificationActions}>
        {!item.read && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => markAsRead(item.id)}
          >
            <MaterialIcons name="check" size={20} color="#6200ee" />
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => deleteNotification(item.id)}
        >
          <MaterialIcons name="delete-outline" size={20} color="#f44336" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSettingsItem = (key, label, icon) => (
    <View style={styles.settingsItem}>
      <View style={styles.settingsItemLeft}>
        <MaterialIcons name={icon} size={22} color="#616161" style={styles.settingsIcon} />
        <Text style={styles.settingsLabel}>{label}</Text>
      </View>
      <Switch
        value={preferences[key]}
        onValueChange={(value) => {
          const newPreferences = { ...preferences, [key]: value };
          savePreferences(newPreferences);
        }}
        trackColor={{ false: '#e0e0e0', true: '#b39ddb' }}
        thumbColor={preferences[key] ? '#6200ee' : '#f5f5f5'}
      />
    </View>
  );

  const renderSettings = () => (
    <View style={styles.settingsContainer}>
      <View style={styles.settingsHeader}>
        <Text style={styles.settingsTitle}>Notification Preferences</Text>
        <TouchableOpacity onPress={() => setShowSettings(false)}>
          <MaterialIcons name="close" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      
      {renderSettingsItem('newBooks', 'New Books', 'menu-book')}
      {renderSettingsItem('authorUpdates', 'Author Updates', 'person')}
      {renderSettingsItem('readingMilestones', 'Reading Milestones', 'emoji-events')}
      {renderSettingsItem('recommendations', 'Book Recommendations', 'recommend')}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showSettings ? (
        renderSettings()
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <View style={styles.headerActions}>
              {notifications.some(notification => !notification.read) && (
                <TouchableOpacity 
                  style={styles.headerAction}
                  onPress={markAllAsRead}
                >
                  <MaterialIcons name="done-all" size={24} color="#6200ee" />
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.headerAction}
                onPress={() => setShowSettings(true)}
              >
                <MaterialIcons name="settings" size={24} color="#6200ee" />
              </TouchableOpacity>
            </View>
          </View>
          
          {notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="notifications-none" size={64} color="#e0e0e0" />
              <Text style={styles.emptyText}>No notifications</Text>
              <Text style={styles.emptySubtext}>You're all caught up!</Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderNotificationItem}
              contentContainerStyle={styles.listContainer}
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAction: {
    marginLeft: 16,
  },
  markAllButton: {
    padding: 8,
  },
  markAllButtonText: {
    color: '#6200ee',
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  readNotification: {
    backgroundColor: '#f9f9f9',
  },
  notificationContent: {
    flex: 1,
    position: 'relative',
    paddingLeft: 16,
  },
  unreadDot: {
    position: 'absolute',
    left: 0,
    top: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6200ee',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#212121',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#616161',
    marginBottom: 8,
  },
  notificationDate: {
    fontSize: 12,
    color: '#9e9e9e',
  },
  notificationActions: {
    justifyContent: 'center',
  },
  actionButton: {
    padding: 8,
    marginBottom: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#757575',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9e9e9e',
    marginTop: 8,
  },
  // Settings styles
  settingsContainer: {
    flex: 1,
    padding: 16,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsIcon: {
    marginRight: 12,
  },
  settingsLabel: {
    fontSize: 16,
    color: '#333',
  },
});
