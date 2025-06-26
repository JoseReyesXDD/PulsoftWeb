import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    <View style={styles.container}>
      <Text style={styles.title}>Crear cuenta</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, role === 'Paciente' && styles.buttonSelected]}
          onPress={() => setRole('Paciente')}
        >
          <View style={styles.buttonContent}>
            <MaterialCommunityIcons name="account-heart" size={24} color="#fff" style={styles.icon} />
            <Text style={styles.buttonText}>Paciente</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, role === 'Cuidador' && styles.buttonSelected]}
          onPress={() => setRole('Cuidador')}
        >
          <View style={styles.buttonContent}>
            <MaterialCommunityIcons name="account-supervisor" size={24} color="#fff" style={styles.icon} />
            <Text style={styles.buttonText}>Cuidador</Text>
          </View>
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Usuario"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
        <Text style={styles.registerButtonText}>Registrarse</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.replace('/login')}>
        <Text style={styles.link}>Volver al login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    fontFamily: 'Lufga',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  button: {
    marginHorizontal: 8,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#000',
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSelected: {
    backgroundColor: '#0A7EA4',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Lufga',
  },
  input: {
    width: 250,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    fontFamily: 'Lufga',
  },
  registerButton: {
    backgroundColor: '#0A7EA4',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    width: 250,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Lufga',
  },
  link: {
    color: '#0A7EA4',
    marginTop: 16,
    fontFamily: 'Lufga',
  },
}); 