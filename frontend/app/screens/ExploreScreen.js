import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  Image,
  ScrollView,
  Switch,
  Animated,
  Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BooksAPI } from '../api/books';
import { useNavigation } from '@react-navigation/native';

export default function ExploreScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeGenre, setActiveGenre] = useState('All');
  const [activeRating, setActiveRating] = useState('All');
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [hasSearched, setHasSearched] = useState(false);
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const scrollX = React.useRef(new Animated.Value(0)).current;
  const { width: windowWidth } = Dimensions.get('window');

  // Genre options
  const genres = [
    'All',
    'Fiction',
    'Non-Fiction',
    'Romance',
    'Sci-Fi',
    'Mystery',
    'Biography',
    'Self-Help'
  ];

  // Rating options
  const ratings = [
    'All',
    '5+ Stars',
    '4+ Stars',
    '3+ Stars'
  ];
  
  useEffect(() => {
    loadFeaturedBooks();
  }, []);
  
  const loadFeaturedBooks = () => {
    // In a real app, this would be an API call
    const featured = [
      { id: 2, title: 'To Kill a Mockingbird', author: 'Harper Lee', genre: 'Fiction', rating: 4.8, isPremium: true, coverImage: `https://via.placeholder.com/300x450`, preview: 'When he was nearly thirteen, my brother Jem got his arm badly broken at the elbow.' },
      { id: 4, title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'Non-Fiction', rating: 4.7, isPremium: true, coverImage: `https://via.placeholder.com/300x450`, preview: 'About 13.5 billion years ago, matter, energy, time and space came into being in what is known as the Big Bang.' },
      { id: 7, title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', rating: 4.8, isPremium: true, coverImage: `https://via.placeholder.com/300x450`, preview: 'The fate of British Cycling changed one day in 2003.' }
    ];
    setFeaturedBooks(featured);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() && activeGenre === 'All' && activeRating === 'All' && !premiumOnly) return;
    
    setLoading(true);
    setIsSearching(true);
    setHasSearched(true);
    
    try {
      // Build query parameters
      const params = {};
      
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      
      if (activeGenre !== 'All') {
        params.genre = activeGenre;
      }
      
      if (activeRating !== 'All') {
        // Extract the number from the rating string (e.g., "4+ Stars" -> 4)
        const ratingValue = parseInt(activeRating.split('+')[0]);
        params.min_rating = ratingValue;
      }
      
      if (premiumOnly) {
        params.premium = true;
      }
      
      // In a real implementation, we would use the actual API with params
      // const results = await BooksAPI.search(params);
      
      // For now, simulate search results with filtering
      setTimeout(() => {
        const mockBooks = [
          { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', genre: 'Fiction', rating: 4.5, isPremium: false, coverImage: `https://via.placeholder.com/150`, preview: 'In my younger and more vulnerable years my father gave me some advice that I\'ve been turning over in my mind ever since.' },
          { id: 2, title: 'To Kill a Mockingbird', author: 'Harper Lee', genre: 'Fiction', rating: 4.8, isPremium: true, coverImage: `https://via.placeholder.com/150`, preview: 'When he was nearly thirteen, my brother Jem got his arm badly broken at the elbow.' },
          { id: 3, title: '1984', author: 'George Orwell', genre: 'Sci-Fi', rating: 4.6, isPremium: false, coverImage: `https://via.placeholder.com/150`, preview: 'It was a bright cold day in April, and the clocks were striking thirteen.' },
          { id: 4, title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'Non-Fiction', rating: 4.7, isPremium: true, coverImage: `https://via.placeholder.com/150`, preview: 'About 13.5 billion years ago, matter, energy, time and space came into being in what is known as the Big Bang.' },
          { id: 5, title: 'Becoming', author: 'Michelle Obama', genre: 'Biography', rating: 4.9, isPremium: false, coverImage: `https://via.placeholder.com/150`, preview: 'I spent much of my childhood listening to the sound of striving.' },
          { id: 6, title: 'Pride and Prejudice', author: 'Jane Austen', genre: 'Romance', rating: 4.7, isPremium: false, coverImage: `https://via.placeholder.com/150`, preview: 'It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.' },
          { id: 7, title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', rating: 4.8, isPremium: true, coverImage: `https://via.placeholder.com/150`, preview: 'The fate of British Cycling changed one day in 2003.' },
          { id: 8, title: 'The Silent Patient', author: 'Alex Michaelides', genre: 'Mystery', rating: 4.5, isPremium: true, coverImage: `https://via.placeholder.com/150`, preview: 'Alicia Berenson was thirty-three years old when she killed her husband.' }
        ];
        
        // Filter based on search parameters
        let filteredResults = mockBooks;
        
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          filteredResults = filteredResults.filter(book => 
            book.title.toLowerCase().includes(query) || 
            book.author.toLowerCase().includes(query) ||
            book.preview.toLowerCase().includes(query)
          );
        }
        
        if (activeGenre !== 'All') {
          filteredResults = filteredResults.filter(book => book.genre === activeGenre);
        }
        
        if (activeRating !== 'All') {
          const minRating = parseInt(activeRating.split('+')[0]);
          filteredResults = filteredResults.filter(book => book.rating >= minRating);
        }
        
        if (premiumOnly) {
          filteredResults = filteredResults.filter(book => book.isPremium);
        }
        
        setSearchResults(filteredResults);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Search error:', error);
      setLoading(false);
    }
  };

  const renderGenreItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.filterChip, activeGenre === item && styles.activeFilterChip]}
      onPress={() => {
        setActiveGenre(item);
        handleSearch();
      }}
    >
      <Text style={[styles.filterChipText, activeGenre === item && styles.activeFilterChipText]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderRatingItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.filterChip, activeRating === item && styles.activeFilterChip]}
      onPress={() => {
        setActiveRating(item);
        handleSearch();
      }}
    >
      <Text style={[styles.filterChipText, activeRating === item && styles.activeFilterChipText]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderBookItem = ({ item }) => (
    <TouchableOpacity 
      style={viewMode === 'grid' ? styles.gridBookCard : styles.listBookCard}
      onPress={() => navigation.navigate('BookDetail', { bookId: item.id })}
    >
      <View style={viewMode === 'grid' ? styles.gridImageContainer : styles.listImageContainer}>
        <Image 
          source={{ uri: item.coverImage ? item.coverImage.replace(/`/g, '') : 'https://via.placeholder.com/150' }} 
          style={viewMode === 'grid' ? styles.gridCoverImage : styles.listCoverImage} 
          resizeMode="cover"
        />
        {item.isPremium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>PREMIUM</Text>
          </View>
        )}
      </View>
      <View style={viewMode === 'grid' ? styles.gridBookContent : styles.listBookContent}>
        <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.bookAuthor} numberOfLines={1}>{item.author}</Text>
        <View style={styles.ratingContainer}>
          <MaterialIcons name="star" size={16} color="#FFC107" />
          <Text style={styles.ratingText}>{item.rating}</Text>
        </View>
        {viewMode === 'list' && (
          <Text style={styles.previewText} numberOfLines={2}>{item.preview}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderFeaturedCarousel = () => {
    return (
      <View style={styles.carouselContainer}>
        <Text style={styles.carouselTitle}>Featured Books</Text>
        <View style={styles.carouselWrapper}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
          >
            {featuredBooks.map((book, index) => (
              <TouchableOpacity 
                key={`featured-${book.id}`}
                style={styles.carouselItem}
                onPress={() => navigation.navigate('BookDetail', { bookId: book.id })}
              >
                <Image 
                  source={{ uri: book.coverImage ? book.coverImage.replace(/`/g, '') : 'https://via.placeholder.com/300x450' }} 
                  style={styles.carouselImage} 
                  resizeMode="cover"
                />
                <View style={styles.carouselOverlay}>
                  <Text style={styles.carouselBookTitle}>{book.title}</Text>
                  <Text style={styles.carouselBookAuthor}>{book.author}</Text>
                  {book.isPremium && (
                    <View style={styles.carouselPremiumBadge}>
                      <Text style={styles.carouselPremiumText}>PREMIUM</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.paginationContainer}>
            {featuredBooks.map((_, index) => {
              const inputRange = [
                (index - 1) * windowWidth,
                index * windowWidth,
                (index + 1) * windowWidth
              ];
              const dotWidth = scrollX.interpolate({
                inputRange,
                outputRange: [8, 16, 8],
                extrapolate: 'clamp'
              });
              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.3, 1, 0.3],
                extrapolate: 'clamp'
              });
              return (
                <Animated.View
                  key={`dot-${index}`}
                  style={[styles.paginationDot, { width: dotWidth, opacity }]}
                />
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <MaterialIcons name="search" size={24} color="#757575" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search books by title, author, or genre"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => {
                setSearchQuery('');
                if (hasSearched) handleSearch();
              }}
              style={styles.clearButton}
            >
              <MaterialIcons name="close" size={20} color="#757575" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <MaterialIcons name="search" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Featured Books Carousel */}
      {!hasSearched && renderFeaturedCarousel()}

      {/* Filters Section */}
      <View style={styles.filtersContainer}>
        {/* Genre Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Genre</Text>
          <FlatList
            data={genres}
            renderItem={renderGenreItem}
            keyExtractor={item => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipsContainer}
          />
        </View>
        
        {/* Rating Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Rating</Text>
          <FlatList
            data={ratings}
            renderItem={renderRatingItem}
            keyExtractor={item => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipsContainer}
          />
        </View>
        
        {/* Premium Toggle and View Mode */}
        <View style={styles.filterRow}>
          <View style={styles.premiumToggleContainer}>
            <Text style={styles.premiumToggleLabel}>Premium Only</Text>
            <Switch
              value={premiumOnly}
              onValueChange={(value) => {
                setPremiumOnly(value);
                handleSearch();
              }}
              trackColor={{ false: '#e0e0e0', true: '#b39ddb' }}
              thumbColor={premiumOnly ? '#6200ee' : '#f5f5f5'}
            />
          </View>
          
          <View style={styles.viewModeContainer}>
            <TouchableOpacity 
              style={[styles.viewModeButton, viewMode === 'grid' && styles.activeViewModeButton]} 
              onPress={() => setViewMode('grid')}
            >
              <MaterialIcons name="grid-view" size={24} color={viewMode === 'grid' ? '#6200ee' : '#757575'} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.viewModeButton, viewMode === 'list' && styles.activeViewModeButton]} 
              onPress={() => setViewMode('list')}
            >
              <MaterialIcons name="view-list" size={24} color={viewMode === 'list' ? '#6200ee' : '#757575'} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Results Section */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text>Searching...</Text>
        </View>
      ) : !hasSearched ? (
        <View style={styles.placeholderContainer}>
          <MaterialIcons name="search" size={64} color="#e0e0e0" />
          <Text style={styles.placeholderText}>Search for books</Text>
          <Text style={styles.placeholderSubtext}>Find your next favorite read</Text>
        </View>
      ) : searchResults.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="sentiment-dissatisfied" size={64} color="#e0e0e0" />
          <Text style={styles.emptyText}>No results found</Text>
          <Text style={styles.placeholderSubtext}>Try adjusting your search or filters</Text>
        </View>
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderBookItem}
          contentContainerStyle={styles.resultsContainer}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode} // Force re-render when view mode changes
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  carouselContainer: {
    marginVertical: 16,
  },
  carouselTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    paddingHorizontal: 16,
    color: '#212121',
  },
  carouselWrapper: {
    position: 'relative',
  },
  carouselItem: {
    width: Dimensions.get('window').width,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselImage: {
    width: '90%',
    height: '100%',
    borderRadius: 12,
  },
  carouselOverlay: {
    position: 'absolute',
    bottom: 0,
    left: '5%',
    right: '5%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  carouselBookTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  carouselBookAuthor: {
    color: '#e0e0e0',
    fontSize: 14,
  },
  carouselPremiumBadge: {
    position: 'absolute',
    top: -30,
    right: 12,
    backgroundColor: '#ffd700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  carouselPremiumText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#212121',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6200ee',
    marginHorizontal: 4,
  },
  // Search Bar Styles
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 8,
    height: 48,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  
  // Filters Section Styles
  filtersContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterSection: {
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#212121',
  },
  filterChipsContainer: {
    paddingBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeFilterChip: {
    backgroundColor: '#ede7f6',
    borderColor: '#6200ee',
  },
  filterChipText: {
    fontSize: 14,
    color: '#757575',
  },
  activeFilterChipText: {
    color: '#6200ee',
    fontWeight: '500',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  premiumToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumToggleLabel: {
    fontSize: 14,
    marginRight: 8,
    color: '#212121',
  },
  viewModeContainer: {
    flexDirection: 'row',
  },
  viewModeButton: {
    padding: 8,
    marginLeft: 8,
  },
  activeViewModeButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  
  // Book Card Styles - Grid View
  gridBookCard: {
    flex: 1,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
    maxWidth: '47%',
  },
  gridImageContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  gridCoverImage: {
    width: '100%',
    height: '100%',
  },
  gridBookContent: {
    padding: 12,
  },
  
  // Book Card Styles - List View
  listBookCard: {
    flexDirection: 'row',
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  listImageContainer: {
    position: 'relative',
    width: 100,
    height: 150,
  },
  listCoverImage: {
    width: '100%',
    height: '100%',
  },
  listBookContent: {
    flex: 1,
    padding: 12,
  },
  
  // Common Book Card Elements
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFC107',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#212121',
    marginLeft: 4,
  },
  previewText: {
    fontSize: 14,
    color: '#616161',
    marginTop: 8,
    fontStyle: 'italic',
  },
  
  // Loading and Empty States
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#757575',
    marginTop: 16,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#9e9e9e',
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#757575',
    marginTop: 16,
  },
  resultsContainer: {
    padding: 8,
  },
});
