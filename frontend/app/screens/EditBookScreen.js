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
  Image,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { BooksAPI } from "../api/books";
import { useNavigation, useRoute } from "@react-navigation/native";
import GenreDropdown from "../components/GenreDropdown";
import { API_URL } from "@env";

export default function EditBookScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { bookId, fetchBooks } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    genre: [],
    author: "",
    coverImage: null,
    existingCoverImage: null,
  });

  useEffect(() => {
    fetchBookDetails();
  }, [bookId]);

  const fetchBookDetails = async () => {
    try {
      const response = await BooksAPI.getById(`books/readbyid/${bookId}`);
      const book = response.data;
      setFormData({
        title: book.title || "",
        description: book.previewText || "",
        genre: Array.isArray(book.genre)
          ? book.genre
          : book.genre
          ? [book.genre]
          : [],
        author: book.author?.name || "",
        coverImage: null,
        existingCoverImage: book.coverImage || null,
      });
      console.log(formData, "Fetched book details:", book);
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

  const handlePickImage = async () => {
    try {
      // Request permission to access media library
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "We need permission to access your photo library to select a cover image."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        const maxSizeInBytes = 5 * 1024 * 1024;
        if (asset.fileSize && asset.fileSize > maxSizeInBytes) {
          Alert.alert("Error", "Image size must be less than 5MB");
          return;
        }

        // Generate unique filename
        const timestamp = Date.now();
        const newName = `cover_${timestamp}.jpg`;

        // Update form data with new image
        setFormData((prev) => ({
          ...prev,
          coverImage: {
            uri: asset.uri,
            name: newName,
            type: asset.mimeType || "image/jpeg",
            fileSize: asset.fileSize,
          },
        }));

        console.log("[v0] Image selected successfully:", newName);
      }
    } catch (err) {
      console.error("[v0] Image picker error:", err);
      Alert.alert("Error", "Failed to open image picker. Please try again.");
    }
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
      const form = new FormData();
      form.append("title", formData.title);
      form.append("previewText", formData.description);
      form.append("genre", JSON.stringify(formData.genre));
      form.append("author", formData.author);

      // Only append image if a new one was selected
      if (formData.coverImage) {
        form.append("coverImage", {
          uri: formData.coverImage.uri,
          name: formData.coverImage.name,
          type: formData.coverImage.type,
        });
      }

      const response = await fetch(`${API_URL}/books/read/${bookId}`, {
        method: "PATCH",
        body: form,
      });

      if (response.ok) {
        Alert.alert("Success", "Book updated successfully!");
        fetchBooks();
        navigation.goBack();
      } else {
        throw new Error("Failed to update book");
      }
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
          <Text style={styles.label}>Cover Image</Text>
          <TouchableOpacity
            style={styles.imagePicker}
            onPress={handlePickImage}
          >
            {formData.coverImage ? (
              <Image
                source={{ uri: formData.coverImage.uri }}
                style={styles.coverPreview}
              />
            ) : formData.existingCoverImage ? (
              <Image
                source={{ uri: `${API_URL}${formData.existingCoverImage}` }}
                style={styles.coverPreview}
              />
            ) : (
              <Text style={{ color: "#999" }}>Tap to change cover image</Text>
            )}
          </TouchableOpacity>
        </View>

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
            placeholder="Enter author name"
            value={formData.author}
            onChangeText={(value) => handleInputChange("author", value)}
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
  imagePicker: {
    height: 150,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9f9f9",
    marginBottom: 15,
  },
  coverPreview: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
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
