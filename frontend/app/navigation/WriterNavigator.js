// In app/navigation/ReaderNavigator.js

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import BottomTabNavigator from './BottomTabNavigator';
import BookDetailScreen from '../screens/BookDetailScreen';
import ReadingScreen from '../screens/ReadingScreen';

const Stack = createStackNavigator();

export default function ReaderNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ReaderTabs" component={BottomTabNavigator} />
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
    </Stack.Navigator>
  );
}