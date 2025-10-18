"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, ScrollView } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"

const GENRES = [
  "Sci-Fi",
  "Adventure",
  "Romance",
  "Drama",
  "True Story",
  "Mystery",
  "Biography",
  "Fantasy",
  "Thriller",
  "Horror",
  "Comedy",
  "Historical",
]

export default function GenreDropdown({ selectedGenres, onGenresChange }) {
  const [showModal, setShowModal] = useState(false)

  const toggleGenre = (genre) => {
    if (selectedGenres.includes(genre)) {
      onGenresChange(selectedGenres.filter((g) => g !== genre))
    } else {
      onGenresChange([...selectedGenres, genre])
    }
  }

  return (
    <View>
      <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowModal(true)}>
        <View style={styles.dropdownContent}>
          {selectedGenres.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreTagsContainer}>
              {selectedGenres.map((genre) => (
                <View key={genre} style={styles.genreTag}>
                  <Text style={styles.genreTagText}>{genre}</Text>
                  <TouchableOpacity onPress={() => toggleGenre(genre)} style={styles.removeButton}>
                    <MaterialIcons name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.placeholderText}>Select genres...</Text>
          )}
        </View>
        <MaterialIcons name="arrow-drop-down" size={24} color="#999" />
      </TouchableOpacity>

      <Modal visible={showModal} transparent={true} animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Genres</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={GENRES}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.genreOption} onPress={() => toggleGenre(item)}>
                  <View style={[styles.checkbox, selectedGenres.includes(item) && styles.checkboxSelected]}>
                    {selectedGenres.includes(item) && <MaterialIcons name="check" size={16} color="#fff" />}
                  </View>
                  <Text style={styles.genreOptionText}>{item}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item}
              scrollEnabled={true}
            />

            <TouchableOpacity style={styles.doneButton} onPress={() => setShowModal(false)}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  dropdownButton: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f9f9f9",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 50,
  },
  dropdownContent: {
    flex: 1,
    justifyContent: "center",
  },
  genreTagsContainer: {
    flexDirection: "row",
  },
  genreTag: {
    backgroundColor: "#6200ee",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  genreTagText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginRight: 6,
  },
  removeButton: {
    padding: 2,
  },
  placeholderText: {
    color: "#999",
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "80%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  genreOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: "#6200ee",
    borderColor: "#6200ee",
  },
  genreOptionText: {
    fontSize: 16,
    color: "#333",
  },
  doneButton: {
    backgroundColor: "#6200ee",
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  doneButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
})
