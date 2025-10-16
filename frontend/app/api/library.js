// app/api/library.js
import { apiGet, apiPost, apiPatch, apiDelete } from "./client";

export const LibraryAPI = {
  // Get all library entries for the current user
  list: () => apiGet("/api/library/"),
  
  // Get library entries by status (saved, reading, finished)
  getByStatus: (status) => apiGet(`/api/library/?status=${status}`),
  
  // Add a book to user's library
  add: (bookId, status = "saved") => apiPost("/api/library/", { 
    book: bookId,
    status: status 
  }),
  
  // Update reading status of a book
  updateStatus: (id, status) => apiPatch(`/api/library/${id}/`, { 
    status: status 
  }),
  
  // Get details of a specific library entry
  getById: (id) => apiGet(`/api/library/${id}/`),
  
  // Remove a book from user's library
  remove: (id) => apiDelete(`/api/library/${id}/`),
  
  // Get reading progress for a book
  getProgress: (id) => apiGet(`/api/library/${id}/progress/`),
  
  // Update reading progress for a book
  updateProgress: (id, progress) => apiPatch(`/api/library/${id}/progress/`, { 
    progress: progress 
  }),
};
