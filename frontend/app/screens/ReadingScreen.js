"use client";
import React from "react";  
import { useState, useEffect } from "react";
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
} from "react-native";
import { Pressable } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Slider from "@react-native-community/slider";
import { MaterialIcons } from "@expo/vector-icons";

// Import the API functions
import { getChaptersByBookIdAPI, getBookByIdAPI,    getReadingProgressAPI, updateReadingProgressAPI,  } from "../utils/api";


const HtmlContent = ({ html, fontSize, color }) => {
  const plainText = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

  return (
    <Text
      style={{ fontSize, color, lineHeight: fontSize * 1.5, marginBottom: 12 }}
    >
      {plainText}
    </Text>
  );
};

export default function ReadingScreen({ route, navigation }) {
  const { bookId, libraryId, featchedbook } = route.params;
  const [book, setBook] = useState(featchedbook || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [fontSize, setFontSize] = useState(16);
  const [readingProgress, setReadingProgress] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [chapters, setChapters] = useState([]);
  
  const [theme, setTheme] = useState("light");
  const [scrollMode, setScrollMode] = useState("paginated");
  const [showSettings, setShowSettings] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [lastSyncedPage, setLastSyncedPage] = useState(1);


  useEffect(() => {
    fetchBookDetails();
    fetchReadingProgress();
    loadBookmarks();
    loadReadingPreferences();

  }, [bookId]);

  const fetchBookDetails = async () => {
  setLoading(true);
  setError(null);

  try {
    console.log("📚 Fetching chapters for book:", bookId);
    
    // First, let's test the API endpoint directly
    console.log("🔍 Testing API endpoint...");
    
    const response = await getChaptersByBookIdAPI(bookId);
    
    console.log("📦 Response data:", response);
    
    if (response.success && response.data) {
      console.log("✅ API call successful");
      
      // Check what we actually received
      const chaptersData = response.data.data || response.data || [];
      console.log(`📊 Chapters data type: ${typeof chaptersData}`);
      console.log(`📊 Is array? ${Array.isArray(chaptersData)}`);
      console.log(`📊 Chapters count: ${chaptersData.length}`);
      
      if (chaptersData.length > 0) {
        console.log("📖 First chapter:", chaptersData[0]);
      }
      
      if (chaptersData.length === 0) {
        setError("No chapters available for this book.");
        setLoading(false);
        return;
      }
      
      const processedChapters = chaptersData.map((chapter, index) => ({
        id: chapter._id || `chapter-${index}`,
        chapterNumber: chapter.order_number || chapter.chapterNumber || index + 1,
        title: chapter.title || `Chapter ${index + 1}`,
        content: chapter.content || "No content available",
        page: index + 1,
      }));
      
      setChapters(processedChapters);
      setTotalPages(processedChapters.length);
      
      // Fetch book details if not already available
      if (!book && bookId) {
        try {
          console.log("📚 Fetching book details for ID:", bookId);
          const bookResponse = await getBookByIdAPI(bookId);
          console.log("📚 Book API Response:", bookResponse);
          
          if (bookResponse.success && bookResponse.data) {
            setBook(bookResponse.data);
          } else {
            console.warn("⚠️ Book API returned error:", bookResponse.error);
          }
        } catch (bookError) {
          console.warn("⚠️ Could not fetch book details:", bookError);
          if (featchedbook) {
            setBook(featchedbook);
          }
        }
      } else if (featchedbook && !book) {
        setBook(featchedbook);
      }
      
      setLoading(false);
    } else {
      console.error("❌ API returned error:", response.error);
      throw new Error(response.error || "Failed to load chapters");
    }
  } catch (error) {
    console.error("❌ Error fetching book details:", error);
    // Try a fallback - check if we can fetch from a different endpoint
    if (featchedbook && featchedbook.content) {
      console.log("🔄 Using fallback data from featchedbook");
      const fallbackChapters = [{
        id: "fallback-1",
        chapterNumber: 1,
        title: featchedbook.title || "Book Content",
        content: featchedbook.content,
        page: 1,
      }];
      setChapters(fallbackChapters);
      setTotalPages(1);
      setBook(featchedbook);
      setLoading(false);
    } else {
      setError(error.message || "Failed to load book. Please try again.");
      setLoading(false);
    }
  }
};

  const fetchReadingProgress = async () => {
    try {
      if (libraryId) {
        const savedProgress = await AsyncStorage.getItem(`reading_progress_${bookId}`);
        if (savedProgress) {
          const parsed = JSON.parse(savedProgress);
          setReadingProgress(parsed.progress || 0);
         if (parsed.currentPage) {
           setCurrentPage(parsed.currentPage);
         }  
        }
      }
    } catch (error) {
      console.error("Error fetching reading progress:", error);
    }
  };

  // Replace your current updateReadingProgress function:
const updateReadingProgress = async (page) => {
  if (!chapters.length || !libraryId) return;

  const totalPages = chapters.length;
  const safePage = Math.max(1, Math.min(page, totalPages));

  // ✅ FIXED: Simple percentage calculation
  const progress = Math.round((safePage / totalPages) * 100);

  // Update local state
  setCurrentPage(safePage);
  setReadingProgress(progress);

  const progressData = {
    currentPage: safePage,
    progress: progress,
    status: progress === 100 ? "finished" : "reading",
    lastReadAt: new Date().toISOString()
  };

  // ✅ Update backend
  try {
    console.log(`📊 Syncing progress: Page ${safePage}/${totalPages} (${progress}%)`);
    await updateReadingProgressAPI(libraryId, progressData);
    console.log("✅ Progress synced to backend");
  } catch (error) {
    console.error("❌ Failed to sync progress:", error);
    // Save locally as fallback
    await AsyncStorage.setItem(
      `reading_progress_${bookId}`,
      JSON.stringify(progressData)
    );
  }

  // ✅ Also update library status if finished
  if (progress === 100) {
    try {
      await updateLibraryStatusAPI(libraryId, "finished");
    } catch (e) {
      console.warn("Could not update status to finished:", e);
    }
  }
};

  const loadBookmarks = async () => {
    try {
      const savedBookmarks = await AsyncStorage.getItem(`bookmarks_${bookId}`);
      if (savedBookmarks) {
        const parsed = JSON.parse(savedBookmarks);
        setBookmarks(parsed);
      }
    } catch (error) {
      console.error("Error loading bookmarks:", error);
    }
  };

  const loadReadingPreferences = async () => {
    try {
      const savedPreferences = await AsyncStorage.getItem("reading_preferences");
      if (savedPreferences) {
        const parsed = JSON.parse(savedPreferences);
        setTheme(parsed.theme || "light");
        setFontSize(parsed.fontSize || 16);
        setScrollMode(parsed.scrollMode || "paginated");
      }
    } catch (error) {
      console.error("Error loading reading preferences:", error);
    }
  };

  const saveReadingPreferences = async () => {
    try {
      const preferences = { theme, fontSize, scrollMode };
      await AsyncStorage.setItem("reading_preferences", JSON.stringify(preferences));
    } catch (error) {
      console.error("Error saving reading preferences:", error);
    }
  };

  const toggleBookmark = async () => {
    try {
      const isBookmarked = bookmarks.includes(currentPage);
      let updatedBookmarks;

      if (isBookmarked) {
        updatedBookmarks = bookmarks.filter((page) => page !== currentPage);
      } else {
        updatedBookmarks = [...bookmarks, currentPage];
      }

      setBookmarks(updatedBookmarks);
      await AsyncStorage.setItem(
        `bookmarks_${bookId}`,
        JSON.stringify(updatedBookmarks)
      );

      Alert.alert(
        isBookmarked ? "Bookmark Removed" : "Bookmark Added",
        isBookmarked ? "Page removed from bookmarks" : "Page added to bookmarks"
      );
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  };

  const goToBookmark = (page) => {
   updateReadingProgress(page);
    setShowBookmarks(false);
  };

  const goToNextPage = () => {
    if (currentPage < chapters.length) {
      updateReadingProgress(currentPage + 1);
      
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      updateReadingProgress(currentPage - 1);
    }
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  const renderContent = () => {
    if (chapters.length === 0) return null;

    const currentChapter = chapters.find((chapter) => chapter.page === currentPage);
    if (!currentChapter) return null;

    return (
      <ScrollView
      style={styles.scrollableContent}
      scrollEnabled={true}
      showsVerticalScrollIndicator={true}
      contentContainerStyle={{ padding: 16 }}
    >
      <Pressable
        onPress={toggleControls}
        style={{ flex: 1 }}
      >
        <Text style={styles.chapterTitle}>{currentChapter.title}</Text>

      <HtmlContent
        html={currentChapter.content}
        fontSize={fontSize}
        color={
          theme === "dark"
            ? "#e0e0e0"
            : theme === "sepia"
            ? "#5b4636"
            : "#212121"
        }
      />
        </Pressable>
    </ScrollView>
    );
  };

  const renderContinuousContent = () => {
  return (
     <ScrollView
      style={styles.continuousScrollContainer}
      scrollEventThrottle={16}
      onScroll={(event) => {
        const scrollPosition = event.nativeEvent.contentOffset.y;
        const scrollViewHeight = event.nativeEvent.layoutMeasurement.height;
        const contentHeight = event.nativeEvent.contentSize.height;

        if (contentHeight > 0) {
          const scrollPercentage =
            scrollPosition / (contentHeight - scrollViewHeight);
          const newPage = Math.max(
            1,
            Math.min(chapters.length, Math.ceil(scrollPercentage * chapters.length))
          );

          if (newPage !== lastSyncedPage) {
            setLastSyncedPage(newPage);
            updateReadingProgress(newPage);

             const totalPages = chapters.length;
              const progress =
                totalPages > 1
                  ? Math.round(((newPage - 1) / (totalPages - 1)) * 100)
                  : 100;

              setReadingProgress(progress);
          }
        }
      }}
     >
        {chapters.map((chapter) => (
        <Pressable
          key={chapter.id}
          onPress={toggleControls}
          style={styles.continuousPageContainer}
        >
          <Text style={styles.chapterTitle}>{chapter.title}</Text>
            <HtmlContent
              html={chapter.content}
              fontSize={fontSize}
              color={
                theme === "dark"
                  ? "#e0e0e0"
                  : theme === "sepia"
                  ? "#5b4636"
                  : "#212121"
              }
            />
          </Pressable>
        ))}
        </ScrollView>
    );
  };


  const renderControls = () => {
  if (!showControls || chapters.length === 0) return null;

  return (
    <View
      style={styles.controlsContainer}
      pointerEvents="box-none"
    >

      {/* TOP CONTROLS */}
      <View style={styles.topControls} pointerEvents="auto">
       <TouchableOpacity
          onPress={() => {
            if (route.params?.onGoBack) {
              route.params.onGoBack(); // 🔥 refresh library
            }
            navigation.navigate("Library",{refresh: true});
          }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.pageIndicator}>
          {currentPage}/{chapters.length}
        </Text>

        <View style={styles.topRightControls}>
          <TouchableOpacity onPress={toggleBookmark} style={styles.iconButton}>
            <MaterialIcons
              name={bookmarks.includes(currentPage)
                ? "bookmark"
                : "bookmark-border"}
              size={24}
              color="#fff"
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowBookmarks(true)}
            style={styles.iconButton}
          >
            <MaterialIcons name="bookmarks" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowSettings(true)}
            style={styles.settingsButton}
          >
            <MaterialIcons name="settings" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* BOTTOM CONTROLS */}
      <View style={styles.bottomControls} pointerEvents="auto">
        <TouchableOpacity
          onPress={goToPreviousPage}
          disabled={currentPage === 1}
        >
          <MaterialIcons
            name="navigate-before"
            size={30}
            color={currentPage === 1 ? "#aaa" : "#fff"}
          />
        </TouchableOpacity>

       <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${readingProgress}%` },
            ]}
          />
        </View>

        <Text style={styles.progressText}>
          {currentPage} / {chapters.length} • {readingProgress}%
        </Text>
       </View>

        <TouchableOpacity
          onPress={goToNextPage}
          disabled={currentPage === chapters.length}
        >
          <MaterialIcons
            name="navigate-next"
            size={30}
            color={currentPage === chapters.length ? "#aaa" : "#fff"}
          />
        </TouchableOpacity>
      </View>

      {/* FONT SIZE */}
      <View style={styles.fontSizeControls} pointerEvents="auto">
        <TouchableOpacity
          onPress={() => setFontSize(Math.max(12, fontSize - 2))}
        >
          <MaterialIcons name="remove" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.fontSizeText}>Text Size</Text>

        <TouchableOpacity
          onPress={() => setFontSize(Math.min(24, fontSize + 2))}
        >
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
        onRequestClose={() => {
          setShowSettings(false);
          saveReadingPreferences();
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reading Settings</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowSettings(false);
                  saveReadingPreferences();
                }}
              >
                <MaterialIcons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.settingSection}>
              <Text style={styles.settingTitle}>Theme</Text>
              <View style={styles.themeOptions}>
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    theme === "light" && styles.selectedTheme,
                  ]}
                  onPress={() => setTheme("light")}
                >
                  <View style={styles.themePreview}>
                    <View style={styles.lightThemePreview} />
                  </View>
                  <Text>Light</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    theme === "dark" && styles.selectedTheme,
                  ]}
                  onPress={() => setTheme("dark")}
                >
                  <View style={styles.themePreview}>
                    <View style={styles.darkThemePreview} />
                  </View>
                  <Text>Dark</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    theme === "sepia" && styles.selectedTheme,
                  ]}
                  onPress={() => setTheme("sepia")}
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
                  style={{ flex: 1, marginHorizontal: 10 }}
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
                  style={[
                    styles.scrollModeOption,
                    scrollMode === "paginated" && styles.selectedScrollMode,
                  ]}
                  onPress={() => setScrollMode("paginated")}
                >
                  <MaterialIcons
                    name="book"
                    size={24}
                    color={scrollMode === "paginated" ? "#6200ee" : "#757575"}
                  />
                  <Text
                    style={
                      scrollMode === "paginated"
                        ? styles.selectedOptionText
                        : {}
                    }
                  >
                    Paginated
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.scrollModeOption,
                    scrollMode === "continuous" && styles.selectedScrollMode,
                  ]}
                  onPress={() => setScrollMode("continuous")}
                >
                  <MaterialIcons
                    name="subject"
                    size={24}
                    color={scrollMode === "continuous" ? "#6200ee" : "#757575"}
                  />
                  <Text
                    style={
                      scrollMode === "continuous"
                        ? styles.selectedOptionText
                        : {}
                    }
                  >
                    Continuous
                  </Text>
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
                <MaterialIcons
                  name="bookmark-border"
                  size={48}
                  color="#757575"
                />
                <Text style={styles.emptyBookmarksText}>No bookmarks yet</Text>
                <Text style={styles.emptyBookmarksSubtext}>
                  Tap the bookmark icon while reading to add bookmarks
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.bookmarksList}>
                {bookmarks
                  .sort((a, b) => a - b)
                  .map((page) => (
                    <TouchableOpacity
                      key={page}
                      style={styles.bookmarkItem}
                      onPress={() => goToBookmark(page)}
                    >
                      <MaterialIcons
                        name="bookmark"
                        size={24}
                        color="#6200ee"
                      />
                      <Text style={styles.bookmarkText}>Page {page}</Text>
                      <TouchableOpacity
                        style={styles.removeBookmark}
                        onPress={() => {
                          const updatedBookmarks = bookmarks.filter(
                            (p) => p !== page
                          );
                          setBookmarks(updatedBookmarks);
                          AsyncStorage.setItem(
                            `bookmarks_${bookId}`,
                            JSON.stringify(updatedBookmarks)
                          );
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

  if (chapters.length === 0) {
    return (
      <View style={styles.centered}>
        <MaterialIcons name="book" size={48} color="#757575" />
        <Text style={styles.errorText}>No chapters available</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchBookDetails}>
          <Text style={styles.retryButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        theme === "dark" && styles.darkContainer,
        theme === "sepia" && styles.sepiaContainer,
      ]}
    >
      <StatusBar
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
      />

      {scrollMode === "paginated" ? renderContent() : renderContinuousContent()}
      
      {renderControls()}
      {renderSettingsModal()}
      {renderBookmarksModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  darkContainer: {
    backgroundColor: "#121212",
  },
  sepiaContainer: {
    backgroundColor: "#f8f1e3",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#757575",
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: "#b00020",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#6200ee",
    borderRadius: 4,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  contentContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  scrollableContent: {
    flex: 1,
  },
  continuousScrollContainer: {
    flex: 1,
    padding: 20,
  },
  continuousPageContainer: {
    marginBottom: 40,
  },
  chapterTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#6200ee",
  },
  controlsContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  topControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  topRightControls: {
    flexDirection: "row",
    alignItems: "center",
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
    color: "#fff",
    fontSize: 16,
  },
  bottomControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  navButton: {
    padding: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  progressContainer: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 16,
  },
    progressBarBackground: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
  height: 4,
  backgroundColor: "#6200ee",
  },
  progressSlider: {
    width: "100%",
  },
  progressText: {
     marginTop: 6,
    color: "#fff",
    fontSize: 12,
    opacity: 0.9,
  },
  fontSizeControls: {
    position: "absolute",
    right: 16,
    top: "50%",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 20,
    padding: 8,
    alignItems: "center",
  },
  fontSizeText: {
    color: "#fff",
    fontSize: 12,
    marginVertical: 8,
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
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  settingSection: {
    marginBottom: 20,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 10,
  },
  themeOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  themeOption: {
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    width: "30%",
  },
  selectedTheme: {
    borderColor: "#6200ee",
    backgroundColor: "rgba(98, 0, 238, 0.1)",
  },
  themePreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
  },
  lightThemePreview: {
    flex: 1,
    backgroundColor: "#fff",
  },
  darkThemePreview: {
    flex: 1,
    backgroundColor: "#121212",
  },
  sepiaThemePreview: {
    flex: 1,
    backgroundColor: "#f8f1e3",
  },
  continuousScrollContainerWrapper: {
  flex: 1,
  padding: 20,
},
  fontSizeSlider: {
    flexDirection: "row",
    alignItems: "center",
  },
  scrollModeOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  scrollModeOption: {
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    width: "45%",
  },
  selectedScrollMode: {
    borderColor: "#6200ee",
    backgroundColor: "rgba(98, 0, 238, 0.1)",
  },
  selectedOptionText: {
    color: "#6200ee",
    fontWeight: "500",
  },
  // Bookmarks styles
  bookmarksList: {
    maxHeight: 300,
  },
  bookmarkItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
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
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyBookmarksText: {
    fontSize: 18,
    fontWeight: "500",
    marginTop: 10,
    marginBottom: 5,
  },
  emptyBookmarksSubtext: {
    fontSize: 14,
    color: "#757575",
    textAlign: "center",
  },
}); 