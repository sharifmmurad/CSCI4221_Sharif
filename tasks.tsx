
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import React from "react";

export default function TasksScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Tasks</Text>
      <Text style={styles.sub}>Second screen to prove navigation works.</Text>
      <Pressable style={styles.btn} onPress={() => router.back()}>
        <Text style={styles.btnText}>Back to Prototype</Text>
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", gap: 16 },
  h1: { fontSize: 24, fontWeight: "700" },
  sub: { fontSize: 14, opacity: 0.7, marginBottom: 8 },
  btn: { backgroundColor: "#1e90ff", padding: 14, borderRadius: 10, alignItems: "center" },
  btnText: { color: "white", fontWeight: "700" },
});
