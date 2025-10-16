import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  StyleSheet, 
  Alert,
  TouchableOpacity,
  Modal,
  Pressable
} from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import { LibraryAPI } from "../api/library";

const READING_STATUS = {
  SAVED: "saved",
  READING: "reading",
  FINISHED: "finished"
};

export default function LibraryScreen() {
  const [items, setItems] = useState(null);
  const [activeTab, setActiveTab] = useState(READING_STATUS.SAVED);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  // New state variables for enhanced library management
  const [sortBy, setSortBy] = useState('title'); // title, author, recent
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [batchMode, setBatchMode] = useState(false);
  const [showBatchOptions, setShowBatchOptions] = useState(false);

  useEffect(() => {
    fetchLibrary();
  }, []);
  
  // Get filtered and sorted books based on current selections
  const getFilteredAndSortedBooks = () => {
    if (!items) return [];
    
    // Filter by status
    const filteredBooks = items.filter(item => item.status === activeTab);
    
    // Sort books
    return filteredBooks.sort((a, b) => {
      if (sortBy === 'title') {
        const titleA = a.book.title.toLowerCase();
        const titleB = b.book.title.toLowerCase();
        return sortOrder === 'asc' 
          ? titleA.localeCompare(titleB) 
          : titleB.localeCompare(titleA);
      } else if (sortBy === 'author') {
        const authorA = a.book.author.toLowerCase();
        const authorB = b.book.author.toLowerCase();
        return sortOrder === 'asc' 
          ? authorA.localeCompare(authorB) 
          : authorB.localeCompare(authorA);
      } else if (sortBy === 'recent') {
        const dateA = new Date(a.lastReadAt || a.addedAt).getTime();
        const dateB = new Date(b.lastReadAt || b.addedAt).getTime();
        return sortOrder === 'asc' 
          ? dateA - dateB 
          : dateB - dateA;
      }
      return 0;
    });
  };

  const fetchLibrary = async () => {
    try {
      const data = await LibraryAPI.list();
      setItems(data);
    } catch (e) {
      Alert.alert("Auth required", "Login first (Writer tab → Dev Login)");
      setItems([]);
    }
  };

  const updateReadingStatus = async (bookId, newStatus) => {
    setUpdatingStatus(true);
    try {
      await LibraryAPI.updateStatus(bookId, newStatus);
      // Update local state
      setItems(prevItems => 
        prevItems.map(item => 
          item.id === bookId ? { ...item, status: newStatus } : item
        )
      );
      if (modalVisible) setModalVisible(false);
    } catch (error) {
      Alert.alert("Error", "Failed to update reading status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const updateReadingProgress = async (bookId, progress) => {
    try {
      await LibraryAPI.updateProgress(bookId, progress);
      // Update local state
      setItems(prevItems => 
        prevItems.map(item => 
          item.id === bookId ? { ...item, progress } : item
        )
      );
    } catch (error) {
      Alert.alert("Error", "Failed to update reading progress");
    }
  };

  const openStatusModal = (book) => {
    setSelectedBook(book);
    setModalVisible(true);
  };

  // Toggle batch mode
  const toggleBatchMode = () => {
    setBatchMode(!batchMode);
    if (batchMode) {
      // Clear selections when exiting batch mode
      setSelectedBooks([]);
    }
  };

  // Toggle book selection in batch mode
  const toggleBookSelection = (bookId) => {
    if (selectedBooks.includes(bookId)) {
      setSelectedBooks(selectedBooks.filter(id => id !== bookId));
    } else {
      setSelectedBooks([...selectedBooks, bookId]);
    }
  };

  // Perform batch operation on selected books
  const performBatchOperation = async (operation) => {
    if (selectedBooks.length === 0) {
      Alert.alert("No Books Selected", "Please select books to perform this operation");
      return;
    }

    setUpdatingStatus(true);
    try {
      // Different operations based on the selected action
      if (operation === 'status') {
        // Update status for all selected books
        const newStatus = activeTab === READING_STATUS.SAVED ? READING_STATUS.READING : 
                         activeTab === READING_STATUS.READING ? READING_STATUS.FINISHED : 
                         READING_STATUS.SAVED;
        
        // In a real app, we would use a batch API endpoint
        // await LibraryAPI.batchUpdateStatus(selectedBooks, newStatus);
        
        // Update local state
        setItems(prevItems => 
          prevItems.map(item => 
            selectedBooks.includes(item.id) ? { ...item, status: newStatus } : item
          )
        );
        
        Alert.alert("Success", `Updated ${selectedBooks.length} books to ${newStatus}`);
      } 
      else if (operation === 'remove') {
        // Remove selected books from library
        // In a real app, we would use a batch API endpoint
        // await LibraryAPI.batchRemove(selectedBooks);
        
        // Update local state
        setItems(prevItems => prevItems.filter(item => !selectedBooks.includes(item.id)));
        
        Alert.alert("Success", `Removed ${selectedBooks.length} books from your library`);
      }
      
      // Exit batch mode and clear selections
      setBatchMode(false);
      setSelectedBooks([]);
      setShowBatchOptions(false);
    } catch (error) {
      Alert.alert("Error", "Failed to perform batch operation");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const renderStatusTabs = () => (
    <View style={styles.tabsContainer}>
      {Object.values(READING_STATUS).map(status => (
        <TouchableOpacity 
          key={status}
          style={[styles.tab, activeTab === status && styles.activeTab]}
          onPress={() => setActiveTab(status)}
        >
          <Text style={[styles.tabText, activeTab === status && styles.activeTabText]}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderBookItem = ({ item }) => {
    const progress = item.progress || 0;
    const isSelected = selectedBooks.includes(item.id);
    
    return (
      <TouchableOpacity 
        style={[styles.bookCard, isSelected && styles.bookItemSelected]}
        onPress={() => batchMode ? toggleBookSelection(item.id) : openStatusModal(item)}
        onLongPress={() => {
          if (!batchMode) {
            setBatchMode(true);
            toggleBookSelection(item.id);
          }
        }}
      >
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle}>{item.book_title || item.book?.title}</Text>
          {item.status === READING_STATUS.READING && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>{progress}% complete</Text>
            </View>
          )}
        </View>
        
        {batchMode && (
          <View style={styles.selectionIndicator}>
            <MaterialIcons 
              name={isSelected ? "check" : "add"} 
              size={16} 
              color="#fff" 
            />
          </View>
        )}
        
        {!batchMode && (
          <TouchableOpacity 
            style={styles.statusButton}
            onPress={() => openStatusModal(item)}
          >
            <MaterialIcons name="more-vert" size={24} color="#757575" />
          </TouchableOpacity>
        )}
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
            <Text style={styles.modalBookTitle}>{selectedBook.book_title || selectedBook.book?.title}</Text>
            
            {updatingStatus ? (
              <ActivityIndicator size="small" color="#6200ee" />
            ) : (
              <View style={styles.statusOptions}>
                {Object.values(READING_STATUS).map(status => (
                  <TouchableOpacity 
                    key={status}
                    style={[styles.statusOption, selectedBook.status === status && styles.selectedStatus]}
                    onPress={() => updateReadingStatus(selectedBook.id, status)}
                  >
                    <Text style={styles.statusText}>
                      {status === READING_STATUS.SAVED ? 'Save for Later' : 
                       status === READING_STATUS.READING ? 'Currently Reading' : 
                       'Finished Reading'}
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
                          const newProgress = Math.max(0, (selectedBook.progress || 0) - 10);
                          updateReadingProgress(selectedBook.id, newProgress);
                        }}
                      >
                        <Text style={styles.progressButtonText}>-10%</Text>
                      </TouchableOpacity>
                      
                      <Text style={styles.progressValue}>{selectedBook.progress || 0}%</Text>
                      
                      <TouchableOpacity 
                        style={styles.progressButton}
                        onPress={() => {
                          const newProgress = Math.min(100, (selectedBook.progress || 0) + 10);
                          updateReadingProgress(selectedBook.id, newProgress);
                        }}
                      >
                        <Text style={styles.progressButtonText}>+10%</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}
            
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

  // Render sort options modal
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
            <TouchableOpacity 
              style={[styles.sortOption, sortBy === 'title' && styles.selectedSortOption]}
              onPress={() => setSortBy('title')}
            >
              <Text style={sortBy === 'title' ? styles.selectedOptionText : {}}>Title</Text>
              {sortBy === 'title' && <MaterialIcons name="check" size={18} color="#6200ee" />}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.sortOption, sortBy === 'author' && styles.selectedSortOption]}
              onPress={() => setSortBy('author')}
            >
              <Text style={sortBy === 'author' ? styles.selectedOptionText : {}}>Author</Text>
              {sortBy === 'author' && <MaterialIcons name="check" size={18} color="#6200ee" />}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.sortOption, sortBy === 'recent' && styles.selectedSortOption]}
              onPress={() => setSortBy('recent')}
            >
              <Text style={sortBy === 'recent' ? styles.selectedOptionText : {}}>Recently Read</Text>
              {sortBy === 'recent' && <MaterialIcons name="check" size={18} color="#6200ee" />}
            </TouchableOpacity>
          </View>
          
          <View style={styles.sortOptionSection}>
            <Text style={styles.sortOptionTitle}>Order</Text>
            <TouchableOpacity 
              style={[styles.sortOption, sortOrder === 'asc' && styles.selectedSortOption]}
              onPress={() => setSortOrder('asc')} 
            >
              <Text style={sortOrder === 'asc' ? styles.selectedOptionText : {}}>Ascending</Text>
              {sortOrder === 'asc' && <MaterialIcons name="check" size={18} color="#6200ee" />}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.sortOption, sortOrder === 'desc' && styles.selectedSortOption]}
              onPress={() => setSortOrder('desc')}
            >
              <Text style={sortOrder === 'desc' ? styles.selectedOptionText : {}}>Descending</Text>
              {sortOrder === 'desc' && <MaterialIcons name="check" size={18} color="#6200ee" />}
            </TouchableOpacity>
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
  
  // Render batch operations modal
  const renderBatchOptionsModal = () => (
    <Modal
      visible={showBatchOptions}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowBatchOptions(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Batch Operations</Text>
            <TouchableOpacity onPress={() => setShowBatchOptions(false)}>
              <MaterialIcons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.batchInfoText}>
            {selectedBooks.length} book{selectedBooks.length !== 1 ? 's' : ''} selected
          </Text>
          
          <TouchableOpacity 
            style={styles.batchOption}
            onPress={() => performBatchOperation('status')}
            disabled={selectedBooks.length === 0}
          >
            <MaterialIcons name="swap-horiz" size={24} color="#6200ee" />
            <Text style={styles.batchOptionText}>
              Move to {activeTab === READING_STATUS.SAVED ? 'Reading' : 
                      activeTab === READING_STATUS.READING ? 'Finished' : 'Saved'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.batchOption}
            onPress={() => performBatchOperation('remove')}
            disabled={selectedBooks.length === 0}
          >
            <MaterialIcons name="delete" size={24} color="#f44336" />
            <Text style={[styles.batchOptionText, {color: '#f44336'}]}>Remove from Library</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (items === null) {
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
          style={[styles.toolbarButton, batchMode && styles.activeToolbarButton]}
          onPress={toggleBatchMode}
        >
          <MaterialIcons 
            name={batchMode ? "close" : "select-all"} 
            size={24} 
            color={batchMode ? "#f44336" : "#6200ee"} 
          />
          <Text 
            style={[
              styles.toolbarButtonText, 
              batchMode && {color: "#f44336"}
            ]}
          >
            {batchMode ? "Cancel" : "Select"}
          </Text>
        </TouchableOpacity>
        
        {batchMode && (
          <TouchableOpacity 
            style={styles.toolbarButton}
            onPress={() => setShowBatchOptions(true)}
            disabled={selectedBooks.length === 0}
          >
            <MaterialIcons 
              name="more-vert" 
              size={24} 
              color={selectedBooks.length === 0 ? "#bdbdbd" : "#6200ee"} 
            />
            <Text 
              style={[
                styles.toolbarButtonText, 
                selectedBooks.length === 0 && {color: "#bdbdbd"}
              ]}
            >
              Actions
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="library-books" size={64} color="#e0e0e0" />
          <Text style={styles.emptyText}>Your library is empty</Text>
          <Text style={styles.emptySubtext}>Books you save will appear here</Text>
        </View>
      ) : filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No books in this category</Text>
          <Text style={styles.emptySubtext}>Try another category or add more books</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(i) => String(i.id)}
          renderItem={renderBookItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
      
      {renderStatusModal()}
      {renderSortOptionsModal()}
      {renderBatchOptionsModal()}
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
  // Toolbar styles
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
  activeToolbarButton: {
    backgroundColor: "#ffebee",
  },
  toolbarButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#6200ee",
  },
  // Sort modal styles
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
  // Batch operation styles
  batchInfoText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
    color: "#424242",
  },
  batchOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  batchOptionText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#424242",
  },
  // Book item with selection
  bookItemSelected: {
    backgroundColor: "#e8f5e9",
    borderWidth: 2,
    borderColor: "#6200ee",
  },
  selectionIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#6200ee",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  listContainer: {
    padding: 16,
  },
  bookCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  progressContainer: {
    marginTop: 8,
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
    fontSize: 12,
    color: "#757575",
    marginTop: 4,
  },
  statusButton: {
    justifyContent: "center",
    padding: 8,
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
  center: { 
    flex: 1, 
    alignItems: "center", 
    justifyContent: "center" 
  },
});
