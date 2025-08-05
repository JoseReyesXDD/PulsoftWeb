import React, { useState } from 'react';
import { View, TouchableOpacity, TextInput, StyleSheet, Alert, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getDatabase, ref, set } from 'firebase/database';
import { firebaseApp } from '../firebaseConfig';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function RegisterScreen() {
  const [role, setRole] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const auth = getAuth(firebaseApp);

  const handleRegister = async () => {
    if (!role) {
      Alert.alert('Error', 'Selecciona un tipo de cuenta');
      return;
    }
    if (!email || !password) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      console.log('Iniciando registro con:', { email, role });
      
      // Crear usuario en Firebase Auth
      console.log('Intentando crear usuario en Firebase Auth...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('Usuario creado en Auth exitosamente:', user.uid);

      // Guardar información adicional en Realtime Database
      console.log('Iniciando guardado en Realtime Database...');
      const db = getDatabase(firebaseApp);
      
      // Guardar información básica primero
      console.log('Guardando datos básicos del usuario');
      try {
        await set(ref(db, `users/${user.uid}`), {
          email: email,
          role: role,
          createdAt: new Date().toISOString()
        });
        console.log('Datos básicos guardados');
      } catch (dbError) {
        console.error('Error guardando datos básicos:', dbError);
        throw new Error('Error al guardar datos del usuario');
      }

      if (role === 'Paciente') {
        console.log('Creando estructura para paciente');
        try {
          // Crear estructura para paciente usando la colección patients existente
          await set(ref(db, `patients/${user.uid}`), {
            alert: false,
            bpm: 79.54679,
            cardiovascular: 82.93399,
            panicMode: false,
            sudor: 50,
            temperatura: 29.3125
          });
          console.log('Datos de paciente guardados en colección patients');
        } catch (dbError) {
          console.error('Error guardando datos de paciente:', dbError);
          throw new Error('Error al guardar datos del paciente');
        }
      } else if (role === 'Cuidador') {
        console.log('Creando estructura para cuidador');
        try {
          // Crear estructura para cuidador
          await set(ref(db, `caregivers/${user.uid}`), {
            linkedPatients: [],
            createdAt: new Date().toISOString()
          });
          console.log('Datos de cuidador guardados');
        } catch (dbError) {
          console.error('Error guardando datos de cuidador:', dbError);
          throw new Error('Error al guardar datos del cuidador');
        }
      }

              Alert.alert('¡Registro exitoso!', `Bienvenido, ${email} (${role})`, [
          { 
            text: 'Continuar', 
            onPress: () => {
              if (role === 'Paciente') {
                router.replace('/patient-dashboard');
              } else if (role === 'Cuidador') {
                router.replace('/caregiver-dashboard');
              }
            }
          }
        ]);
    } catch (error: any) {
      console.error('Error completo:', error);
      console.error('Código de error:', error.code);
      console.error('Mensaje de error:', error.message);
      
      let errorMessage = 'Ocurrió un problema al registrar el usuario';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este email ya está registrado';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Error de conexión. Verifica tu internet';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiados intentos. Intenta más tarde';
      } else {
        errorMessage = `Error: ${error.message}`;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
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
            <ThemedText style={styles.inputLabel}>Email</ThemedText>
            <View style={styles.textInputContainer}>
              <MaterialCommunityIcons name="email-outline" size={20} color="#666" />
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="Ingresa tu email"
                keyboardType="email-address"
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
              (!role || !email || !password || loading) && styles.disabledButton
            ]}
            onPress={handleRegister}
            disabled={!role || !email || !password || loading}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons 
              name={loading ? "loading" : "account-plus"} 
              size={20} 
              color="white" 
            />
            <ThemedText style={styles.registerButtonText}>
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
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