import axios from "axios";
import { API_URL } from "@env";

const API_BASE_URL = `${API_URL}/api/library`;

export const LibraryAPI = {
  // Add book to library
  add: async (bookId, status = "saved") => {
    const response = await axios.post(`${API_BASE_URL}/${bookId}`, { status });
    return response.data.data;
  },

  // Get user's library
  list: async () => {
    const response = await axios.get(API_BASE_URL);
    return response.data.data;
  },

  // Get library item for a specific book
  getByBook: async (bookId) => {
    const response = await axios.get(`${API_BASE_URL}/${bookId}`);
    return response.data.data;
  },

  // Update reading status
  updateStatus: async (libraryItemId, status) => {
    const response = await axios.patch(
      `${API_BASE_URL}/${libraryItemId}/status`,
      { status }
    );
    return response.data.data;
  },

  // Update reading progress
  updateProgress: async (libraryItemId, progress) => {
    const response = await axios.patch(
      `${API_BASE_URL}/${libraryItemId}/progress`,
      { progress }
    );
    return response.data.data;
  },

  // Remove from library
  remove: async (libraryItemId) => {
    const response = await axios.delete(`${API_BASE_URL}/${libraryItemId}`);
    return response.data;
  },
};
