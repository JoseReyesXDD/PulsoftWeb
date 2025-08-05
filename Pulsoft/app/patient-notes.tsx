import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, onValue, off } from 'firebase/database';
import { firebaseApp } from '../firebaseConfig';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface Note {
  id: string;
  content: string;
  createdAt: string;
  type: 'analysis' | 'recommendation' | 'observation';
  category?: string;
  priority?: string;
  patientId?: string;
}

export default function PatientNotesScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>('');
  const [authStatus, setAuthStatus] = useState<string>('checking');
  const router = useRouter();
  const auth = getAuth(firebaseApp);

  useEffect(() => {
    // Verificar estado de autenticación
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('✅ Usuario autenticado para notas:', user.uid);
        setAuthStatus('authenticated');
        loadNotes(user);
      } else {
        console.log('❌ No hay usuario autenticado');
        setAuthStatus('unauthenticated');
        setLoading(false);
        setError('No hay usuario autenticado');
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  const loadNotes = async (user: any) => {
    try {
      console.log('🔄 Cargando notas del paciente...');
      setError('');
      
      const db = getDatabase(firebaseApp);
      const patientId = user.uid;
      const notesRef = ref(db, `patients/${patientId}/notes`);
      
      console.log('📍 Ruta de notas:', `patients/${patientId}/notes`);
      
      const unsubscribe = onValue(notesRef, (snapshot) => {
        console.log('📡 Notas recibidas de Firebase:', snapshot.val());
        
        if (snapshot.exists()) {
          const notesData = snapshot.val();
          const notesArray: Note[] = [];
          
          // Convertir objeto de Firebase a array
          Object.keys(notesData).forEach(key => {
            const note = notesData[key];
            notesArray.push({
              id: key,
              content: note.content,
              createdAt: note.createdAt,
              type: note.type,
              category: note.category,
              priority: note.priority,
              patientId: note.patientId
            });
          });
          
          // Ordenar por fecha de creación (más recientes primero)
          notesArray.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          
          console.log('✅ Notas cargadas:', notesArray.length);
          setNotes(notesArray);
        } else {
          console.log('⚠️ No hay notas disponibles');
          setNotes([]);
          setError('No hay notas disponibles. Las notas aparecerán aquí cuando el sistema las genere.');
        }
        
        setLoading(false);
        setRefreshing(false);
      }, (error) => {
        console.error('❌ Error cargando notas:', error);
        setError(`Error cargando notas: ${error.message}`);
        setLoading(false);
        setRefreshing(false);
      });

      // Limpiar suscripción cuando el componente se desmonte
      return () => {
        console.log('🧹 Limpiando suscripción de notas');
        off(notesRef);
        unsubscribe();
      };
    } catch (error) {
      console.error('❌ Error en loadNotes:', error);
      setError(`Error inesperado: ${error}`);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setError('');
    const user = auth.currentUser;
    if (user) {
      loadNotes(user);
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

  const getNoteIcon = (type: string) => {
    switch (type) {
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

  const getNoteTypeLabel = (type: string) => {
    switch (type) {
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#FF6B6B';
      case 'medium':
        return '#FF9800';
      case 'low':
        return '#4CAF50';
      default:
        return '#666';
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
        <ThemedText style={styles.loadingText}>Cargando notas...</ThemedText>
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
        <View style={styles.headerContent}>
          <MaterialCommunityIcons name="note-text" size={32} color="#0A7EA4" />
          <View style={styles.headerText}>
            <ThemedText type="title" style={styles.title}>
              Mis Notas Médicas
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Historial de análisis y recomendaciones
            </ThemedText>
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

      {/* Notes List */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {notes.length === 0 && !error ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="note-outline" size={64} color="#ccc" />
            <ThemedText style={styles.emptyText}>
              No hay notas disponibles
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Las notas aparecerán aquí cuando el sistema las genere
            </ThemedText>
          </View>
        ) : (
          notes.map((note) => {
            const icon = getNoteIcon(note.type);
            const priorityColor = getPriorityColor(note.priority || 'normal');
            
            return (
              <View key={note.id} style={styles.noteCard}>
                <View style={styles.noteHeader}>
                  <View style={styles.noteTypeContainer}>
                    <MaterialCommunityIcons 
                      name={icon.name} 
                      size={20} 
                      color={icon.color} 
                    />
                    <ThemedText style={styles.noteType}>
                      {getNoteTypeLabel(note.type)}
                    </ThemedText>
                  </View>
                  {note.priority && note.priority !== 'normal' && (
                    <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
                      <ThemedText style={styles.priorityText}>
                        {note.priority === 'high' ? 'Alta' : 
                         note.priority === 'medium' ? 'Media' : 'Baja'}
                      </ThemedText>
                    </View>
                  )}
                </View>
                
                <ThemedText style={styles.noteContent}>
                  {note.content}
                </ThemedText>
                
                <View style={styles.noteFooter}>
                  <ThemedText style={styles.noteDate}>
                    {formatDate(note.createdAt)}
                  </ThemedText>
                  {note.category && (
                    <View style={styles.categoryBadge}>
                      <ThemedText style={styles.categoryText}>
                        {note.category}
                      </ThemedText>
                    </View>
                  )}
                </View>
              </View>
            );
          })
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  noteCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  noteTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  noteContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteDate: {
    fontSize: 12,
    color: '#666',
  },
  categoryBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 10,
    color: '#1976D2',
    fontWeight: '500',
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