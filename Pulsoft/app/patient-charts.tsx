import React, { useState, useEffect } from 'react';
import { 
  View, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert, 
  RefreshControl,
  ActivityIndicator 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth, signOut } from 'firebase/auth';
import { firebaseApp } from '../firebaseConfig';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { PatientCharts } from '@/components/PatientCharts';
import { caregiverService } from '../utils/caregiverService';
import { mockDataService } from '../utils/mockDataService';

interface PatientData {
  uid: string;
  email: string;
  cardiovascular?: number;
  sudor?: number;
  temperatura?: number;
  lastUpdate?: string;
  name?: string;
  age?: number;
  condition?: string;
}

interface ChartData {
  cardiovascular: number[];
  sudor: number[];
  temperatura: number[];
  labels: string[];
  patientInfo?: {
    name: string;
    age: number;
    condition: string;
  };
}

export default function PatientChartsScreen() {
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [realTimeMode, setRealTimeMode] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  
  const router = useRouter();
  const params = useLocalSearchParams();
  const auth = getAuth(firebaseApp);

  useEffect(() => {
    const patientIdParam = params.patientId as string;
    const patientEmailParam = params.patientEmail as string;
    
    if (patientIdParam) {
      setPatientId(patientIdParam);
      setPatientEmail(patientEmailParam || 'Paciente');
      loadPatientData(patientIdParam);
    }
  }, [params]);

  const loadPatientData = async (patientUid: string) => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        Alert.alert('Error', 'No hay usuario autenticado');
        router.replace('/login');
        return;
      }

      // Obtener datos del paciente desde el servicio mock
      const patient = mockDataService.getPatient(patientUid);
      if (patient) {
        setPatientData(patient);
      } else {
        // Datos por defecto si no se encuentra el paciente
        const defaultPatient: PatientData = {
          uid: patientUid,
          email: patientEmail,
          cardiovascular: 75,
          sudor: 45,
          temperatura: 37.2,
          lastUpdate: new Date().toLocaleString(),
          name: 'Paciente',
          age: 70,
          condition: 'General'
        };
        setPatientData(defaultPatient);
      }

      // Cargar datos de gráficas en tiempo real
      const realTimeChartData = mockDataService.generateRealTimeChartData(patientUid);
      setChartData(realTimeChartData);

    } catch (error) {
      console.error('Error loading patient data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del paciente');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (patientId) {
      loadPatientData(patientId);
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

  const handleExportCharts = () => {
    Alert.alert(
      'Exportar Gráficas',
      '¿Deseas exportar las gráficas como PDF?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Exportar', onPress: () => {
          Alert.alert('Éxito', 'Gráficas exportadas correctamente');
        }}
      ]
    );
  };

  const handleShareCharts = () => {
    Alert.alert(
      'Compartir Gráficas',
      '¿Deseas compartir las gráficas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Compartir', onPress: () => {
          Alert.alert('Éxito', 'Gráficas compartidas correctamente');
        }}
      ]
    );
  };

  const toggleRealTimeMode = () => {
    setRealTimeMode(!realTimeMode);
    Alert.alert(
      realTimeMode ? 'Modo Estático' : 'Modo Tiempo Real',
      realTimeMode 
        ? 'Cambiando a modo estático. Los datos se actualizarán cada 5 segundos.'
        : 'Activando modo tiempo real. Los datos se actualizarán automáticamente.',
      [{ text: 'OK' }]
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0A7EA4" />
        <ThemedText style={styles.loadingText}>Cargando gráficas...</ThemedText>
      </ThemedView>
    );
  }

  if (!patientData) {
    return (
      <ThemedView style={styles.errorContainer}>
        <MaterialCommunityIcons name="chart-line-off" size={64} color="#ccc" />
        <ThemedText style={styles.errorTitle}>No se encontraron datos</ThemedText>
        <ThemedText style={styles.errorSubtitle}>
          No se pudieron cargar los datos del paciente
        </ThemedText>
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
          <MaterialCommunityIcons name="chart-line" size={32} color="#0A7EA4" />
          <View style={styles.headerText}>
            <ThemedText type="title" style={styles.title}>
              Gráficas del Paciente
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              {patientData.name || patientData.email}
            </ThemedText>
            <ThemedText style={styles.realTimeStatus}>
              {realTimeMode ? '🔴 Tiempo Real' : '📊 Estático'}
            </ThemedText>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={toggleRealTimeMode} style={styles.actionButton}>
            <MaterialCommunityIcons 
              name={realTimeMode ? "clock-outline" : "clock"} 
              size={20} 
              color="#0A7EA4" 
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShareCharts} style={styles.actionButton}>
            <MaterialCommunityIcons name="share" size={20} color="#0A7EA4" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleExportCharts} style={styles.actionButton}>
            <MaterialCommunityIcons name="download" size={20} color="#0A7EA4" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Información del paciente */}
        <View style={styles.patientInfo}>
          <View style={styles.patientAvatar}>
            <MaterialCommunityIcons name="account-heart" size={32} color="#0A7EA4" />
          </View>
          <View style={styles.patientDetails}>
            <ThemedText style={styles.patientName}>
              {patientData.name || patientData.email}
            </ThemedText>
            <ThemedText style={styles.patientStatus}>
              {patientData.condition ? `${patientData.condition} - ${patientData.age} años` : 'Paciente Activo'}
            </ThemedText>
            <ThemedText style={styles.lastUpdate}>
              Última actualización: {patientData.lastUpdate}
            </ThemedText>
          </View>
        </View>

        {/* Gráficas */}
        {chartData && (
          <PatientCharts 
            patientData={patientData}
            chartData={chartData}
            realTime={realTimeMode}
          />
        )}

        {/* Acciones adicionales */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push({
              pathname: '/caregiver-notes',
              params: { 
                patientId: patientData.uid,
                patientEmail: patientData.email 
              }
            })}
          >
            <MaterialCommunityIcons name="file-document" size={24} color="#0A7EA4" />
            <ThemedText style={styles.actionText}>Ver Notas</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push({
              pathname: '/caregiver-dashboard',
              params: { selectedPatient: patientData.uid }
            })}
          >
            <MaterialCommunityIcons name="dashboard" size={24} color="#0A7EA4" />
            <ThemedText style={styles.actionText}>Dashboard</ThemedText>
          </TouchableOpacity>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
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
  realTimeStatus: {
    fontSize: 12,
    color: '#0A7EA4',
    marginTop: 2,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 12,
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
  patientDetails: {
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
  lastUpdate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
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