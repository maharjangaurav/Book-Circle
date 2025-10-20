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
  SafeAreaView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { BooksAPI } from "../api/books";
import { useNavigation, useRoute } from "@react-navigation/native";
import GenreDropdown from "../components/GenreDropdown";
import { useAuth } from "../context/AuthContext";

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
    setLoading(true);
    try {
      const response = await BooksAPI.create("books/create", {
        title: formData.title,
        previewText: formData.description,
        genre: formData.genre,
        author: formData.author,
        status: "draft",
      });
      fetchBooks();

      Alert.alert("Success", "Book created successfully!");
      navigation.goBack();
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
});
