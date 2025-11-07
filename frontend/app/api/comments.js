import axios from "axios";
import { API_URL } from "@env";

const API_BASE_URL = `${API_URL}/api/comments`;

export const CommentsAPI = {
  // Add comment
  add: async (bookId, text) => {
    const response = await axios.post(`${API_BASE_URL}/${bookId}`, { text });
    return response.data.data;
  },

  // Get comments
  getAll: async (bookId) => {
    const response = await axios.get(`${API_BASE_URL}/${bookId}`);
    return response.data.data;
  },

  // Update comment
  update: async (commentId, text) => {
    const response = await axios.patch(`${API_BASE_URL}/${commentId}`, {
      text,
    });
    return response.data.data;
  },

  // Delete comment
  delete: async (commentId) => {
    const response = await axios.delete(`${API_BASE_URL}/${commentId}`);
    return response.data;
  },
};
