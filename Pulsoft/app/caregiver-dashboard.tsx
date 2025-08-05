import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth, signOut } from 'firebase/auth';
import { getDatabase, ref, onValue, get } from 'firebase/database';
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
}

export default function CaregiverDashboardScreen() {
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
  const [linkedPatients, setLinkedPatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const auth = getAuth(firebaseApp);

  useEffect(() => {
    // Cargar pacientes vinculados desde Firebase
    const loadLinkedPatients = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.error('No hay usuario autenticado');
          setLoading(false);
          return;
        }

        const db = getDatabase(firebaseApp);
        
        // Obtener la lista de pacientes vinculados al cuidador
        const caregiverRef = ref(db, `caregivers/${user.uid}/linkedPatients`);
        const caregiverSnapshot = await get(caregiverRef);
        
        if (caregiverSnapshot.exists()) {
          const linkedPatientIds = caregiverSnapshot.val();
          const patients: PatientData[] = [];
          
          // Obtener datos de cada paciente vinculado
          for (const patientId in linkedPatientIds) {
            const patientRef = ref(db, `patients/${patientId}`);
            const patientSnapshot = await get(patientRef);
            
            if (patientSnapshot.exists()) {
              const patientData = patientSnapshot.val();
              patients.push({
                uid: patientId,
                email: patientData.email || `paciente-${patientId}@ejemplo.com`,
                cardiovascular: patientData.cardiovascular || 0,
                sudor: patientData.sudor || 0,
                temperatura: patientData.temperatura || 0,
                lastUpdate: patientData.lastUpdate || new Date().toLocaleString()
              });
            }
          }
          
          setLinkedPatients(patients);
          if (patients.length > 0) {
            setSelectedPatient(patients[0]);
          }
        } else {
          // Si no hay pacientes vinculados, mostrar mensaje
          console.log('No se encontraron pacientes vinculados');
          setLinkedPatients([]);
        }
      } catch (error) {
        console.error('Error loading linked patients:', error);
        Alert.alert('Error', 'No se pudieron cargar los pacientes vinculados');
      } finally {
        setLoading(false);
      }
    };

    loadLinkedPatients();
  }, []);

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

  const handleViewCharts = () => {
    if (selectedPatient) {
      router.push({
        pathname: '/patient-charts',
        params: { patientId: selectedPatient.uid, patientEmail: selectedPatient.email }
      });
    }
  };

  const handleSelectPatient = (patient: PatientData) => {
    setSelectedPatient(patient);
  };

  const handleSettings = () => {
    router.push('/configuracion-usuario');
  };

  const getHealthStatus = (cardiovascular: number, sudor: number, temperatura: number) => {
    // Lógica simple para determinar el estado de salud
    if (temperatura > 38 || cardiovascular > 100 || sudor > 80) {
      return { status: 'Crítico', color: '#FF6B6B', icon: 'alert-circle' };
    } else if (temperatura > 37.5 || cardiovascular > 85 || sudor > 60) {
      return { status: 'Atención', color: '#FFA726', icon: 'alert' };
    } else {
      return { status: 'Estable', color: '#4CAF50', icon: 'check-circle' };
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
            Pacientes Vinculados ({linkedPatients.length})
          </ThemedText>
          
          {linkedPatients.length > 0 ? (
            <View style={styles.patientList}>
              {linkedPatients.map((patient) => {
                const healthStatus = getHealthStatus(patient.cardiovascular, patient.sudor, patient.temperatura);
                return (
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
                        <View style={styles.patientMetrics}>
                          <ThemedText style={styles.metricText}>
                            ❤️ {patient.cardiovascular} | 💧 {patient.sudor} | 🌡️ {patient.temperatura}°C
                          </ThemedText>
                        </View>
                        <View style={styles.healthStatus}>
                          <MaterialCommunityIcons 
                            name={healthStatus.icon as any} 
                            size={16} 
                            color={healthStatus.color} 
                          />
                          <ThemedText style={[styles.statusText, { color: healthStatus.color }]}>
                            {healthStatus.status}
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                    {selectedPatient?.uid === patient.uid && (
                      <MaterialCommunityIcons name="check-circle" size={20} color="#0A7EA4" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.noPatientsContainer}>
              <MaterialCommunityIcons name="account-off" size={48} color="#ccc" />
              <ThemedText style={styles.noPatientsText}>
                No se encontraron pacientes vinculados
              </ThemedText>
              <ThemedText style={styles.noPatientsSubtext}>
                Los pacientes aparecerán aquí una vez que se vinculen
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

            {/* Estado de salud */}
            <View style={styles.healthStatusContainer}>
              {(() => {
                const healthStatus = getHealthStatus(selectedPatient.cardiovascular, selectedPatient.sudor, selectedPatient.temperatura);
                return (
                  <View style={[styles.healthStatusCard, { borderColor: healthStatus.color }]}>
                    <MaterialCommunityIcons name={healthStatus.icon as any} size={24} color={healthStatus.color} />
                    <ThemedText style={[styles.healthStatusTitle, { color: healthStatus.color }]}>
                      Estado: {healthStatus.status}
                    </ThemedText>
                  </View>
                );
              })()}
            </View>

            {/* Acciones */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={handleViewAnalysis}
                disabled={!selectedPatient}
              >
                <MaterialCommunityIcons name="note-text" size={24} color="white" />
                <ThemedText style={styles.actionButtonText}>
                  Ver notas del paciente
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, styles.secondaryButton]} 
                onPress={handleViewCharts}
                disabled={!selectedPatient}
              >
                <MaterialCommunityIcons name="chart-line" size={24} color="#0A7EA4" />
                <ThemedText style={[styles.actionButtonText, styles.secondaryButtonText]}>
                  Ver gráficas del paciente
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
    color: 'white',
    fontFamily: 'Lufga-Bold',
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
  patientMetrics: {
    marginTop: 4,
  },
  metricText: {
    fontSize: 12,
    color: '#666',
  },
  healthStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
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
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
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
  healthStatusContainer: {
    marginBottom: 20,
  },
  healthStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  healthStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
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