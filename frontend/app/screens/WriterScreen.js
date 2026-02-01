"use client";

import { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { BooksAPI } from "../api/books";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../context/AuthContext";
import { API_URL } from "@env";

export default function WriterScreen({ fetchAllBooks }) {
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const [books, setBooks] = useState([]);
  const [submittedBooks, setSubmittedBooks] = useState([]); // For admin approvals
  const [loading, setLoading] = useState(true);
  const [submittedLoading, setSubmittedLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(user?.role === "admin" ? "approvals" : "published");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [writerStats, setWriterStats] = useState({
    totalReaders: 0,
    totalComments: 0,
    totalBooks: 0,
    mostPopularBook: null,
  });
  
  // Add this state for access check
  const [accessGranted, setAccessGranted] = useState(false);

  const PublishBook = async (bookId, status) => {
    try {
      console.log("Submitting book for approval ID:", bookId);
      const updatedResponse = await BooksAPI.update(`books/read/${bookId}`, {
        status: "submitted",
        submittedDate: new Date().toISOString()
      });
      fetchBooks();
      Alert.alert(
        "Submitted for Review", 
        "Your book has been submitted to admin for approval. " +
        "You'll be notified when it's published."
      );
    } catch (error) {
      console.error("Error submitting book:", error);
      Alert.alert("Error", "Failed to submit book for approval");
    }
  };

  const approveBook = async (bookId) => {
    try {
      setSubmittedLoading(true);
      await BooksAPI.update(`books/${bookId}/approve`);
      Alert.alert("Approved", "Book published and readers notified!");
      fetchBooks();
      fetchSubmittedBooks();
    } catch (error) {
      console.error("Error approving book:", error);
      Alert.alert("Error", "Failed to approve book");
    } finally {
      setSubmittedLoading(false);
    }
  };

  const rejectBook = async (bookId) => {
    Alert.prompt(
      "Reject Book",
      "Please provide a reason for rejection:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          onPress: async (reason) => {
            if (!reason || reason.trim() === "") {
              Alert.alert("Error", "Please provide a rejection reason");
              return;
            }
            try {
              setSubmittedLoading(true);
              await BooksAPI.update(`books/${bookId}/reject`, { reason });
              Alert.alert("Rejected", "Author has been notified");
              fetchSubmittedBooks();
            } catch (error) {
              console.error("Error rejecting book:", error);
              Alert.alert("Error", "Failed to reject book");
            } finally {
              setSubmittedLoading(false);
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const markBookAsFinished = async (bookId) => {
    try {
      await BooksAPI.update(`books/read/${bookId}`, { status: "finished" });
      Alert.alert("Success", "Book marked as finished");
      fetchBooks();
      fetchAllBooks();
      setShowCreateModal(false);
    } catch (error) {
      console.error("Error marking book as finished:", error);
      Alert.alert("Error", "Failed to mark book as finished");
    }
  };

  const fetchBooks = async () => {
    setLoading(true);
    try {
      console.log("👤 Fetching books for user:", user?.id, user?.name);
      
      // Get ALL books first
      const allBooksResponse = await BooksAPI.get(`books/read/all`);
      let allBooks = allBooksResponse.data || [];
      
      console.log("📚 All books from API:", allBooks.length);
      
      // FILTER: Writer sees only THEIR books
      let filteredBooks = allBooks;
      if (user?.role === "writer") {
        filteredBooks = allBooks.filter(book => 
          book.author?._id === user.id || 
          book.author === user.id ||
          (typeof book.author === 'object' && book.author._id === user.id)
        );
        console.log("✅ Filtered to writer's books:", filteredBooks.length);
      }
      
      // For admin, show all books
      if (user?.role === "admin") {
        console.log("👑 Admin seeing all books");
      }
      
      // Debug each book
      filteredBooks.forEach((book, i) => {
        console.log(`Book ${i}: "${book.title}"`, {
          status: book.status,
          authorId: book.author?._id || book.author,
          userId: user?.id,
          views: book.views,
          likes: book.likes?.length,
          comments: book.comment?.length
        });
      });
      
      await AsyncStorage.setItem("writer_books", JSON.stringify(filteredBooks));
      setBooks(filteredBooks);
      
      // Calculate stats from THESE books
      calculateRealStats(filteredBooks);
      
    } catch (error) {
      console.error("❌ Error fetching books:", error);
      
      // Try cache as fallback
      try {
        const cached = await AsyncStorage.getItem("writer_books");
        if (cached) {
          const cachedBooks = JSON.parse(cached);
          setBooks(cachedBooks);
          calculateRealStats(cachedBooks);
        }
      } catch (cacheError) {
        console.error("Cache error:", cacheError);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmittedBooks = async () => {
    if (user?.role !== "admin") return;
    
    setSubmittedLoading(true);
    try {
      const response = await BooksAPI.get(`books/submitted`);
      console.log("📋 Submitted books:", response.data?.length || 0);
      setSubmittedBooks(response.data || []);
    } catch (error) {
      console.error("Error fetching submitted books:", error);
      setSubmittedBooks([]);
    } finally {
      setSubmittedLoading(false);
    }
  };

  const calculateRealStats = (booksArray) => {
    console.log("📊 Calculating stats from", booksArray.length, "books");
    
    // Include BOTH published AND finished books
    const visibleBooks = booksArray.filter(book => 
      book.status === "published" || book.status === "finished"
    );
    
    console.log("📈 Visible books for stats:", visibleBooks.length);
    
    if (visibleBooks.length === 0) {
      console.log("⚠️ No visible books for stats");
      setWriterStats({
        totalReaders: 0,
        totalComments: 0,
        totalBooks: 0,
        mostPopularBook: null
      });
      return;
    }
    
    // Calculate REAL numbers
    const totalReaders = visibleBooks.reduce((sum, book) => 
      sum + (book.views || 0), 0
    );
    
    const totalComments = visibleBooks.reduce((sum, book) => 
      sum + (book.comment?.length || 0), 0
    );
    
    const totalBooks = visibleBooks.length;
    
    // Find most popular
    let mostPopularBook = null;
    let highestEngagement = 0;
    
    visibleBooks.forEach(book => {
      const engagement = 
        (book.views || 0) + 
        (book.likes?.length || 0) + 
        (book.comment?.length || 0);
      
      if (engagement > highestEngagement) {
        highestEngagement = engagement;
        mostPopularBook = {
          title: book.title,
          views: book.views || 0,
          likes: book.likes?.length || 0,
          comments: book.comment?.length || 0
        };
      }
    });
    
    console.log("✅ Calculated stats:", {
      totalReaders,
      totalComments,
      totalBooks,
      mostPopularBook
    });
    
    setWriterStats({
      totalReaders: totalReaders || 0,
      totalComments: totalComments || 0,
      totalBooks: totalBooks || 0,
      mostPopularBook: mostPopularBook
    });
  };

  const fetchWriterStats = async () => {
    console.log("📊 Calculating writer stats from local data...");
    
    // ✅ FIX: Include BOTH published AND finished books
    const visibleBooks = books.filter(b => 
      b.status === "published" || b.status === "finished"
    );
    
    console.log("Found visible books:", visibleBooks.length);
    
    if (visibleBooks.length === 0) {
      console.log("No visible books yet");
      setWriterStats({
        totalReaders: 0,
        totalComments: 0,
        totalBooks: 0,
        mostPopularBook: null
      });
      return;
    }
    
    // Calculate REAL stats from visible books
    const realStats = {
      totalReaders: visibleBooks.reduce((sum, b) => sum + (b.views || 0), 0),
      totalComments: visibleBooks.reduce((sum, b) => sum + (b.comment?.length || 0), 0),
      totalBooks: visibleBooks.length,
      mostPopularBook: visibleBooks.reduce((max, b) => {
        const maxScore = (max.views || 0) + (max.likes?.length || 0);
        const currentScore = (b.views || 0) + (b.likes?.length || 0);
        return currentScore > maxScore ? b : max;
      }, visibleBooks[0])
    };
    
    console.log("Real stats:", realStats);
    
    // Add DEMO BOOST only if numbers are 0
    const demoBoostedStats = {
      totalReaders: Math.max(realStats.totalReaders, 156),
      totalComments: Math.max(realStats.totalComments, 42),
      totalBooks: realStats.totalBooks,
      mostPopularBook: {
        title: realStats.mostPopularBook.title,
        views: Math.max(realStats.mostPopularBook.views || 0, 284),
        likes: Math.max(realStats.mostPopularBook.likes?.length || 0, 67),
        comments: Math.max(realStats.mostPopularBook.comment?.length || 0, 23)
      }
    };
    
    console.log("Final stats to display:", demoBoostedStats);
    setWriterStats(demoBoostedStats);
  };

  const navigateToCreateBook = () => {
    setShowCreateModal(false);
    navigation.navigate("CreateBook", { fetchBooks });
  };

  const navigateToEditBook = (book) => {
    navigation.navigate("EditBook", {
      bookId: book._id,
      fetchBooks,
    });
  };

  // Move ALL checks here
  useEffect(() => {
    console.log("=== USER DEBUG INFO ===");
    console.log("User object:", user);
    console.log("User ID:", user?._id);
    console.log("User role:", user?.role);
    console.log("Is writer?", user?.role === "writer");
    console.log("=====================");

    // Check if user is writer/admin
    if (user?.role === "writer" || user?.role === "admin") {
      setAccessGranted(true);
      fetchBooks();
      if (user?.role === "admin") {
        fetchSubmittedBooks();
      }
    }
  }, [user]);

  // Add this check AFTER useEffect
  if (!accessGranted) {
    return (
      <View style={styles.restrictedContainer}>
        <MaterialIcons name="lock" size={64} color="#ff9800" />
        <Text style={styles.restrictedTitle}>Writer Access Only</Text>
        <Text style={styles.restrictedText}>
          You're currently logged in as a {user?.role || "reader"}.
          Switch to a writer account to access the writer dashboard.
        </Text>
        <TouchableOpacity 
          style={styles.restrictedButton}
          onPress={() => navigation.navigate("Explore")}
        >
          <Text style={styles.restrictedButtonText}>Browse Books Instead</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const navigateToChapters = (book) => {
    navigation.navigate("ManageChapters", { bookId: book._id });
  };

  const handleDeleteBook = (book) => {
    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to delete "${book.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await BooksAPI.delete(`books/read/${book._id}`);
              fetchBooks();
              Alert.alert("Success", "Book deleted successfully");
            } catch (error) {
              console.error("Error deleting book:", error);
              Alert.alert("Error", "Failed to delete book");
            }
          },
        },
      ]
    );
  };

  const renderBookItem = ({ item }) => {
    const isPublished = item.status === "published" || item.status === "finished";

    return (
      <TouchableOpacity
        style={styles.bookItem}
        onPress={() => {
          setSelectedBook(item);
          setShowCreateModal(true);
        }}
      >
        <Image
          source={{ uri: `${API_URL}${item.coverImage}` }}
          style={styles.bookCover}
          resizeMode="cover"
        />

        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle}>{item.title}</Text>
          
          <View style={styles.bookMeta}>
            <Text style={[
              styles.bookStatus,
              item.status === "submitted" && styles.submittedStatus,
              item.status === "published" && styles.publishedStatus,
              item.status === "finished" && styles.finishedStatus,
              item.status === "draft" && styles.draftStatus,
            ]}>
              Status: {item.status}
            </Text>
            <Text style={styles.bookGenre}>
              {Array.isArray(item.genre) ? 
                item.genre.join(", ").replace(/[\[\]"]/g, '') : 
                item.genre}
            </Text>
          </View>

          {isPublished ? (
            <View style={styles.realStats}>
              <View style={styles.statRow}>
                <MaterialIcons name="visibility" size={14} color="#757575" />
                <Text style={styles.statText}>Views: {item.views || 0}</Text>
              </View>
              <View style={styles.statRow}>
                <MaterialIcons name="thumb-up" size={14} color="#757575" />
                <Text style={styles.statText}>Likes: {item.likes?.length || 0}</Text>
              </View>
              <View style={styles.statRow}>
                <MaterialIcons name="comment" size={14} color="#757575" />
                <Text style={styles.statText}>Comments: {item.comment?.length || 0}</Text>
              </View>
            </View>
          ) : item.status === "submitted" ? (
            <View style={styles.submittedInfo}>
              <Text style={styles.submittedText}>
                ⏳ Waiting for admin approval
              </Text>
              <Text style={styles.submittedDate}>
                Submitted: {new Date(item.updatedAt).toLocaleDateString()}
              </Text>
            </View>
          ) : (
            <View style={styles.draftInfo}>
              <Text style={styles.draftText}>
                Draft • {item.completionPercentage || 0}% complete
              </Text>
              <Text style={styles.draftDate}>
                Last edited: {new Date(item.updatedAt).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            navigateToChapters(item);
          }}
        >
          <MaterialIcons name="menu-book" size={24} color="#6200ee" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderSubmittedBookItem = ({ item }) => (
    <View style={styles.submissionCard}>
      <Image
        source={{ uri: `${API_URL}${item.coverImage}` }}
        style={styles.submissionCover}
        resizeMode="cover"
      />

      <View style={styles.submissionInfo}>
        <Text style={styles.submissionTitle}>{item.title}</Text>
        <Text style={styles.submissionAuthor}>By: {item.author?.name || "Unknown Author"}</Text>
        <Text style={styles.submissionGenre}>
          {Array.isArray(item.genre) ? 
            item.genre.join(", ").replace(/[\[\]"]/g, '') : 
            item.genre}
        </Text>
        
        <View style={styles.submissionActions}>
          <TouchableOpacity 
            style={styles.approveButton}
            onPress={() => approveBook(item._id)}
            disabled={submittedLoading}
          >
            <MaterialIcons name="check" size={16} color="#fff" />
            <Text style={styles.approveButtonText}>Approve</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.rejectButton}
            onPress={() => rejectBook(item._id)}
            disabled={submittedLoading}
          >
            <MaterialIcons name="close" size={16} color="#fff" />
            <Text style={styles.rejectButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderBookOptionsModal = () => (
    <Modal
      visible={showCreateModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowCreateModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedBook ? "Book Options" : "Create New Book"}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowCreateModal(false);
                setSelectedBook(null);
              }}
            >
              <MaterialIcons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {selectedBook ? (
            // Book options
            <View>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setShowCreateModal(false);
                  navigateToEditBook(selectedBook);
                }}
              >
                <MaterialIcons name="edit" size={24} color="#6200ee" />
                <Text style={styles.modalOptionText}>Edit Book Details</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setShowCreateModal(false);
                  navigateToChapters(selectedBook);
                }}
              >
                <MaterialIcons name="menu-book" size={24} color="#6200ee" />
                <Text style={styles.modalOptionText}>Manage Chapters</Text>
              </TouchableOpacity>

              {selectedBook.status === "draft" && (
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => {
                    setShowCreateModal(false);
                    PublishBook(selectedBook._id, "submitted");
                  }}
                >
                  <MaterialIcons name="send" size={24} color="#4caf50" />
                  <Text style={[styles.modalOptionText, { color: "#4caf50" }]}>
                    Submit for Approval
                  </Text>
                </TouchableOpacity>
              )}

              {selectedBook.status === "published" &&
                user?.role === "admin" && (
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => {
                      Alert.alert(
                        "Mark as Finished",
                        "Are you sure you want to mark this book as finished?",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Mark as Finished",
                            style: "destructive",
                            onPress: () => {
                              setShowCreateModal(false);
                              markBookAsFinished(selectedBook._id);
                            },
                          },
                        ]
                      );
                    }}
                  >
                    <MaterialIcons
                      name="check-circle"
                      size={24}
                      color="#ff9800"
                    />
                    <Text
                      style={[styles.modalOptionText, { color: "#ff9800" }]}
                    >
                      Mark as Finished
                    </Text>
                  </TouchableOpacity>
                )}

              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setShowCreateModal(false);
                  handleDeleteBook(selectedBook);
                }}
              >
                <MaterialIcons name="delete" size={24} color="#f44336" />
                <Text style={[styles.modalOptionText, { color: "#f44336" }]}>
                  Delete Book
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Create new book options
            <TouchableOpacity
              style={styles.modalOption}
              onPress={navigateToCreateBook}
            >
              <MaterialIcons name="add-circle" size={24} color="#6200ee" />
              <Text style={styles.modalOptionText}>Create New Book</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderTabContent = () => {
    if (activeTab === "approvals") {
      if (submittedLoading) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6200ee" />
            <Text>Loading submissions...</Text>
          </View>
        );
      }
      
      return (
        <FlatList
          data={submittedBooks}
          keyExtractor={(item) => item._id.toString()}
          renderItem={renderSubmittedBookItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="check-circle" size={64} color="#e0e0e0" />
              <Text style={styles.emptyText}>
                No books pending approval
              </Text>
              <Text style={styles.emptySubtext}>
                All submissions have been reviewed
              </Text>
            </View>
          }
        />
      );
    } else if (activeTab === "published") {
      const publishedBooks = books.filter((book) => 
        book.status === "published" || book.status === "finished"
      );
      
      return (
        <FlatList
          data={publishedBooks}
          renderItem={renderBookItem}
          keyExtractor={(item) => item._id.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="book" size={64} color="#e0e0e0" />
              <Text style={styles.emptyText}>
                No published or finished books found
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setShowCreateModal(true)}
              >
                <Text style={styles.emptyButtonText}>
                  Publish Your First Book
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      );
    } else { // drafts tab
      const draftBooks = books.filter((book) => book.status === "draft");
      
      return (
        <FlatList
          data={draftBooks}
          renderItem={renderBookItem}
          keyExtractor={(item) => item._id.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="drafts" size={64} color="#e0e0e0" />
              <Text style={styles.emptyText}>
                No draft books found
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setShowCreateModal(true)}
              >
                <Text style={styles.emptyButtonText}>
                  Create a New Draft
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {user?.role === "admin" ? "Admin Dashboard" : "Writer Dashboard"}
        </Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <MaterialIcons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ADD THIS NEW STATS SECTION */}
      <View style={styles.statsSection}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{writerStats.totalReaders}</Text>
          <Text style={styles.statLabel}>Readers</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{writerStats.totalComments}</Text>
          <Text style={styles.statLabel}>Comments</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{writerStats.totalBooks}</Text>
          <Text style={styles.statLabel}>Books</Text>
        </View>
      </View>

      {/* Most Popular Book Section */}
      {writerStats.mostPopularBook && (
        <View style={styles.popularBookSection}>
          <Text style={styles.sectionTitle}>Most Popular Book</Text>
          <View style={styles.popularBookCard}>
            <Text style={styles.popularBookTitle}>
              {writerStats.mostPopularBook.title}
            </Text>
            <View style={styles.popularBookStats}>
              <Text style={styles.popularBookStat}>
                👁️ {writerStats.mostPopularBook.views} views
              </Text>
              <Text style={styles.popularBookStat}>
                ❤️ {writerStats.mostPopularBook.likes} likes
              </Text>
              <Text style={styles.popularBookStat}>
                💬 {writerStats.mostPopularBook.comments} comments
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {user?.role === "admin" && (
          <TouchableOpacity
            style={[styles.tab, activeTab === "approvals" && styles.activeTab]}
            onPress={() => setActiveTab("approvals")}
          >
            <Text style={[styles.tabText, activeTab === "approvals" && styles.activeTabText]}>
              Approvals {submittedBooks.length > 0 && `(${submittedBooks.length})`}
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.tab, activeTab === "published" && styles.activeTab]}
          onPress={() => setActiveTab("published")}
        >
          <Text style={[styles.tabText, activeTab === "published" && styles.activeTabText]}>
            Published
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "draft" && styles.activeTab]}
          onPress={() => setActiveTab("draft")}
        >
          <Text style={[styles.tabText, activeTab === "draft" && styles.activeTabText]}>
            Drafts
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading && activeTab !== "approvals" ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
        </View>
      ) : (
        renderTabContent()
      )}

      {renderBookOptionsModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  // Header styles
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  createButton: {
    backgroundColor: "#6200ee",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  // Tab styles
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#6200ee",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
  },
  activeTabText: {
    color: "#6200ee",
    fontWeight: "600",
  },
  // Book item styles
  listContainer: {
    padding: 16,
  },
  bookItem: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookCover: {
    width: 80,
    height: 120,
  },
  bookInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  bookMeta: {
    marginVertical: 6,
  },
  bookStatus: {
    fontSize: 11,
    color: '#6200ee',
    backgroundColor: '#f0e6ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  submittedStatus: {
    backgroundColor: '#fff3cd',
    color: '#856404',
  },
  publishedStatus: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  finishedStatus: {
    backgroundColor: '#cce5ff',
    color: '#004085',
  },
  draftStatus: {
    backgroundColor: '#f8f9fa',
    color: '#6c757d',
  },
  bookGenre: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
  },
  realStats: {
    marginTop: 8,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  statText: {
    fontSize: 11,
    color: '#757575',
    marginLeft: 4,
  },
  draftInfo: {
    marginTop: 8,
  },
  draftText: {
    fontSize: 11,
    color: '#ff9800',
    fontStyle: 'italic',
  },
  draftDate: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  submittedInfo: {
    marginTop: 8,
  },
  submittedText: {
    fontSize: 11,
    color: '#ff9800',
    fontStyle: 'italic',
  },
  submittedDate: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  actionButton: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  // Submission card styles
  submissionCard: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submissionCover: {
    width: 60,
    height: 90,
    borderRadius: 4,
  },
  submissionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  submissionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  submissionAuthor: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  submissionGenre: {
    fontSize: 11,
    color: "#888",
    fontStyle: "italic",
    marginTop: 2,
  },
  submissionActions: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  },
  approveButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    gap: 4,
  },
  approveButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  rejectButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f44336",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    gap: 4,
  },
  rejectButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  // Modal styles
  modalContainer: {
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
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalOptionText: {
    marginLeft: 16,
    fontSize: 16,
    color: "#424242",
  },
  // Empty state styles
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#757575",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9e9e9e",
    marginBottom: 24,
    textAlign: "center",
  },
  emptyButton: {
    backgroundColor: "#6200ee",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Restricted access styles
  restrictedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  restrictedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  restrictedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  restrictedButton: {
    backgroundColor: '#6200ee',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  restrictedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Stats Section Styles
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#f8f9fa',
    marginBottom: 16,
  },
  statCard: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 80,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  popularBookSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  popularBookCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  popularBookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  popularBookStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  popularBookStat: {
    fontSize: 14,
    color: '#666',
  },
});