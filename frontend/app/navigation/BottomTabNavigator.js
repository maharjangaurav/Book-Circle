"use client";
import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

// Import all screens
import HomeScreen from "../screens/HomeScreen";
import ExploreScreen from "../screens/ExploreScreen";
import LibraryScreen from "../screens/LibraryScreen";
import WriterScreen from "../screens/WriterScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ManageChaptersScreen from "../screens/ManageChaptersScreen";
import BookDetailScreen from "../screens/BookDetailScreen";
import CreateBookScreen from "../screens/CreateBookScreen";
import EditBookScreen from "../screens/EditBookScreen";
import { BooksAPI } from "../api/books";

const Tab = createBottomTabNavigator();

// Theme colors
const COLORS = {
  primary: "#6200ee",
  inactive: "#757575",
  background: "#f5f5f5",
  card: "#ffffff",
  text: "#212121",
  border: "#e0e0e0",
  notification: "#f50057",
};

const HeaderWithAvatar = ({ navigation }) => {
  const { user } = useAuth();

  // Get first letter of user name for avatar
  const getInitial = () => {
    return user?.name ? user.name.charAt(0).toUpperCase() : "U";
  };

  return (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>BookCircle</Text>
      <TouchableOpacity
        style={styles.avatarButton}
        onPress={() => navigation.navigate("Profile")}
      >
        <View style={styles.avatarSmall}>
          <Text style={styles.avatarText}>{getInitial()}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default function BottomTabNavigator({ navigation }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [finishedBooks, setFinishedBooks] = useState([]);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    // Simulate fetching unread notifications count
    // In a real app, this would come from an API or local storage
    const fetchUnreadCount = () => {
      // Mock data - in production this would be an API call
      setTimeout(() => {
        setUnreadCount(2); // Set to a static number for demonstration
      }, 1000);
    };

    fetchUnreadCount();

    // Set up a refresh interval (optional)
    const intervalId = setInterval(fetchUnreadCount, 60000); // Refresh every minute

    return () => clearInterval(intervalId);
  }, []);

  async function fetchAllBooks() {
    try {
      const response = await BooksAPI.get(`books/read/finished`);
      if (response.data.length === 0) {
        setError("No finished books found.");
        setFinishedBooks([]);
        return;
      }
      const bookss = response.data.map((book, index) => ({
        id: index + 1,
        _id: book._id,
        title: book.title,
        author: book.author?.name || "Gaurav Dangol",
        preview: book.previewText,
        isPremium: book.isPremium,
        trending: book.trending || false,
        recentlyAdded: book.recentlyAdded,
        genre: book.genre,
        coverImage: book?.coverImage || null,
      }));
      setFinishedBooks(bookss);
      await AsyncStorage.setItem("finished_books", JSON.stringify(bookss));
    } catch (error) {
      console.error("Error fetching all books in BottomTabNavigator:", error);
      try {
        const cachedBooks = await AsyncStorage.getItem("finished_books");
        if (cachedBooks) {
          setFinishedBooks(JSON.parse(cachedBooks));
        } else {
          setFinishedBooks([]);
        }
      } catch (cacheError) {
        console.error("Error loading from cache:", cacheError);
        setBooks([]);
      }
    }
  }

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Home") {
            iconName = "home";
          } else if (route.name === "Explore") {
            iconName = "search";
          } else if (route.name === "Library") {
            iconName = "book";
          } else if (route.name === "Writer") {
            iconName = "edit";
          } else if (route.name === "Notifications") {
            iconName = "notifications";
          } else if (route.name === "Profile") {
            iconName = "person";
          }

          // Return the icon with or without a badge
          return route.name === "Notifications" && unreadCount > 0 ? (
            <View style={{ width: size, height: size, alignItems: "center" }}>
              <MaterialIcons name={iconName} size={size} color={color} />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            </View>
          ) : (
            <MaterialIcons name={iconName} size={size} color={color} />
          );
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          paddingBottom: 5,
        },
        headerStyle: {
          backgroundColor: COLORS.card,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        },
        headerTitleStyle: {
          fontWeight: "bold",
          color: COLORS.text,
        },
        header: ({ navigation: headerNav }) =>
          route.name === "Home" ? (
            <HeaderWithAvatar navigation={headerNav} />
          ) : undefined,
      })}
    >
      <Tab.Screen name="Home">
        {() => (
          <HomeScreen
            finishedBooks={finishedBooks}
            fetchAllBooks={fetchAllBooks}
          />
        )}
      </Tab.Screen>

      <Tab.Screen name="Explore">
        {() => (
          <ExploreScreen
            finishedBooks={finishedBooks}
            fetchAllBooks={fetchAllBooks}
          />
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{
          title: "My Library",
        }}
      />
      <Tab.Screen name="Writer">
        {() => <WriterScreen fetchAllBooks={fetchAllBooks} />}
      </Tab.Screen>
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: "Notifications",
          tabBarBadge: 3, // Example badge count, will be dynamic in real app
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
        }}
      />
      <Tab.Screen
        name="BookDetails"
        component={BookDetailScreen}
        options={{
          title: "Book Details",
          tabBarButton: () => null, // Hide from tab bar
        }}
      />
      <Tab.Screen
        name="CreateBook"
        component={CreateBookScreen}
        options={{
          title: "Create Book",
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="EditBook"
        component={EditBookScreen}
        options={{
          title: "Edit Book",
          tabBarButton: () => null,
        }}
      />
      <Tab.Screen
        name="ManageChapters"
        component={ManageChaptersScreen}
        options={{
          title: "Manage Chapters",
          tabBarButton: () => null,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, backgroundColor: COLORS.background },
  tabBar: {
    backgroundColor: COLORS.card,
    borderTopColor: COLORS.border,
    paddingVertical: 5,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  badge: {
    position: "absolute",
    right: -6,
    top: -3,
    backgroundColor: COLORS.notification,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0A84FF",
  },
  avatarButton: {
    padding: 4,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0A84FF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
