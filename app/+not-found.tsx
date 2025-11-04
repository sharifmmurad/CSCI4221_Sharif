import { Link } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.h1}>Not Found</Text>
      <Link href="/tab">Go to Prototype</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, alignItems:'center', justifyContent:'center', padding:24 },
  h1: { fontSize:24, fontWeight:'700', marginBottom:12 }
});
