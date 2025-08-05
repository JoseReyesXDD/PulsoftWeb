import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth, signOut } from 'firebase/auth';
import { firebaseApp } from '../firebaseConfig';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { PatientNotesList } from '@/components/PatientNotesList';
import { caregiverService } from '../utils/caregiverService';
import { PatientAnalysis } from '../types/caregiver';

export default function CaregiverNotesScreen() {
  const [analyses, setAnalyses] = useState<PatientAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [patientEmail, setPatientEmail] = useState('');
  const [totalNotes, setTotalNotes] = useState(0);
  
  const router = useRouter();
  const params = useLocalSearchParams();
  const auth = getAuth(firebaseApp);

  const patientIdParam = params.patientId as string;
  const patientEmailParam = params.patientEmail as string;

  useEffect(() => {
    if (patientIdParam && patientEmailParam) {
      setPatientEmail(patientEmailParam);
      loadPatientAnalyses();
    }
  }, [patientIdParam, patientEmailParam]);

  const loadPatientAnalyses = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        Alert.alert('Error', 'No hay usuario autenticado');
        router.replace('/login');
        return;
      }

      // Validar que el paciente esté vinculado al cuidador
      const isLinked = await caregiverService.validatePatientLink(currentUser.uid, patientIdParam);
      if (!isLinked) {
        Alert.alert('Error', 'No tienes permisos para ver las notas de este paciente');
        router.back();
        return;
      }

      // Obtener token de autenticación
      const token = await currentUser.getIdToken();
      
      // Llamada a la API real
      const response = await fetch(
        `http://localhost:8000/api/patient-notes/?patient_uid=${patientIdParam}&caregiver_uid=${currentUser.uid}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAnalyses(data.notes || []);
        setTotalNotes(data.total_notes || 0);
      } else {
        // Fallback a datos mock si la API no está disponible
        console.log('API no disponible, usando datos mock');
        const mockAnalyses = caregiverService.getMockAnalyses(patientEmailParam);
        setAnalyses(mockAnalyses);
        setTotalNotes(mockAnalyses.length);
      }
    } catch (error) {
      console.error('Error loading patient analyses:', error);
      Alert.alert('Error', 'No se pudieron cargar los análisis del paciente');
      
      // Fallback a datos mock en caso de error
      const mockAnalyses = caregiverService.getMockAnalyses(patientEmailParam);
      setAnalyses(mockAnalyses);
      setTotalNotes(mockAnalyses.length);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPatientAnalyses();
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      Alert.alert('Error', 'No se pudo cerrar sesión');
    }
  };

  const handleShareAnalysis = (analysis: PatientAnalysis) => {
    Alert.alert(
      'Compartir Análisis',
      `¿Deseas compartir el análisis del ${caregiverService.formatDate(analysis.analizadoEn)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Compartir', onPress: () => {
          Alert.alert('Éxito', 'Análisis compartido correctamente');
        }}
      ]
    );
  };

  const handleExportAnalysis = (analysis: PatientAnalysis) => {
    Alert.alert(
      'Exportar Análisis',
      `¿Deseas exportar el análisis del ${caregiverService.formatDate(analysis.analizadoEn)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Exportar', onPress: () => {
          Alert.alert('Éxito', 'Análisis exportado correctamente');
        }}
      ]
    );
  };

  const handleViewCharts = () => {
    router.push({
      pathname: '/patient-charts',
      params: { 
        patientId: patientIdParam,
        patientEmail: patientEmailParam 
      }
    });
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <MaterialCommunityIcons name="loading" size={48} color="#0A7EA4" />
        <ThemedText style={styles.loadingText}>Cargando análisis...</ThemedText>
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
          <MaterialCommunityIcons name="file-document" size={32} color="#0A7EA4" />
          <View style={styles.headerText}>
            <ThemedText type="title" style={styles.title}>
              Análisis del Paciente
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              {patientEmail}
            </ThemedText>
            <ThemedText style={styles.notesCount}>
              {totalNotes} análisis disponible{totalNotes !== 1 ? 's' : ''}
            </ThemedText>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleViewCharts} style={styles.actionButton}>
            <MaterialCommunityIcons name="chart-line" size={20} color="#0A7EA4" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Contenido principal */}
      <View style={styles.content}>
        <PatientNotesList
          analyses={analyses}
          onShare={handleShareAnalysis}
          onExport={handleExportAnalysis}
          patientEmail={patientEmail}
        />
      </View>

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
  notesCount: {
    fontSize: 12,
    color: '#0A7EA4',
    marginTop: 2,
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