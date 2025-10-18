import AsyncStorage from "@react-native-async-storage/async-storage"

const API_BASE_URL = "http://your-backend-url/api"

export const apiCall = async (endpoint, options = {}) => {
  try {
    const token = await AsyncStorage.getItem("authToken")

    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "API request failed")
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Login API call
export const loginAPI = async (email, password) => {
  return apiCall("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

// Signup API call
export const signupAPI = async (email, password, name) => {
  return apiCall("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  })
}

// Refresh token API call
export const refreshTokenAPI = async () => {
  return apiCall("/auth/refresh", {
    method: "POST",
  })
}

// Get user profile API call
export const getUserProfileAPI = async () => {
  return apiCall("/user/profile", {
    method: "GET",
  })
}
