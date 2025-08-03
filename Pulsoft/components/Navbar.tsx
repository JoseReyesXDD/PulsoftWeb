import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from './ui/IconSymbol';
import { ThemedText } from './ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export function Navbar() {
  const router = useRouter();
  const colorScheme = useColorScheme();

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <TouchableOpacity onPress={() => router.push('/')} style={styles.logoContainer}>
          <IconSymbol name="house.fill" size={24} color="#111" />
          <ThemedText type="defaultSemiBold" style={[styles.logoText, { color: '#111' }]}>Pulsoft</ThemedText>
        </TouchableOpacity>
      </View>
      
      <View style={styles.rightSection}>
        <TouchableOpacity onPress={() => window.location.href = '/login/'} style={styles.iconButton}>
          <IconSymbol name="person.fill" size={22} color="#111" />
          <ThemedText style={styles.iconLabel}>Perfil</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontSize: 20,
    fontFamily: 'Lufga-Bold',
  },
  iconButton: {
    padding: 4,
    alignItems: 'center',
  },
  iconLabel: {
    fontSize: 14,
    color: '#111',
    marginTop: 2,
    fontFamily: 'Lufga-Regular',
  },
}); 