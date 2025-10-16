import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BooksAPI } from '../api/books';
import { LibraryAPI } from '../api/library';

export default function BookDetailScreen({ route, navigation }) {
  const { bookId } = route.params;
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingToLibrary, setSavingToLibrary] = useState(false);
  const [libraryStatus, setLibraryStatus] = useState(null);

  useEffect(() => {
    fetchBookDetails();
    checkLibraryStatus();
  }, []);

  const fetchBookDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      // In a real implementation, we would use the actual API
      // const data = await BooksAPI.getById(bookId);
      
      // Mock data for demonstration
      setTimeout(() => {
        const mockBook = {
          id: bookId,
          title: "Book Title " + bookId,
          author: "Author Name",
          description: "This is a detailed description of the book. It covers the plot, characters, and themes in depth. The book explores various concepts and ideas that readers will find engaging and thought-provoking.",
          published_date: "2023-01-15",
          preview: "This is a preview of the book content...",
          content: "This is the full content of the book. It would typically be much longer and contain multiple chapters.",
          isPremium: bookId % 2 === 0, // Even IDs are premium
          genre: bookId % 3 === 0 ? "Fiction" : "Non-Fiction",
          rating: (bookId % 5) + 1, // Rating between 1-5
          coverImage: null, // In a real app, this would be an image URL
          libraryId: null // Will be set if book is in library
        };
        
        setBook(mockBook);
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error("Error fetching book details:", err);
      setError("Failed to load book details. Please try again.");
      setLoading(false);
    }
  };

  const checkLibraryStatus = async () => {
    try {
      // In a real implementation, we would use the actual API
      // const libraryItems = await LibraryAPI.list();
      // const bookInLibrary = libraryItems.find(item => item.book_id === bookId || item.book?.id === bookId);
      // if (bookInLibrary) {
      //   setLibraryStatus(bookInLibrary.status);
      // }
      
      // Mock data for demonstration
      setTimeout(() => {
        // Randomly determine if book is in library
        const inLibrary = Math.random() > 0.5;
        if (inLibrary) {
          const statuses = ['saved', 'reading', 'finished'];
          const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
          setLibraryStatus(randomStatus);
          
          // Set a mock libraryId for the book
          if (book) {
            setBook({
              ...book,
              libraryId: 'lib_' + bookId + '_' + Date.now()
            });
          }
        }
      }, 800);
    } catch (error) {
      console.error("Error checking library status:", error);
      // Don't set an error state here, as this is a secondary operation
    }
  };

  const addToLibrary = async (status) => {
    setSavingToLibrary(true);
    try {
      // In a real implementation, we would use the actual API
      // await LibraryAPI.add(bookId, status);
      
      // Mock implementation
      setTimeout(() => {
        setLibraryStatus(status);
        setSavingToLibrary(false);
        Alert.alert(
          "Success", 
          status === 'saved' 
            ? "Book saved to your library" 
            : "You've started reading this book"
        );
      }, 800);
    } catch (error) {
      console.error("Error adding to library:", error);
      Alert.alert("Error", "Failed to add book to library. Please try again.");
      setSavingToLibrary(false);
    }
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
              {libraryStatus === 'saved' ? 'Saved for Later' :
               libraryStatus === 'reading' ? 'Currently Reading' :
               'Finished Reading'}
            </Text>
          </View>
          <View style={styles.statusButtonsRow}>
            <TouchableOpacity 
              style={styles.changeStatusButton}
              onPress={() => navigation.navigate('Library')}
            >
              <Text style={styles.changeStatusText}>Manage in Library</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.readNowButton}
              onPress={() => navigation.navigate('Reading', { bookId: book.id, libraryId: book.libraryId })}
            >
              <MaterialIcons name="menu-book" size={16} color="#fff" />
              <Text style={styles.readNowButtonText}>Read Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.saveButton]}
          onPress={() => addToLibrary('saved')}
        >
          <MaterialIcons name="bookmark" size={18} color="#fff" />
          <Text style={styles.buttonText}>Save for Later</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.readButton]}
          onPress={() => addToLibrary('reading')}
        >
          <MaterialIcons name="book" size={18} color="#fff" />
          <Text style={styles.buttonText}>Start Reading</Text>
        </TouchableOpacity>
      </View>
    );
  };

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
            <Image source={{ uri: book.coverImage.replace(/`/g, '') }} style={styles.coverImage} />
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
        onPress={() => navigation.navigate('Home')}
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
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
    backgroundColor: '#9e9e9e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  author: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 12,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  premiumBadge: {
    backgroundColor: '#ffd700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#212121',
  },
  genreBadge: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  genreText: {
    fontSize: 10,
    color: '#212121',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8e1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ff8f00',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  saveButton: {
    backgroundColor: '#757575',
  },
  readButton: {
    backgroundColor: '#6200ee',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statusContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  statusButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  statusBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 8,
  },
  statusText: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  changeStatusButton: {
    marginHorizontal: 8,
  },
  changeStatusText: {
    color: '#6200ee',
    fontWeight: 'bold',
  },
  readNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6200ee',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginHorizontal: 8,
  },
  readNowButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 8,
    color: '#757575',
  },
  section: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
  },
  preview: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  premiumOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  premiumOverlayText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 16,
  },
  upgradeButton: {
    backgroundColor: '#ffd700',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  upgradeButtonText: {
    color: '#212121',
    fontWeight: 'bold',
  },
  publishDate: {
    fontSize: 14,
    color: '#757575',
  },
  backToHomeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  backToHomeText: {
    color: '#6200ee',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 16,
    backgroundColor: '#6200ee',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});