import React, { useState, useEffect } from 'react';
import { 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  RefreshControl,
  TextInput,
  ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth, signOut } from 'firebase/auth';
import { firebaseApp } from '../firebaseConfig';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { caregiverService } from '../utils/caregiverService';
import { PatientData } from '../types/caregiver';

interface LinkData {
  id: string;
  patient: PatientData;
  linked_at: string;
}

export default function ManagePatientLinksScreen() {
  const [linkedPatients, setLinkedPatients] = useState<LinkData[]>([]);
  const [availablePatients, setAvailablePatients] = useState<PatientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [linkingPatient, setLinkingPatient] = useState<string | null>(null);
  const [unlinkingPatient, setUnlinkingPatient] = useState<string | null>(null);
  
  const router = useRouter();
  const auth = getAuth(firebaseApp);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        Alert.alert('Error', 'No hay usuario autenticado');
        router.replace('/login');
        return;
      }

      // Cargar pacientes vinculados
      const linkedResponse = await caregiverService.getLinkedPatients(currentUser.uid);
      if (linkedResponse.success && linkedResponse.data) {
        // Convertir a formato de vínculos
        const links: LinkData[] = linkedResponse.data.linked_patients.map((patient, index) => ({
          id: `link_${index}`,
          patient,
          linked_at: new Date().toISOString() // Mock date
        }));
        setLinkedPatients(links);
      } else {
        // Fallback a datos mock
        const mockPatients = caregiverService.getMockPatients();
        const links: LinkData[] = mockPatients.map((patient, index) => ({
          id: `link_${index}`,
          patient,
          linked_at: new Date().toISOString()
        }));
        setLinkedPatients(links);
      }

      // Cargar pacientes disponibles
      const availableResponse = await caregiverService.getAvailablePatients(currentUser.uid);
      if (availableResponse.success && availableResponse.data) {
        setAvailablePatients(availableResponse.data.available_patients);
      } else {
        // Fallback a datos mock
        setAvailablePatients(caregiverService.getMockAvailablePatients());
      }

    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleLinkPatient = async (patientUid: string, patientEmail: string) => {
    Alert.alert(
      'Vincular Paciente',
      `¿Estás seguro de que quieres vincular al paciente ${patientEmail}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Vincular', 
          onPress: async () => {
            try {
              setLinkingPatient(patientUid);
              const currentUser = auth.currentUser;
              
              if (!currentUser) {
                Alert.alert('Error', 'No hay usuario autenticado');
                return;
              }

              const response = await caregiverService.linkPatient(currentUser.uid, patientUid);
              
              if (response.success) {
                Alert.alert('Éxito', 'Paciente vinculado exitosamente');
                loadData(); // Recargar datos
              } else {
                Alert.alert('Error', response.error || 'Error al vincular paciente');
              }
            } catch (error) {
              console.error('Error linking patient:', error);
              Alert.alert('Error', 'Error al vincular paciente');
            } finally {
              setLinkingPatient(null);
            }
          }
        }
      ]
    );
  };

  const handleUnlinkPatient = async (patientUid: string, patientEmail: string) => {
    Alert.alert(
      'Desvincular Paciente',
      `¿Estás seguro de que quieres desvincular al paciente ${patientEmail}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Desvincular', 
          onPress: async () => {
            try {
              setUnlinkingPatient(patientUid);
              const currentUser = auth.currentUser;
              
              if (!currentUser) {
                Alert.alert('Error', 'No hay usuario autenticado');
                return;
              }

              const response = await caregiverService.unlinkPatient(currentUser.uid, patientUid);
              
              if (response.success) {
                Alert.alert('Éxito', 'Paciente desvinculado exitosamente');
                loadData(); // Recargar datos
              } else {
                Alert.alert('Error', response.error || 'Error al desvincular paciente');
              }
            } catch (error) {
              console.error('Error unlinking patient:', error);
              Alert.alert('Error', 'Error al desvincular paciente');
            } finally {
              setUnlinkingPatient(null);
            }
          }
        }
      ]
    );
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      Alert.alert('Error', 'No se pudo cerrar sesión');
    }
  };

  const filteredAvailablePatients = availablePatients.filter(patient =>
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0A7EA4" />
        <ThemedText style={styles.loadingText}>Cargando datos...</ThemedText>
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
          <MaterialCommunityIcons name="account-supervisor" size={32} color="#0A7EA4" />
          <View style={styles.headerText}>
            <ThemedText type="title" style={styles.title}>
              Gestionar Pacientes
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Vincular y desvincular pacientes
            </ThemedText>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Estadísticas */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statNumber}>{linkedPatients.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Vinculados</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statNumber}>{availablePatients.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Disponibles</ThemedText>
          </View>
        </View>

        {/* Pacientes Vinculados */}
        <View style={styles.section}>
          <ThemedText type="title" style={styles.sectionTitle}>
            📋 Pacientes Vinculados ({linkedPatients.length})
          </ThemedText>
          
          {linkedPatients.length > 0 ? (
            <View style={styles.patientList}>
              {linkedPatients.map((link) => (
                <View key={link.id} style={styles.patientCard}>
                  <View style={styles.patientInfo}>
                    <MaterialCommunityIcons name="account-heart" size={24} color="#0A7EA4" />
                    <View style={styles.patientDetails}>
                      <ThemedText style={styles.patientEmail}>
                        {link.patient.email}
                      </ThemedText>
                      <ThemedText style={styles.patientUid}>
                        ID: {link.patient.uid}
                      </ThemedText>
                      <ThemedText style={styles.linkDate}>
                        Vinculado: {caregiverService.formatDate(link.linked_at)}
                      </ThemedText>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.unlinkButton]}
                    onPress={() => handleUnlinkPatient(link.patient.uid, link.patient.email)}
                    disabled={unlinkingPatient === link.patient.uid}
                  >
                    {unlinkingPatient === link.patient.uid ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="link-off" size={16} color="white" />
                        <ThemedText style={styles.actionButtonText}>Desvincular</ThemedText>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="account-off" size={48} color="#ccc" />
              <ThemedText style={styles.emptyTitle}>No hay pacientes vinculados</ThemedText>
              <ThemedText style={styles.emptySubtitle}>
                Vincula pacientes desde la sección de pacientes disponibles
              </ThemedText>
            </View>
          )}
        </View>

        {/* Pacientes Disponibles */}
        <View style={styles.section}>
          <ThemedText type="title" style={styles.sectionTitle}>
            ➕ Pacientes Disponibles ({filteredAvailablePatients.length})
          </ThemedText>
          
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="🔍 Buscar pacientes..."
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
          
          {filteredAvailablePatients.length > 0 ? (
            <View style={styles.patientList}>
              {filteredAvailablePatients.map((patient) => (
                <View key={patient.uid} style={styles.patientCard}>
                  <View style={styles.patientInfo}>
                    <MaterialCommunityIcons name="account" size={24} color="#666" />
                    <View style={styles.patientDetails}>
                      <ThemedText style={styles.patientEmail}>
                        {patient.email}
                      </ThemedText>
                      <ThemedText style={styles.patientUid}>
                        ID: {patient.uid}
                      </ThemedText>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.linkButton]}
                    onPress={() => handleLinkPatient(patient.uid, patient.email)}
                    disabled={linkingPatient === patient.uid}
                  >
                    {linkingPatient === patient.uid ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="link" size={16} color="white" />
                        <ThemedText style={styles.actionButtonText}>Vincular</ThemedText>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="account-off" size={48} color="#ccc" />
              <ThemedText style={styles.emptyTitle}>
                {searchTerm ? 'No se encontraron pacientes' : 'No hay pacientes disponibles'}
              </ThemedText>
              <ThemedText style={styles.emptySubtitle}>
                {searchTerm ? 'Intenta con otro término de búsqueda' : 'Todos los pacientes ya están vinculados'}
              </ThemedText>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer */}
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
  statsContainer: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 30,
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
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0A7EA4',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: 'white',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
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
  patientUid: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  linkDate: {
    fontSize: 12,
    color: '#0A7EA4',
    marginTop: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    minWidth: 80,
    justifyContent: 'center',
  },
  linkButton: {
    backgroundColor: '#27ae60',
  },
  unlinkButton: {
    backgroundColor: '#e74c3c',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
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