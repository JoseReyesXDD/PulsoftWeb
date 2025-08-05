import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '../firebaseConfig';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface LinkedPatient {
  uid: string;
  email: string;
  linked_at: string;
  lastActivity?: string;
  notesCount?: number;
}

export default function ManagePatientsScreen() {
  const [linkedPatients, setLinkedPatients] = useState<LinkedPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const auth = getAuth(firebaseApp);

  useEffect(() => {
    loadLinkedPatients();
  }, []);

  const loadLinkedPatients = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const response = await fetch(`http://127.0.0.1:8000/api/caregiver-patients/?caregiver_uid=${user.uid}`);
        
        if (response.ok) {
          const data = await response.json();
          // Añadir datos adicionales simulados
          const enhancedPatients = data.patients.map((patient: any) => ({
            ...patient,
            lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            notesCount: Math.floor(Math.random() * 20) + 5
          }));
          setLinkedPatients(enhancedPatients);
        } else {
          console.error('Error fetching patients:', response.statusText);
          Alert.alert('Error', 'No se pudieron cargar los pacientes');
        }
      }
    } catch (error) {
      console.error('Error loading patients:', error);
      Alert.alert('Error', 'Error al cargar los pacientes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLinkedPatients();
  };

  const handlePatientAction = (patient: LinkedPatient, action: string) => {
    switch (action) {
      case 'view_notes':
        router.push({
          pathname: '/caregiver-notes',
          params: { patientId: patient.uid }
        });
        break;
      case 'view_graphics':
        router.push({
          pathname: '/patient-graphics',
          params: { 
            patientId: patient.uid,
            patientEmail: patient.email
          }
        });
        break;
      case 'unlink':
        handleUnlinkPatient(patient);
        break;
      case 'details':
        showPatientDetails(patient);
        break;
    }
  };

  const handleUnlinkPatient = async (patient: LinkedPatient) => {
    Alert.alert(
      'Confirmar Desvinculación',
      `¿Estás seguro de que deseas desvincular al paciente ${patient.email}?\n\nYa no podrás:\n• Ver sus datos de salud\n• Acceder a sus notas\n• Recibir actualizaciones\n\nEsta acción no se puede deshacer.`,
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
                  loadLinkedPatients(); // Recargar la lista
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

  const showPatientDetails = (patient: LinkedPatient) => {
    const linkedDate = new Date(patient.linked_at);
    const lastActivity = patient.lastActivity ? new Date(patient.lastActivity) : null;
    
    Alert.alert(
      'Detalles del Paciente',
      `Email: ${patient.email}\n\nVinculado: ${linkedDate.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}\n\nÚltima actividad: ${lastActivity ? lastActivity.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : 'No disponible'}\n\nNotas disponibles: ${patient.notesCount || 0}`,
      [
        { text: 'Cerrar', style: 'cancel' }
      ]
    );
  };

  const handleAddPatient = () => {
    router.push('/add-patient');
  };

  const getLastActivityColor = (lastActivity?: string) => {
    if (!lastActivity) return '#999';
    
    const activityDate = new Date(lastActivity);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return '#4CAF50'; // Verde - actividad reciente
    if (diffDays <= 7) return '#FF9800'; // Naranja - actividad moderada
    return '#FF6B6B'; // Rojo - sin actividad reciente
  };

  const getLastActivityText = (lastActivity?: string) => {
    if (!lastActivity) return 'Sin actividad';
    
    const activityDate = new Date(lastActivity);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays <= 7) return `Hace ${diffDays} días`;
    if (diffDays <= 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return `Hace ${Math.floor(diffDays / 30)} meses`;
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Cargando pacientes...</ThemedText>
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
          <MaterialCommunityIcons name="account-group" size={32} color="#0A7EA4" />
          <View style={styles.headerText}>
            <ThemedText type="title" style={styles.title}>
              Gestionar Pacientes
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              {linkedPatients.length} paciente{linkedPatients.length !== 1 ? 's' : ''} vinculado{linkedPatients.length !== 1 ? 's' : ''}
            </ThemedText>
          </View>
        </View>
        <TouchableOpacity onPress={handleAddPatient} style={styles.addButton}>
          <MaterialCommunityIcons name="plus" size={24} color="#0A7EA4" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {linkedPatients.length > 0 ? (
          <View style={styles.patientsList}>
            {linkedPatients.map((patient) => (
              <View key={patient.uid} style={styles.patientCard}>
                {/* Patient Info */}
                <View style={styles.patientHeader}>
                  <View style={styles.patientMainInfo}>
                    <MaterialCommunityIcons name="account-heart" size={24} color="#0A7EA4" />
                    <View style={styles.patientDetails}>
                      <ThemedText style={styles.patientEmail}>{patient.email}</ThemedText>
                      <View style={styles.patientMeta}>
                        <ThemedText style={styles.patientMetaText}>
                          Vinculado: {new Date(patient.linked_at).toLocaleDateString('es-ES')}
                        </ThemedText>
                        <View style={styles.activityIndicator}>
                          <View 
                            style={[
                              styles.activityDot, 
                              { backgroundColor: getLastActivityColor(patient.lastActivity) }
                            ]} 
                          />
                          <ThemedText 
                            style={[
                              styles.activityText,
                              { color: getLastActivityColor(patient.lastActivity) }
                            ]}
                          >
                            {getLastActivityText(patient.lastActivity)}
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity 
                    onPress={() => handlePatientAction(patient, 'details')}
                    style={styles.infoButton}
                  >
                    <MaterialCommunityIcons name="information" size={20} color="#666" />
                  </TouchableOpacity>
                </View>

                {/* Quick Stats */}
                <View style={styles.quickStats}>
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons name="note-text" size={16} color="#666" />
                    <ThemedText style={styles.statText}>{patient.notesCount || 0} notas</ThemedText>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.actionsContainer}>
                  <TouchableOpacity 
                    style={styles.actionBtn}
                    onPress={() => handlePatientAction(patient, 'view_notes')}
                  >
                    <MaterialCommunityIcons name="note-text" size={16} color="#0A7EA4" />
                    <ThemedText style={styles.actionBtnText}>Notas</ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.actionBtn}
                    onPress={() => handlePatientAction(patient, 'view_graphics')}
                  >
                    <MaterialCommunityIcons name="chart-line" size={16} color="#0A7EA4" />
                    <ThemedText style={styles.actionBtnText}>Gráficas</ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.actionBtn, styles.dangerBtn]}
                    onPress={() => handlePatientAction(patient, 'unlink')}
                  >
                    <MaterialCommunityIcons name="link-off" size={16} color="#FF6B6B" />
                    <ThemedText style={[styles.actionBtnText, styles.dangerText]}>Desvincular</ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="account-off" size={64} color="#ccc" />
            <ThemedText style={styles.emptyTitle}>
              No hay pacientes vinculados
            </ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              Añade tu primer paciente para comenzar a monitorear su salud
            </ThemedText>
            <TouchableOpacity style={styles.emptyActionButton} onPress={handleAddPatient}>
              <MaterialCommunityIcons name="plus" size={20} color="white" />
              <ThemedText style={styles.emptyActionText}>Añadir Paciente</ThemedText>
            </TouchableOpacity>
          </View>
        )}
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
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  patientsList: {
    gap: 16,
  },
  patientCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  patientMainInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    marginBottom: 4,
  },
  patientMeta: {
    gap: 4,
  },
  patientMetaText: {
    fontSize: 12,
    color: '#666',
  },
  activityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  activityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  infoButton: {
    padding: 4,
  },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0A7EA4',
    backgroundColor: 'transparent',
  },
  actionBtnText: {
    fontSize: 12,
    color: '#0A7EA4',
    fontWeight: '500',
    marginLeft: 4,
  },
  dangerBtn: {
    borderColor: '#FF6B6B',
  },
  dangerText: {
    color: '#FF6B6B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A7EA4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  emptyActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});