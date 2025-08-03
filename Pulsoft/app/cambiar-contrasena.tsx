import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { firebaseApp } from '../firebaseConfig';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function CambiarContrasenaScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const auth = getAuth(firebaseApp);

  const validatePassword = (password: string) => {
    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    if (password.length < minLength) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    if (!hasUpperCase || !hasLowerCase) {
      return 'La contraseña debe contener mayúsculas y minúsculas';
    }
    if (!hasNumbers) {
      return 'La contraseña debe contener al menos un número';
    }
    return null;
  };

  const handleChangePassword = async () => {
    // Validaciones
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas nuevas no coinciden');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      Alert.alert('Error', passwordError);
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        Alert.alert('Error', 'No se pudo obtener la información del usuario');
        return;
      }

      // Reautenticar al usuario antes de cambiar la contraseña
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Cambiar la contraseña
      await updatePassword(user, newPassword);

      Alert.alert(
        'Éxito', 
        'Contraseña actualizada correctamente',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error: any) {
      console.error('Error changing password:', error);
      
      let errorMessage = 'No se pudo cambiar la contraseña';
      if (error.code === 'wrong-password') {
        errorMessage = 'La contraseña actual es incorrecta';
      } else if (error.code === 'weak-password') {
        errorMessage = 'La nueva contraseña es muy débil';
      } else if (error.code === 'requires-recent-login') {
        errorMessage = 'Necesitas iniciar sesión nuevamente para cambiar la contraseña';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = currentPassword && newPassword && confirmPassword && newPassword === confirmPassword;

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0A7EA4" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <MaterialCommunityIcons name="lock-reset" size={32} color="#0A7EA4" />
          <View style={styles.headerText}>
            <ThemedText type="title" style={styles.title}>
              Cambiar Contraseña
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Actualiza tu contraseña de seguridad
            </ThemedText>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Información de seguridad */}
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="shield-check" size={24} color="#4CAF50" />
          <View style={styles.infoContent}>
            <ThemedText style={styles.infoTitle}>Seguridad de la cuenta</ThemedText>
            <ThemedText style={styles.infoText}>
              Asegúrate de usar una contraseña fuerte que contenga letras, números y símbolos.
            </ThemedText>
          </View>
        </View>

        {/* Formulario */}
        <View style={styles.formContainer}>
          {/* Contraseña actual */}
          <View style={styles.inputContainer}>
            <ThemedText style={styles.inputLabel}>Contraseña actual</ThemedText>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Ingresa tu contraseña actual"
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                style={styles.eyeButton}
              >
                <MaterialCommunityIcons
                  name={showCurrentPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Nueva contraseña */}
          <View style={styles.inputContainer}>
            <ThemedText style={styles.inputLabel}>Nueva contraseña</ThemedText>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Ingresa tu nueva contraseña"
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={styles.eyeButton}
              >
                <MaterialCommunityIcons
                  name={showNewPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            {newPassword && (
              <View style={styles.validationContainer}>
                <ThemedText style={[
                  styles.validationText,
                  newPassword.length >= 6 ? styles.validText : styles.invalidText
                ]}>
                  ✓ Mínimo 6 caracteres
                </ThemedText>
                <ThemedText style={[
                  styles.validationText,
                  /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) ? styles.validText : styles.invalidText
                ]}>
                  ✓ Mayúsculas y minúsculas
                </ThemedText>
                <ThemedText style={[
                  styles.validationText,
                  /\d/.test(newPassword) ? styles.validText : styles.invalidText
                ]}>
                  ✓ Al menos un número
                </ThemedText>
              </View>
            )}
          </View>

          {/* Confirmar nueva contraseña */}
          <View style={styles.inputContainer}>
            <ThemedText style={styles.inputLabel}>Confirmar nueva contraseña</ThemedText>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirma tu nueva contraseña"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                <MaterialCommunityIcons
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            {confirmPassword && newPassword !== confirmPassword && (
              <ThemedText style={styles.errorText}>
                Las contraseñas no coinciden
              </ThemedText>
            )}
          </View>

          {/* Botón de actualizar */}
          <TouchableOpacity
            style={[
              styles.updateButton,
              (!isFormValid || loading) && styles.disabledButton
            ]}
            onPress={handleChangePassword}
            disabled={!isFormValid || loading}
          >
            <MaterialCommunityIcons 
              name="lock-reset" 
              size={20} 
              color="white" 
            />
            <ThemedText style={styles.updateButtonText}>
              {loading ? 'Actualizando...' : 'Actualizar contraseña'}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Consejos de seguridad */}
        <View style={styles.tipsContainer}>
          <ThemedText type="title" style={styles.tipsTitle}>
            Consejos de seguridad
          </ThemedText>
          <View style={styles.tipItem}>
            <MaterialCommunityIcons name="check-circle" size={16} color="#4CAF50" />
            <ThemedText style={styles.tipText}>
              Usa una contraseña única que no hayas usado en otros servicios
            </ThemedText>
          </View>
          <View style={styles.tipItem}>
            <MaterialCommunityIcons name="check-circle" size={16} color="#4CAF50" />
            <ThemedText style={styles.tipText}>
              Evita información personal como fechas de nacimiento o nombres
            </ThemedText>
          </View>
          <View style={styles.tipItem}>
            <MaterialCommunityIcons name="check-circle" size={16} color="#4CAF50" />
            <ThemedText style={styles.tipText}>
              Considera usar un gestor de contraseñas para mayor seguridad
            </ThemedText>
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
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
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
  },
  eyeButton: {
    padding: 8,
  },
  validationContainer: {
    marginTop: 8,
  },
  validationText: {
    fontSize: 12,
    marginBottom: 2,
  },
  validText: {
    color: '#4CAF50',
  },
  invalidText: {
    color: '#FF6B6B',
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
  tipsContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
}); 