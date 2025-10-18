"use client"

import { useCallback } from "react"
import { useAuth } from "../context/AuthContext"
import { tokenStorage } from "../utils/tokenStorage"

export const useApi = () => {
  const { token, refreshToken, logout } = useAuth()

  const apiCall = useCallback(
    async (endpoint, options = {}) => {
      try {
        const headers = {
          "Content-Type": "application/json",
          ...options.headers,
        }

        if (token) {
          headers.Authorization = `Bearer ${token}`
        }

        let response = await fetch(`http://your-backend-url/api${endpoint}`, {
          ...options,
          headers,
        })

        // If token expired, try to refresh
        if (response.status === 401) {
          const refreshResult = await refreshToken()
          if (refreshResult.success) {
            const newToken = await tokenStorage.getToken()
            headers.Authorization = `Bearer ${newToken}`

            response = await fetch(`http://your-backend-url/api${endpoint}`, {
              ...options,
              headers,
            })
          } else {
            // Refresh failed, logout user
            await logout()
            return { success: false, error: "Session expired. Please login again." }
          }
        }

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "API request failed")
        }

        return { success: true, data }
      } catch (error) {
        return { success: false, error: error.message }
      }
    },
    [token, refreshToken, logout],
  )

  return { apiCall }
}
