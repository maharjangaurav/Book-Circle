import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './app/context/AuthContext';
import AppNavigator from './app/navigation/AppNavigator';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  return (
    <AuthProvider>
      <SafeAreaView style={{ flex: 1 }}>

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
</SafeAreaView>
    </AuthProvider>
  );
}