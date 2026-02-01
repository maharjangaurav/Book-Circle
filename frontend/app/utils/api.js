import AsyncStorage from "@react-native-async-storage/async-storage"

const API_BASE_URL = "http://192.168.1.75:3000"

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

// ============= BOOK APIs =============
export const getBookByIdAPI = async (bookId) => {
  return apiCall(`/book/${bookId}`, {
    method: "GET",
  })
}

export const getBooksAPI = async () => {
  return apiCall("/book/read", {
    method: "GET",
  })
}

// ============= CHAPTER APIs =============
// Get all chapters for a specific book
export const getChaptersByBookIdAPI = async (bookId) => {
  return apiCall(`/chapter/readbybook/${bookId}`, {
    method: "GET",
  })
}

// Get single chapter by ID
export const getChapterByIdAPI = async (chapterId) => {
  return apiCall(`/chapter/readbyid/${chapterId}`, {
    method: "GET",
  })
}

// Create new chapter
export const createChapterAPI = async (chapterData) => {
  return apiCall("/chapter/create", {
    method: "POST",
    body: JSON.stringify(chapterData),
  })
}

// Update chapter
export const updateChapterAPI = async (chapterId, chapterData) => {
  return apiCall(`/chapter/read/${chapterId}`, {
    method: "PATCH",
    body: JSON.stringify(chapterData),
  })
}

// ============= LIBRARY APIs =============
export const getReadingProgressAPI = async (libraryId) => {
  return apiCall(`/api/library/${libraryId}/progress`, {
    method: "GET",
  })
}

export const updateReadingProgressAPI = async (libraryId, progressData) => {
  return apiCall(`/api/library/${libraryId}/progress`, {
    method: "PUT",
    body: JSON.stringify(progressData),
  })
}

// ✅ ADD THESE MISSING LIBRARY APIs:
export const getLibraryAPI = async () => {
  return apiCall('/api/library', {
    method: "GET",
  })
}

export const updateLibraryStatusAPI = async (libraryId, status) => {
  return apiCall(`/api/library/${libraryId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
}

export const removeFromLibraryAPI = async (libraryId) => {
  return apiCall(`/api/library/${libraryId}`, {
    method: "DELETE",
  })
}

export const addToLibraryAPI = async (bookId) => {
  return apiCall(`/api/library/${bookId}`, {
    method: "POST",
  })
}
