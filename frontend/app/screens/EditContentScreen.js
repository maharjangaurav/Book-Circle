"use client";

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  RichEditor,
  RichToolbar,
  actions,
} from "react-native-pell-rich-editor";
import { BooksAPI } from "../api/books";
import { useRoute, useNavigation } from "@react-navigation/native";

export default function EditContentScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { chapterId, bookId, chapterTitle } = route.params;

  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const richTextRef = React.useRef();

  useEffect(() => {
    fetchChapterContent();
  }, [chapterId]);

  const fetchChapterContent = async () => {
    try {
      setLoading(true);
      const response = await BooksAPI.getById(`chapter/readbyid/${chapterId}`);
      // ✅ Check response structure
    if (!response || !response.success || !response.data) {
      Alert.alert("Error", "Failed to load chapter content");
      setContent("");
      return;
    }
    
    setContent(response.data.content || "");  // ✅ Correct path
    } catch (error) {
      console.error("Error fetching chapter:", error);
      Alert.alert("Error", "Failed to load chapter content");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContent = async () => {
    if (!content.trim()) {
      Alert.alert("Error", "Please add some content to the chapter");
      return;
    }

    setSaving(true);
    try {
       // ✅ Use correct endpoint for content-only updates
    const response = await BooksAPI.update(`chapter/read/content/${chapterId}`, { 
      content 
    });
    
    if (response?.success) {
      Alert.alert("Success", "Chapter content updated successfully!");
      navigation.goBack();
      } else {
      Alert.alert("Error", response?.error || "Failed to save content");
    }
    } catch (error) {
      console.error("Error saving chapter:", error);
      Alert.alert("Error", "Failed to save chapter content");
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
        <View style={styles.headerTitle}>
          <Text style={styles.title} numberOfLines={1}>
            {chapterTitle}
          </Text>
          <Text style={styles.subtitle}>Edit Chapter Content</Text>
        </View>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.buttonDisabled]}
          onPress={handleSaveContent}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <MaterialIcons name="check" size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      <RichToolbar
        editor={richTextRef}
        selectedIconTint="#6200ee"
        iconTint="#757575"
        style={styles.toolbar}
        actions={[
          actions.undo,
          actions.redo,
          actions.bold,
          actions.italic,
          actions.underline,
          actions.strikethrough,
          actions.heading1,
          actions.heading2,
          actions.heading3,
          actions.insertBulletsList,
          actions.insertOrderedList,
          actions.alignLeft,
          actions.alignCenter,
          actions.alignRight,
          actions.blockquote,
          actions.insertLink,
          actions.insertImage,
        ]}
        iconMap={{
          [actions.heading1]: ({ tintColor }) => (
            <Text style={{ color: tintColor, fontWeight: "bold" }}>H1</Text>
          ),
          [actions.heading2]: ({ tintColor }) => (
            <Text style={{ color: tintColor, fontWeight: "bold" }}>H2</Text>
          ),
          [actions.heading3]: ({ tintColor }) => (
            <Text style={{ color: tintColor, fontWeight: "bold" }}>H3</Text>
          ),
        }}
      />

      <RichEditor
        ref={richTextRef}
        value={content}
        onChange={setContent}
        placeholder="Edit your chapter content here..."
        editorStyle={styles.editor}
        style={styles.editorContainer}
        useContainer={true}
        initialHeight={400}
      />

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.cancelButton]}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="close" size={20} color="#757575" />
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.primaryButton,
            saving && styles.buttonDisabled,
          ]}
          onPress={handleSaveContent}
          disabled={saving}
        >
          <MaterialIcons name="save" size={20} color="#fff" />
          <Text style={styles.primaryButtonText}>
            {saving ? "Updating..." : "Update Content"}
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
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  subtitle: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  saveButton: {
    backgroundColor: "#6200ee",
    borderRadius: 8,
    padding: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  toolbar: {
    backgroundColor: "#f5f5f5",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  editorContainer: {
    flex: 1,
    borderColor: "#e0e0e0",
    borderWidth: 1,
    margin: 8,
    borderRadius: 4,
  },
  editor: {
    backgroundColor: "#fff",
    color: "#333",
    fontSize: 16,
    placeholderColor: "#999",
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
  cancelButton: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  cancelButtonText: {
    color: "#757575",
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: "#6200ee",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
