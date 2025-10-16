import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { BooksAPI } from "../api/books";
import { login } from "../api/auth";

export default function WriterScreen() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");

  // TEMP: quick login button for testing; replace with proper auth screen later
  const devLogin = async () => {
    try {
      await login("writer_username", "writer_password"); // use a real writer user
      Alert.alert("Logged in", "JWT stored");
    } catch {
      Alert.alert("Login failed", "Check credentials");
    }
  };

  const submit = async () => {
    try {
      if (!title.trim() || !author.trim()) {
        Alert.alert("Missing", "Title and author are required");
        return;
      }
      const created = await BooksAPI.create({ title, author });
      Alert.alert("Created", `Book #${created.id} created`);
      setTitle(""); setAuthor("");
    } catch (e) {
      // If user is not a writer, backend raises 403 "Only writers can add books."
      Alert.alert("Error", e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Writer Panel</Text>
      <Button title="Dev Login (JWT)" onPress={devLogin} />
      <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
      <TextInput style={styles.input} placeholder="Author" value={author} onChangeText={setAuthor} />
      <Button title="Create Book" onPress={submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  title: { fontSize: 20, fontWeight: "bold" },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 8 },
});
