// In app/navigation/AppNavigator.js - implement role-based routing

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import { View, ActivityIndicator } from 'react-native';
import BottomTabNavigator from './BottomTabNavigator';
import BookDetailScreen from '../screens/BookDetailScreen';
import ReadingScreen from '../screens/ReadingScreen';

const Stack = createStackNavigator();

// Loading screen component
const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color="#0000ff" />
  </View>
);

export default function AppNavigator() {
  const { isAuthenticated, loading, user } = useAuth();
  
  // Show loading screen while checking authentication
  if (loading) {
    return <LoadingScreen />;
  }
  
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false
      }}
    >
      {!isAuthenticated ? (
        // Authentication routes
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      ) : user && user.role === 'admin' ? (
        // Admin routes
        <>
          <Stack.Screen name="AdminHome" component={BottomTabNavigator} />
          <Stack.Screen 
            name="BookDetail" 
            component={BookDetailScreen} 
            options={{
              headerShown: true,
              title: 'Book Details',
              headerBackTitleVisible: false
            }}
          />
          <Stack.Screen 
            name="Reading" 
            component={ReadingScreen} 
            options={{ headerShown: false }}
          />
        </>
      ) : (
        // Reader routes
        <>
          <Stack.Screen name="ReaderHome" component={BottomTabNavigator} />
          <Stack.Screen 
            name="BookDetail" 
            component={BookDetailScreen} 
            options={{
              headerShown: true,
              title: 'Book Details',
              headerBackTitleVisible: false
            }}
          />
          <Stack.Screen 
            name="Reading" 
            component={ReadingScreen} 
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}