import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert, Dimensions, Button, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Ajusta la ruta si tu config está en otro lugar

export default function LoginScreen() {
  const [role, setRole] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { username: localSearchUsername } = useLocalSearchParams();

  const handleRoleSelect = (selectedRole: string) => {
    setRole(selectedRole);
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      // Aquí puedes guardar el idToken en un contexto global, AsyncStorage, etc.
      Alert.alert('¡Login exitoso!');
      router.replace('/'); // Redirige al home o dashboard
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      {!role ? (
        <>
          <View style={styles.roleContainer}>
            <Text style={styles.title}>¿Quién eres?</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={() => handleRoleSelect('Paciente')}>
                <View style={styles.buttonContent}>
                  <MaterialCommunityIcons name="account-heart" size={24} color="#fff" style={styles.icon} />
                  <Text style={styles.buttonText}>Paciente</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => handleRoleSelect('Cuidador')}>
                <View style={styles.buttonContent}>
                  <MaterialCommunityIcons name="account-supervisor" size={24} color="#fff" style={styles.icon} />
                  <Text style={styles.buttonText}>Cuidador</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={styles.link}>Crear cuenta</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.title}>Iniciar sesión como {role}</Text>
          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Button title={loading ? 'Cargando...' : 'Entrar'} onPress={handleLogin} disabled={loading} />
          {loading && <ActivityIndicator style={{ marginTop: 16 }} />}
          <TouchableOpacity onPress={() => setRole(null)}>
            <Text style={styles.link}>Volver</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={styles.link}>Crear cuenta</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
    textAlign: "center"
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
    textAlign: "center"
  },
  button: {
    marginHorizontal: 8,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#000',
    minWidth: 160,
    alignSelf: "center",
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Lufga',
  },
  icon: {
    marginRight: 8,
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
  link: {
    color: '#0A7EA4',
    marginTop: 16,
    fontFamily: 'Lufga',
    fontSize: 16,
  },
  roleContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 32,
    width: screenWidth * 0.4,
    height: screenHeight * 0.4,
  },
}); 