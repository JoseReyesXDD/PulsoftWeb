import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth, signOut } from 'firebase/auth';
import { getDatabase, ref, onValue, get } from 'firebase/database';
import { firebaseApp } from '../firebaseConfig';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface PatientAnalysis {
  id: string;
  analisis_IA: string;
  analizadoEn: string;
  patient_email: string;
  severity: 'low' | 'medium' | 'high';
  category: 'cardiovascular' | 'sudor' | 'temperatura' | 'general';
}

export default function CaregiverNotesScreen() {
  const [analyses, setAnalyses] = useState<PatientAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [patientEmail, setPatientEmail] = useState('');
  const router = useRouter();
  const params = useLocalSearchParams();
  const auth = getAuth(firebaseApp);

  useEffect(() => {
    loadPatientAnalyses();
  }, []);

  const loadPatientAnalyses = async () => {
    try {
      const patientId = params.patientId as string;
      
      if (!patientId) {
        console.error('No se proporcionó ID del paciente');
        Alert.alert('Error', 'No se pudo identificar al paciente');
        setLoading(false);
        return;
      }

      const db = getDatabase(firebaseApp);
      
      // Obtener datos del paciente para el email
      const patientRef = ref(db, `patients/${patientId}`);
      const patientSnapshot = await get(patientRef);
      
      if (patientSnapshot.exists()) {
        const patientData = patientSnapshot.val();
        setPatientEmail(patientData.email || `paciente-${patientId}@ejemplo.com`);
      } else {
        setPatientEmail(`paciente-${patientId}@ejemplo.com`);
      }
      
      // Obtener análisis del paciente desde Firebase
      const analysesRef = ref(db, `patients/${patientId}/analyses`);
      const analysesSnapshot = await get(analysesRef);
      
      if (analysesSnapshot.exists()) {
        const analysesData = analysesSnapshot.val();
        const analyses: PatientAnalysis[] = [];
        
        // Convertir los datos de Firebase a nuestro formato
        for (const analysisId in analysesData) {
          const analysis = analysesData[analysisId];
          analyses.push({
            id: analysisId,
            analisis_IA: analysis.analisis_IA || 'Análisis no disponible',
            analizadoEn: analysis.analizadoEn || new Date().toISOString(),
            patient_email: patientData?.email || `paciente-${patientId}@ejemplo.com`,
            severity: analysis.severity || 'low',
            category: analysis.category || 'general'
          });
        }
        
        // Ordenar por fecha de análisis (más reciente primero)
        analyses.sort((a, b) => new Date(b.analizadoEn).getTime() - new Date(a.analizadoEn).getTime());
        
        setAnalyses(analyses);
      } else {
        // Si no hay análisis, mostrar lista vacía
        console.log('No se encontraron análisis para este paciente');
        setAnalyses([]);
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

  const getSeverityIcon = (severity: string) => {
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

  const getCategoryIcon = (category: string) => {
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

  const getSeverityLabel = (severity: string) => {
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

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Cargando análisis...</ThemedText>
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
                <View key={analysis.id} style={styles.analysisCard}>
                  <View style={styles.analysisHeader}>
                    <View style={styles.analysisTypeContainer}>
                      <MaterialCommunityIcons 
                        name={categoryIcon.name as any} 
                        size={20} 
                        color={categoryIcon.color} 
                      />
                      <ThemedText style={[styles.analysisType, { color: categoryIcon.color }]}>
                        {analysis.category.charAt(0).toUpperCase() + analysis.category.slice(1)}
                      </ThemedText>
                    </View>
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
                  </View>
                  
                  <View style={styles.analysisContent}>
                    <ThemedText style={styles.analysisText}>
                      {analysis.analisis_IA}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.analysisFooter}>
                    <ThemedText style={styles.analysisDate}>
                      {new Date(analysis.analizadoEn).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </ThemedText>
                    
                    <View style={styles.analysisActions}>
                      <TouchableOpacity style={styles.actionButton}>
                        <MaterialCommunityIcons name="share" size={16} color="#666" />
                        <ThemedText style={styles.actionText}>Compartir</ThemedText>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionButton}>
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