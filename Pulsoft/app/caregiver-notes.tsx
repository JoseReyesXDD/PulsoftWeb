import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, onValue, get, off } from 'firebase/database';
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
  patientId?: string;
}

export default function CaregiverNotesScreen() {
  const [analyses, setAnalyses] = useState<PatientAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [patientEmail, setPatientEmail] = useState('');
  const [error, setError] = useState<string>('');
  const [authStatus, setAuthStatus] = useState<string>('checking');
  const router = useRouter();
  const params = useLocalSearchParams();
  const auth = getAuth(firebaseApp);

  useEffect(() => {
    // Verificar estado de autenticación
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('✅ Cuidador autenticado:', user.uid);
        setAuthStatus('authenticated');
        loadPatientAnalyses();
      } else {
        console.log('❌ No hay cuidador autenticado');
        setAuthStatus('unauthenticated');
        setLoading(false);
        setError('No hay usuario autenticado');
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  const loadPatientAnalyses = async () => {
    try {
      console.log('🔄 Cargando análisis del paciente...');
      setError('');
      
      const patientId = params.patientId as string;
      
      if (!patientId) {
        console.error('❌ No se proporcionó ID del paciente');
        setError('No se pudo identificar al paciente');
        setLoading(false);
        return;
      }

      console.log('📍 ID del paciente:', patientId);
      
      const db = getDatabase(firebaseApp);
      
      // Obtener datos del paciente para el email
      const patientRef = ref(db, `patients/${patientId}`);
      const patientSnapshot = await get(patientRef);
      
      if (patientSnapshot.exists()) {
        const patientData = patientSnapshot.val();
        setPatientEmail(patientData.email || `paciente-${patientId}@ejemplo.com`);
        console.log('✅ Datos del paciente cargados:', patientData.email);
      } else {
        setPatientEmail(`paciente-${patientId}@ejemplo.com`);
        console.log('⚠️ No se encontraron datos del paciente');
      }
      
      // Obtener análisis del paciente desde Firebase
      const analysesRef = ref(db, `patients/${patientId}/analyses`);
      
      const unsubscribe = onValue(analysesRef, (analysesSnapshot) => {
        console.log('📡 Análisis recibidos de Firebase:', analysesSnapshot.val());
        
        if (analysesSnapshot.exists()) {
          const analysesData = analysesSnapshot.val();
          const analyses: PatientAnalysis[] = [];
          
          // Convertir los datos de Firebase a nuestro formato
          Object.keys(analysesData).forEach(key => {
            const analysis = analysesData[key];
            analyses.push({
              id: key,
              analisis_IA: analysis.analisis_IA || 'Análisis no disponible',
              analizadoEn: analysis.analizadoEn || new Date().toISOString(),
              patient_email: patientEmail || `paciente-${patientId}@ejemplo.com`,
              severity: analysis.severity || 'low',
              category: analysis.category || 'general',
              patientId: patientId
            });
          });
          
          // Ordenar por fecha de análisis (más reciente primero)
          analyses.sort((a, b) => new Date(b.analizadoEn).getTime() - new Date(a.analizadoEn).getTime());
          
          console.log('✅ Análisis cargados:', analyses.length);
          setAnalyses(analyses);
        } else {
          console.log('⚠️ No se encontraron análisis para este paciente');
          setAnalyses([]);
          setError('No hay análisis disponibles para este paciente. Los análisis aparecerán aquí cuando el sistema los genere.');
        }
        
        setLoading(false);
        setRefreshing(false);
      }, (error) => {
        console.error('❌ Error cargando análisis:', error);
        setError(`Error cargando análisis: ${error.message}`);
        setLoading(false);
        setRefreshing(false);
      });

      // Limpiar suscripción cuando el componente se desmonte
      return () => {
        console.log('🧹 Limpiando suscripción de análisis');
        off(analysesRef);
        unsubscribe();
      };
      
    } catch (error) {
      console.error('❌ Error en loadPatientAnalyses:', error);
      setError(`Error inesperado: ${error}`);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setError('');
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

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-ES', {
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
        <ThemedText style={styles.statusText}>
          Auth: {authStatus}
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
          <MaterialCommunityIcons name="account-supervisor" size={32} color="#0A7EA4" />
          <View style={styles.headerText}>
            <ThemedText type="title" style={styles.title}>
              Análisis del Paciente
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              {patientEmail}
            </ThemedText>
            {params.patientId && (
              <ThemedText style={styles.patientId}>
                ID: {params.patientId as string}
              </ThemedText>
            )}
          </View>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <MaterialCommunityIcons name="refresh" size={24} color="#0A7EA4" />
        </TouchableOpacity>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={20} color="#FF6B6B" />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </View>
      )}

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {analyses.length === 0 && !error ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="chart-line" size={64} color="#ccc" />
            <ThemedText style={styles.emptyTitle}>
              No hay análisis disponibles
            </ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              Este paciente aún no ha registrado datos para su análisis. Los análisis aparecerán aquí cuando el sistema los genere automáticamente.
            </ThemedText>
          </View>
        ) : (
          <View style={styles.analysesContainer}>
            {analyses.map((analysis) => {
              const severityIcon = getSeverityIcon(analysis.severity);
              const categoryIcon = getCategoryIcon(analysis.category);
              return (
                <View key={analysis.id} style={styles.analysisCard}>
                  <View style={styles.analysisHeader}>
                    <View style={styles.analysisTypeContainer}>
                      <MaterialCommunityIcons 
                        name={categoryIcon.name} 
                        size={20} 
                        color={categoryIcon.color} 
                      />
                      <ThemedText style={[styles.analysisType, { color: categoryIcon.color }]}>
                        {analysis.category.charAt(0).toUpperCase() + analysis.category.slice(1)}
                      </ThemedText>
                    </View>
                    <View style={[styles.severityBadge, { backgroundColor: severityIcon.color }]}>
                      <MaterialCommunityIcons 
                        name={severityIcon.name} 
                        size={16} 
                        color="white" 
                      />
                      <ThemedText style={styles.severityLabel}>
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
                      {formatDate(analysis.analizadoEn)}
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
    fontSize: 16,
    marginTop: 16,
    color: '#666',
  },
  statusText: {
    fontSize: 12,
    marginTop: 8,
    color: '#999',
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
  patientId: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  refreshButton: {
    padding: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  errorText: {
    color: '#D32F2F',
    marginLeft: 8,
    flex: 1,
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
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
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