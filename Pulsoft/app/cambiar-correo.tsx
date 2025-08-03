import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth, updateEmail, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { firebaseApp } from '../firebaseConfig';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function CambiarCorreoScreen() {
  const [currentEmail, setCurrentEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const auth = getAuth(firebaseApp);

  useEffect(() => {
    // Obtener el email actual del usuario
    const user = auth.currentUser;
    if (user?.email) {
      setCurrentEmail(user.email);
    }
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChangeEmail = async () => {
    // Validaciones
    if (!newEmail || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (!validateEmail(newEmail)) {
      Alert.alert('Error', 'Por favor ingresa un email válido');
      return;
    }

    if (newEmail === currentEmail) {
      Alert.alert('Error', 'El nuevo email debe ser diferente al actual');
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        Alert.alert('Error', 'No se pudo obtener la información del usuario');
        return;
      }

      // Reautenticar al usuario antes de cambiar el email
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);

      // Cambiar el email
      await updateEmail(user, newEmail);

      Alert.alert(
        'Éxito', 
        'Email actualizado correctamente. Se ha enviado un email de verificación a tu nueva dirección.',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error: any) {
      console.error('Error changing email:', error);
      
      let errorMessage = 'No se pudo cambiar el email';
      if (error.code === 'wrong-password') {
        errorMessage = 'La contraseña es incorrecta';
      } else if (error.code === 'email-already-in-use') {
        errorMessage = 'Este email ya está siendo usado por otra cuenta';
      } else if (error.code === 'invalid-email') {
        errorMessage = 'El email ingresado no es válido';
      } else if (error.code === 'requires-recent-login') {
        errorMessage = 'Necesitas iniciar sesión nuevamente para cambiar el email';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = newEmail && password && validateEmail(newEmail) && newEmail !== currentEmail;

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0A7EA4" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <MaterialCommunityIcons name="email-edit" size={32} color="#0A7EA4" />
          <View style={styles.headerText}>
            <ThemedText type="title" style={styles.title}>
              Cambiar Email
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Actualiza tu dirección de correo electrónico
            </ThemedText>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Información importante */}
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="information" size={24} color="#FFA726" />
          <View style={styles.infoContent}>
            <ThemedText style={styles.infoTitle}>Importante</ThemedText>
            <ThemedText style={styles.infoText}>
              Al cambiar tu email, se enviará un enlace de verificación a tu nueva dirección. Deberás verificar el email para completar el proceso.
            </ThemedText>
          </View>
        </View>

        {/* Email actual */}
        <View style={styles.currentEmailContainer}>
          <ThemedText style={styles.sectionTitle}>Email actual</ThemedText>
          <View style={styles.currentEmailCard}>
            <MaterialCommunityIcons name="email" size={20} color="#666" />
            <ThemedText style={styles.currentEmailText}>{currentEmail}</ThemedText>
          </View>
        </View>

        {/* Formulario */}
        <View style={styles.formContainer}>
          <ThemedText style={styles.sectionTitle}>Nuevo email</ThemedText>
          
          {/* Nuevo email */}
          <View style={styles.inputContainer}>
            <ThemedText style={styles.inputLabel}>Nuevo correo electrónico</ThemedText>
            <View style={styles.emailContainer}>
              <MaterialCommunityIcons name="email-outline" size={20} color="#666" />
              <TextInput
                style={styles.emailInput}
                value={newEmail}
                onChangeText={setNewEmail}
                placeholder="Ingresa tu nuevo email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              />
            </View>
            {newEmail && !validateEmail(newEmail) && (
              <ThemedText style={styles.errorText}>
                Por favor ingresa un email válido
              </ThemedText>
            )}
            {newEmail && newEmail === currentEmail && (
              <ThemedText style={styles.errorText}>
                El nuevo email debe ser diferente al actual
              </ThemedText>
            )}
          </View>

          {/* Contraseña */}
          <View style={styles.inputContainer}>
            <ThemedText style={styles.inputLabel}>Contraseña actual</ThemedText>
            <View style={styles.passwordContainer}>
              <MaterialCommunityIcons name="lock-outline" size={20} color="#666" />
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Ingresa tu contraseña actual"
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

          {/* Botón de actualizar */}
          <TouchableOpacity
            style={[
              styles.updateButton,
              (!isFormValid || loading) && styles.disabledButton
            ]}
            onPress={handleChangeEmail}
            disabled={!isFormValid || loading}
          >
            <MaterialCommunityIcons 
              name="email-edit" 
              size={20} 
              color="white" 
            />
            <ThemedText style={styles.updateButtonText}>
              {loading ? 'Actualizando...' : 'Actualizar email'}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Información adicional */}
        <View style={styles.additionalInfoContainer}>
          <ThemedText type="title" style={styles.additionalInfoTitle}>
            ¿Qué sucede después?
          </ThemedText>
          
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <ThemedText style={styles.stepNumberText}>1</ThemedText>
            </View>
            <View style={styles.stepContent}>
              <ThemedText style={styles.stepTitle}>Verificación requerida</ThemedText>
              <ThemedText style={styles.stepText}>
                Recibirás un email de verificación en tu nueva dirección
              </ThemedText>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <ThemedText style={styles.stepNumberText}>2</ThemedText>
            </View>
            <View style={styles.stepContent}>
              <ThemedText style={styles.stepTitle}>Confirma el cambio</ThemedText>
              <ThemedText style={styles.stepText}>
                Haz clic en el enlace de verificación para completar el proceso
              </ThemedText>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <ThemedText style={styles.stepNumberText}>3</ThemedText>
            </View>
            <View style={styles.stepContent}>
              <ThemedText style={styles.stepTitle}>Listo</ThemedText>
              <ThemedText style={styles.stepText}>
                Tu email será actualizado y podrás usar la nueva dirección para iniciar sesión
              </ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#fff3e0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#FFA726',
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  currentEmailContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  currentEmailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  currentEmailText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
  formContainer: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 16,
  },
  emailInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 16,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  eyeButton: {
    padding: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 8,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A7EA4',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  updateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  additionalInfoContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  additionalInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0A7EA4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  stepText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
}); 