"use client";

import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "@env";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

const API_BASE_URL = API_URL || process.env.API_URL || 'http://192.168.0.101:3000';

// Helper function to get complete image URL
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  if (path.startsWith('/')) return `${API_BASE_URL}${path}`;
  return `${API_BASE_URL}/${path}`;
};

export default function HomeScreen({ finishedBooks, fetchAllBooks }) {
  const navigation = useNavigation();
  const { user, token } = useAuth();
  const [books, setBooks] = useState([]);
  const [trendingBooks, setTrendingBooks] = useState([]);
  const [recentBooks, setRecentBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [allBooks, setAllBooks] = useState([]);
  const [imageErrors, setImageErrors] = useState({});

  const fetchAllBooksFromAPI = useCallback(async () => {
    try {
      setError(null);
      
      console.log("🔍 Token check:", {
        hasToken: !!token,
        tokenLength: token?.length,
        tokenFirst10: token?.substring(0, 10)
      });
      
      if (!token) {
        throw new Error("Authentication required");
      }
      
      // Clean the token
      const cleanToken = token.replace(/['"]+/g, '').trim();
      
      // For READERS: Only fetch published/finished books
      // For WRITERS/ADMINS: Fetch all to see their own books
      let endpoint = 'published';
      
      if (user?.role === 'writer') {
        // Writers should see all their books
        endpoint = 'all';
      } else if (user?.role === 'admin') {
        // Admins see all books
        endpoint = 'all';
      }
      
      const url = `${API_BASE_URL}/books/read/${endpoint}`;
      console.log(`📡 Fetching from: ${url} (role: ${user?.role})`);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log("📊 Response status:", response.status);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      
      const data = await response.json();
      console.log("📦 API response data:", {
        success: data.success,
        count: data.data?.length || 0,
        firstBook: data.data?.[0]?.title
      });
      
      if (data.success && data.data) {
        let filteredBooks = data.data;
        
        // Filter logic based on user role
        if (user?.role === 'reader') {
          // Readers see ONLY published or finished books
          filteredBooks = data.data.filter(book => 
            book.status === 'published' || book.status === 'finished'
          );
          console.log(`👤 Reader sees ${filteredBooks.length} published/finished books`);
        } else if (user?.role === 'writer') {
          // Writers see ALL their books (including drafts, submitted)
          console.log(`✍️ Writer sees ${filteredBooks.length} books (all statuses)`);
        } else if (user?.role === 'admin') {
          // Admins see ALL books
          console.log(`👑 Admin sees ${filteredBooks.length} books (all statuses)`);
        }
        
        if (filteredBooks.length > 0) {
          console.log("✅ Setting books from API");
          setAllBooks(filteredBooks);
          filterAndSetBooks(filteredBooks);
        } else {
          console.log("⚠️ No books after filtering");
          // Fallback to finishedBooks
          if (finishedBooks && finishedBooks.length > 0) {
            console.log("📚 Falling back to finishedBooks");
            setAllBooks(finishedBooks);
            filterAndSetBooks(finishedBooks);
            setError("No published books yet. Showing available books.");
          } else {
            setError("No books available yet.");
          }
        }
      } else {
        console.log("❌ API returned unsuccessful response");
        throw new Error(data.message || 'Failed to load books');
      }
      
    } catch (err) {
      console.error("❌ Error fetching books:", err.message);
      
      // LAST RESORT: Use finishedBooks if available
      if (finishedBooks && finishedBooks.length > 0) {
        console.log("🆘 Using finishedBooks as last resort");
        setAllBooks(finishedBooks);
        filterAndSetBooks(finishedBooks);
        setError("Using cached data. " + err.message);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, user?.role, finishedBooks]);

  const filterAndSetBooks = (bookList) => {
    try {
      if (!bookList || !Array.isArray(bookList)) {
        console.log("No books to filter");
        setBooks([]);
        setTrendingBooks([]);
        setRecentBooks([]);
        return;
      }

      console.log(`📊 Filtering ${bookList.length} books`);
      
      // Process books
      const processedBooks = bookList.map(book => {
        // Handle genre
        let parsedGenre = book.genre;
        if (book.genre && Array.isArray(book.genre) && book.genre[0] && typeof book.genre[0] === 'string') {
          try {
            const genreStr = book.genre[0];
            if (genreStr.startsWith('[') && genreStr.endsWith(']')) {
              parsedGenre = JSON.parse(genreStr);
            }
          } catch (err) {
            parsedGenre = ["General"];
          }
        }
        
        // Set defaults
        const rating = book.rating || 0;
        const isTrending = rating >= 4.0 || book.readCount > 100;
        
        return {
          ...book,
          genre: parsedGenre,
          rating: rating,
          trending: isTrending,
          mainGenre: Array.isArray(parsedGenre) ? parsedGenre[0] : "General"
        };
      });

      console.log("📄 Processed books sample:", processedBooks.slice(0, 2));
      
      // Show all books (they're already filtered by status based on user role)
      setBooks(processedBooks);
      
      // Find trending books (only published/finished for readers)
      const trending = processedBooks.filter((book) => 
        (book.trending === true || (book.rating && book.rating >= 3.5)) &&
        (user?.role !== 'reader' || (book.status === 'published' || book.status === 'finished'))
      );
      console.log(`📈 Found ${trending.length} trending books`);
      setTrendingBooks(trending);
      
      // Find recent books
      const recent = [...processedBooks]
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || a.updatedAt || 0);
          const dateB = new Date(b.createdAt || b.updatedAt || 0);
          return dateB - dateA;
        })
        .slice(0, 10);
      console.log(`🆕 Found ${recent.length} recent books`);
      setRecentBooks(recent);
    } catch (err) {
      console.error("Error filtering books:", err);
      setBooks([]);
      setTrendingBooks([]);
      setRecentBooks([]);
    }
  };

  useEffect(() => {
    console.log("🏠 HomeScreen mounted", {
      userRole: user?.role,
      finishedBooksCount: finishedBooks?.length
    });
    
    const loadBooks = async () => {
      setLoading(true);
      
      try {
        await fetchAllBooksFromAPI();
      } catch (err) {
        console.error("Initial load error:", err);
      }
    };
    
    loadBooks();
  }, [token, user?.role]);

  useEffect(() => {
    if (fetchAllBooks) {
      fetchAllBooks();
    }
  }, []);

  const onRefresh = useCallback(() => {
    console.log("🔄 Refreshing books...");
    setRefreshing(true);
    fetchAllBooksFromAPI();
  }, [fetchAllBooksFromAPI]);

  const handleImageError = (bookId) => {
    setImageErrors(prev => ({
      ...prev,
      [bookId]: true
    }));
  };

  const renderBook = ({ item }) => {
    const imageUrl = getImageUrl(item.coverImage);
    const hasImageError = imageErrors[item._id];
    
    // Don't show draft/submitted books to readers
    if (user?.role === 'reader' && item.status && !['published', 'finished'].includes(item.status)) {
      return null;
    }
    
    return (
      <TouchableOpacity
        style={styles.bookCard}
        onPress={() => navigation.navigate("BookDetails", { bookId: item._id })}
      >
        <View style={styles.imageContainer}>
          {imageUrl && !hasImageError ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.bookImage}
              resizeMode="cover"
              onError={() => handleImageError(item._id)}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <MaterialIcons name="book" size={40} color="#999" />
              <Text style={styles.placeholderText}>No Cover</Text>
            </View>
          )}
          
          {/* Status badge - show different colors based on status */}
          {item.status && (
            <View style={[
              styles.statusBadge,
              item.status === 'published' && styles.publishedBadge,
              item.status === 'finished' && styles.finishedBadge,
              item.status === 'draft' && styles.draftBadge,
              item.status === 'submitted' && styles.submittedBadge,
            ]}>
              <Text style={styles.statusText}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          )}
          
          {item.isPremium && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumText}>PREMIUM</Text>
            </View>
          )}
        </View>

        <View style={styles.bookContent}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title || "Untitled Book"}
          </Text>
          <Text style={styles.author} numberOfLines={1}>
            by {item.author?.name || item.author?.email || item.author || "Unknown Author"}
          </Text>

          <View style={styles.metaContainer}>
            {item.genre && (
              <View style={styles.genreTag}>
                <Text style={styles.genreText}>
                  {Array.isArray(item.genre) ? item.genre[0] : item.genre}
                </Text>
              </View>
            )}
            
            {(item.rating || item.rating === 0) && (
              <View style={styles.ratingContainer}>
                <MaterialIcons name="star" size={12} color="#FFC107" />
                <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>

          <View style={styles.tagsContainer}>
            {item.trending && (
              <View style={[styles.tag, styles.trendingTag]}>
                <MaterialIcons name="trending-up" size={10} color="#fff" />
                <Text style={styles.tagText}>Trending</Text>
              </View>
            )}
            
            {/* Show "New" badge for books created in last 7 days */}
            {item.createdAt && (new Date() - new Date(item.createdAt)) < (7 * 24 * 60 * 60 * 1000) && (
              <View style={[styles.tag, styles.newTag]}>
                <MaterialIcons name="fiber-new" size={10} color="#fff" />
                <Text style={styles.tagText}>New</Text>
              </View>
            )}
            
            {item.status === 'finished' && (
              <View style={[styles.tag, styles.finishedTag]}>
                <MaterialIcons name="check-circle" size={10} color="#fff" />
                <Text style={styles.tagText}>Complete</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = (title, count, showCount = true) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {showCount && count !== undefined && count > 0 && (
        <Text style={styles.sectionCount}>{count} {count === 1 ? 'book' : 'books'}</Text>
      )}
    </View>
  );

  const renderTrendingCarousel = () => {
    // Only show trending books that are published/finished for readers
    const visibleTrendingBooks = user?.role === 'reader' 
      ? trendingBooks.filter(book => book.status === 'published' || book.status === 'finished')
      : trendingBooks;
    
    return (
      <View style={styles.carouselSection}>
        {renderSectionHeader("Trending Now", visibleTrendingBooks.length)}
        {visibleTrendingBooks.length > 0 ? (
          <FlatList
            horizontal
            data={visibleTrendingBooks}
            keyExtractor={(item) => `trending-${item._id}`}
            renderItem={({ item }) => {
              const imageUrl = getImageUrl(item.coverImage);
              const hasImageError = imageErrors[`carousel-${item._id}`];
              
              return (
                <TouchableOpacity
                  style={styles.carouselCard}
                  onPress={() => navigation.navigate("BookDetails", { bookId: item._id })}
                >
                  {imageUrl && !hasImageError ? (
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.carouselImage}
                      resizeMode="cover"
                      onError={() => handleImageError(`carousel-${item._id}`)}
                    />
                  ) : (
                    <View style={styles.carouselPlaceholder}>
                      <MaterialIcons name="book" size={40} color="#999" />
                    </View>
                  )}
                  <View style={styles.carouselOverlay}>
                    <Text style={styles.carouselTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.carouselAuthor} numberOfLines={1}>
                      {item.author?.name || item.author}
                    </Text>
                    {item.status && (
                      <Text style={styles.carouselStatus}>
                        {item.status === 'published' ? '📖 Published' : 
                         item.status === 'finished' ? '✅ Complete' : item.status}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContentContainer}
          />
        ) : (
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>
              {user?.role === 'reader' ? 'No trending books yet' : 'No trending content'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (loading && !refreshing && books.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Loading books...</Text>
        {user?.role && <Text style={styles.roleText}>Loading as: {user.role}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {user && (
        <View style={styles.userGreeting}>
          <Text style={styles.greetingText}>Welcome, {user.name}!</Text>
          {user?.role && (
            <Text style={styles.roleText}>
              Viewing as: {user.role}
              {user.role === 'reader' && ' (published books only)'}
              {user.role === 'writer' && ' (all your books)'}
              {user.role === 'admin' && ' (all books)'}
            </Text>
          )}
          {error && (
            <Text style={styles.greetingError}>
              {error}
            </Text>
          )}
        </View>
      )}
      
      <FlatList
        data={books}
        keyExtractor={(item) => item._id || Math.random().toString()}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={renderBook}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#6200ee"]}
            tintColor="#6200ee"
          />
        }
        ListHeaderComponent={
          <>
            {renderTrendingCarousel()}
            
            {recentBooks.length > 0 && (
              <>
                {renderSectionHeader("Recently Added", recentBooks.length)}
                <FlatList
                  horizontal
                  data={recentBooks}
                  keyExtractor={(item) => `recent-${item._id}`}
                  renderItem={renderBook}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalListContent}
                  scrollEnabled={true}
                />
              </>
            )}

            {books.length > 0 && renderSectionHeader(
              user?.role === 'reader' ? "All Published Books" : "All Books", 
              books.length
            )}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="library-books" size={64} color="#e0e0e0" />
            <Text style={styles.emptyText}>No books available</Text>
            <Text style={styles.emptySubtext}>
              {user?.role === 'reader' 
                ? "Check back soon for new published books!"
                : error || "Pull to refresh or check your connection"}
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchAllBooksFromAPI}>
              <Text style={styles.retryButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={
          books.length > 0 && (
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Showing {books.length} book{books.length !== 1 ? 's' : ''}
              </Text>
              {user?.role && (
                <Text style={styles.userRoleText}>
                  {user.role === 'reader' && '📖 Published books only'}
                  {user.role === 'writer' && '✍️ All your books'}
                  {user.role === 'admin' && '👑 All books'}
                </Text>
              )}
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  roleText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
    fontStyle: "italic",
  },
  listContainer: {
    padding: 12,
    paddingBottom: 24,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },
  sectionCount: {
    fontSize: 14,
    color: "#666",
  },
  emptySection: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  emptySectionText: {
    color: "#999",
    fontSize: 14,
  },
  horizontalListContent: {
    paddingRight: 16,
  },
  carouselSection: {
    marginBottom: 20,
  },
  carouselContentContainer: {
    paddingRight: 16,
  },
  carouselCard: {
    width: 150,
    marginRight: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    overflow: "hidden",
  },
  carouselImage: {
    width: "100%",
    height: 200,
  },
  carouselPlaceholder: {
    width: "100%",
    height: 200,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  carouselOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 8,
  },
  carouselTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 2,
  },
  carouselAuthor: {
    fontSize: 12,
    color: "#e0e0e0",
    marginBottom: 2,
  },
  carouselStatus: {
    fontSize: 10,
    color: "#4CAF50",
    fontWeight: "bold",
  },
  bookCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 12,
    marginRight: 12,
    width: CARD_WIDTH,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    height: CARD_WIDTH * 1.5,
    backgroundColor: "#e0e0e0",
    position: "relative",
  },
  bookImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#999",
    fontSize: 12,
    marginTop: 8,
  },
  statusBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
    backgroundColor: "#6200ee", // Default color
  },
  publishedBadge: {
    backgroundColor: "#4CAF50", // Green for published
  },
  finishedBadge: {
    backgroundColor: "#2196F3", // Blue for finished
  },
  draftBadge: {
    backgroundColor: "#FF9800", // Orange for draft
  },
  submittedBadge: {
    backgroundColor: "#FFC107", // Yellow for submitted
  },
  statusText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "bold",
  },
  bookContent: {
    padding: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 4,
  },
  author: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  genreTag: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  genreText: {
    fontSize: 10,
    color: "#666",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: 12,
    color: "#212121",
    marginLeft: 2,
  },
  premiumBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#ffd700",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
  },
  premiumText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#212121",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
    marginRight: 6,
    marginBottom: 4,
  },
  trendingTag: {
    backgroundColor: "#6200ee",
  },
  newTag: {
    backgroundColor: "#00c853",
  },
  finishedTag: {
    backgroundColor: "#2196F3",
  },
  tagText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "bold",
    marginLeft: 3,
  },
  retryButton: {
    backgroundColor: "#6200ee",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
    marginTop: 50,
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
    marginBottom: 20,
  },
  userGreeting: {
    backgroundColor: "#0A84FF",
    padding: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  greetingSubtext: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
  },
  greetingError: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 8,
    fontStyle: "italic",
  },
  footer: {
    padding: 16,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    marginTop: 16,
  },
  footerText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  userRoleText: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
    textAlign: "center",
    fontStyle: "italic", 
  },
});