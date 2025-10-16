import client from './client';

// Login user
export const login = async (email, password) => {
  try {
    // Extract username without domain if it's an email
    const username = email.includes('@') ? email.split('@')[0] : email;
    
    console.log('Attempting login with:', { username: username, password: '***' });
    
    // Make sure we're sending the request to the correct endpoint with proper format
    // Using username without @domain.com and the provided password
    const response = await client.post('api/auth/login/', { 
      username: username, 
      password: password 
    });
    
    console.log('Login response:', response.data);
    
    const { access, refresh, user } = response.data;

    // Set the access token for future requests
    if (access) {
      client.defaults.headers.common['Authorization'] = `Bearer ${access}`;
    }

    // Return the correct object structure for AuthContext
    return { success: true, access, refresh, user };
  } catch (error) {
    console.error('Login error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: error.config
    });
    
    // Return a structured error object
    return { 
      success: false, 
      error: error.response?.data || { message: 'Network connection failed. Please check your internet connection.' }
    };
  }
};

// In app/api/auth.js - add getUserProfile function

export const getUserProfile = async () => {
  try {
    const response = await client.get('/api/user/me/');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return { 
      success: false, 
      error: { 
        message: error.response?.data?.message || 'Failed to fetch user profile'
      }
    };
  }
};

// Register user
export const register = async (userData) => {
  try {
    const response = await client.post('/api/auth/register/', userData);
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error.response?.data || error;
  }
};

// Logout user
export const logout = async () => {
  try {
    // If backend has logout endpoint, call it. Otherwise skip.
    delete client.defaults.headers.common['Authorization'];
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    throw error.response?.data || error;
  }
};

// Refresh token
export const refreshToken = async (refresh) => {
  try {
    const response = await client.post('/api/auth/refresh/', { refresh });
    const { access } = response.data;

    if (access) {
      client.defaults.headers.common['Authorization'] = `Bearer ${access}`;
    }

    return { access };
  } catch (error) {
    console.error('Token refresh error:', error.response?.data || error);
    throw error.response?.data || error;
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const response = await client.get('/api/auth/me/');
    return response.data;
  } catch (error) {
    console.error('Get current user error:', error);
    throw error.response?.data || error;
  }
};

// Update user profile
export const updateProfile = async (userData) => {
  try {
    const response = await client.put('/api/auth/profile/', userData);
    return response.data;
  } catch (error) {
    console.error('Update profile error:', error);
    throw error.response?.data || error;
  }
};

// Request password reset
export const requestPasswordReset = async (email) => {
  try {
    const response = await client.post('/api/auth/forgot-password/', { email });
    return response.data;
  } catch (error) {
    console.error('Password reset request error:', error);
    throw error.response?.data || error;
  }
};

// Confirm password reset
export const confirmPasswordReset = async (uid, token, newPassword) => {
  try {
    const response = await client.post('/api/auth/reset-password/', {
      uid,
      token,
      password: newPassword,
    });
    return response.data;
  } catch (error) {
    console.error('Password reset confirmation error:', error);
    throw error.response?.data || error;
  }
};
