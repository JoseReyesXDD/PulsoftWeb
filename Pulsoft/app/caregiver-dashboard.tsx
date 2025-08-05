import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth, signOut } from 'firebase/auth';
import { firebaseApp } from '../firebaseConfig';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface PatientData {
  uid: string;
  email: string;
  cardiovascular: number;
  sudor: number;
  temperatura: number;
  lastUpdate: string;
  linked_at?: string;
}

interface Note {
  id: string;
  content: string;
  createdAt: string;
  type: 'analysis' | 'recommendation' | 'observation';
}

export default function CaregiverDashboardScreen() {
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
  const [linkedPatients, setLinkedPatients] = useState<PatientData[]>([]);
  const [patientNotes, setPatientNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [notesLoading, setNotesLoading] = useState(false);
  const router = useRouter();
  const auth = getAuth(firebaseApp);

  useEffect(() => {
    loadLinkedPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      loadPatientNotes(selectedPatient.uid);
    }
  }, [selectedPatient]);

  const loadLinkedPatients = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const response = await fetch(`http://127.0.0.1:8000/api/caregiver-patients/?caregiver_uid=${user.uid}`);
        
        if (response.ok) {
          const data = await response.json();
          // Add mock health data for display purposes
          const patientsWithHealthData = data.patients.map((patient: any) => ({
            ...patient,
            cardiovascular: Math.floor(Math.random() * 30) + 70, // 70-100
            sudor: Math.floor(Math.random() * 30) + 30, // 30-60
            temperatura: (Math.random() * 2 + 36).toFixed(1), // 36.0-38.0
            lastUpdate: new Date().toLocaleString()
          }));
          
          setLinkedPatients(patientsWithHealthData);
          if (patientsWithHealthData.length > 0) {
            setSelectedPatient(patientsWithHealthData[0]);
          }
        } else {
          console.error('Error fetching linked patients:', response.statusText);
          Alert.alert('Error', 'No se pudieron cargar los pacientes vinculados');
        }
      }
    } catch (error) {
      console.error('Error loading linked patients:', error);
      Alert.alert('Error', 'No se pudieron cargar los pacientes vinculados');
    } finally {
      setLoading(false);
    }
  };

  const loadPatientNotes = async (patientUid: string) => {
    setNotesLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        const response = await fetch(`http://127.0.0.1:8000/api/patient-notes/?patient_uid=${patientUid}&requester_uid=${user.uid}&requester_type=caregiver`);
        
        if (response.ok) {
          const data = await response.json();
          // Show only recent notes (last 5) in dashboard
          setPatientNotes(data.notes.slice(0, 5));
        } else {
          console.error('Error fetching patient notes:', response.statusText);
          setPatientNotes([]);
        }
      }
    } catch (error) {
      console.error('Error loading patient notes:', error);
      setPatientNotes([]);
    } finally {
      setNotesLoading(false);
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

  const handleViewAnalysis = () => {
    if (selectedPatient) {
      router.push({
        pathname: '/caregiver-notes',
        params: { patientId: selectedPatient.uid }
      });
    }
  };

  const handleViewGraphics = () => {
    if (selectedPatient) {
      router.push({
        pathname: '/patient-graphics',
        params: { 
          patientId: selectedPatient.uid,
          patientEmail: selectedPatient.email
        }
      });
    }
  };

  const handleAddPatient = () => {
    router.push('/add-patient');
  };

  const handleManagePatient = () => {
    if (selectedPatient) {
      // Mostrar opciones para manejar el paciente
      Alert.alert(
        'Gestionar Paciente',
        `¿Qué deseas hacer con ${selectedPatient.email}?`,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Desvincular',
            style: 'destructive',
            onPress: () => handleUnlinkPatient(selectedPatient),
          },
          {
            text: 'Ver Perfil',
            onPress: () => {
              // Navegar al perfil del paciente
              console.log('Ver perfil del paciente');
            },
          },
        ]
      );
    }
  };

  const handleUnlinkPatient = async (patient: PatientData) => {
    Alert.alert(
      'Confirmar Desvinculación',
      `¿Estás seguro de que deseas desvincular al paciente ${patient.email}? Ya no podrás ver sus datos ni notas.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Desvincular',
          style: 'destructive',
          onPress: async () => {
            try {
              const user = auth.currentUser;
              if (user) {
                const response = await fetch('http://127.0.0.1:8000/api/unlink-patient/', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    caregiver_uid: user.uid,
                    patient_uid: patient.uid,
                  }),
                });

                if (response.ok) {
                  Alert.alert('Éxito', 'Paciente desvinculado exitosamente');
                  // Recargar la lista de pacientes
                  loadLinkedPatients();
                } else {
                  const errorData = await response.json();
                  Alert.alert('Error', errorData.error || 'No se pudo desvincular el paciente');
                }
              }
            } catch (error) {
              console.error('Error unlinking patient:', error);
              Alert.alert('Error', 'Error al desvincular el paciente');
            }
          },
        },
      ]
    );
  };

  const handleSelectPatient = (patient: PatientData) => {
    setSelectedPatient(patient);
  };

  const handleSettings = () => {
    router.push('/configuracion-usuario');
  };

  const getNoteIcon = (type: string) => {
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

  const formatNoteDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Cargando...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <MaterialCommunityIcons name="account-supervisor" size={32} color="#0A7EA4" />
          <View style={styles.headerText}>
            <ThemedText type="title" style={styles.title}>
              Dashboard del Cuidador
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              {selectedPatient ? `Paciente: ${selectedPatient.email}` : 'Selecciona un paciente'}
            </ThemedText>
          </View>
        </View>
        <TouchableOpacity onPress={handleSettings} style={styles.settingsButton}>
          <MaterialCommunityIcons name="cog" size={24} color="#0A7EA4" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Selector de paciente */}
        <View style={styles.patientSelector}>
          <ThemedText type="title" style={styles.sectionTitle}>
            Pacientes Vinculados
          </ThemedText>
          
          {linkedPatients.length > 0 ? (
            <View style={styles.patientList}>
              {linkedPatients.map((patient) => (
                <TouchableOpacity
                  key={patient.uid}
                  style={[
                    styles.patientCard,
                    selectedPatient?.uid === patient.uid && styles.selectedPatientCard
                  ]}
                  onPress={() => handleSelectPatient(patient)}
                >
                  <View style={styles.patientInfo}>
                    <MaterialCommunityIcons 
                      name="account-heart" 
                      size={24} 
                      color={selectedPatient?.uid === patient.uid ? "#0A7EA4" : "#666"} 
                    />
                    <View style={styles.patientDetails}>
                      <ThemedText style={[
                        styles.patientEmail,
                        selectedPatient?.uid === patient.uid && styles.selectedPatientText
                      ]}>
                        {patient.email}
                      </ThemedText>
                      <ThemedText style={styles.lastUpdate}>
                        Vinculado: {patient.linked_at ? new Date(patient.linked_at).toLocaleDateString('es-ES') : 'Recientemente'}
                      </ThemedText>
                    </View>
                  </View>
                  {selectedPatient?.uid === patient.uid && (
                    <MaterialCommunityIcons name="check-circle" size={20} color="#0A7EA4" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.noPatientsContainer}>
              <MaterialCommunityIcons name="account-off" size={48} color="#ccc" />
              <ThemedText style={styles.noPatientsText}>
                No se encontraron pacientes vinculados
              </ThemedText>
              <TouchableOpacity style={styles.addFirstPatientButton} onPress={handleAddPatient}>
                <MaterialCommunityIcons name="account-plus" size={20} color="white" />
                <ThemedText style={styles.addFirstPatientText}>Añadir Primer Paciente</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Datos del paciente seleccionado */}
        {selectedPatient && (
          <View style={styles.patientDataContainer}>
            <ThemedText type="title" style={styles.sectionTitle}>
              Datos del Paciente
            </ThemedText>
            
            <View style={styles.metricsContainer}>
              <View style={styles.metricCard}>
                <MaterialCommunityIcons name="heart-pulse" size={32} color="#FF6B6B" />
                <ThemedText style={styles.metricValue}>{selectedPatient.cardiovascular}</ThemedText>
                <ThemedText style={styles.metricLabel}>Cardiovascular</ThemedText>
              </View>
              
              <View style={styles.metricCard}>
                <MaterialCommunityIcons name="water" size={32} color="#4BC0C0" />
                <ThemedText style={styles.metricValue}>{selectedPatient.sudor}</ThemedText>
                <ThemedText style={styles.metricLabel}>Sudor</ThemedText>
              </View>
              
              <View style={styles.metricCard}>
                <MaterialCommunityIcons name="thermometer" size={32} color="#FFCD56" />
                <ThemedText style={styles.metricValue}>{selectedPatient.temperatura}°C</ThemedText>
                <ThemedText style={styles.metricLabel}>Temperatura</ThemedText>
              </View>
            </View>

            {/* Notas del paciente */}
            <View style={styles.notesSection}>
              <View style={styles.notesSectionHeader}>
                <ThemedText type="title" style={styles.notesTitle}>
                  Notas del Paciente
                </ThemedText>
                <TouchableOpacity onPress={handleViewAnalysis} style={styles.viewAllButton}>
                  <ThemedText style={styles.viewAllText}>Ver todas</ThemedText>
                  <MaterialCommunityIcons name="arrow-right" size={16} color="#0A7EA4" />
                </TouchableOpacity>
              </View>

              {notesLoading ? (
                <View style={styles.notesLoadingContainer}>
                  <ThemedText style={styles.notesLoadingText}>Cargando notas...</ThemedText>
                </View>
              ) : patientNotes.length > 0 ? (
                <View style={styles.notesContainer}>
                  {patientNotes.map((note) => {
                    const icon = getNoteIcon(note.type);
                    return (
                      <View key={note.id} style={styles.noteCard}>
                        <View style={styles.noteHeader}>
                          <View style={styles.noteTypeContainer}>
                            <MaterialCommunityIcons 
                              name={icon.name as any} 
                              size={16} 
                              color={icon.color} 
                            />
                            <ThemedText style={[styles.noteType, { color: icon.color }]}>
                              {note.type === 'analysis' ? 'Análisis' : 
                               note.type === 'recommendation' ? 'Recomendación' : 'Observación'}
                            </ThemedText>
                          </View>
                          <ThemedText style={styles.noteDate}>
                            {formatNoteDate(note.createdAt)}
                          </ThemedText>
                        </View>
                        <ThemedText style={styles.noteContent} numberOfLines={2}>
                          {note.content}
                        </ThemedText>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.emptyNotesContainer}>
                  <MaterialCommunityIcons name="note-off" size={48} color="#ccc" />
                  <ThemedText style={styles.emptyNotesText}>
                    No hay notas registradas para este paciente
                  </ThemedText>
                </View>
              )}
            </View>

            {/* Acciones */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={handleViewAnalysis}
                disabled={!selectedPatient}
              >
                <MaterialCommunityIcons name="chart-line" size={24} color="white" />
                <ThemedText style={styles.actionButtonText}>
                  Ver análisis del paciente
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, styles.secondaryButton]} 
                onPress={handleViewGraphics}
              >
                <MaterialCommunityIcons name="chart-bar" size={24} color="#0A7EA4" />
                <ThemedText style={[styles.actionButtonText, styles.secondaryButtonText]}>
                  Ver gráficas
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, styles.secondaryButton]} 
                onPress={handleAddPatient}
              >
                <MaterialCommunityIcons name="account-plus" size={24} color="#0A7EA4" />
                <ThemedText style={[styles.actionButtonText, styles.secondaryButtonText]}>
                  Añadir Paciente
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, styles.secondaryButton]} 
                onPress={handleManagePatient}
              >
                <MaterialCommunityIcons name="account-cog" size={24} color="#0A7EA4" />
                <ThemedText style={[styles.actionButtonText, styles.secondaryButtonText]}>
                  Gestionar Paciente
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Add Patient Button */}
      <TouchableOpacity style={styles.floatingAddButton} onPress={handleAddPatient}>
        <MaterialCommunityIcons name="plus" size={24} color="white" />
      </TouchableOpacity>

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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
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
  settingsButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  patientSelector: {
    marginBottom: 30,
  },
  patientList: {
    gap: 12,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedPatientCard: {
    borderColor: '#0A7EA4',
    backgroundColor: '#f0f8ff',
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
  selectedPatientText: {
    color: '#0A7EA4',
  },
  lastUpdate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  noPatientsContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noPatientsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  addFirstPatientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A7EA4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  addFirstPatientText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  patientDataContainer: {
    marginBottom: 20,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#333',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  notesSection: {
    marginBottom: 30,
  },
  notesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  notesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#0A7EA4',
    marginRight: 4,
    fontWeight: '600',
  },
  notesLoadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  notesLoadingText: {
    fontSize: 14,
    color: '#666',
  },
  notesContainer: {
    gap: 12,
  },
  noteCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteType: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  noteDate: {
    fontSize: 12,
    color: '#666',
  },
  noteContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  emptyNotesContainer: {
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
  emptyNotesText: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
    textAlign: 'center',
  },
  actionsContainer: {
    marginBottom: 30,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A7EA4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#0A7EA4',
  },
  secondaryButtonText: {
    color: '#0A7EA4',
  },
  floatingAddButton: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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