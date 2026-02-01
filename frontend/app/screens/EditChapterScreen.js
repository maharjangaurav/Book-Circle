"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { BooksAPI } from "../api/books";
import { useRoute, useNavigation } from "@react-navigation/native";

export default function EditChapterScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { fetchChapters, chapterId, bookId } = route.params;

  const [chapterData, setChapterData] = useState({
    title: "",
    order_number: "",
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchChapterData();
  }, [chapterId]);

  const fetchChapterData = async () => {
    try {
      setLoading(true);
      const response = await BooksAPI.getById(`chapter/readbyid/${chapterId}`);
     // ✅ Check response structure
       if (!response || !response.success || !response.data) {
      Alert.alert("Error", "Failed to load chapter data");
      return;
      const chapter = response.data;  // ✅ Extract chapter from data
    setChapterData({
      title: chapter.title,
      order_number: chapter.order_number.toString(),
    });
    }
    } catch (error) {
      console.error("Error fetching chapter:", error);
      Alert.alert("Error", "Failed to load chapter data");
    } finally {
      setLoading(false);
    }
  };

 const handleUpdateChapter = async () => {
  if (!chapterData.title.trim()) {
    Alert.alert("Error", "Please enter a chapter title");
    return;
  }

  if (!chapterData.order_number.trim()) {
    Alert.alert("Error", "Please enter a chapter number");
    return;
  }

  setUpdating(true);
  try {
    const response = await BooksAPI.update(`chapter/read/${chapterId}`, {
      title: chapterData.title,
      order_number: Number.parseInt(chapterData.order_number),
      book: bookId,
    });
    
    if (response?.success) {
      Alert.alert("Success", "Chapter updated successfully!", [
        {
          text: "OK",
          onPress: () => {
            // 🔥 Navigate to ManageChapters
            navigation.navigate("ManageChapters", {
              bookId: bookId,
              refreshChapters: true,
              showSuccess: true,
              successMessage: "Chapter updated successfully!"
            });
          }
        }
      ]);
    } else {
      Alert.alert("Error", response?.message);
    }
  } catch (error) {
    console.error("Error updating chapter:", error);
    Alert.alert("Error", "Failed to update chapter");
  } finally {
    setUpdating(false);
  }
};

const handleDeleteChapter = () => {
  Alert.alert(
    "Delete Chapter",
    "Are you sure you want to delete this chapter?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
           await BooksAPI.delete(`chapter/read/${bookId}/${chapterId}`);
            
            Alert.alert("Success", "Chapter deleted successfully!", [
              {
                text: "OK",
                onPress: () => {
                  // 🔥 Navigate to ManageChapters
                  navigation.navigate("ManageChapters", {
                    bookId: bookId,
                    refreshChapters: true,
                    showSuccess: true,
                    successMessage: "Chapter deleted successfully!"
                  });
                }
              }
            ]);
          } catch (error) {
            console.error("Error deleting chapter:", error);
            Alert.alert("Error", "Failed to delete chapter");
          }
        },
      },
    ]
  );
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
        <TouchableOpacity  onPress={() => {
      // 🔥 Go back to ManageChapters
      navigation.navigate("ManageChapters", {
        bookId: bookId,
        refreshChapters: false
      });
    }} >
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Chapter</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.label}>Chapter Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 1, 2, 3..."
            keyboardType="numeric"
            value={chapterData.order_number}
            onChangeText={(text) =>
              setChapterData({ ...chapterData, order_number: text })
            }
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Chapter Title</Text>
          <TextInput
            style={[styles.input, styles.titleInput]}
            placeholder="Enter chapter title"
            multiline
            value={chapterData.title}
            onChangeText={(text) =>
              setChapterData({ ...chapterData, title: text })
            }
          />
        </View>

        <View style={styles.infoSection}>
          <MaterialIcons name="info" size={20} color="#0A84FF" />
          <Text style={styles.infoText}>
            You can edit the chapter content in the Content Editor
          </Text>
        </View>
      </ScrollView>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDeleteChapter}
        >
          <MaterialIcons name="delete" size={20} color="#f44336" />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.primaryButton,
            updating && styles.buttonDisabled,
          ]}
          onPress={handleUpdateChapter}
          disabled={updating}
        >
          <MaterialIcons name="check" size={20} color="#fff" />
          <Text style={styles.primaryButtonText}>
            {updating ? "Updating..." : "Update Chapter"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  section: {
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
  titleInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  infoSection: {
    flexDirection: "row",
    backgroundColor: "#e3f2fd",
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#0A84FF",
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  deleteButton: {
    backgroundColor: "#ffebee",
    borderWidth: 1,
    borderColor: "#ffcdd2",
  },
  deleteButtonText: {
    color: "#f44336",
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: "#6200ee",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
