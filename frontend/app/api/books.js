import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiGet, apiPost, apiPatch, apiDelete } from "../utils/api";
import { API_URL } from "@env";

export const BooksAPI = {
  // Basic book operations
  get: (api) => fetched(api, "GET"),
  getById: (api) => fetched(api, "GET"),
  create: (api, data) => fetched(api, "POST", data),
  update: (api, data) => fetched(api, "PATCH", data),
  delete: (api) => fetched(api, "DELETE"),

  // Search and filter operations
  search: (query) => apiGet(`/books/?search=${encodeURIComponent(query)}`),
  filter: (params) => {
    const queryString = Object.entries(params)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      )
      .join("&");
    return apiGet(`/books/?${queryString}`);
  },

  // Writer-specific operations
  getMyBooks: () => fetch("/books/mybooks/"),
  getAuthorBooks: (authorId) => fetch(`/books/?author=${authorId}`),
  deleteBook: () => fetch("/books/mybooks/"),

  // Chapter management operations
  getChapters: (bookId) => apiGet(`/books/${bookId}/chapters/`),
  createChapter: (bookId, data) => apiPost(`/books/${bookId}/chapters/`, data),
  updateChapter: (bookId, chapterId, data) =>
    apiPatch(`/books/${bookId}/chapters/${chapterId}/`, data),
  deleteChapter: (bookId, chapterId) =>
    apiDelete(`/books/${bookId}/chapters/${chapterId}/`),
  reorderChapters: (bookId, chapterOrder) =>
    apiPost(`/books/${bookId}/chapters/reorder/`, {
      chapter_order: chapterOrder,
    }),

  // Premium content operations
  getPremiumContent: (bookId) => apiGet(`/books/${bookId}/premium/`),
};

async function fetched(api, method, data) {
  try {
    const token = await AsyncStorage.getItem("authToken");

    console.log(
      `Making ${method} request to ${API_URL}/${api} with data:`,
      data,
      "with token: ",
      token
    );

    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_URL}/${api}`, options);

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error(`Error calling api, ${error}`);
  }
}
