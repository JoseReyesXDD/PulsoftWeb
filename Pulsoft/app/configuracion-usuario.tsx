import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth, signOut } from 'firebase/auth';
import { firebaseApp } from '../firebaseConfig';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface UserSettings {
  notifications: boolean;
  biometrics: boolean;
  darkMode: boolean;
  language: string;
  email: string;
}

export default function ConfiguracionUsuarioScreen() {
  const [settings, setSettings] = useState<UserSettings>({
    notifications: true,
    biometrics: false,
    darkMode: false,
    language: 'es',
    email: ''
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const auth = getAuth(firebaseApp);

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        setSettings(prev => ({
          ...prev,
          email: user.email || ''
        }));
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      Alert.alert('Error', 'No se pudo cerrar sesión');
    }
  };

  const handleSettingChange = (key: keyof UserSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleChangePassword = () => {
    router.push('/cambiar-contrasena');
  };

  const handleChangeEmail = () => {
    router.push('/cambiar-correo');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Eliminar cuenta',
      '¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => {
            // Implementar eliminación de cuenta
            Alert.alert('Cuenta eliminada');
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Cargando configuración...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0A7EA4" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <MaterialCommunityIcons name="cog" size={32} color="#0A7EA4" />
          <View style={styles.headerText}>
            <ThemedText type="title" style={styles.title}>
              Configuración
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Ajustes de tu cuenta
            </ThemedText>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Información de la cuenta */}
        <View style={styles.section}>
          <ThemedText type="title" style={styles.sectionTitle}>
            Información de la cuenta
          </ThemedText>
          
          <View style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons name="email" size={24} color="#666" />
              <View style={styles.settingDetails}>
                <ThemedText style={styles.settingLabel}>Correo electrónico</ThemedText>
                <ThemedText style={styles.settingValue}>{settings.email}</ThemedText>
              </View>
            </View>
            <TouchableOpacity onPress={handleChangeEmail} style={styles.settingAction}>
              <MaterialCommunityIcons name="pencil" size={20} color="#0A7EA4" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.settingCard} onPress={handleChangePassword}>
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons name="lock" size={24} color="#666" />
              <View style={styles.settingDetails}>
                <ThemedText style={styles.settingLabel}>Cambiar contraseña</ThemedText>
                <ThemedText style={styles.settingValue}>Actualizar credenciales</ThemedText>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Preferencias */}
        <View style={styles.section}>
          <ThemedText type="title" style={styles.sectionTitle}>
            Preferencias
          </ThemedText>
          
          <View style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons name="bell" size={24} color="#666" />
              <View style={styles.settingDetails}>
                <ThemedText style={styles.settingLabel}>Notificaciones</ThemedText>
                <ThemedText style={styles.settingValue}>Alertas y recordatorios</ThemedText>
              </View>
            </View>
            <Switch
              value={settings.notifications}
              onValueChange={(value) => handleSettingChange('notifications', value)}
              trackColor={{ false: '#ccc', true: '#0A7EA4' }}
              thumbColor={settings.notifications ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons name="fingerprint" size={24} color="#666" />
              <View style={styles.settingDetails}>
                <ThemedText style={styles.settingLabel}>Autenticación biométrica</ThemedText>
                <ThemedText style={styles.settingValue}>Usar huella dactilar</ThemedText>
              </View>
            </View>
            <Switch
              value={settings.biometrics}
              onValueChange={(value) => handleSettingChange('biometrics', value)}
              trackColor={{ false: '#ccc', true: '#0A7EA4' }}
              thumbColor={settings.biometrics ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons name="theme-light-dark" size={24} color="#666" />
              <View style={styles.settingDetails}>
                <ThemedText style={styles.settingLabel}>Modo oscuro</ThemedText>
                <ThemedText style={styles.settingValue}>Cambiar apariencia</ThemedText>
              </View>
            </View>
            <Switch
              value={settings.darkMode}
              onValueChange={(value) => handleSettingChange('darkMode', value)}
              trackColor={{ false: '#ccc', true: '#0A7EA4' }}
              thumbColor={settings.darkMode ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Privacidad y seguridad */}
        <View style={styles.section}>
          <ThemedText type="title" style={styles.sectionTitle}>
            Privacidad y seguridad
          </ThemedText>
          
          <TouchableOpacity style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons name="shield-check" size={24} color="#666" />
              <View style={styles.settingDetails}>
                <ThemedText style={styles.settingLabel}>Política de privacidad</ThemedText>
                <ThemedText style={styles.settingValue}>Leer términos</ThemedText>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingCard}>
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons name="file-document" size={24} color="#666" />
              <View style={styles.settingDetails}>
                <ThemedText style={styles.settingLabel}>Términos de servicio</ThemedText>
                <ThemedText style={styles.settingValue}>Leer condiciones</ThemedText>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Acciones peligrosas */}
        <View style={styles.section}>
          <ThemedText type="title" style={styles.sectionTitle}>
            Acciones peligrosas
          </ThemedText>
          
          <TouchableOpacity style={styles.dangerCard} onPress={handleDeleteAccount}>
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons name="delete" size={24} color="#FF6B6B" />
              <View style={styles.settingDetails}>
                <ThemedText style={[styles.settingLabel, styles.dangerText]}>
                  Eliminar cuenta
                </ThemedText>
                <ThemedText style={[styles.settingValue, styles.dangerText]}>
                  Esta acción no se puede deshacer
                </ThemedText>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer con logout */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color="#FF6B6B" />
          <ThemedText style={styles.logoutText}>Cerrar sesión</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingDetails: {
    marginLeft: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  settingValue: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  settingAction: {
    padding: 8,
  },
  dangerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff5f5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFE5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dangerText: {
    color: '#FF6B6B',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: 'white',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  logoutText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 