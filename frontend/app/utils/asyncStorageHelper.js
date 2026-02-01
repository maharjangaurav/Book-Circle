import AsyncStorage from "@react-native-async-storage/async-storage";

const LIBRARY_KEY = "USER_LIBRARY";

export const AsyncStorageHelper = {
  // Save a book to library
  saveToLibrary: async (book, status = "saved") => {
    try {
      const libraryRaw = await AsyncStorage.getItem(LIBRARY_KEY);
      let library = [];

      try {
        library = libraryRaw ? JSON.parse(libraryRaw) : [];
      } catch {
        console.warn("Invalid JSON in library, resetting to empty array");
        library = [];
      }

      const existingIndex = library.findIndex((item) => item.id === book.id);

      if (existingIndex !== -1) {
        library[existingIndex] = { ...library[existingIndex], ...book, status };
      } else {
        library.push({ ...book, status });
      }

      await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
    } catch (error) {
      console.error("Error saving to library:", error);
    }
  },

  // Get the full library
  getLibrary: async () => {
    try {
      const libraryRaw = await AsyncStorage.getItem(LIBRARY_KEY);
      try {
        return libraryRaw ? JSON.parse(libraryRaw) : [];
      } catch {
        console.warn("Invalid JSON in library, returning empty array");
        return [];
      }
    } catch (error) {
      console.error("Error getting library:", error);
      return [];
    }
  },

  // Update reading status
  updateReadingStatus: async (bookId, newStatus) => {
    try {
      const library = await AsyncStorageHelper.getLibrary();
      const updatedLibrary = library.map((item) =>
        item.id === bookId ? { ...item, status: newStatus } : item
      );
      await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(updatedLibrary));
    } catch (error) {
      console.error("Error updating reading status:", error);
    }
  },

  // Remove a book from library
  removeFromLibrary: async (bookId) => {
    try {
      const library = await AsyncStorageHelper.getLibrary();
      const updatedLibrary = library.filter((item) => item.id !== bookId);
      await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(updatedLibrary));
    } catch (error) {
      console.error("Error removing from library:", error);
    }
  },

  // Update reading progress for a book
 updateReadingProgress: async (libraryId, progress, currentPage) => {
  const library = await AsyncStorageHelper.getLibrary();
  const updated = library.map(item =>
    item.id === libraryId
      ? { ...item, progress, currentPage, lastReadAt: new Date().toISOString() }
      : item
  );
  await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(updated));
},




  // Optional: Clear all library (for debugging or reset)
  clearLibrary: async () => {
    try {
      await AsyncStorage.removeItem(LIBRARY_KEY);
    } catch (error) {
      console.error("Error clearing library:", error);
    }
  },
};
