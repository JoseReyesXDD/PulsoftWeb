import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth, signOut } from 'firebase/auth';
import { firebaseApp } from '../firebaseConfig';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface PatientProfile {
  uid: string;
  email: string;
  user_type: string;
  created_at: number;
  statistics: {
    total_notes: number;
    caregivers_count: number;
    notes_by_type: {
      [key: string]: number;
    };
    last_activity: string;
  };
}

export default function PatientProfileScreen() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editEmail, setEditEmail] = useState('');
  const router = useRouter();
  const params = useLocalSearchParams();
  const auth = getAuth(firebaseApp);
  
  // Determinar si es vista de solo lectura (cuidador viendo perfil de paciente)
  const isViewOnly = params.viewOnly === 'true';
  const targetPatientId = params.patientId as string;

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        // Si es vista de solo lectura, usar el ID del paciente objetivo, sino usar el usuario actual
        const profileUid = isViewOnly ? targetPatientId : user.uid;
        const response = await fetch(`http://127.0.0.1:8000/api/user-profile/?user_uid=${profileUid}&user_type=patient`);
        
        if (response.ok) {
          const data = await response.json();
          setProfile(data.profile);
          setEditEmail(data.profile.email);
        } else {
          console.error('Error fetching profile:', response.statusText);
          Alert.alert('Error', 'No se pudo cargar el perfil');
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const user = auth.currentUser;
      if (user && profile) {
        const response = await fetch('http://127.0.0.1:8000/api/user-profile/', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_uid: user.uid,
            user_type: 'patient',
            email: editEmail,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setProfile(prev => prev ? { ...prev, email: editEmail } : null);
          setEditing(false);
          Alert.alert('Éxito', 'Perfil actualizado correctamente');
        } else {
          const errorData = await response.json();
          Alert.alert('Error', errorData.error || 'No se pudo actualizar el perfil');
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Error al actualizar el perfil');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              router.replace('/login');
            } catch (error) {
              Alert.alert('Error', 'No se pudo cerrar sesión');
            }
          },
        },
      ]
    );
  };

  const getNoteTypeLabel = (type: string) => {
    switch (type) {
      case 'analysis':
        return 'Análisis';
      case 'recommendation':
        return 'Recomendaciones';
      case 'observation':
        return 'Observaciones';
      default:
        return type;
    }
  };

  const getNoteTypeIcon = (type: string) => {
    switch (type) {
      case 'analysis':
        return { name: 'chart-line', color: '#4CAF50' };
      case 'recommendation':
        return { name: 'lightbulb', color: '#FF9800' };
      case 'observation':
        return { name: 'eye', color: '#2196F3' };
      default:
        return { name: 'note-text', color: '#666' };
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Cargando perfil...</ThemedText>
      </ThemedView>
    );
  }

  if (!profile) {
    return (
      <ThemedView style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={64} color="#FF6B6B" />
        <ThemedText style={styles.errorText}>No se pudo cargar el perfil</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
          <ThemedText style={styles.retryButtonText}>Reintentar</ThemedText>
        </TouchableOpacity>
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
          <MaterialCommunityIcons name="account-circle" size={32} color="#0A7EA4" />
          <View style={styles.headerText}>
                         <ThemedText type="title" style={styles.title}>
               {isViewOnly ? 'Perfil del Paciente' : 'Mi Perfil'}
             </ThemedText>
             <ThemedText style={styles.subtitle}>
               {isViewOnly ? 'Información del paciente' : 'Información personal y estadísticas'}
             </ThemedText>
          </View>
        </View>
                 {!isViewOnly && (
           <TouchableOpacity 
             onPress={() => setEditing(!editing)} 
             style={styles.editButton}
           >
             <MaterialCommunityIcons 
               name={editing ? "check" : "pencil"} 
               size={24} 
               color="#0A7EA4" 
             />
           </TouchableOpacity>
         )}
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="account" size={48} color="#0A7EA4" />
            </View>
            <View style={styles.userTypeIndicator}>
              <MaterialCommunityIcons name="heart" size={16} color="white" />
            </View>
          </View>

          <View style={styles.basicInfo}>
            <ThemedText style={styles.userType}>Paciente</ThemedText>
            
            {editing && !isViewOnly ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.editInput}
                  value={editEmail}
                  onChangeText={setEditEmail}
                  placeholder="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <View style={styles.editActions}>
                  <TouchableOpacity 
                    style={styles.saveButton} 
                    onPress={handleSaveProfile}
                  >
                    <MaterialCommunityIcons name="check" size={16} color="white" />
                    <ThemedText style={styles.saveButtonText}>Guardar</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.cancelButton} 
                    onPress={() => {
                      setEditing(false);
                      setEditEmail(profile.email);
                    }}
                  >
                    <MaterialCommunityIcons name="close" size={16} color="#666" />
                    <ThemedText style={styles.cancelButtonText}>Cancelar</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <ThemedText style={styles.email}>{profile.email}</ThemedText>
            )}
            
            <ThemedText style={styles.joinDate}>
              Miembro desde {new Date().getFullYear()}
            </ThemedText>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.statisticsSection}>
          <ThemedText type="title" style={styles.sectionTitle}>
            Mis Estadísticas de Salud
          </ThemedText>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="note-text" size={32} color="#4CAF50" />
              <ThemedText style={styles.statValue}>{profile.statistics.total_notes}</ThemedText>
              <ThemedText style={styles.statLabel}>Notas Totales</ThemedText>
            </View>

            <View style={styles.statCard}>
              <MaterialCommunityIcons name="doctor" size={32} color="#2196F3" />
              <ThemedText style={styles.statValue}>{profile.statistics.caregivers_count}</ThemedText>
              <ThemedText style={styles.statLabel}>Cuidadores</ThemedText>
            </View>

            <View style={styles.statCard}>
              <MaterialCommunityIcons name="calendar-today" size={32} color="#FF9800" />
              <ThemedText style={styles.statValue}>Hoy</ThemedText>
              <ThemedText style={styles.statLabel}>Última Actividad</ThemedText>
            </View>
          </View>
        </View>

        {/* Notes Breakdown */}
        <View style={styles.notesSection}>
          <ThemedText type="title" style={styles.sectionTitle}>
            Desglose de Notas
          </ThemedText>

          <View style={styles.notesBreakdown}>
            {Object.entries(profile.statistics.notes_by_type).map(([type, count]) => {
              const icon = getNoteTypeIcon(type);
              return (
                <View key={type} style={styles.noteTypeCard}>
                  <View style={styles.noteTypeHeader}>
                    <MaterialCommunityIcons 
                      name={icon.name as any} 
                      size={24} 
                      color={icon.color} 
                    />
                    <ThemedText style={styles.noteTypeLabel}>
                      {getNoteTypeLabel(type)}
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.noteTypeCount, { color: icon.color }]}>
                    {count}
                  </ThemedText>
                </View>
              );
            })}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <ThemedText type="title" style={styles.sectionTitle}>
            {isViewOnly ? 'Acciones del Paciente' : 'Acciones Rápidas'}
          </ThemedText>

          <View style={styles.actionsList}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                if (isViewOnly) {
                  router.push({
                    pathname: '/caregiver-notes',
                    params: { patientId: targetPatientId }
                  });
                } else {
                  router.push('/patient-notes');
                }
              }}
            >
              <MaterialCommunityIcons name="note-text" size={24} color="#0A7EA4" />
              <View style={styles.actionContent}>
                <ThemedText style={styles.actionTitle}>
                  {isViewOnly ? 'Ver Notas del Paciente' : 'Ver Mis Notas'}
                </ThemedText>
                <ThemedText style={styles.actionSubtitle}>
                  {isViewOnly ? 'Revisa los análisis médicos del paciente' : 'Revisa todos tus análisis médicos'}
                </ThemedText>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
            </TouchableOpacity>

            {isViewOnly && (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push({
                  pathname: '/patient-graphics',
                  params: { 
                    patientId: targetPatientId,
                    patientEmail: profile?.email
                  }
                })}
              >
                <MaterialCommunityIcons name="chart-line" size={24} color="#0A7EA4" />
                <View style={styles.actionContent}>
                  <ThemedText style={styles.actionTitle}>Ver Gráficas de Salud</ThemedText>
                  <ThemedText style={styles.actionSubtitle}>
                    Revisa las métricas de salud del paciente
                  </ThemedText>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
              </TouchableOpacity>
            )}

            {!isViewOnly && (
              <>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => router.push('/configuracion-usuario')}
                >
                  <MaterialCommunityIcons name="cog" size={24} color="#0A7EA4" />
                  <View style={styles.actionContent}>
                    <ThemedText style={styles.actionTitle}>Configuración</ThemedText>
                    <ThemedText style={styles.actionSubtitle}>
                      Ajustes de cuenta y privacidad
                    </ThemedText>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.actionButton, styles.dangerAction]}
                  onPress={handleLogout}
                >
                  <MaterialCommunityIcons name="logout" size={24} color="#FF6B6B" />
                  <View style={styles.actionContent}>
                    <ThemedText style={[styles.actionTitle, styles.dangerText]}>
                      Cerrar Sesión
                    </ThemedText>
                    <ThemedText style={styles.actionSubtitle}>
                      Sal de tu cuenta de forma segura
                    </ThemedText>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#FF6B6B" />
                </TouchableOpacity>
              </>
            )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#0A7EA4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
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
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0A7EA4',
  },
  userTypeIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  basicInfo: {
    alignItems: 'center',
  },
  userType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0A7EA4',
    marginBottom: 8,
  },
  email: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  joinDate: {
    fontSize: 14,
    color: '#666',
  },
  editContainer: {
    width: '100%',
    alignItems: 'center',
  },
  editInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: 'white',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 4,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  statisticsSection: {
    marginBottom: 30,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  notesSection: {
    marginBottom: 30,
  },
  notesBreakdown: {
    gap: 12,
  },
  noteTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noteTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  noteTypeCount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  actionsSection: {
    marginBottom: 20,
  },
  actionsList: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionContent: {
    flex: 1,
    marginLeft: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  dangerAction: {
    borderColor: '#FF6B6B',
    borderWidth: 1,
  },
  dangerText: {
    color: '#FF6B6B',
  },
});