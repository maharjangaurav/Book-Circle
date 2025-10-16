// In app/navigation/AdminNavigator.js

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import BottomTabNavigator from './BottomTabNavigator';
import BookDetailScreen from '../screens/BookDetailScreen';
import ReadingScreen from '../screens/ReadingScreen';
import ManageChaptersScreen from '../screens/ManageChaptersScreen';

const Stack = createStackNavigator();

export default function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminTabs" component={BottomTabNavigator} />
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
      <Stack.Screen 
        name="ManageChapters" 
        component={ManageChaptersScreen} 
        options={{
          headerShown: true,
          title: 'Manage Chapters',
          headerBackTitleVisible: false
        }}
      />
    </Stack.Navigator>
  );
}