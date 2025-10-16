export const BooksAPI = {
  // Basic book operations
  list: () => apiGet("/api/books/"),
  getById: (id) => apiGet(`/api/books/${id}/`),
  create: (data) => apiPost("/api/books/", data),
  update: (id, data) => apiPatch(`/api/books/${id}/`, data),
  delete: (id) => apiDelete(`/api/books/${id}/`),

  // Search and filter operations
  search: (query) => apiGet(`/api/books/?search=${encodeURIComponent(query)}`),
  filter: (params) => {
    const queryString = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    return apiGet(`/api/books/?${queryString}`);
  },

  // Writer-specific operations
  getMyBooks: () => apiGet("/api/books/mybooks/"),
  getAuthorBooks: (authorId) => apiGet(`/api/books/?author=${authorId}`),  // <-- added function

  // Chapter management operations
  getChapters: (bookId) => apiGet(`/api/books/${bookId}/chapters/`),
  createChapter: (bookId, data) => apiPost(`/api/books/${bookId}/chapters/`, data),
  updateChapter: (bookId, chapterId, data) => apiPatch(`/api/books/${bookId}/chapters/${chapterId}/`, data),
  deleteChapter: (bookId, chapterId) => apiDelete(`/api/books/${bookId}/chapters/${chapterId}/`),
  reorderChapters: (bookId, chapterOrder) => apiPost(`/api/books/${bookId}/chapters/reorder/`, { chapter_order: chapterOrder }),

  // Premium content operations
  getPremiumContent: (bookId) => apiGet(`/api/books/${bookId}/premium/`),
};
