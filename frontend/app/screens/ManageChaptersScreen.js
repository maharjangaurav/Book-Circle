"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  TextInput,
  Modal,
} from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import { BooksAPI } from "../api/books"
import { useNavigation, useRoute } from "@react-navigation/native"

export default function ManageChaptersScreen() {
  const navigation = useNavigation()
  const route = useRoute()
  const { bookId } = route.params

  const [loading, setLoading] = useState(true)
  const [chapters, setChapters] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [newChapterTitle, setNewChapterTitle] = useState("")
  const [addingChapter, setAddingChapter] = useState(false)

  useEffect(() => {
    fetchChapters()
  }, [])

  const fetchChapters = async () => {
    try {
      // Fetch chapters for this book
      const response = await BooksAPI.getById(`books/readbyid/${bookId}`)
      const book = response.data
      setChapters(book.chapters || [])
    } catch (error) {
      console.error("Error fetching chapters:", error)
      Alert.alert("Error", "Failed to load chapters")
    } finally {
      setLoading(false)
    }
  }

  const handleAddChapter = async () => {
    if (!newChapterTitle.trim()) {
      Alert.alert("Error", "Please enter a chapter title")
      return
    }

    setAddingChapter(true)
    try {
      const newChapter = {
        title: newChapterTitle,
        content: "",
        chapterNumber: chapters.length + 1,
      }

      // Add chapter via API
      await BooksAPI.create(`books/read/${bookId}/chapters`, newChapter)

      setChapters([...chapters, newChapter])
      setNewChapterTitle("")
      setShowAddModal(false)
      Alert.alert("Success", "Chapter added successfully!")
    } catch (error) {
      console.error("Error adding chapter:", error)
      Alert.alert("Error", "Failed to add chapter")
    } finally {
      setAddingChapter(false)
    }
  }

  const handleDeleteChapter = (chapterIndex) => {
    Alert.alert("Delete Chapter", "Are you sure you want to delete this chapter?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await BooksAPI.delete(`books/read/${bookId}/chapters/${chapterIndex}`)
            setChapters(chapters.filter((_, index) => index !== chapterIndex))
            Alert.alert("Success", "Chapter deleted successfully!")
          } catch (error) {
            console.error("Error deleting chapter:", error)
            Alert.alert("Error", "Failed to delete chapter")
          }
        },
      },
    ])
  }

  const renderChapterItem = ({ item, index }) => (
    <View style={styles.chapterItem}>
      <View style={styles.chapterInfo}>
        <Text style={styles.chapterNumber}>Chapter {index + 1}</Text>
        <Text style={styles.chapterTitle}>{item.title}</Text>
      </View>
      <View style={styles.chapterActions}>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="edit" size={20} color="#6200ee" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleDeleteChapter(index)}>
          <MaterialIcons name="delete" size={20} color="#f44336" />
        </TouchableOpacity>
      </View>
    </View>
  )

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Chapters</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <MaterialIcons name="add" size={24} color="#6200ee" />
        </TouchableOpacity>
      </View>

      {chapters.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="menu-book" size={64} color="#e0e0e0" />
          <Text style={styles.emptyText}>No chapters yet</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => setShowAddModal(true)}>
            <Text style={styles.emptyButtonText}>Add First Chapter</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={chapters}
          renderItem={renderChapterItem}
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Chapter</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Enter chapter title"
              value={newChapterTitle}
              onChangeText={setNewChapterTitle}
              placeholderTextColor="#999"
            />

            <TouchableOpacity
              style={[styles.addButton, addingChapter && styles.buttonDisabled]}
              onPress={handleAddChapter}
              disabled={addingChapter}
            >
              {addingChapter ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.addButtonText}>Add Chapter</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    padding: 16,
  },
  chapterItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  chapterInfo: {
    flex: 1,
  },
  chapterNumber: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
  },
  chapterTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  chapterActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 16,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: "#6200ee",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 30,
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
    color: "#333",
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
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: "#6200ee",
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
})
