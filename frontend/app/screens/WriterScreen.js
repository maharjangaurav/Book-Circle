import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator, 
  Alert,
  Modal,
  Image
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BooksAPI } from '../api/books';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WriterScreen() {
  const navigation = useNavigation();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('published');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  
  useEffect(() => {
    fetchBooks();
  }, []);

  const PublishBook = async (bookId, status) => {
    try{
      console.log('Publishing book with ID:', bookId, 'to status:', status);
      const updatedResponse = await BooksAPI.update(`books/read/${bookId}`,{ status: status })
      console.log('Book published successfully:', updatedResponse);
    }catch(error){
      console.error('Error publishing book:', error);
    }
  }
  
  const fetchBooks = async () => {
    setLoading(true);
    try {


           const draftResponse = await BooksAPI.get(`books/read/draft`)
     const publihedResponse = await BooksAPI.get(`books/read/published`) 


          let bookData=[...draftResponse.data,...publihedResponse.data];

console.log(bookData, "draft books");
      
      // For demo purposes, we'll create some mock data if the API call fails
      let booksData = bookData
      
      // Cache the books data
      await AsyncStorage.setItem('writer_books', JSON.stringify(booksData));
      
      setBooks(booksData);
    } catch (error) {
      console.error('Error fetching books:', error);
      
      // Try to load from cache if API fails
      try {
        const cachedBooks = await AsyncStorage.getItem('writer_books');
        if (cachedBooks) {
          setBooks(JSON.parse(cachedBooks));
        } else {
          setBooks([]);
        }
      } catch (cacheError) {
        console.error('Error loading from cache:', cacheError);
        setBooks([]); 
      }
    } finally {
      setLoading(false);
    }
  };
  
  
  const navigateToCreateBook = () => {
    setShowCreateModal(false);
    // Navigate to book creation screen
    navigation.navigate('CreateBook');
  };
  
  const navigateToEditBook = (book) => {
    // Navigate to book editing screen with the book data
    navigation.navigate('EditBook', { bookId: book._id });
  };
  
  const navigateToChapters = (book) => {
    // Navigate to chapter management screen
    navigation.navigate('ManageChapters', { bookId: book._id });
  };
  
  const handleDeleteBook = (book) => {
    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete "${book.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete book API call
              await BooksAPI.delete(`books/read/${book._id}`);
              // Update local state
              setBooks(books.filter(b => b._id !== book._id));
              Alert.alert('Success', 'Book deleted successfully');
            } catch (error) {
              console.error('Error deleting book:', error);
              Alert.alert('Error', 'Failed to delete book');
            }
          }
        }
      ]
    );
  };
  
  const renderBookItem = ({ item }) => {
    const isPublished = item.status === 'published';
    
    return (
      <TouchableOpacity 
        style={styles.bookItem}
        onPress={() => {
          setSelectedBook(item);
          setShowCreateModal(true);
        }}
      >
        <Image 
          source={{ uri: item.coverImage }} 
          style={styles.bookCover}
          resizeMode="cover"
        />
        
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle}>{item.title}</Text>
          
          {isPublished ? (
            <View>
              <Text style={styles.bookDetail}>
                Published: {item.publishedDate}
              </Text>
              <Text style={styles.bookDetail}>
                Chapters: {item.chapterCount}
              </Text>
              <View style={styles.statsContainer}>
                <Text style={styles.statItem}>
                  <MaterialIcons name="visibility" size={16} color="#757575" /> {item.views}
                </Text>
                <Text style={styles.statItem}>
                  <MaterialIcons name="thumb-up" size={16} color="#757575" /> {item.likes}
                </Text>
              </View>
            </View>
          ) : (
            <View>
              <Text style={styles.bookDetail}>
                Last edited: {item.lastEdited}
              </Text>
              <Text style={styles.bookDetail}>
                Chapters: {item.chapterCount}
              </Text>
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                  {item.completionPercentage}% Complete
                </Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${item.completionPercentage}%` }
                    ]} 
                  />
                </View>
              </View>
            </View>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigateToChapters(item)}
        >
          <MaterialIcons name="menu-book" size={24} color="#6200ee" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };
  
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
              {selectedBook ? 'Book Options' : 'Create New Book'}
            </Text>
            <TouchableOpacity onPress={() => {
              setShowCreateModal(false);
              setSelectedBook(null);
            }}>
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
              
              {selectedBook.status === 'draft' && (
                <TouchableOpacity 
                  style={styles.modalOption}
                  onPress={() => {
                    setShowCreateModal(false);
                    PublishBook(selectedBook._id, "published");
                    // Publish book logic
                    Alert.alert('Coming Soon', 'Publishing functionality will be available soon');
                  }}
                >
                  <MaterialIcons name="publish" size={24} color="#4caf50" />
                  <Text style={[styles.modalOptionText, { color: '#4caf50' }]}>Publish Book</Text>
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
                <Text style={[styles.modalOptionText, { color: '#f44336' }]}>Delete Book</Text>
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Writer Dashboard</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <MaterialIcons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'published' && styles.activeTab]}
          onPress={() => setActiveTab('published')}
        >
          <Text style={[styles.tabText, activeTab === 'published' && styles.activeTabText]}>
            Published
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'draft' && styles.activeTab]}
          onPress={() => setActiveTab('draft')}
        >
          <Text style={[styles.tabText, activeTab === 'draft' && styles.activeTabText]}>
            Drafts
          </Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
        </View>
      ) : (
        <FlatList
          data={books.filter(book => book.status === activeTab)}
          renderItem={renderBookItem}
          keyExtractor={item => item._id.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="book" size={64} color="#e0e0e0" />
              <Text style={styles.emptyText}>
                No {activeTab} books found
              </Text>
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={() => setShowCreateModal(true)}
              >
                <Text style={styles.emptyButtonText}>Create Your First Book</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
      
      {renderBookOptionsModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  createButton: {
    backgroundColor: '#6200ee',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#6200ee',
  },
  tabText: {
    fontSize: 16,
  },
  activeTabText: {
    color: '#6200ee',
    fontWeight: '600',
  },
  // Book item styles
  listContainer: {
    padding: 16,
  },
  bookItem: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  bookCover: {
    width: 100,
    height: 150,
  },
  bookInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bookDetail: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  statItem: {
    marginRight: 16,
    fontSize: 14,
    color: '#757575',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6200ee',
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalOptionText: {
    marginLeft: 16,
    fontSize: 16,
    color: '#424242',
  },
  // Empty state styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
    marginTop: 16,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#6200ee',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
