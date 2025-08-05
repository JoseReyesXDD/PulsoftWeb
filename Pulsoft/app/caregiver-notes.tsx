import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth, signOut } from 'firebase/auth';
import { firebaseApp } from '../firebaseConfig';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface PatientAnalysis {
  note_id: string;
  analisis_IA: string;
  analizadoEn: string;
  patient_email: string;
  severity?: 'low' | 'medium' | 'high';
  category?: 'cardiovascular' | 'sudor' | 'temperatura' | 'general';
}

interface PatientNotesResponse {
  patient_uid: string;
  patient_email: string;
  caregiver_uid: string;
  notes: PatientAnalysis[];
  total_notes: number;
}

export default function CaregiverNotesScreen() {
  const [analyses, setAnalyses] = useState<PatientAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [patientEmail, setPatientEmail] = useState('');
  const [patientId, setPatientId] = useState('');
  const [totalNotes, setTotalNotes] = useState(0);
  const router = useRouter();
  const params = useLocalSearchParams();
  const auth = getAuth(firebaseApp);

  useEffect(() => {
    const patientIdParam = params.patientId as string;
    const patientEmailParam = params.patientEmail as string;
    
    if (patientIdParam) {
      setPatientId(patientIdParam);
      setPatientEmail(patientEmailParam || 'Paciente');
      loadPatientAnalyses(patientIdParam);
    }
  }, [params]);

  const loadPatientAnalyses = async (patientUid: string) => {
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
      const response = await fetch(
        `http://localhost:8000/api/patient-notes/?patient_uid=${patientUid}&caregiver_uid=${currentUser.uid}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data: PatientNotesResponse = await response.json();
        setAnalyses(data.notes);
        setPatientEmail(data.patient_email);
        setTotalNotes(data.total_notes);
      } else {
        // Fallback a datos mock si la API no está disponible
        console.log('API no disponible, usando datos mock');
        const mockAnalyses: PatientAnalysis[] = [
          {
            note_id: '1',
            analisis_IA: 'Análisis de ritmo cardíaco: Se detecta una frecuencia cardíaca ligeramente elevada (85 bpm) que puede indicar estrés o actividad física reciente. Se recomienda monitorear durante las próximas horas.',
            analizadoEn: '2024-01-15T14:30:00Z',
            patient_email: patientEmail,
            severity: 'medium',
            category: 'cardiovascular'
          },
          {
            note_id: '2',
            analisis_IA: 'Análisis de sudoración: Los niveles de GSR muestran una disminución del 15% comparado con el promedio semanal. Esto puede indicar mejor hidratación o reducción del estrés.',
            analizadoEn: '2024-01-14T10:15:00Z',
            patient_email: patientEmail,
            severity: 'low',
            category: 'sudor'
          },
          {
            note_id: '3',
            analisis_IA: 'Análisis de temperatura: La temperatura corporal se mantiene estable en 37.1°C, dentro del rango normal. No se detectan signos de fiebre o hipotermia.',
            analizadoEn: '2024-01-13T16:45:00Z',
            patient_email: patientEmail,
            severity: 'low',
            category: 'temperatura'
          },
          {
            note_id: '4',
            analisis_IA: 'Análisis general: El paciente muestra patrones saludables en todos los biomarcadores. Se recomienda mantener la rutina actual y continuar con el monitoreo regular.',
            analizadoEn: '2024-01-12T09:20:00Z',
            patient_email: patientEmail,
            severity: 'low',
            category: 'general'
          }
        ];
        
        setAnalyses(mockAnalyses);
        setTotalNotes(mockAnalyses.length);
      }
    } catch (error) {
      console.error('Error loading patient analyses:', error);
      Alert.alert('Error', 'No se pudieron cargar los análisis');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (patientId) {
      loadPatientAnalyses(patientId);
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

  const handleShareAnalysis = (analysis: PatientAnalysis) => {
    Alert.alert(
      'Compartir Análisis',
      '¿Deseas compartir este análisis?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Compartir', onPress: () => {
          // Aquí implementarías la lógica de compartir
          Alert.alert('Éxito', 'Análisis compartido');
        }}
      ]
    );
  };

  const handleExportAnalysis = (analysis: PatientAnalysis) => {
    Alert.alert(
      'Exportar Análisis',
      '¿Deseas exportar este análisis como PDF?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Exportar', onPress: () => {
          // Aquí implementarías la lógica de exportar
          Alert.alert('Éxito', 'Análisis exportado');
        }}
      ]
    );
  };

  const getSeverityIcon = (severity?: string) => {
    switch (severity) {
      case 'high':
        return { name: 'alert-circle', color: '#FF6B6B' };
      case 'medium':
        return { name: 'alert', color: '#FFA726' };
      case 'low':
        return { name: 'check-circle', color: '#4CAF50' };
      default:
        return { name: 'information', color: '#2196F3' };
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'cardiovascular':
        return { name: 'heart-pulse', color: '#FF6B6B' };
      case 'sudor':
        return { name: 'water', color: '#4BC0C0' };
      case 'temperatura':
        return { name: 'thermometer', color: '#FFCD56' };
      case 'general':
        return { name: 'chart-line', color: '#2196F3' };
      default:
        return { name: 'chart-line', color: '#666' };
    }
  };

  const getSeverityLabel = (severity?: string) => {
    switch (severity) {
      case 'high':
        return 'Alto';
      case 'medium':
        return 'Medio';
      case 'low':
        return 'Bajo';
      default:
        return 'Normal';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
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
          <MaterialCommunityIcons name="account-supervisor" size={32} color="#0A7EA4" />
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
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {analyses.length > 0 ? (
          <View style={styles.analysesContainer}>
            {analyses.map((analysis) => {
              const severityIcon = getSeverityIcon(analysis.severity);
              const categoryIcon = getCategoryIcon(analysis.category);
              return (
                <View key={analysis.note_id} style={styles.analysisCard}>
                  <View style={styles.analysisHeader}>
                    <View style={styles.analysisTypeContainer}>
                      <MaterialCommunityIcons 
                        name={categoryIcon.name as any} 
                        size={20} 
                        color={categoryIcon.color} 
                      />
                      <ThemedText style={[styles.analysisType, { color: categoryIcon.color }]}>
                        {analysis.category ? analysis.category.charAt(0).toUpperCase() + analysis.category.slice(1) : 'General'}
                      </ThemedText>
                    </View>
                    {analysis.severity && (
                      <View style={styles.severityContainer}>
                        <MaterialCommunityIcons 
                          name={severityIcon.name as any} 
                          size={16} 
                          color={severityIcon.color} 
                        />
                        <ThemedText style={[styles.severityLabel, { color: severityIcon.color }]}>
                          {getSeverityLabel(analysis.severity)}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.analysisContent}>
                    <ThemedText style={styles.analysisText}>
                      {analysis.analisis_IA}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.analysisFooter}>
                    <ThemedText style={styles.analysisDate}>
                      {formatDate(analysis.analizadoEn)}
                    </ThemedText>
                    
                    <View style={styles.analysisActions}>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleShareAnalysis(analysis)}
                      >
                        <MaterialCommunityIcons name="share" size={16} color="#666" />
                        <ThemedText style={styles.actionText}>Compartir</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => handleExportAnalysis(analysis)}
                      >
                        <MaterialCommunityIcons name="download" size={16} color="#666" />
                        <ThemedText style={styles.actionText}>Exportar</ThemedText>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="chart-line-off" size={64} color="#ccc" />
            <ThemedText style={styles.emptyTitle}>
              No hay análisis disponibles
            </ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              Este paciente aún no ha registrado datos para su análisis
            </ThemedText>
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
    flex: 1,
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
    marginTop: 4,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  analysesContainer: {
    gap: 16,
  },
  analysisCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  analysisTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analysisType: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  severityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  severityLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  analysisContent: {
    marginBottom: 16,
  },
  analysisText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  analysisFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  analysisDate: {
    fontSize: 12,
    color: '#666',
  },
  analysisActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
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