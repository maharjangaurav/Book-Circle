
"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  Image,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { AsyncStorageHelper } from "../utils/asyncStorageHelper";
import { API_URL } from "@env";
import { useFocusEffect } from "@react-navigation/native";

// ✅ IMPORT CORRECT API FUNCTIONS from utils/api.js
import {
  getLibraryAPI,           // Get all library items
  updateLibraryStatusAPI,   // Update reading status
  removeFromLibraryAPI,     // Remove from library
  addToLibraryAPI,         // Add to library
  getReadingProgressAPI,    // Get reading progress
  updateReadingProgressAPI, // Update reading progress
} from "../utils/api";

const READING_STATUS = {
  SAVED: "saved",
  READING: "reading",
  FINISHED: "finished",
};
export default function LibraryScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState(READING_STATUS.SAVED);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState("title");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showSortOptions, setShowSortOptions] = useState(false);

  const getFilteredAndSortedBooks = () => {
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.log("📊 No items to filter/sort");
      return [];
    }

    console.log(`📊 Filtering books for tab: ${activeTab}`);
    
    // Filter by active tab
    const filteredBooks = items.filter((item) => {
      const matches = item.status === activeTab;
      return matches;
    });

    console.log(`📊 Found ${filteredBooks.length} books in ${activeTab}`);

    // Sort the filtered books
    const sortedBooks = filteredBooks.sort((a, b) => {
      if (sortBy === "title") {
        const titleA = (a.book_title || "").toLowerCase();
        const titleB = (b.book_title || "").toLowerCase();
        return sortOrder === "asc"
          ? titleA.localeCompare(titleB)
          : titleB.localeCompare(titleA);
      } else if (sortBy === "author") {
        const authorA = (a.book_author || "").toLowerCase();
        const authorB = (b.book_author || "").toLowerCase();
        return sortOrder === "asc"
          ? authorA.localeCompare(authorB)
          : authorB.localeCompare(authorA);
      } else if (sortBy === "recent") {
        const dateA = new Date(a.lastReadAt || a.addedAt).getTime();
        const dateB = new Date(b.lastReadAt || b.addedAt).getTime();
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });
        return sortedBooks;
  };
  
  // Fetch library on focus
  useFocusEffect(
    useCallback(() => {
      fetchLibrary();
    }, [])
  );

  // Replace your fetchLibrary function:
const fetchLibrary = async () => {
  try {
    setLoading(true);
    
    console.log("📱 Fetching library from API...");
    
    // ✅ Use the imported getLibraryAPI function
    const response = await getLibraryAPI(); // This calls /api/library
    
    console.log("📦 Full API response:", JSON.stringify(response, null, 2));
    
    // Debug the response structure
    if (response.success) {
      console.log("✅ API call successful");
      console.log("📊 Response data:", response.data);
      console.log("📊 Response data type:", typeof response.data);
      
      if (response.data) {
        console.log("📊 Is array?", Array.isArray(response.data));
        console.log("📊 Data keys:", Object.keys(response.data));
      }
    } else {
      console.log("❌ API error:", response.error);
    }
    
    // Try different response structures
    const apiLibrary = response.data;
    
    // Handle different possible response structures
    let itemsArray = [];
    
    if (Array.isArray(apiLibrary)) {
      // Case 1: Direct array
      console.log("📊 Case 1: Direct array");
      itemsArray = apiLibrary;
    } else if (apiLibrary && apiLibrary.data && Array.isArray(apiLibrary.data)) {
      // Case 2: { data: [...] }
      console.log("📊 Case 2: Nested data array");
      itemsArray = apiLibrary.data;
    } else if (apiLibrary && Array.isArray(apiLibrary.items)) {
      // Case 3: { items: [...] }
      console.log("📊 Case 3: Items array");
      itemsArray = apiLibrary.items;
    } else if (apiLibrary && apiLibrary.books) {
      // Case 4: { books: [...] }
      console.log("📊 Case 4: Books array");
      itemsArray = apiLibrary.books;
    } else if (apiLibrary && typeof apiLibrary === 'object') {
      // Case 5: Single object or something else
      console.log("📊 Case 5: Single object or other structure");
      itemsArray = [apiLibrary];
    } else {
      console.log("📊 Case 6: No valid data found");
      itemsArray = [];
    }
    
    console.log("📊 Items to process:", itemsArray.length);
    
    if (itemsArray.length > 0) {
      const transformedItems = itemsArray.map((item) => ({
        id: item._id || item.id || `lib-${Date.now()}`,
        bookId: item.book?._id || item.bookId || item.book || "unknown",
        book_title: item.book?.title || item.title || "Untitled",
        book_author: item.book?.author?.name || item.book?.author || item.author || "Unknown",
        book_cover: item.book?.coverImage || item.book_cover || item.cover || null,
        status: item.status || "saved",
        progress: item.progress || 0,
        currentPage: item.currentPage || 1,
        lastReadAt: item.lastReadAt || item.updatedAt || new Date().toISOString(),
        addedAt: item.createdAt || new Date().toISOString(),
        book: item.book || null,
      }));

      console.log("✅ Transformed items:", transformedItems.length);
      
      setItems(transformedItems);
      
      // Save to local storage
      await AsyncStorageHelper.clearLibrary();
      for (const transformedItem of transformedItems) {
        await AsyncStorageHelper.saveToLibrary(transformedItem, transformedItem.status);
      }
    } else {
      console.log("📭 No library items found");
      setItems([]);
    }
    
    setLoading(false);
  } catch (error) {
    console.error("❌ Error fetching library:", error);
    console.error("❌ Error stack:", error.stack);
    
    // Fallback to local storage
    try {
      const localLibrary = await AsyncStorageHelper.getLibrary();
      console.log("📱 Fallback to local storage, items:", localLibrary.length);
      setItems(localLibrary);
    } catch (storageError) {
      console.error("❌ Error with local storage:", storageError);
      setItems([]);
    }
    
    setLoading(false);
  }
};

  const updateReadingStatus = async (libraryItemId, newStatus) => {
  try {
    // ✅ Use updateLibraryStatusAPI from utils/api.js
    const response = await updateLibraryStatusAPI(libraryItemId, newStatus);
    
    if (response.success) {
      // Update UI state
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === libraryItemId ? { ...item, status: newStatus } : item
        )
      );

      // Update local storage
      await AsyncStorageHelper.updateReadingStatus(libraryItemId, newStatus);

      if (modalVisible) setModalVisible(false);
      Alert.alert("Success", "Book status updated");
    } else {
      throw new Error(response.error);
    }
  } catch (error) {
    console.error("Error updating status:", error);
    
    // Offline fallback - update locally
    await AsyncStorageHelper.updateReadingStatus(libraryItemId, newStatus);
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === libraryItemId ? { ...item, status: newStatus } : item
      )
    );
    
    if (modalVisible) setModalVisible(false);
    Alert.alert("Updated locally", "Will sync when online");
  }
};

  const updateReadingProgress = async (
  libraryItemId,
  progress,
  currentPage = 1
) => {
  try {
    // 🔹 Clamp progress safely (0–100)
    const safeProgress = Math.max(0, Math.min(progress, 100));
    const safePage = Math.max(1, currentPage);

    // 🔹 Update backend
    await BooksAPI.update(
      `api/library/${libraryItemId}/progress`,
      {
        progress: safeProgress,
        currentPage: safePage,
      }
    );

    // 🔹 Update UI list immediately
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === libraryItemId
          ? {
              ...item,
              progress: safeProgress,
              lastReadAt: new Date().toISOString(),
            }
          : item
      )
    );

    // 🔹 Update selected modal book
    setSelectedBook((prev) =>
      prev
        ? {
            ...prev,
            progress: safeProgress,
            lastReadAt: new Date().toISOString(),
          }
        : prev
    );

    // 🔹 Save locally (offline-safe)
    await AsyncStorageHelper.updateReadingProgress(
      libraryItemId,
      safeProgress,
      safePage
    );
  } catch (error) {
    console.error("Error updating progress:", error);

    // 🔹 Offline fallback
    await AsyncStorageHelper.updateReadingProgress(
      libraryItemId,
      progress,
      currentPage
    );

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === libraryItemId
          ? { ...item, progress }
          : item
      )
    );
  }
};

  const removeFromLibrary = async (libraryItemId) => {
  Alert.alert("Remove Book", "Remove this book from your library?", [
    { text: "Cancel" },
    {
      text: "Remove",
        style: "destructive",
      onPress: async () => {
        try {
          // ✅ Use removeFromLibraryAPI from utils/api.js
          const response = await removeFromLibraryAPI(libraryItemId);
          
          if (response.success) {
            // Remove from UI
            setItems((prevItems) =>
              prevItems.filter((item) => item.id !== libraryItemId)
            );
            
            // Remove from local storage
            await AsyncStorageHelper.removeFromLibrary(libraryItemId);
            
            Alert.alert("Success", "Book removed from library");
          } else {
            throw new Error(response.error);
          }
        } catch (error) {
          console.error("Error removing book:", error);
          
          // Offline fallback - remove locally
          setItems((prevItems) =>
            prevItems.filter((item) => item.id !== libraryItemId)
          );
          await AsyncStorageHelper.removeFromLibrary(libraryItemId);
          Alert.alert("Removed locally", "Will sync when online");
        }
      },
    },
  ]);
};

  const openStatusModal = (book) => {
    setSelectedBook(book);
    setModalVisible(true);
  };

  const renderStatusTabs = () => (
    <View style={styles.tabsContainer}>
      {Object.values(READING_STATUS).map((status) => (
        <TouchableOpacity
          key={status}
          style={[styles.tab, activeTab === status && styles.activeTab]}
          onPress={() => setActiveTab(status)}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === status && styles.activeTabText,
            ]}
          >
            {status === READING_STATUS.SAVED
              ? "Saved"
              : status === READING_STATUS.READING
              ? "Reading"
              : "Finished"}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderBookItem = ({ item }) => {
    const progress = item.progress || 0;

    return (
      <TouchableOpacity
        style={styles.bookCard}
        onPress={() =>
          navigation.navigate("Reading", { 
            bookId: item.bookId,
            libraryId: item.id,      
             onGoBack: fetchLibrary,
           })
        }
      >
        <View style={styles.coverSection}>
          {item.book_cover ? (
            <Image
              source={{ uri: `${API_URL}${item.book_cover}` }}
              style={styles.bookCover}
            />
          ) : (
            <View style={styles.placeholderCover}>
              <MaterialIcons name="book" size={32} color="#fff" />
            </View>
          )}
        </View>

        <View style={styles.bookInfoSection}>
          <Text style={styles.bookTitle} numberOfLines={2}>
            {item.book_title}
          </Text>
          <Text style={styles.bookAuthor} numberOfLines={1}>
            {item.book_author}
          </Text>

          {item.status === READING_STATUS.READING && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${progress}%` }]}
                />
              </View>
              <Text style={styles.progressText}>{progress}% complete</Text>
            </View>
          )}

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.smallButton}
              onPress={() => openStatusModal(item)}
            >
              <MaterialIcons name="edit" size={16} color="#6200ee" />
              <Text style={styles.smallButtonText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.smallButton, styles.deleteButton]}
              onPress={() => removeFromLibrary(item.id)}
            >
              <MaterialIcons name="delete" size={16} color="#f44336" />
              <Text style={[styles.smallButtonText, { color: "#f44336" }]}>
                Remove
              </Text>
            </TouchableOpacity>

            {item.status === READING_STATUS.READING && (
              <TouchableOpacity
                style={[styles.smallButton, styles.readButton]}
                onPress={() =>
                  navigation.navigate("Reading", {
                    bookId: item.bookId,
                    libraryId: item.id,
                    onGoBack: fetchLibrary,
                  })
                }
              >
                <MaterialIcons name="menu-book" size={16} color="#fff" />
                <Text style={[styles.smallButtonText, { color: "#fff" }]}>
                  Read
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderStatusModal = () => {
    if (!selectedBook) return null;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Reading Status</Text>
            <Text style={styles.modalBookTitle}>{selectedBook.book_title}</Text>

            <View style={styles.statusOptions}>
              {Object.values(READING_STATUS).map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusOption,
                    selectedBook.status === status && styles.selectedStatus,
                  ]}
                  onPress={() => updateReadingStatus(selectedBook.id, status)}
                >
                  <Text style={styles.statusText}>
                    {status === READING_STATUS.SAVED
                      ? "Save for Later"
                      : status === READING_STATUS.READING
                      ? "Currently Reading"
                      : "Finished Reading"}
                  </Text>
                  {selectedBook.status === status && (
                    <MaterialIcons name="check" size={18} color="#6200ee" />
                  )}
                </TouchableOpacity>
              ))}

              {selectedBook.status === READING_STATUS.READING && (
                <View style={styles.progressInputContainer}>
                  <Text style={styles.progressLabel}>Reading Progress:</Text>
                  <View style={styles.progressControls}>
                    <TouchableOpacity
                      style={styles.progressButton}
                      onPress={() => {
                        const newProgress = Math.max(
                          0,
                          (selectedBook.progress || 0) - 10
                        );
                        updateReadingProgress(selectedBook.id, newProgress, 1);
                      }}
                    >
                      <Text style={styles.progressButtonText}>-10%</Text>
                    </TouchableOpacity>

                    <Text style={styles.progressValue}>
                      {selectedBook.progress || 0}%
                    </Text>

                    <TouchableOpacity
                      style={styles.progressButton}
                      onPress={() => {
                        const newProgress = Math.min(
                          100,
                          (selectedBook.progress || 0) + 10
                        );
                        updateReadingProgress(selectedBook.id, newProgress, 1);
                      }}
                    >
                      <Text style={styles.progressButtonText}>+10%</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderSortOptionsModal = () => (
    <Modal
      visible={showSortOptions}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowSortOptions(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sort Books</Text>
            <TouchableOpacity onPress={() => setShowSortOptions(false)}>
              <MaterialIcons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.sortOptionSection}>
            <Text style={styles.sortOptionTitle}>Sort By</Text>
            {["title", "author", "recent"].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.sortOption,
                  sortBy === option && styles.selectedSortOption,
                ]}
                onPress={() => setSortBy(option)}
              >
                <Text
                  style={sortBy === option ? styles.selectedOptionText : {}}
                >
                  {option === "title"
                    ? "Title"
                    : option === "author"
                    ? "Author"
                    : "Recently Read"}
                </Text>
                {sortBy === option && (
                  <MaterialIcons name="check" size={18} color="#6200ee" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sortOptionSection}>
            <Text style={styles.sortOptionTitle}>Order</Text>
            {["asc", "desc"].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.sortOption,
                  sortOrder === option && styles.selectedSortOption,
                ]}
                onPress={() => setSortOrder(option)}
              >
                <Text
                  style={sortOrder === option ? styles.selectedOptionText : {}}
                >
                  {option === "asc" ? "Ascending" : "Descending"}
                </Text>
                {sortOrder === option && (
                  <MaterialIcons name="check" size={18} color="#6200ee" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => setShowSortOptions(false)}
          >
            <Text style={styles.applyButtonText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text>Loading library…</Text>
      </View>
    );
  }

  const filteredItems = getFilteredAndSortedBooks();

  return (
    <View style={styles.container}>
      {renderStatusTabs()}

      <View style={styles.toolbarContainer}>
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={() => setShowSortOptions(true)}
        >
          <MaterialIcons name="sort" size={24} color="#6200ee" />
          <Text style={styles.toolbarButtonText}>Sort</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={() => fetchLibrary()}
        >
          <MaterialIcons name="refresh" size={24} color="#6200ee" />
          <Text style={styles.toolbarButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="library-books" size={64} color="#e0e0e0" />
          <Text style={styles.emptyText}>Your library is empty</Text>
          <Text style={styles.emptySubtext}>
            Books you save will appear here
          </Text>
        </View>
      ) : filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No books in this category</Text>
          <Text style={styles.emptySubtext}>
            Try another category or add more books
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(i) => String(i.id)}
          renderItem={renderBookItem}
          contentContainerStyle={styles.listContainer}
          onRefresh={() => fetchLibrary()}
          refreshing={refreshing}
        />
      )}

      {renderStatusModal()}
      {renderSortOptionsModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#6200ee",
  },
  tabText: {
    fontSize: 14,
    color: "#757575",
  },
  activeTabText: {
    color: "#6200ee",
    fontWeight: "bold",
  },
  toolbarContainer: {
    flexDirection: "row",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#f9f9f9",
  },
  toolbarButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 4,
    backgroundColor: "#f0f0f0",
  },
  toolbarButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#6200ee",
  },
  listContainer: {
    padding: 8,
  },
  bookCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  coverSection: {
    marginRight: 12,
  },
  bookCover: {
    width: 80,
    height: 120,
    borderRadius: 6,
  },
  placeholderCover: {
    width: 80,
    height: 120,
    borderRadius: 6,
    backgroundColor: "#9e9e9e",
    justifyContent: "center",
    alignItems: "center",
  },
  bookInfoSection: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 13,
    color: "#757575",
    marginBottom: 8,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#e0e0e0",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#6200ee",
  },
  progressText: {
    fontSize: 11,
    color: "#757575",
    marginTop: 4,
  },
  actionButtonsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  smallButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  deleteButton: {
    backgroundColor: "#ffebee",
  },
  readButton: {
    backgroundColor: "#6200ee",
  },
  smallButtonText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "#6200ee",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#757575",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9e9e9e",
    marginTop: 8,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  modalBookTitle: {
    fontSize: 16,
    color: "#757575",
    marginBottom: 16,
  },
  statusOptions: {
    marginBottom: 16,
  },
  statusOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginBottom: 8,
    backgroundColor: "#f5f5f5",
  },
  selectedStatus: {
    backgroundColor: "#ede7f6",
  },
  statusText: {
    fontSize: 14,
  },
  progressInputContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
  progressControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressButton: {
    backgroundColor: "#6200ee",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  progressButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  progressValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  closeButton: {
    backgroundColor: "#f5f5f5",
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#6200ee",
  },
  sortOptionSection: {
    marginBottom: 16,
  },
  sortOptionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#424242",
  },
  sortOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  selectedSortOption: {
    backgroundColor: "#f3e5f5",
  },
  selectedOptionText: {
    color: "#6200ee",
    fontWeight: "500",
  },
  applyButton: {
    backgroundColor: "#6200ee",
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: "center",
    marginTop: 8,
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
