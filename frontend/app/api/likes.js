import axios from "axios";
import { API_URL } from "@env";

const API_BASE_URL = `${API_URL}/api/likes`;

export const LikesAPI = {
  // Add like
  addLike: async (bookId) => {
    const response = await axios.post(`${API_BASE_URL}/${bookId}`);
    return response.data.data;
  },

  // Remove like
  removeLike: async (bookId) => {
    const response = await axios.delete(`${API_BASE_URL}/${bookId}`);
    return response.data;
  },

  // Get like status
  getStatus: async (bookId) => {
    const response = await axios.get(`${API_BASE_URL}/${bookId}/status`);
    return response.data;
  },

  // Get like count
  getCount: async (bookId) => {
    const response = await axios.get(`${API_BASE_URL}/${bookId}/count`);
    return response.data;
  },
};
