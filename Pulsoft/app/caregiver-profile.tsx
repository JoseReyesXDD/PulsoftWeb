import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth, signOut } from 'firebase/auth';
import { firebaseApp } from '../firebaseConfig';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface CaregiverProfile {
  uid: string;
  email: string;
  user_type: string;
  created_at: number;
  statistics: {
    patients_count: number;
    total_notes_access: number;
    average_notes_per_patient: number;
    active_since: string | null;
  };
}

interface LinkedPatient {
  uid: string;
  email: string;
  linked_at: string;
}

export default function CaregiverProfileScreen() {
  const [profile, setProfile] = useState<CaregiverProfile | null>(null);
  const [linkedPatients, setLinkedPatients] = useState<LinkedPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editEmail, setEditEmail] = useState('');
  const router = useRouter();
  const auth = getAuth(firebaseApp);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        // Cargar perfil
        const profileResponse = await fetch(`http://127.0.0.1:8000/api/user-profile/?user_uid=${user.uid}&user_type=caregiver`);
        
        // Cargar pacientes vinculados
        const patientsResponse = await fetch(`http://127.0.0.1:8000/api/caregiver-patients/?caregiver_uid=${user.uid}`);
        
        if (profileResponse.ok && patientsResponse.ok) {
          const profileData = await profileResponse.json();
          const patientsData = await patientsResponse.json();
          
          setProfile(profileData.profile);
          setLinkedPatients(patientsData.patients);
          setEditEmail(profileData.profile.email);
        } else {
          console.error('Error fetching data');
          Alert.alert('Error', 'No se pudo cargar la información del perfil');
        }
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
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
            user_type: 'caregiver',
            email: editEmail,
          }),
        });

        if (response.ok) {
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

  const navigateToPatient = (patient: LinkedPatient) => {
    router.push({
      pathname: '/patient-graphics',
      params: {
        patientId: patient.uid,
        patientEmail: patient.email
      }
    });
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
        <TouchableOpacity style={styles.retryButton} onPress={loadProfileData}>
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
          <MaterialCommunityIcons name="doctor" size={32} color="#0A7EA4" />
          <View style={styles.headerText}>
            <ThemedText type="title" style={styles.title}>
              Mi Perfil Profesional
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Información y estadísticas de cuidado
            </ThemedText>
          </View>
        </View>
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
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="doctor" size={48} color="#0A7EA4" />
            </View>
            <View style={styles.userTypeIndicator}>
              <MaterialCommunityIcons name="stethoscope" size={16} color="white" />
            </View>
          </View>

          <View style={styles.basicInfo}>
            <ThemedText style={styles.userType}>Cuidador Profesional</ThemedText>
            
            {editing ? (
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
              Activo desde {profile.statistics.active_since ? 
                new Date(profile.statistics.active_since).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long'
                }) : 'Recientemente'
              }
            </ThemedText>
          </View>
        </View>

        {/* Professional Statistics */}
        <View style={styles.statisticsSection}>
          <ThemedText type="title" style={styles.sectionTitle}>
            Estadísticas Profesionales
          </ThemedText>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="account-group" size={32} color="#4CAF50" />
              <ThemedText style={styles.statValue}>{profile.statistics.patients_count}</ThemedText>
              <ThemedText style={styles.statLabel}>Pacientes Activos</ThemedText>
            </View>

            <View style={styles.statCard}>
              <MaterialCommunityIcons name="note-text" size={32} color="#2196F3" />
              <ThemedText style={styles.statValue}>{profile.statistics.total_notes_access}</ThemedText>
              <ThemedText style={styles.statLabel}>Notas Accesibles</ThemedText>
            </View>

            <View style={styles.statCard}>
              <MaterialCommunityIcons name="chart-line" size={32} color="#FF9800" />
              <ThemedText style={styles.statValue}>{profile.statistics.average_notes_per_patient}</ThemedText>
              <ThemedText style={styles.statLabel}>Promedio por Paciente</ThemedText>
            </View>
          </View>
        </View>

        {/* Linked Patients */}
        <View style={styles.patientsSection}>
          <View style={styles.sectionHeader}>
            <ThemedText type="title" style={styles.sectionTitle}>
              Mis Pacientes ({linkedPatients.length})
            </ThemedText>
            <TouchableOpacity 
              style={styles.manageButton}
              onPress={() => router.push('/manage-patients')}
            >
              <MaterialCommunityIcons name="cog" size={16} color="#0A7EA4" />
              <ThemedText style={styles.manageButtonText}>Gestionar</ThemedText>
            </TouchableOpacity>
          </View>

          {linkedPatients.length > 0 ? (
            <View style={styles.patientsList}>
              {linkedPatients.slice(0, 3).map((patient) => (
                <TouchableOpacity
                  key={patient.uid}
                  style={styles.patientCard}
                  onPress={() => navigateToPatient(patient)}
                >
                  <View style={styles.patientInfo}>
                    <MaterialCommunityIcons name="account-heart" size={24} color="#0A7EA4" />
                    <View style={styles.patientDetails}>
                      <ThemedText style={styles.patientEmail}>{patient.email}</ThemedText>
                      <ThemedText style={styles.patientDate}>
                        Vinculado: {new Date(patient.linked_at).toLocaleDateString('es-ES')}
                      </ThemedText>
                    </View>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
                </TouchableOpacity>
              ))}
              
              {linkedPatients.length > 3 && (
                <TouchableOpacity 
                  style={styles.seeMoreButton}
                  onPress={() => router.push('/manage-patients')}
                >
                  <ThemedText style={styles.seeMoreText}>
                    Ver {linkedPatients.length - 3} pacientes más
                  </ThemedText>
                  <MaterialCommunityIcons name="arrow-right" size={16} color="#0A7EA4" />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.noPatientsContainer}>
              <MaterialCommunityIcons name="account-off" size={48} color="#ccc" />
              <ThemedText style={styles.noPatientsTitle}>Sin pacientes vinculados</ThemedText>
              <ThemedText style={styles.noPatientsSubtitle}>
                Añade tu primer paciente para comenzar
              </ThemedText>
              <TouchableOpacity 
                style={styles.addPatientButton}
                onPress={() => router.push('/add-patient')}
              >
                <MaterialCommunityIcons name="plus" size={16} color="white" />
                <ThemedText style={styles.addPatientText}>Añadir Paciente</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <ThemedText type="title" style={styles.sectionTitle}>
            Acciones Rápidas
          </ThemedText>

          <View style={styles.actionsList}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/add-patient')}
            >
              <MaterialCommunityIcons name="account-plus" size={24} color="#0A7EA4" />
              <View style={styles.actionContent}>
                <ThemedText style={styles.actionTitle}>Añadir Paciente</ThemedText>
                <ThemedText style={styles.actionSubtitle}>
                  Buscar y vincular nuevo paciente
                </ThemedText>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/manage-patients')}
            >
              <MaterialCommunityIcons name="account-group" size={24} color="#0A7EA4" />
              <View style={styles.actionContent}>
                <ThemedText style={styles.actionTitle}>Gestionar Pacientes</ThemedText>
                <ThemedText style={styles.actionSubtitle}>
                  Ver y administrar todos los pacientes
                </ThemedText>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
            </TouchableOpacity>

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
    backgroundColor: '#4CAF50',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  manageButtonText: {
    color: '#0A7EA4',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
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
  patientsSection: {
    marginBottom: 30,
  },
  patientsList: {
    gap: 12,
  },
  patientCard: {
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
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  patientDetails: {
    marginLeft: 12,
    flex: 1,
  },
  patientEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  patientDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  seeMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0A7EA4',
  },
  seeMoreText: {
    color: '#0A7EA4',
    fontWeight: '600',
    marginRight: 8,
  },
  noPatientsContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noPatientsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  noPatientsSubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  addPatientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A7EA4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  addPatientText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
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