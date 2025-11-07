import AsyncStorage from "@react-native-async-storage/async-storage";

const LIBRARY_KEY = "@bookcircle_library";
const READING_PROGRESS_KEY = "@bookcircle_reading_progress";

export const AsyncStorageHelper = {
  // Save book to library locally
  saveToLibrary: async (book, status = "saved") => {
    try {
      const library = await AsyncStorage.getItem(LIBRARY_KEY);
      const libraryArray = library ? JSON.parse(library) : [];

      const existingIndex = libraryArray.findIndex(
        (item) => item.id === book.id
      );

      if (existingIndex >= 0) {
        libraryArray[existingIndex] = {
          ...book,
          status,
          addedAt: new Date().toISOString(),
        };
      } else {
        libraryArray.push({
          ...book,
          status,
          addedAt: new Date().toISOString(),
        });
      }

      await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(libraryArray));
      return true;
    } catch (error) {
      console.error("Error saving to library:", error);
      return false;
    }
  },

  // Get library
  getLibrary: async () => {
    try {
      const library = await AsyncStorage.getItem(LIBRARY_KEY);
      return library ? JSON.parse(library) : [];
    } catch (error) {
      console.error("Error getting library:", error);
      return [];
    }
  },

  // Get library status for a specific book
  getBookStatus: async (bookId) => {
    try {
      const library = await AsyncStorage.getItem(LIBRARY_KEY);
      if (!library) return null;

      const libraryArray = JSON.parse(library);
      const book = libraryArray.find((item) => item.id === bookId);
      return book ? book.status : null;
    } catch (error) {
      console.error("Error getting book status:", error);
      return null;
    }
  },

  // Update reading status
  updateReadingStatus: async (bookId, status) => {
    try {
      const library = await AsyncStorage.getItem(LIBRARY_KEY);
      const libraryArray = library ? JSON.parse(library) : [];

      const index = libraryArray.findIndex((item) => item.id === bookId);
      if (index >= 0) {
        libraryArray[index].status = status;
        libraryArray[index].lastReadAt = new Date().toISOString();

        if (status === "finished") {
          libraryArray[index].progress = 100;
        }

        await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(libraryArray));
      }

      return true;
    } catch (error) {
      console.error("Error updating reading status:", error);
      return false;
    }
  },

  // Update reading progress
  updateReadingProgress: async (bookId, progress) => {
    try {
      const library = await AsyncStorage.getItem(LIBRARY_KEY);
      const libraryArray = library ? JSON.parse(library) : [];

      const index = libraryArray.findIndex((item) => item.id === bookId);
      if (index >= 0) {
        libraryArray[index].progress = progress;
        libraryArray[index].lastReadAt = new Date().toISOString();

        if (progress === 100) {
          libraryArray[index].status = "finished";
        }

        await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(libraryArray));
      }

      return true;
    } catch (error) {
      console.error("Error updating progress:", error);
      return false;
    }
  },

  // Remove from library
  removeFromLibrary: async (bookId) => {
    try {
      const library = await AsyncStorage.getItem(LIBRARY_KEY);
      const libraryArray = library ? JSON.parse(library) : [];

      const filteredArray = libraryArray.filter((item) => item.id !== bookId);
      await AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(filteredArray));

      return true;
    } catch (error) {
      console.error("Error removing from library:", error);
      return false;
    }
  },

  // Clear library
  clearLibrary: async () => {
    try {
      await AsyncStorage.removeItem(LIBRARY_KEY);
      return true;
    } catch (error) {
      console.error("Error clearing library:", error);
      return false;
    }
  },
};
