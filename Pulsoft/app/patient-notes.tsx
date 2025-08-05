import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
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

export default function PatientNotesScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const auth = getAuth(firebaseApp);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const response = await fetch(`http://127.0.0.1:8000/api/patient-notes/?patient_uid=${user.uid}&requester_uid=${user.uid}&requester_type=patient`);
        
        if (response.ok) {
          const data = await response.json();
          setNotes(data.notes);
        } else {
          console.error('Error fetching notes:', response.statusText);
          Alert.alert('Error', 'No se pudieron cargar las notas');
        }
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      Alert.alert('Error', 'No se pudieron cargar las notas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotes();
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

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Cargando notas...</ThemedText>
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
          <MaterialCommunityIcons name="note-text" size={32} color="#0A7EA4" />
          <View style={styles.headerText}>
            <ThemedText type="title" style={styles.title}>
              Mis Notas
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Análisis y recomendaciones
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
          <View style={styles.notesContainer}>
            {notes.map((note) => {
              const icon = getNoteIcon(note.type);
              return (
                <View key={note.id} style={styles.noteCard}>
                  <View style={styles.noteHeader}>
                    <View style={styles.noteTypeContainer}>
                      <MaterialCommunityIcons 
                        name={icon.name as any} 
                        size={20} 
                        color={icon.color} 
                      />
                      <ThemedText style={[styles.noteType, { color: icon.color }]}>
                        {getNoteTypeLabel(note.type)}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.noteDate}>
                      {new Date(note.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.noteContent}>
                    <ThemedText style={styles.noteText}>
                      {note.content}
                    </ThemedText>
                  </View>
                  
                  <View style={styles.noteFooter}>
                    <TouchableOpacity style={styles.actionButton}>
                      <MaterialCommunityIcons name="share" size={16} color="#666" />
                      <ThemedText style={styles.actionText}>Compartir</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                      <MaterialCommunityIcons name="bookmark-outline" size={16} color="#666" />
                      <ThemedText style={styles.actionText}>Guardar</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="note-off" size={64} color="#ccc" />
            <ThemedText style={styles.emptyTitle}>No hay notas registradas</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              Las notas aparecerán aquí cuando se generen análisis automáticos
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
  notesContainer: {
    gap: 16,
  },
  noteCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
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
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  noteDate: {
    fontSize: 12,
    color: '#666',
  },
  noteContent: {
    marginBottom: 16,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
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