"use client";

import { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "@env";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

export default function HomeScreen({ finishedBooks, fetchAllBooks }) {
  const navigation = useNavigation();

  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [trendingBooks, setTrendingBooks] = useState([]);
  const [recentBooks, setRecentBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (finishedBooks) {
      console.log("Finished books received:", finishedBooks);
      setLoading(true);
      setError(null);
      setBooks(finishedBooks);
      setTrendingBooks(finishedBooks.filter((book) => book.trending));
      setRecentBooks(finishedBooks.filter((book) => book.recentlyAdded));
      setLoading(false);
    }
  }, [finishedBooks]);

  useEffect(() => {
    fetchAllBooks();
  }, []);

  const renderBook = ({ item }) => (
    <TouchableOpacity
      style={styles.bookCard}
      onPress={() => navigation.navigate("BookDetails", { bookId: item._id })}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri: `${API_URL}${item.coverImage}`,
          }}
          style={styles.bookImage}
          resizeMode="cover"
        />
      </View>

      <View style={styles.bookContent}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.author} numberOfLines={1}>
          by {item.author}
        </Text>

        {(item.trending || item.recentlyAdded) && (
          <View style={styles.tagsContainer}>
            {item.trending && (
              <View style={[styles.tag, styles.trendingTag]}>
                <MaterialIcons name="trending-up" size={10} color="#fff" />
                <Text style={styles.tagText}>Trending</Text>
              </View>
            )}
            {item.recentlyAdded && (
              <View style={[styles.tag, styles.newTag]}>
                <MaterialIcons name="fiber-new" size={10} color="#fff" />
                <Text style={styles.tagText}>New</Text>
              </View>
            )}
          </View>
        )}

        {item.isPremium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>PREMIUM</Text>
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
        <TouchableOpacity style={styles.retryButton} onPress={fetchAllBooks}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {user && (
        <View style={styles.userGreeting}>
          <Text style={styles.greetingText}>Welcome, {user.name}!</Text>
        </View>
      )}
      <FlatList
        data={books}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        renderItem={renderBook}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={
          <>
            {trendingBooks.length > 0 && (
              <>
                {renderSectionHeader("Trending Now")}
                <FlatList
                  horizontal
                  data={trendingBooks}
                  keyExtractor={(item) => `trending-${item._id}`}
                  renderItem={renderBook}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalListContent}
                  scrollEnabled={false}
                />
              </>
            )}

            {recentBooks.length > 0 && (
              <>
                {renderSectionHeader("Recently Added")}
                <FlatList
                  horizontal
                  data={recentBooks}
                  keyExtractor={(item) => `recent-${item._id}`}
                  renderItem={renderBook}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalListContent}
                  scrollEnabled={false}
                />
              </>
            )}

            {renderSectionHeader("All Books")}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="library-books" size={64} color="#e0e0e0" />
            <Text style={styles.emptyText}>No books available</Text>
            <Text style={styles.emptySubtext}>
              Check back later for new titles
            </Text>
          </View>
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
  },
  bookImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#9e9e9e",
    justifyContent: "center",
    alignItems: "center",
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
  premiumBadge: {
    backgroundColor: "#ffd700",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  premiumText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#212121",
  },
  tagsContainer: {
    flexDirection: "row",
    marginTop: 8,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
    marginRight: 6,
  },
  trendingTag: {
    backgroundColor: "#6200ee",
  },
  newTag: {
    backgroundColor: "#00c853",
  },
  tagText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "bold",
    marginLeft: 3,
  },
  errorText: {
    color: "red",
    fontSize: 16,
    marginBottom: 12,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#6200ee",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
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
  userGreeting: {
    backgroundColor: "#0A84FF",
    padding: 16,
    paddingTop: 12,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
});
