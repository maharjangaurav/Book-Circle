import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  SafeAreaView,
  StatusBar,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BooksAPI } from '../api/books';
import { LibraryAPI } from '../api/library';

const { width, height } = Dimensions.get('window');

export default function ReadingScreen({ route, navigation }) {
  const { bookId, libraryId } = route.params;
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(10); // Mock value
  const [fontSize, setFontSize] = useState(16);
  const [readingProgress, setReadingProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [bookContent, setBookContent] = useState([]);
  
  // New state variables for enhanced reading experience
  const [theme, setTheme] = useState('light'); // light, dark, sepia
  const [scrollMode, setScrollMode] = useState('paginated'); // paginated, continuous
  const [showSettings, setShowSettings] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [showBookmarks, setShowBookmarks] = useState(false);

  useEffect(() => {
    fetchBookDetails();
    fetchReadingProgress();
    loadBookmarks();
    loadReadingPreferences();
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
          description: "This is a detailed description of the book.",
          published_date: "2023-01-15",
          content: generateMockContent(),
          isPremium: bookId % 2 === 0, // Even IDs are premium
          genre: bookId % 3 === 0 ? "Fiction" : "Non-Fiction",
          rating: (bookId % 5) + 1, // Rating between 1-5
        };
        setBook(mockBook);
        setBookContent(mockBook.content);
        setLoading(false);
      }, 1000);
    } catch (error) {
      setError("Failed to load book details. Please try again.");
      setLoading(false);
    }
  };

  const fetchReadingProgress = async () => {
    try {
      if (libraryId) {
        // In a real app, we would fetch the actual progress
        // const progress = await LibraryAPI.getProgress(libraryId);
        // setReadingProgress(progress);
        // setCurrentPage(Math.ceil((progress / 100) * totalPages));
        
        // Mock progress
        const mockProgress = 30; // 30%
        setReadingProgress(mockProgress);
        setCurrentPage(Math.ceil((mockProgress / 100) * totalPages));
      }
    } catch (error) {
      console.error("Error fetching reading progress:", error);
    }
  };

  const generateMockContent = () => {
    // Generate mock content with 10 pages
    const content = [];
    for (let i = 1; i <= 10; i++) {
      content.push({
        page: i,
        text: `This is page ${i} of the book. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n\nParagraph 2. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.\n\nParagraph 3. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.`
      });
    }
    return content;
  };

  // Load saved bookmarks
  const loadBookmarks = async () => {
    try {
      const savedBookmarks = await AsyncStorage.getItem(`bookmarks_${bookId}`);
      if (savedBookmarks) {
        setBookmarks(JSON.parse(savedBookmarks));
      }
    } catch (error) {
      console.error("Error loading bookmarks:", error);
    }
  };

  // Load reading preferences (theme, font size, scroll mode)
  const loadReadingPreferences = async () => {
    try {
      const savedPreferences = await AsyncStorage.getItem('reading_preferences');
      if (savedPreferences) {
        const { theme, fontSize, scrollMode } = JSON.parse(savedPreferences);
        setTheme(theme || 'light');
        setFontSize(fontSize || 16);
        setScrollMode(scrollMode || 'paginated');
      }
    } catch (error) {
      console.error("Error loading reading preferences:", error);
    }
  };

  // Save reading preferences
  const saveReadingPreferences = async () => {
    try {
      const preferences = { theme, fontSize, scrollMode };
      await AsyncStorage.setItem('reading_preferences', JSON.stringify(preferences));
    } catch (error) {
      console.error("Error saving reading preferences:", error);
    }
  };

  // Add or remove bookmark
  const toggleBookmark = async () => {
    try {
      const isBookmarked = bookmarks.includes(currentPage);
      let updatedBookmarks;
      
      if (isBookmarked) {
        updatedBookmarks = bookmarks.filter(page => page !== currentPage);
      } else {
        updatedBookmarks = [...bookmarks, currentPage];
      }
      
      setBookmarks(updatedBookmarks);
      await AsyncStorage.setItem(`bookmarks_${bookId}`, JSON.stringify(updatedBookmarks));
      
      Alert.alert(
        isBookmarked ? "Bookmark Removed" : "Bookmark Added",
        isBookmarked ? "Page removed from bookmarks" : "Page added to bookmarks"
      );
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  };

  // Jump to a bookmarked page
  const goToBookmark = (page) => {
    setCurrentPage(page);
    setShowBookmarks(false);
    updateReadingProgress();
  };

  const updateReadingProgress = async () => {
    const newProgress = Math.floor((currentPage / totalPages) * 100);
    setReadingProgress(newProgress);

    try {
      if (libraryId) {
        // In a real app, we would update the progress
        // await LibraryAPI.updateProgress(libraryId, newProgress);
        console.log("Updated reading progress to", newProgress);
        
        // Save progress to AsyncStorage for offline access
        await AsyncStorage.setItem(`reading_progress_${bookId}`, JSON.stringify({
          progress: newProgress,
          currentPage,
          lastReadAt: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error("Error updating reading progress:", error);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      updateReadingProgress();
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      updateReadingProgress();
    }
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  const renderContent = () => {
    if (!book || !bookContent || bookContent.length === 0) return null;

    const pageContent = bookContent.find(p => p.page === currentPage);
    if (!pageContent) return null;

    return (
      <TouchableOpacity 
        activeOpacity={1} 
        style={styles.contentContainer} 
        onPress={toggleControls}
      >
        <Text style={[styles.bookContent, { fontSize }]}>{pageContent.text}</Text>
      </TouchableOpacity>
    );
  };

  const renderControls = () => {
    if (!showControls) return null;

    return (
      <View style={styles.controlsContainer}>
        <View style={styles.topControls}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.pageIndicator}>{currentPage} / {totalPages}</Text>
          <View style={styles.topRightControls}>
            <TouchableOpacity onPress={toggleBookmark} style={styles.iconButton}>
              <MaterialIcons 
                name={bookmarks.includes(currentPage) ? "bookmark" : "bookmark-border"} 
                size={24} 
                color="#fff" 
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowBookmarks(true)} style={styles.iconButton}>
              <MaterialIcons name="bookmarks" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.settingsButton}>
              <MaterialIcons name="settings" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomControls}>
          <TouchableOpacity 
            onPress={goToPreviousPage} 
            style={[styles.navButton, currentPage === 1 && styles.disabledButton]}
            disabled={currentPage === 1}
          >
            <MaterialIcons name="navigate-before" size={30} color={currentPage === 1 ? '#aaa' : '#fff'} />
          </TouchableOpacity>
          
          <View style={styles.progressContainer}>
            <Slider
              style={styles.progressSlider}
              minimumValue={1}
              maximumValue={totalPages}
              step={1}
              value={currentPage}
              onValueChange={setCurrentPage}
              onSlidingComplete={() => updateReadingProgress()}
              minimumTrackTintColor="#6200ee"
              maximumTrackTintColor="#e0e0e0"
              thumbTintColor="#6200ee"
            />
            <Text style={styles.progressText}>{readingProgress}% completed</Text>
          </View>
          
          <TouchableOpacity 
            onPress={goToNextPage} 
            style={[styles.navButton, currentPage === totalPages && styles.disabledButton]}
            disabled={currentPage === totalPages}
          >
            <MaterialIcons name="navigate-next" size={30} color={currentPage === totalPages ? '#aaa' : '#fff'} />
          </TouchableOpacity>
        </View>

        <View style={styles.fontSizeControls}>
          <TouchableOpacity onPress={() => setFontSize(Math.max(12, fontSize - 2))}>
            <MaterialIcons name="remove" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.fontSizeText}>Text Size</Text>
          <TouchableOpacity onPress={() => setFontSize(Math.min(24, fontSize + 2))}>
            <MaterialIcons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render settings modal
  const renderSettingsModal = () => {
    return (
      <Modal
        visible={showSettings}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reading Settings</Text>
              <TouchableOpacity onPress={() => {
                setShowSettings(false);
                saveReadingPreferences();
              }}>
                <MaterialIcons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.settingSection}>
              <Text style={styles.settingTitle}>Theme</Text>
              <View style={styles.themeOptions}>
                <TouchableOpacity 
                  style={[styles.themeOption, theme === 'light' && styles.selectedTheme]}
                  onPress={() => setTheme('light')}
                >
                  <View style={styles.themePreview}>
                    <View style={styles.lightThemePreview} />
                  </View>
                  <Text>Light</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.themeOption, theme === 'dark' && styles.selectedTheme]}
                  onPress={() => setTheme('dark')}
                >
                  <View style={styles.themePreview}>
                    <View style={styles.darkThemePreview} />
                  </View>
                  <Text>Dark</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.themeOption, theme === 'sepia' && styles.selectedTheme]}
                  onPress={() => setTheme('sepia')}
                >
                  <View style={styles.themePreview}>
                    <View style={styles.sepiaThemePreview} />
                  </View>
                  <Text>Sepia</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.settingSection}>
              <Text style={styles.settingTitle}>Font Size: {fontSize}px</Text>
              <View style={styles.fontSizeSlider}>
                <MaterialIcons name="format-size" size={16} color="#000" />
                <Slider
                  style={{flex: 1, marginHorizontal: 10}}
                  minimumValue={12}
                  maximumValue={24}
                  step={1}
                  value={fontSize}
                  onValueChange={setFontSize}
                  minimumTrackTintColor="#6200ee"
                  maximumTrackTintColor="#e0e0e0"
                  thumbTintColor="#6200ee"
                />
                <MaterialIcons name="format-size" size={24} color="#000" />
              </View>
            </View>
            
            <View style={styles.settingSection}>
              <Text style={styles.settingTitle}>Scroll Mode</Text>
              <View style={styles.scrollModeOptions}>
                <TouchableOpacity 
                  style={[styles.scrollModeOption, scrollMode === 'paginated' && styles.selectedScrollMode]}
                  onPress={() => setScrollMode('paginated')}
                >
                  <MaterialIcons name="book" size={24} color={scrollMode === 'paginated' ? '#6200ee' : '#757575'} />
                  <Text style={scrollMode === 'paginated' ? styles.selectedOptionText : {}}>Paginated</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.scrollModeOption, scrollMode === 'continuous' && styles.selectedScrollMode]}
                  onPress={() => setScrollMode('continuous')}
                >
                  <MaterialIcons name="subject" size={24} color={scrollMode === 'continuous' ? '#6200ee' : '#757575'} />
                  <Text style={scrollMode === 'continuous' ? styles.selectedOptionText : {}}>Continuous</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Render bookmarks modal
  const renderBookmarksModal = () => {
    return (
      <Modal
        visible={showBookmarks}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBookmarks(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bookmarks</Text>
              <TouchableOpacity onPress={() => setShowBookmarks(false)}>
                <MaterialIcons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            {bookmarks.length === 0 ? (
              <View style={styles.emptyBookmarks}>
                <MaterialIcons name="bookmark-border" size={48} color="#757575" />
                <Text style={styles.emptyBookmarksText}>No bookmarks yet</Text>
                <Text style={styles.emptyBookmarksSubtext}>
                  Tap the bookmark icon while reading to add bookmarks
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.bookmarksList}>
                {bookmarks.sort((a, b) => a - b).map(page => (
                  <TouchableOpacity 
                    key={page} 
                    style={styles.bookmarkItem}
                    onPress={() => goToBookmark(page)}
                  >
                    <MaterialIcons name="bookmark" size={24} color="#6200ee" />
                    <Text style={styles.bookmarkText}>Page {page}</Text>
                    <TouchableOpacity 
                      style={styles.removeBookmark}
                      onPress={() => {
                        const updatedBookmarks = bookmarks.filter(p => p !== page);
                        setBookmarks(updatedBookmarks);
                        AsyncStorage.setItem(`bookmarks_${bookId}`, JSON.stringify(updatedBookmarks));
                      }}
                    >
                      <MaterialIcons name="close" size={18} color="#757575" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Loading book...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <MaterialIcons name="error-outline" size={48} color="#b00020" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchBookDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, theme === 'dark' && styles.darkContainer, theme === 'sepia' && styles.sepiaContainer]}>
      <StatusBar barStyle={theme === 'dark' ? "light-content" : "dark-content"} />
      {scrollMode === 'paginated' ? (
        renderContent()
      ) : (
        <ScrollView 
          style={styles.continuousScrollContainer}
          onScroll={(event) => {
            // Calculate progress based on scroll position
            const scrollPosition = event.nativeEvent.contentOffset.y;
            const scrollViewHeight = event.nativeEvent.layoutMeasurement.height;
            const contentHeight = event.nativeEvent.contentSize.height;
            
            if (contentHeight > 0) {
              const scrollPercentage = scrollPosition / (contentHeight - scrollViewHeight);
              const newPage = Math.max(1, Math.min(
                totalPages,
                Math.ceil(scrollPercentage * totalPages)
              ));
              
              if (newPage !== currentPage) {
                setCurrentPage(newPage);
                updateReadingProgress();
              }
            }
          }}
        >
          {bookContent.map((page) => (
            <View key={page.page} style={styles.continuousPageContainer}>
              <Text style={[
                styles.bookContent, 
                { fontSize },
                theme === 'dark' && styles.darkText,
                theme === 'sepia' && styles.sepiaText
              ]}>
                {page.text}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
      {renderControls()}
      {renderSettingsModal()}
      {renderBookmarksModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  sepiaContainer: {
    backgroundColor: '#f8f1e3',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#757575',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#b00020',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#6200ee',
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  bookContent: {
    color: '#212121',
    lineHeight: 24,
  },
  darkText: {
    color: '#e0e0e0',
  },
  sepiaText: {
    color: '#5b4636',
  },
  continuousScrollContainer: {
    flex: 1,
    padding: 20,
  },
  continuousPageContainer: {
    marginBottom: 20,
  },
  controlsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  settingsButton: {
    padding: 8,
  },
  iconButton: {
    padding: 8,
    marginRight: 8,
  },
  pageIndicator: {
    color: '#fff',
    fontSize: 16,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  navButton: {
    padding: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  progressSlider: {
    width: '100%',
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  fontSizeControls: {
    position: 'absolute',
    right: 16,
    top: '50%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    padding: 8,
    alignItems: 'center',
  },
  fontSizeText: {
    color: '#fff',
    fontSize: 12,
    marginVertical: 8,
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
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  settingSection: {
    marginBottom: 20,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  themeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  themeOption: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    width: '30%',
  },
  selectedTheme: {
    borderColor: '#6200ee',
    backgroundColor: 'rgba(98, 0, 238, 0.1)',
  },
  themePreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  lightThemePreview: {
    flex: 1,
    backgroundColor: '#fff',
  },
  darkThemePreview: {
    flex: 1,
    backgroundColor: '#121212',
  },
  sepiaThemePreview: {
    flex: 1,
    backgroundColor: '#f8f1e3',
  },
  fontSizeSlider: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollModeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  scrollModeOption: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    width: '45%',
  },
  selectedScrollMode: {
    borderColor: '#6200ee',
    backgroundColor: 'rgba(98, 0, 238, 0.1)',
  },
  selectedOptionText: {
    color: '#6200ee',
    fontWeight: '500',
  },
  // Bookmarks styles
  bookmarksList: {
    maxHeight: 300,
  },
  bookmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  bookmarkText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  removeBookmark: {
    padding: 5,
  },
  emptyBookmarks: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyBookmarksText: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 10,
    marginBottom: 5,
  },
  emptyBookmarksSubtext: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
});