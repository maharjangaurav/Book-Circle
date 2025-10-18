import AsyncStorage from "@react-native-async-storage/async-storage"

const TOKEN_KEY = "authToken"
const USER_KEY = "userData"
const REFRESH_TOKEN_KEY = "refreshToken"

export const tokenStorage = {
  // Save token
  saveToken: async (token) => {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token)
    } catch (error) {
      console.error("Failed to save token", error)
    }
  },

  // Get token
  getToken: async () => {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY)
    } catch (error) {
      console.error("Failed to get token", error)
      return null
    }
  },

  // Remove token
  removeToken: async () => {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY)
    } catch (error) {
      console.error("Failed to remove token", error)
    }
  },

  // Save user data
  saveUser: async (user) => {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user))
    } catch (error) {
      console.error("Failed to save user", error)
    }
  },

  // Get user data
  getUser: async () => {
    try {
      const user = await AsyncStorage.getItem(USER_KEY)
      return user ? JSON.parse(user) : null
    } catch (error) {
      console.error("Failed to get user", error)
      return null
    }
  },

  // Remove user data
  removeUser: async () => {
    try {
      await AsyncStorage.removeItem(USER_KEY)
    } catch (error) {
      console.error("Failed to remove user", error)
    }
  },

  // Save refresh token
  saveRefreshToken: async (refreshToken) => {
    try {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    } catch (error) {
      console.error("Failed to save refresh token", error)
    }
  },

  // Get refresh token
  getRefreshToken: async () => {
    try {
      return await AsyncStorage.getItem(REFRESH_TOKEN_KEY)
    } catch (error) {
      console.error("Failed to get refresh token", error)
      return null
    }
  },

  // Clear all auth data
  clearAll: async () => {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, REFRESH_TOKEN_KEY])
    } catch (error) {
      console.error("Failed to clear auth data", error)
    }
  },
}
