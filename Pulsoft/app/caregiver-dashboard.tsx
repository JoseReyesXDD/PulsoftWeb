import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth, signOut } from 'firebase/auth';
import { firebaseApp } from '../firebaseConfig';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface PatientData {
  uid: string;
  email: string;
  user_type: string;
  cardiovascular?: number;
  sudor?: number;
  temperatura?: number;
  lastUpdate?: string;
  notesCount?: number;
}

interface CaregiverPatientsResponse {
  caregiver_uid: string;
  linked_patients: PatientData[];
  total_patients: number;
}

export default function CaregiverDashboardScreen() {
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
  const [linkedPatients, setLinkedPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const auth = getAuth(firebaseApp);

  useEffect(() => {
    loadLinkedPatients();
  }, []);

  const loadLinkedPatients = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        Alert.alert('Error', 'No hay usuario autenticado');
        router.replace('/login');
        return;
      }

      // Obtener token de autenticación
      const token = await currentUser.getIdToken();
      
      // Llamada a la API real
      const response = await fetch(`http://localhost:8000/api/caregiver-patients/?caregiver_uid=${currentUser.uid}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: CaregiverPatientsResponse = await response.json();
        setLinkedPatients(data.linked_patients);
        
        if (data.linked_patients.length > 0) {
          setSelectedPatient(data.linked_patients[0]);
        }
      } else {
        // Fallback a datos mock si la API no está disponible
        console.log('API no disponible, usando datos mock');
        const mockPatients: PatientData[] = [
          {
            uid: '1',
            email: 'paciente1@ejemplo.com',
            user_type: 'patient',
            cardiovascular: 75,
            sudor: 45,
            temperatura: 37.2,
            lastUpdate: new Date().toLocaleString(),
            notesCount: 3
          },
          {
            uid: '2',
            email: 'paciente2@ejemplo.com',
            user_type: 'patient',
            cardiovascular: 82,
            sudor: 38,
            temperatura: 36.8,
            lastUpdate: new Date().toLocaleString(),
            notesCount: 1
          }
        ];
        
        setLinkedPatients(mockPatients);
        if (mockPatients.length > 0) {
          setSelectedPatient(mockPatients[0]);
        }
      }
    } catch (error) {
      console.error('Error loading linked patients:', error);
      Alert.alert('Error', 'No se pudieron cargar los pacientes vinculados');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLinkedPatients();
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
        params: { 
          patientId: selectedPatient.uid,
          patientEmail: selectedPatient.email 
        }
      });
    }
  };

  const handleViewCharts = () => {
    if (selectedPatient) {
      router.push({
        pathname: '/patient-charts',
        params: { 
          patientId: selectedPatient.uid,
          patientEmail: selectedPatient.email 
        }
      });
    }
  };

  const handleSelectPatient = (patient: PatientData) => {
    setSelectedPatient(patient);
  };

  const handleSettings = () => {
    router.push('/configuracion-usuario');
  };

  const handleManagePatients = () => {
    router.push('/manage-patient-links');
  };

  const handleViewAllPatients = () => {
    Alert.alert('Información', 'Funcionalidad para ver todos los pacientes en desarrollo');
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <MaterialCommunityIcons name="loading" size={48} color="#0A7EA4" />
        <ThemedText style={styles.loadingText}>Cargando pacientes...</ThemedText>
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

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Selector de paciente */}
        <View style={styles.patientSelector}>
          <View style={styles.sectionHeader}>
            <ThemedText type="title" style={styles.sectionTitle}>
              Pacientes Vinculados ({linkedPatients.length})
            </ThemedText>
            <TouchableOpacity onPress={handleViewAllPatients} style={styles.viewAllButton}>
              <ThemedText style={styles.viewAllText}>Ver todos</ThemedText>
            </TouchableOpacity>
          </View>
          
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
                      <View style={styles.patientStats}>
                        <ThemedText style={styles.lastUpdate}>
                          Última actualización: {patient.lastUpdate || 'No disponible'}
                        </ThemedText>
                        {patient.notesCount !== undefined && (
                          <ThemedText style={styles.notesCount}>
                            {patient.notesCount} notas
                          </ThemedText>
                        )}
                      </View>
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
              <ThemedText style={styles.noPatientsSubtext}>
                Los pacientes aparecerán aquí una vez que se vinculen a tu cuenta
              </ThemedText>
            </View>
          )}
        </View>

        {/* Datos del paciente seleccionado */}
        {selectedPatient && (
          <View style={styles.patientDataContainer}>
            <ThemedText type="title" style={styles.sectionTitle}>
              Datos del Paciente Seleccionado
            </ThemedText>
            
            <View style={styles.patientSummary}>
              <View style={styles.patientAvatar}>
                <MaterialCommunityIcons name="account" size={32} color="#0A7EA4" />
              </View>
              <View style={styles.patientSummaryInfo}>
                <ThemedText style={styles.patientName}>{selectedPatient.email}</ThemedText>
                <ThemedText style={styles.patientStatus}>Paciente Activo</ThemedText>
              </View>
            </View>

            {/* Métricas del paciente */}
            {(selectedPatient.cardiovascular || selectedPatient.sudor || selectedPatient.temperatura) && (
              <View style={styles.metricsContainer}>
                {selectedPatient.cardiovascular && (
                  <View style={styles.metricCard}>
                    <MaterialCommunityIcons name="heart-pulse" size={32} color="#FF6B6B" />
                    <ThemedText style={styles.metricValue}>{selectedPatient.cardiovascular}</ThemedText>
                    <ThemedText style={styles.metricLabel}>Cardiovascular</ThemedText>
                  </View>
                )}
                
                {selectedPatient.sudor && (
                  <View style={styles.metricCard}>
                    <MaterialCommunityIcons name="water" size={32} color="#4BC0C0" />
                    <ThemedText style={styles.metricValue}>{selectedPatient.sudor}</ThemedText>
                    <ThemedText style={styles.metricLabel}>Sudor</ThemedText>
                  </View>
                )}
                
                {selectedPatient.temperatura && (
                  <View style={styles.metricCard}>
                    <MaterialCommunityIcons name="thermometer" size={32} color="#FFCD56" />
                    <ThemedText style={styles.metricValue}>{selectedPatient.temperatura}°C</ThemedText>
                    <ThemedText style={styles.metricLabel}>Temperatura</ThemedText>
                  </View>
                )}
              </View>
            )}

            {/* Acciones principales */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={handleViewAnalysis}
                disabled={!selectedPatient}
              >
                <MaterialCommunityIcons name="file-document" size={24} color="white" />
                <ThemedText style={styles.actionButtonText}>
                  Ver análisis del paciente
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, styles.secondaryButton]} 
                onPress={handleViewCharts}
                disabled={!selectedPatient}
              >
                <MaterialCommunityIcons name="chart-line" size={24} color="#0A7EA4" />
                <ThemedText style={[styles.actionButtonText, styles.secondaryButtonText]}>
                  Ver gráficas
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* Acciones adicionales */}
            <View style={styles.additionalActions}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.tertiaryButton]} 
                onPress={handleManagePatients}
              >
                <MaterialCommunityIcons name="account-multiple" size={24} color="#27ae60" />
                <ThemedText style={[styles.actionButtonText, styles.tertiaryButtonText]}>
                  Gestionar Pacientes
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, styles.tertiaryButton]} 
                onPress={() => router.push('/select_patient')}
              >
                <MaterialCommunityIcons name="account-switch" size={24} color="#95a5a6" />
                <ThemedText style={[styles.actionButtonText, styles.tertiaryButtonText]}>
                  Cambiar Paciente
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Lufga-Bold',
  },
  viewAllButton: {
    padding: 8,
  },
  viewAllText: {
    color: '#0A7EA4',
    fontSize: 14,
    fontWeight: '600',
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
  patientStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  lastUpdate: {
    fontSize: 12,
    color: '#666',
  },
  notesCount: {
    fontSize: 12,
    color: '#0A7EA4',
    fontWeight: '600',
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
  noPatientsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  patientDataContainer: {
    marginBottom: 20,
  },
  patientSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  patientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  patientSummaryInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  patientStatus: {
    fontSize: 14,
    color: '#0A7EA4',
    marginTop: 2,
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
  actionsContainer: {
    marginBottom: 20,
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
  additionalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  tertiaryButton: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#27ae60',
  },
  tertiaryButtonText: {
    color: '#27ae60',
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