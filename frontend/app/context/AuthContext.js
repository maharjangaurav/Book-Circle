"use client"

import React, { createContext, useState, useEffect, useCallback } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check if user is already logged in on app start
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const savedToken = await AsyncStorage.getItem("authToken")
        const savedUser = await AsyncStorage.getItem("userData")

        if (savedToken && savedUser) {
          setToken(savedToken)
          setUser(JSON.parse(savedUser))
        }
      } catch (e) {
        console.error("Failed to restore token", e)
      } finally {
        setIsLoading(false)
      }
    }

    bootstrapAsync()
  }, [])

  // Login function
  const login = useCallback(async (email, password) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("http://192.168.0.101:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }

      // Save token and user data
      await AsyncStorage.setItem("authToken", data.token)
      await AsyncStorage.setItem("userData", JSON.stringify(data.user))

      setToken(data.token)
      setUser(data.user)

      return { success: true, user: data.user }
    } catch (err) {
      const errorMessage = err.message || "Login failed"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Logout function
  const logout = useCallback(async () => {
    setIsLoading(true)

    try {
      await AsyncStorage.removeItem("authToken")
      await AsyncStorage.removeItem("userData")

      setToken(null)
      setUser(null)
      setError(null)
    } catch (err) {
      console.error("Logout failed", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Signup function
  const signup = useCallback(async (email, password, name) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("http://192.168.0.101:3000/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Signup failed")
      }

      // Save token and user data
      await AsyncStorage.setItem("authToken", data.token)
      await AsyncStorage.setItem("userData", JSON.stringify(data.user))

      setToken(data.token)
      setUser(data.user)

      return { success: true, user: data.user }
    } catch (err) {
      const errorMessage = err.message || "Signup failed"
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Refresh token function
  const refreshToken = useCallback(async () => {
    try {
      const response = await fetch("http://192.168.0.101:3000/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Token refresh failed")
      }

      await AsyncStorage.setItem("authToken", data.token)
      setToken(data.token)

      return { success: true }
    } catch (err) {
      console.error("Token refresh failed", err)
      // If refresh fails, logout the user
      await logout()
      return { success: false }
    }
  }, [token, logout])

  const value = {
    user,
    token,
    isLoading,
    error,
    login,
    logout,
    signup,
    refreshToken,
    isAuthenticated: !!token,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook to use Auth Context
export const useAuth = () => {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
