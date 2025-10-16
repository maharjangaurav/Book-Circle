import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './app/context/AuthContext';
import AppNavigator from './app/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer
        theme={{
          colors: {
            primary: '#0A84FF',
            background: '#FFFFFF',
            card: '#FFFFFF',
            text: '#000000',
            border: '#E5E5E5',
            notification: '#FF3B30',
          },
          dark: false,
        }}
      >
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}