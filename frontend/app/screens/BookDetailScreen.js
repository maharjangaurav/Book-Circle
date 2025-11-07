"use client";

import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  FlatList,
  Modal,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { BooksAPI } from "../api/books";
import { AsyncStorageHelper } from "../utils/asyncStorageHelper";
import { API_URL } from "@env";

export default function BookDetailScreen({ route, navigation }) {
  const { bookId } = route.params;
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingToLibrary, setSavingToLibrary] = useState(false);
  const [libraryStatus, setLibraryStatus] = useState(null);
  const [libraryItemId, setLibraryItemId] = useState(null);

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [addingComment, setAddingComment] = useState(false);

  useEffect(() => {
    fetchBookDetails();
    checkLibraryStatus();
  }, [bookId]);

  const fetchBookDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await BooksAPI.getById(`books/readbyid/${bookId}`);
      const book = {
        id: response.data._id,
        title: response.data.title,
        author: response.data.author?.name || null,
        preview: response.data.previewText,
        isPremium: response.data.isPremium,
        trending: response.data.trending || false,
        recentlyAdded: response.data.recentlyAdded,
        content: allcontent(response.data.chapters),
        description: response.data.previewText,
        published_date: response.data.createdAt,
        genre: response.data.genre,
        rating: 5,
        coverImage: response.data.coverImage,
      };
      setBook(book);

      try {
        const likeStatusRes = await BooksAPI.getById(
          `api/likes/${bookId}/status`
        );
        setIsLiked(likeStatusRes?.isLiked);
        setLikeCount(likeStatusRes?.likeCount);
      } catch (err) {
        console.error("Error fetching like status:", err);
      }

      try {
        const commentsRes = await BooksAPI.getById(`api/comments/${bookId}`);
        setComments(commentsRes.data || []);
      } catch (err) {
        console.error("Error fetching comments:", err);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error fetching book details:", err);
      setError("Failed to load book details. Please try again.");
      setLoading(false);
    }
  };

  function allcontent(chapters = []) {
    const sorted = chapters.sort((a, b) => a.order_number - b.order_number);

    const htmlContent = sorted
      .map(
        (ch) => `
        <div style="margin-bottom: 30px;">
          <h2 style="text-align: center; font-weight: bold; font-size: 16px;">
            Chapter-${ch.order_number}
          </h2>
          <h3 style="text-align: center; font-weight: bold; font-size: 14px;">
            ${ch.title}
          </h3>
          <div style="margin-top: 10px;">
            ${ch.content || ""}
          </div>
        </div>
      `
      )
      .join("");

    return htmlContent;
  }

  const checkLibraryStatus = async () => {
    try {
      const libraryItem = await BooksAPI.getById(`api/library/${bookId}`);
      console.log("Library item fetched:", libraryItem);
      if (libraryItem) {
        setLibraryStatus(libraryItem.data?.status);
        setLibraryItemId(libraryItem?.data?._id || null);
        setBook((prev) => ({
          ...prev,
          libraryId: libraryItem.data?._id,
        }));
      }
    } catch (error) {
      console.error("Error checking library status:", error);
      // Fallback to AsyncStorage
      const status = await AsyncStorageHelper.getBookStatus(bookId);
      if (status) {
        setLibraryStatus(status);
      }
    }
  };

  const toggleLike = async () => {
    try {
      if (isLiked) {
        await BooksAPI.delete(`api/likes/${bookId}`);
        setIsLiked(false);
        setLikeCount(Math.max(0, likeCount - 1));
      } else {
        const response = await BooksAPI.create(`api/likes/${bookId}`, {});
        console.log(response, "response from like count");
        setIsLiked(true);
        setLikeCount(response.likeCount || likeCount + 1);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update like status");
      console.error("Error toggling like:", error);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) {
      Alert.alert("Error", "Please enter a comment");
      return;
    }

    try {
      setAddingComment(true);
      const response = await BooksAPI.create(`api/comments/${bookId}`, {
        text: commentText,
      });

      setComments([response.data, ...comments]);
      setCommentText("");
      Alert.alert("Success", "Comment added successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to add comment");
      console.error("Error adding comment:", error);
    } finally {
      setAddingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment?",
      [
        { text: "Cancel", onPress: () => {} },
        {
          text: "Delete",
          onPress: async () => {
            try {
              await BooksAPI.delete(`api/comments/${bookId}/${commentId}`);

              setComments(comments.filter((c) => c._id !== commentId));
              Alert.alert("Success", "Comment deleted successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to delete comment");
              console.error("Error deleting comment:", error);
            }
          },
        },
      ]
    );
  };

  const addToLibrary = async (status) => {
    setSavingToLibrary(true);
    try {
      const response = await BooksAPI.create(`api/library/${bookId}`, {
        status,
      });
      setLibraryStatus(status);
      setSavingToLibrary(false);
      await AsyncStorageHelper.saveToLibrary(book, status);
      Alert.alert(
        "Success",
        status === "saved"
          ? "Book saved to your library"
          : "You've started reading this book"
      );
    } catch (error) {
      console.error("Error adding to library:", error);
      Alert.alert("Error", "Failed to add book to library. Please try again.");
      setSavingToLibrary(false);
    }
  };

  const updateLibraryStatus = async (newStatus) => {
    try {
      await BooksAPI.update(`api/library/${libraryItemId}/status`, {
        status: newStatus,
      });
      setLibraryStatus(newStatus);
      await AsyncStorageHelper.updateReadingStatus(bookId, newStatus);
      Alert.alert("Success", `Book status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating library status:", error);
      Alert.alert("Error", "Failed to update book status");
    }
  };

  const removeFromLibrary = async () => {
    Alert.alert("Remove Book", "Remove this book from your library?", [
      { text: "Cancel" },
      {
        text: "Remove",
        onPress: async () => {
          try {
            await BooksAPI.delete(`api/library/${libraryItemId}`);
            setLibraryStatus(null);
            setLibraryItemId(null);
            await AsyncStorageHelper.removeFromLibrary(bookId);
            Alert.alert("Success", "Book removed from library");
          } catch (error) {
            console.error("Error removing from library:", error);
            Alert.alert("Error", "Failed to remove book from library");
          }
        },
      },
    ]);
  };

  const renderLibraryButtons = () => {
    if (savingToLibrary) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#6200ee" />
          <Text style={styles.loadingText}>Updating library...</Text>
        </View>
      );
    }

    if (libraryStatus) {
      return (
        <View style={styles.statusContainer}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {libraryStatus === "saved"
                ? "Saved for Later"
                : libraryStatus === "reading"
                ? "Currently Reading"
                : "Finished Reading"}
            </Text>
          </View>
          <View style={styles.statusButtonsRow}>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={removeFromLibrary}
            >
              <MaterialIcons name="delete" size={14} color="#f44336" />
              <Text style={styles.removeButtonText}>Remove</Text>
            </TouchableOpacity>

            {libraryStatus === "reading" && (
              <TouchableOpacity
                style={styles.finishButton}
                onPress={() => updateLibraryStatus("finished")}
              >
                <MaterialIcons name="check" size={14} color="#fff" />
                <Text style={styles.finishButtonText}>Finished</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.readNowButton}
              onPress={() =>
                navigation.navigate("Reading", {
                  bookId: book.id,
                  libraryId: book.libraryId,
                  featchedbook: book,
                })
              }
            >
              <MaterialIcons name="menu-book" size={16} color="#fff" />
              <Text style={styles.readNowButtonText}>
                {libraryStatus === "reading" ? "Continue Reading" : "Read Now"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.saveButton]}
          onPress={() => addToLibrary("saved")}
        >
          <MaterialIcons name="bookmark" size={18} color="#fff" />
          <Text style={styles.buttonText}>Save for Later</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.readButton]}
          onPress={() => addToLibrary("reading")}
        >
          <MaterialIcons name="book" size={18} color="#fff" />
          <Text style={styles.buttonText}>Start Reading</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderLikeAndCommentSection = () => (
    <View style={styles.engagementSection}>
      <View style={styles.engagementHeader}>
        <TouchableOpacity
          style={[styles.engagementButton, isLiked && styles.likedButton]}
          onPress={toggleLike}
        >
          <MaterialIcons
            name={isLiked ? "favorite" : "favorite-border"}
            size={20}
            color={isLiked ? "#f44336" : "#757575"}
          />
          <Text
            style={[
              styles.engagementCount,
              isLiked && { color: "#f44336", fontWeight: "bold" },
            ]}
          >
            {likeCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.engagementButton}
          onPress={() => setShowCommentModal(true)}
        >
          <MaterialIcons name="comment" size={20} color="#757575" />
          <Text style={styles.engagementCount}>{comments.length}</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showCommentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCommentModal(false)}
      >
        <View style={styles.commentModalContainer}>
          <View style={styles.commentModalContent}>
            <View style={styles.commentModalHeader}>
              <Text style={styles.commentModalTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setShowCommentModal(false)}>
                <MaterialIcons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            {loadingComments ? (
              <ActivityIndicator
                size="large"
                color="#6200ee"
                style={{ marginTop: 20 }}
              />
            ) : (
              <>
                <FlatList
                  data={comments}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item }) => (
                    <View style={styles.commentItem}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentAuthor}>
                          {item.user?.name || "Anonymous"}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleDeleteComment(item._id)}
                        >
                          <MaterialIcons
                            name="delete"
                            size={16}
                            color="#f44336"
                          />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.commentText}>{item.text}</Text>
                      <Text style={styles.commentDate}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                  ListEmptyComponent={
                    <Text style={styles.noCommentsText}>
                      No comments yet. Be the first to comment!
                    </Text>
                  }
                  scrollEnabled={false}
                />

                <View style={styles.addCommentContainer}>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Add a comment..."
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline={true}
                    maxLength={500}
                  />
                  <TouchableOpacity
                    style={styles.addCommentButton}
                    onPress={handleAddComment}
                    disabled={addingComment}
                  >
                    {addingComment ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <MaterialIcons name="send" size={20} color="#fff" />
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text>Loading book details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchBookDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!book) {
    return (
      <View style={styles.centered}>
        <Text>Book not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.coverContainer}>
          {book.coverImage ? (
            <Image
              source={{ uri: `${API_URL}${book.coverImage}` }}
              style={styles.coverImage}
            />
          ) : (
            <View style={styles.placeholderCover}>
              <MaterialIcons name="book" size={48} color="#fff" />
            </View>
          )}
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>{book.title}</Text>
          <Text style={styles.author}>by {book.author}</Text>

          <View style={styles.metaContainer}>
            {book.isPremium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumText}>PREMIUM</Text>
              </View>
            )}

            <View style={styles.genreBadge}>
              <Text style={styles.genreText}>{book.genre}</Text>
            </View>

            <View style={styles.ratingContainer}>
              <MaterialIcons name="star" size={16} color="#ffc107" />
              <Text style={styles.ratingText}>{book.rating}</Text>
            </View>
          </View>
        </View>
      </View>

      {renderLibraryButtons()}
      {renderLikeAndCommentSection()}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{book.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preview</Text>
        <Text style={styles.preview}>{book.preview}</Text>

        {book.isPremium && (
          <View style={styles.premiumOverlay}>
            <MaterialIcons name="lock" size={24} color="#fff" />
            <Text style={styles.premiumOverlayText}>Premium Content</Text>
            <TouchableOpacity style={styles.upgradeButton}>
              <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Published</Text>
        <Text style={styles.publishDate}>{book.published_date}</Text>
      </View>

      <TouchableOpacity
        style={styles.backToHomeButton}
        onPress={() => navigation.navigate("Home")}
      >
        <MaterialIcons name="home" size={18} color="#6200ee" />
        <Text style={styles.backToHomeText}>Back to Home</Text>
      </TouchableOpacity>
    </ScrollView>
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
  header: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  coverContainer: {
    marginRight: 16,
  },
  coverImage: {
    width: 120,
    height: 180,
    borderRadius: 8,
  },
  placeholderCover: {
    width: 120,
    height: 180,
    borderRadius: 8,
    backgroundColor: "#9e9e9e",
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 4,
  },
  author: {
    fontSize: 16,
    color: "#757575",
    marginBottom: 12,
  },
  metaContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  premiumBadge: {
    backgroundColor: "#ffd700",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#212121",
  },
  genreBadge: {
    backgroundColor: "#e0e0e0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  genreText: {
    fontSize: 10,
    color: "#212121",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff8e1",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#ff8f00",
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  saveButton: {
    backgroundColor: "#757575",
  },
  readButton: {
    backgroundColor: "#6200ee",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },
  statusContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    alignItems: "center",
  },
  statusButtonsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    width: "100%",
    flexWrap: "wrap",
  },
  statusBadge: {
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 8,
  },
  statusText: {
    color: "#2e7d32",
    fontWeight: "bold",
  },
  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 6,
    marginBottom: 6,
  },
  removeButtonText: {
    color: "#f44336",
    fontWeight: "bold",
    marginLeft: 4,
    fontSize: 12,
  },
  finishButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4caf50",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginHorizontal: 6,
    marginBottom: 6,
  },
  finishButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 4,
    fontSize: 12,
  },
  readNowButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6200ee",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginHorizontal: 6,
    marginBottom: 6,
  },
  readNowButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 4,
    fontSize: 12,
  },
  loadingContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginLeft: 8,
    color: "#757575",
  },
  engagementSection: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  engagementHeader: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  engagementButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
    marginRight: 12,
  },
  likedButton: {
    backgroundColor: "#ffebee",
  },
  engagementCount: {
    marginLeft: 6,
    fontSize: 14,
    color: "#757575",
    fontWeight: "600",
  },
  commentModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  commentModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "90%",
    padding: 16,
  },
  commentModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  commentModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },
  commentItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
  },
  commentText: {
    fontSize: 14,
    color: "#424242",
    lineHeight: 18,
    marginBottom: 6,
  },
  commentDate: {
    fontSize: 12,
    color: "#9e9e9e",
  },
  noCommentsText: {
    textAlign: "center",
    fontSize: 14,
    color: "#9e9e9e",
    marginVertical: 20,
  },
  addCommentContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 80,
    fontSize: 14,
  },
  addCommentButton: {
    backgroundColor: "#6200ee",
    borderRadius: 4,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    padding: 16,
    backgroundColor: "#fff",
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#424242",
    lineHeight: 20,
  },
  preview: {
    fontSize: 14,
    color: "#424242",
    lineHeight: 20,
    fontStyle: "italic",
  },
  premiumOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  premiumOverlayText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 16,
  },
  upgradeButton: {
    backgroundColor: "#ffd700",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  upgradeButtonText: {
    color: "#212121",
    fontWeight: "bold",
  },
  publishDate: {
    fontSize: 14,
    color: "#757575",
  },
  backToHomeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  backToHomeText: {
    color: "#6200ee",
    fontWeight: "bold",
    marginLeft: 8,
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
  backButton: {
    marginTop: 16,
    backgroundColor: "#6200ee",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
