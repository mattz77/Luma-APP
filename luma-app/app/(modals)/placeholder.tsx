import { StyleSheet, Text, View } from 'react-native';

export default function PlaceholderModal() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Modal Placeholder</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
});

