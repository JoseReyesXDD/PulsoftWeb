import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth, signOut } from 'firebase/auth';
import { firebaseApp } from '../firebaseConfig';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface Note {
  id: string;
  content: string;
  createdAt: string;
  type: 'analysis' | 'recommendation' | 'observation';
}

export default function CaregiverNotesScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [patientEmail, setPatientEmail] = useState('');
  const router = useRouter();
  const params = useLocalSearchParams();
  const auth = getAuth(firebaseApp);

  useEffect(() => {
    loadPatientNotes();
  }, []);

  const loadPatientNotes = async () => {
    try {
      const patientId = params.patientId as string;
      const user = auth.currentUser;
      
      if (user && patientId) {
        const response = await fetch(`http://127.0.0.1:8000/api/patient-notes/?patient_uid=${patientId}&requester_uid=${user.uid}&requester_type=caregiver`);
        
        if (response.ok) {
          const data = await response.json();
          setNotes(data.notes);
          // Set a mock patient email or fetch it from another endpoint
          setPatientEmail('paciente@ejemplo.com');
        } else {
          console.error('Error fetching patient notes:', response.statusText);
          Alert.alert('Error', 'No se pudieron cargar las notas del paciente');
        }
      }
    } catch (error) {
      console.error('Error loading patient notes:', error);
      Alert.alert('Error', 'No se pudieron cargar las notas del paciente');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPatientNotes();
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      Alert.alert('Error', 'No se pudo cerrar sesión');
    }
  };

  const getSeverityIcon = (noteType: string) => {
    switch (noteType) {
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

  const getCategoryIcon = (noteType: string) => {
    switch (noteType) {
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

  const getSeverityLabel = (noteType: string) => {
    switch (noteType) {
      case 'analysis':
        return 'Análisis';
      case 'recommendation':
        return 'Recomendación';
      case 'observation':
        return 'Observación';
      default:
        return 'Nota';
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
        {notes.length > 0 ? (
          <View style={styles.analysesContainer}>
            {notes.map((note) => {
              const severityIcon = getSeverityIcon(note.type);
              const categoryIcon = getCategoryIcon(note.type);
              return (
                <View key={note.id} style={styles.analysisCard}>
                  <View style={styles.analysisHeader}>
                    <View style={styles.analysisTypeContainer}>
                      <MaterialCommunityIcons 
                        name={categoryIcon.name as any} 
                        size={20} 
                        color={categoryIcon.color} 
                      />
                      <ThemedText style={[styles.analysisType, { color: categoryIcon.color }]}>
                        {note.type.charAt(0).toUpperCase() + note.type.slice(1)}
                      </ThemedText>
                    </View>
                    <View style={styles.severityContainer}>
                      <MaterialCommunityIcons 
                        name={severityIcon.name as any} 
                        size={16} 
                        color={severityIcon.color} 
                      />
                      <ThemedText style={[styles.severityLabel, { color: severityIcon.color }]}>
                        {getSeverityLabel(note.type)}
                      </ThemedText>
                    </View>
                  </View>
                  
                  <View style={styles.analysisContent}>
                    <ThemedText style={styles.analysisText}>
                      {note.content}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.analysisFooter}>
                    <ThemedText style={styles.analysisDate}>
                      {new Date(note.createdAt).toLocaleDateString('es-ES', {
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