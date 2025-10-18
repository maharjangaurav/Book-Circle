"use client"
import { createStackNavigator } from "@react-navigation/stack"
import { useAuth } from "../context/AuthContext"
import LoginScreen from "../screens/LoginScreen"
import SignUpScreen from "../screens/SignUpScreen"
import { View, ActivityIndicator } from "react-native"
import BottomTabNavigator from "./BottomTabNavigator"

const Stack = createStackNavigator()

const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
    <ActivityIndicator size="large" color="#0A84FF" />
  </View>
)

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth()

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {!isAuthenticated ? (
        <Stack.Group screenOptions={{ animationEnabled: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </Stack.Group>
      ) : (
        <Stack.Group screenOptions={{ animationEnabled: false }}>
          <Stack.Screen name="Home" component={BottomTabNavigator} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  )
}
