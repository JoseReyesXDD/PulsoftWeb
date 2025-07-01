import { StyleSheet, View, Text } from 'react-native';

export default function NotificationsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notificaciones</Text>
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>No tienes notificaciones nuevas.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2C3E50',
    textAlign: 'center',
  },
  emptyBox: {
    backgroundColor: '#f2ebeb',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
});