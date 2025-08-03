import React, { useState } from 'react';
import { View, TouchableOpacity, TextInput, StyleSheet, Alert, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function RegisterScreen() {
  const [role, setRole] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleRegister = async () => {
    if (!role) {
      Alert.alert('Error', 'Selecciona un tipo de cuenta');
      return;
    }
    if (!username || !password) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }
    try {
      const usersJson = await AsyncStorage.getItem('users');
      const users = usersJson ? JSON.parse(usersJson) : [];
      const exists = users.some((u: any) => u.username === username && u.role === role);
      if (exists) {
        Alert.alert('Error', 'El usuario ya existe para este tipo de cuenta');
        return;
      }
      users.push({ username, password, role });
      await AsyncStorage.setItem('users', JSON.stringify(users));
      Alert.alert('¡Registro exitoso!', `Bienvenido, ${username} (${role})`, [
        { text: 'Ir al login', onPress: () => router.replace('/login') }
      ]);
    } catch (e) {
      Alert.alert('Error', 'Ocurrió un problema al registrar el usuario');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#0A7EA4" />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>
            Crear Cuenta
          </ThemedText>
        </View>

        {/* Logo Section */}
        <View style={styles.logoSection}>
          <MaterialCommunityIcons name="heart-pulse" size={64} color="#0A7EA4" />
          <ThemedText type="title" style={styles.appTitle}>Pulsoft</ThemedText>
          <ThemedText style={styles.appSubtitle}>
            Únete a nuestra comunidad de salud
          </ThemedText>
        </View>

        {/* Role Selection */}
        <View style={styles.roleSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            ¿Quién eres?
          </ThemedText>
          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[styles.roleCard, role === 'Paciente' && styles.roleCardSelected]}
              onPress={() => setRole('Paciente')}
              activeOpacity={0.8}
            >
              <View style={styles.roleCardContent}>
                <MaterialCommunityIcons 
                  name="account-heart" 
                  size={32} 
                  color={role === 'Paciente' ? '#fff' : '#0A7EA4'} 
                />
                <ThemedText style={[styles.roleCardTitle, role === 'Paciente' && styles.roleCardTitleSelected]}>
                  Paciente
                </ThemedText>
                <ThemedText style={[styles.roleCardSubtitle, role === 'Paciente' && styles.roleCardSubtitleSelected]}>
                  Monitorea tu salud
                </ThemedText>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleCard, role === 'Cuidador' && styles.roleCardSelected]}
              onPress={() => setRole('Cuidador')}
              activeOpacity={0.8}
            >
              <View style={styles.roleCardContent}>
                <MaterialCommunityIcons 
                  name="account-supervisor" 
                  size={32} 
                  color={role === 'Cuidador' ? '#fff' : '#0A7EA4'} 
                />
                <ThemedText style={[styles.roleCardTitle, role === 'Cuidador' && styles.roleCardTitleSelected]}>
                  Cuidador
                </ThemedText>
                <ThemedText style={[styles.roleCardSubtitle, role === 'Cuidador' && styles.roleCardSubtitleSelected]}>
                  Cuida de otros
                </ThemedText>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Información de la cuenta
          </ThemedText>
          
          <View style={styles.inputContainer}>
            <ThemedText style={styles.inputLabel}>Nombre de usuario</ThemedText>
            <View style={styles.textInputContainer}>
              <MaterialCommunityIcons name="account-outline" size={20} color="#666" />
              <TextInput
                style={styles.textInput}
                value={username}
                onChangeText={setUsername}
                placeholder="Ingresa tu nombre de usuario"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.inputLabel}>Contraseña</ThemedText>
            <View style={styles.textInputContainer}>
              <MaterialCommunityIcons name="lock-outline" size={20} color="#666" />
              <TextInput
                style={styles.textInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Ingresa tu contraseña"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <TouchableOpacity 
            style={[
              styles.registerButton,
              (!role || !username || !password) && styles.disabledButton
            ]}
            onPress={handleRegister}
            disabled={!role || !username || !password}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons 
              name="account-plus" 
              size={20} 
              color="white" 
            />
            <ThemedText style={styles.registerButtonText}>
              Crear Cuenta
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>
            ¿Ya tienes una cuenta?
          </ThemedText>
          <TouchableOpacity onPress={() => router.replace('/login')}>
            <ThemedText style={styles.loginLink}>Iniciar sesión</ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    fontFamily: 'Lufga-Bold',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
    paddingVertical: 20,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#0A7EA4',
    marginTop: 16,
    fontFamily: 'Lufga-Bold',
  },
  appSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Lufga-Regular',
  },
  roleSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Lufga-Bold',
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  roleCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleCardSelected: {
    backgroundColor: '#0A7EA4',
    borderColor: '#0A7EA4',
  },
  roleCardContent: {
    alignItems: 'center',
  },
  roleCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 12,
    marginBottom: 4,
    fontFamily: 'Lufga-Bold',
  },
  roleCardTitleSelected: {
    color: 'white',
  },
  roleCardSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Lufga-Regular',
  },
  roleCardSubtitleSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  formSection: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
    fontFamily: 'Lufga-SemiBold',
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#2C3E50',
    marginLeft: 12,
    fontFamily: 'Lufga-Regular',
  },
  registerButton: {
    backgroundColor: '#0A7EA4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#B0B0B0',
    shadowOpacity: 0,
    elevation: 0,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    fontFamily: 'Lufga-Bold',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    fontFamily: 'Lufga-Regular',
  },
  loginLink: {
    fontSize: 16,
    color: '#0A7EA4',
    fontWeight: '600',
    fontFamily: 'Lufga-SemiBold',
  },
}); 