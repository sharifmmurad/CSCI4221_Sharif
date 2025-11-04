
import { View, Text, Pressable, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import React from "react";

export default function PrototypeScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Project 2 Prototype</Text>
      <Text style={styles.sub}>Simple demo with two working clicks</Text>
      <Pressable style={styles.btn} onPress={() => router.push("/(tabs)/tasks")}>
        <Text style={styles.btnText}>Go to Tasks</Text>
      </Pressable>
      <Pressable style={[styles.btn, styles.btnSecondary]} onPress={() => Alert.alert("Saved", "Your demo action ran successfully.")}>
        <Text style={styles.btnText}>Quick Save</Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", gap: 16 },
  h1: { fontSize: 28, fontWeight: "700" },
  sub: { fontSize: 14, opacity: 0.7, marginBottom: 8 },
  btn: { backgroundColor: "#1e90ff", padding: 14, borderRadius: 10, alignItems: "center" },
  btnSecondary: { backgroundColor: "#333" },
  btnText: { color: "white", fontWeight: "700" },
});
