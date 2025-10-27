"use client";

import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { BooksAPI } from "../api/books";
import { useNavigation, useRoute } from "@react-navigation/native";
import GenreDropdown from "../components/GenreDropdown";
import { useAuth } from "../context/AuthContext";
import * as ImagePicker from "expo-image-picker";
import { API_URL } from "@env";

export default function CreateBookScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { fetchBooks } = route.params;
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    genre: "",
    author: "",
    coverImage: null,
  });

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

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4], // Standard book cover aspect ratio
        quality: 0.8, // Compress image to 80% quality
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        // Validate image size (max 5MB)
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

  useEffect(() => {
    if (user?.id) {
      setFormData((prev) => ({ ...prev, author: user.id }));
    }
  }, [user]);

  const handleCreateBook = async () => {
    if (!formData.title.trim()) {
      Alert.alert("Error", "Please enter a book title");
      return;
    }

    if (formData.genre.length === 0) {
      Alert.alert("Error", "Please select at least one genre");
      return;
    }

    if (!formData.coverImage) {
      Alert.alert("Error", "Please upload a cover image");
      return;
    }

    setLoading(true);

    try {
      const form = new FormData();
      form.append("title", formData.title);
      form.append("previewText", formData.description);
      form.append("genre", JSON.stringify(formData.genre));
      form.append("author", formData.author);
      form.append("status", "draft");
      form.append("coverImage", {
        uri: formData.coverImage.uri,
        name: formData.coverImage.name,
        type: formData.coverImage.type,
      });
      console.log(form, "Creating book with data:", formData);
      const response = await fetch(`${API_URL}/books/create`, {
        method: "POST",
        body: form,
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", "Book created successfully!");
        fetchBooks();
        navigation.goBack();
      } else {
        throw new Error(data.message || "Failed to create book");
      }
    } catch (error) {
      console.error("Error creating book:", error);
      Alert.alert("Error", "Failed to create book");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New Book</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Cover Image *</Text>
          <TouchableOpacity
            style={styles.imagePicker}
            onPress={handlePickImage}
          >
            {formData.coverImage ? (
              <Image
                source={{ uri: formData.coverImage.uri }}
                style={styles.coverPreview}
              />
            ) : (
              <Text style={{ color: "#999" }}>Tap to upload cover image</Text>
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
            style={[styles.input, { color: "#555" }]}
            value={user.name}
            editable={false}
            selectTextOnFocus={false}
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
          style={[styles.createButton, loading && styles.buttonDisabled]}
          onPress={handleCreateBook}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="add-circle" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create Book</Text>
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
  createButton: {
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
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
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
});
