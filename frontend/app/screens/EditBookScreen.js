"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { BooksAPI } from "../api/books";
import { useNavigation, useRoute } from "@react-navigation/native";
import GenreDropdown from "../components/GenreDropdown";

export default function EditBookScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { bookId, fetchBooks } = route.params;
  const [book, setBook] = useState();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    genre: [],
    author: "",
  });

  useEffect(() => {
    fetchBookDetails();
  }, []);

  const fetchBookDetails = async () => {
    try {
      const response = await BooksAPI.getById(`books/readbyid/${bookId}`);
      const book = response.data;
      console.log("Fetched book details:", book);
      setFormData({
        title: book.title || "",
        description: book.previewText || "",
        genre: Array.isArray(book.genre)
          ? book.genre
          : book.genre
          ? [book.genre]
          : [],
        author: book.author._id || "",
      });
      setBook(book);
    } catch (error) {
      console.error("Error fetching book details:", error);
      Alert.alert("Error", "Failed to load book details");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGenreChange = (genres) => {
    setFormData((prev) => ({
      ...prev,
      genre: genres,
    }));
  };

  const handleSaveBook = async () => {
    if (!formData.title.trim()) {
      Alert.alert("Error", "Please enter a book title");
      return;
    }

    if (formData.genre.length === 0) {
      Alert.alert("Error", "Please select at least one genre");
      return;
    }

    setSaving(true);
    try {
      await BooksAPI.update(`books/read/${bookId}`, {
        title: formData.title,
        previewText: formData.description,
        genre: formData.genre,
        author: formData.author,
      });

      Alert.alert("Success", "Book updated successfully!");
      fetchBooks();
      navigation.goBack();
    } catch (error) {
      console.error("Error updating book:", error);
      Alert.alert("Error", "Failed to update book");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Book Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Book Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter book title"
            value={formData.title}
            onChangeText={(value) => handleInputChange("title", value)}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Author</Text>
          <TextInput
            style={styles.input}
            editable={false}
            selectTextOnFocus={false}
            value={book.author.name || ""}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Genres *</Text>
          <GenreDropdown
            selectedGenres={formData.genre}
            onGenresChange={handleGenreChange}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter book description"
            value={formData.description}
            onChangeText={(value) => handleInputChange("description", value)}
            placeholderTextColor="#999"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.buttonDisabled]}
          onPress={handleSaveBook}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="save" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#333",
    backgroundColor: "#f9f9f9",
  },
  textArea: {
    height: 120,
    paddingTop: 10,
  },
  saveButton: {
    backgroundColor: "#6200ee",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 30,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
