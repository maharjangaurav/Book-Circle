import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image
} from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import { BooksAPI } from "../api/books";
import { useNavigation } from "@react-navigation/native";

export default function HomeScreen() {
  const navigation = useNavigation();
  const [books, setBooks] = useState([]);
  const [trendingBooks, setTrendingBooks] = useState([]);
  const [recentBooks, setRecentBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBooks = async () => {
    setLoading(true);
    setError(null);

    try {
      // In a real implementation, we would use the actual API
      // const data = await BooksAPI.list();
      
      // Mock data for demonstration
      setTimeout(() => {
        const mockBooks = [
          { id: 1, title: "The Great Adventure", author: "John Smith", preview: "Once upon a time in a land far away...", isPremium: false, trending: true, recentlyAdded: false },
          { id: 2, title: "Understanding the Universe", author: "Jane Doe", preview: "The cosmos is vast and mysterious...", isPremium: true, trending: true, recentlyAdded: true },
          { id: 3, title: "Mystery of the Lost City", author: "Robert Johnson", preview: "The ancient civilization disappeared without a trace...", isPremium: false, trending: false, recentlyAdded: true },
          { id: 4, title: "Business Strategies", author: "Emily Williams", preview: "Successful entrepreneurs share these traits...", isPremium: true, trending: false, recentlyAdded: false },
          { id: 5, title: "Cooking Masterclass", author: "Chef Michael", preview: "The secret to perfect pasta is...", isPremium: false, trending: true, recentlyAdded: false },
          { id: 6, title: "Digital Art Fundamentals", author: "Sarah Chen", preview: "Color theory is essential for creating...", isPremium: true, trending: false, recentlyAdded: true },
        ];
        
        setBooks(mockBooks);
        setTrendingBooks(mockBooks.filter(book => book.trending));
        setRecentBooks(mockBooks.filter(book => book.recentlyAdded));
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error("Error fetching books:", err);
      setError("Failed to load books. Please check your connection.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const renderBook = ({ item }) => (
    <TouchableOpacity 
      style={styles.bookCard}
      onPress={() => navigation.navigate('BookDetail', { bookId: item.id })}
    >
      <View style={styles.bookContent}>
        <View style={styles.bookHeader}>
          <Text style={styles.title}>{item.title}</Text>
          {item.isPremium && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumText}>PREMIUM</Text>
            </View>
          )}
        </View>
        <Text style={styles.author}>by {item.author}</Text>
        <Text style={styles.preview} numberOfLines={2}>{item.preview}</Text>
        
        {(item.trending || item.recentlyAdded) && (
          <View style={styles.tagsContainer}>
            {item.trending && (
              <View style={[styles.tag, styles.trendingTag]}>
                <MaterialIcons name="trending-up" size={12} color="#fff" />
                <Text style={styles.tagText}>Trending</Text>
              </View>
            )}
            {item.recentlyAdded && (
              <View style={[styles.tag, styles.newTag]}>
                <MaterialIcons name="fiber-new" size={12} color="#fff" />
                <Text style={styles.tagText}>New</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
  
  const renderSectionHeader = (title) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text>Loading books...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchBooks}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={books}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBook}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <>
            {trendingBooks.length > 0 && (
              <>
                {renderSectionHeader('Trending Now')}
                <FlatList
                  horizontal
                  data={trendingBooks}
                  keyExtractor={(item) => `trending-${item.id}`}
                  renderItem={renderBook}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalListContent}
                />
              </>
            )}
            
            {recentBooks.length > 0 && (
              <>
                {renderSectionHeader('Recently Added')}
                <FlatList
                  horizontal
                  data={recentBooks}
                  keyExtractor={(item) => `recent-${item.id}`}
                  renderItem={renderBook}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalListContent}
                />
              </>
            )}
            
            {renderSectionHeader('All Books')}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="library-books" size={64} color="#e0e0e0" />
            <Text style={styles.emptyText}>No books available</Text>
            <Text style={styles.emptySubtext}>Check back later for new titles</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f5f5f5" 
  },
  centered: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    padding: 16 
  },
  listContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },
  horizontalListContent: {
    paddingRight: 16,
  },
  bookCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 12,
    marginRight: 12,
    width: 280,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    overflow: "hidden",
  },
  bookContent: {
    padding: 16,
  },
  bookHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  title: { 
    fontSize: 16, 
    fontWeight: "bold",
    flex: 1,
    marginRight: 8,
  },
  author: { 
    fontSize: 14, 
    color: "#666", 
    marginBottom: 8 
  },
  preview: {
    fontSize: 14,
    color: "#757575",
    lineHeight: 20,
  },
  premiumBadge: {
    backgroundColor: "#ffd700",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#212121",
  },
  tagsContainer: {
    flexDirection: "row",
    marginTop: 12,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  trendingTag: {
    backgroundColor: "#6200ee",
  },
  newTag: {
    backgroundColor: "#00c853",
  },
  tagText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    marginLeft: 4,
  },
  errorText: { 
    color: "red", 
    fontSize: 16, 
    marginBottom: 12, 
    textAlign: "center" 
  },
  retryButton: { 
    backgroundColor: "#6200ee", 
    paddingHorizontal: 24, 
    paddingVertical: 12, 
    borderRadius: 8 
  },
  retryButtonText: { 
    color: "#fff", 
    fontWeight: "bold" 
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
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
});
