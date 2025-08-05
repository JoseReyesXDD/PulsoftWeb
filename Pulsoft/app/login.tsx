import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert, Dimensions, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { signInWithEmailAndPassword, getAuth } from 'firebase/auth';
import { firebaseApp } from '../firebaseConfig';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function LoginScreen() {
  const [role, setRole] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { username: localSearchUsername } = useLocalSearchParams();

  const handleRoleSelect = (selectedRole: string) => {
    setRole(selectedRole);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Por favor ingresa un email válido');
      return;
    }

    setLoading(true);

    try {
      const auth = getAuth(firebaseApp);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      
      Alert.alert('¡Login exitoso!', `Bienvenido ${role}`);
      
      if (role === 'Paciente') {
        router.replace('/patient-dashboard');
      } else if (role === 'Cuidador') {
        router.replace('/caregiver-dashboard');
      } else {
        router.replace('/');
      }
    } catch (error: any) {
      let errorMessage = 'Error de inicio de sesión';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No existe una cuenta con este email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Contraseña incorrecta';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiados intentos fallidos. Intenta más tarde';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Error de conexión. Verifica tu internet';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = email && password && email.includes('@');
  const windowHeight = Dimensions.get('window').height;

  return (
    <ThemedView style={[styles.container, { backgroundColor: '#fff' }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        {!role ? (
          <ScrollView 
            contentContainerStyle={[styles.roleSelectionContainer, { minHeight: windowHeight }]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.logoContainer}>
              <MaterialCommunityIcons name="heart-pulse" size={64} color="#0A7EA4" />
              <ThemedText type="title" style={styles.appTitle}>Pulsoft</ThemedText>
              <ThemedText style={styles.appSubtitle}>Monitoreo de salud inteligente</ThemedText>
            </View>

            <View style={styles.roleContainer}>
              <ThemedText type="title" style={styles.title}>¿Quién eres?</ThemedText>
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.roleButton} 
                  onPress={() => handleRoleSelect('Paciente')}
                  activeOpacity={0.8}
                >
                  <View style={styles.roleButtonContent}>
                    <MaterialCommunityIcons name="account-heart" size={32} color="#fff" />
                    <ThemedText style={styles.roleButtonText}>Paciente</ThemedText>
                    <ThemedText style={styles.roleButtonSubtext}>
                      Monitorea tu salud
                    </ThemedText>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.roleButton} 
                  onPress={() => handleRoleSelect('Cuidador')}
                  activeOpacity={0.8}
                >
                  <View style={styles.roleButtonContent}>
                    <MaterialCommunityIcons name="account-supervisor" size={32} color="#fff" />
                    <ThemedText style={styles.roleButtonText}>Cuidador</ThemedText>
                    <ThemedText style={styles.roleButtonSubtext}>
                      Cuida de otros
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              onPress={() => router.push('/register')}
              style={styles.createAccountButton}
            >
              <ThemedText style={styles.createAccountText}>
                ¿No tienes cuenta? Crear cuenta
              </ThemedText>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <ScrollView 
            style={styles.loginContainer} 
            contentContainerStyle={[styles.loginContent, { minHeight: windowHeight }]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <TouchableOpacity onPress={() => setRole(null)} style={styles.backButton}>
                <MaterialCommunityIcons name="arrow-left" size={24} color="#0A7EA4" />
              </TouchableOpacity>
              <ThemedText type="title" style={styles.headerTitle}>
                Iniciar sesión
              </ThemedText>
            </View>

            <View style={styles.loginForm}>
              <View style={styles.roleIndicator}>
                <MaterialCommunityIcons 
                  name={role === 'Paciente' ? 'account-heart' : 'account-supervisor'} 
                  size={24} 
                  color="#0A7EA4" 
                />
                <ThemedText style={styles.roleIndicatorText}>
                  {role}
                </ThemedText>
              </View>

              <View style={styles.inputContainer}>
                <ThemedText style={styles.inputLabel}>Correo electrónico</ThemedText>
                <View style={styles.textInputContainer}>
                  <MaterialCommunityIcons name="email-outline" size={20} color="#666" />
                  <TextInput
                    style={styles.textInput}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Ingresa tu correo electrónico"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
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
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <MaterialCommunityIcons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.loginButton,
                  (!isFormValid || loading) && styles.disabledButton
                ]}
                onPress={handleLogin}
                disabled={!isFormValid || loading}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons 
                  name="login" 
                  size={20} 
                  color="white" 
                />
                <ThemedText style={styles.loginButtonText}>
                  {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => router.push('/register')}
                style={styles.createAccountLink}
              >
                <ThemedText style={styles.createAccountLinkText}>
                  ¿No tienes cuenta? Crear cuenta
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Fondo blanco conservado
  },
  // Estilos para selección de rol
  roleSelectionContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#fff', // Fondo blanco conservado
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: height * 0.05,
  },
  appTitle: {
    fontSize: 32,
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
  },
  roleContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 32,
    color: '#333',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  roleButton: {
    backgroundColor: '#0A7EA4',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  roleButtonContent: {
    alignItems: 'center',
  },
  roleButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 12,
    fontFamily: 'Lufga-Bold',
  },
  roleButtonSubtext: {
    color: '#fff',
    fontSize: 14,
    marginTop: 4,
    opacity: 0.9,
  },
  createAccountButton: {
    alignItems: 'center',
    padding: 16,
    marginBottom: 20,
  },
  createAccountText: {
    color: '#0A7EA4',
    fontSize: 16,
    fontWeight: '600',
  },
  // Estilos para formulario de login
  loginContainer: {
    flex: 1,
    backgroundColor: '#fff', // Fondo blanco conservado
  },
  loginContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#fff', // Fondo blanco conservado
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 32,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  loginForm: {
    flex: 1,
  },
  roleIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#0A7EA4',
  },
  roleIndicatorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0A7EA4',
    marginLeft: 8,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 16,
  },
  textInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  eyeButton: {
    padding: 8,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A7EA4',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  createAccountLink: {
    alignItems: 'center',
    marginTop: 32,
    padding: 16,
    marginBottom: 20,
  },
  createAccountLinkText: {
    color: '#0A7EA4',
    fontSize: 16,
    fontWeight: '600',
  },
});