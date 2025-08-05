import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '../firebaseConfig';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface Patient {
  uid: string;
  email: string;
}

export default function AddPatientScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const router = useRouter();
  const auth = getAuth(firebaseApp);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Por favor ingresa un email para buscar');
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        const response = await fetch(`http://127.0.0.1:8000/api/search-patients/?caregiver_uid=${user.uid}&search=${encodeURIComponent(searchQuery)}`);
        
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.patients);
          setSearchPerformed(true);
        } else {
          console.error('Error searching patients:', response.statusText);
          Alert.alert('Error', 'No se pudieron buscar pacientes');
        }
      }
    } catch (error) {
      console.error('Error searching patients:', error);
      Alert.alert('Error', 'Error al buscar pacientes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPatient = async (patient: Patient) => {
    Alert.alert(
      'Confirmar vinculación',
      `¿Estás seguro de que deseas vincular al paciente ${patient.email}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Vincular',
          onPress: async () => {
            try {
              const user = auth.currentUser;
              if (user) {
                const response = await fetch('http://127.0.0.1:8000/api/link-patient/', {
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
                  Alert.alert('Éxito', 'Paciente vinculado exitosamente', [
                    {
                      text: 'OK',
                      onPress: () => router.back(),
                    },
                  ]);
                } else {
                  const errorData = await response.json();
                  Alert.alert('Error', errorData.error || 'No se pudo vincular el paciente');
                }
              }
            } catch (error) {
              console.error('Error linking patient:', error);
              Alert.alert('Error', 'Error al vincular el paciente');
            }
          },
        },
      ]
    );
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchPerformed(false);
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#0A7EA4" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <MaterialCommunityIcons name="account-plus" size={32} color="#0A7EA4" />
          <View style={styles.headerText}>
            <ThemedText type="title" style={styles.title}>
              Añadir Paciente
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Busca y vincula nuevos pacientes
            </ThemedText>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Search Section */}
        <View style={styles.searchSection}>
          <ThemedText type="title" style={styles.sectionTitle}>
            Buscar Paciente
          </ThemedText>
          <ThemedText style={styles.searchDescription}>
            Ingresa el email del paciente que deseas vincular
          </ThemedText>

          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <MaterialCommunityIcons name="email-search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="ejemplo@correo.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={handleSearch}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                  <MaterialCommunityIcons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity 
              style={[styles.searchButton, loading && styles.searchButtonDisabled]} 
              onPress={handleSearch}
              disabled={loading}
            >
              <MaterialCommunityIcons 
                name={loading ? "loading" : "magnify"} 
                size={20} 
                color="white" 
              />
              <ThemedText style={styles.searchButtonText}>
                {loading ? 'Buscando...' : 'Buscar'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Results */}
        {searchPerformed && (
          <View style={styles.resultsSection}>
            <ThemedText type="title" style={styles.sectionTitle}>
              Resultados de Búsqueda
            </ThemedText>

            {searchResults.length > 0 ? (
              <View style={styles.resultsList}>
                {searchResults.map((patient) => (
                  <View key={patient.uid} style={styles.patientCard}>
                    <View style={styles.patientInfo}>
                      <MaterialCommunityIcons name="account" size={24} color="#0A7EA4" />
                      <View style={styles.patientDetails}>
                        <ThemedText style={styles.patientEmail}>
                          {patient.email}
                        </ThemedText>
                        <ThemedText style={styles.patientStatus}>
                          Disponible para vincular
                        </ThemedText>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={styles.addButton}
                      onPress={() => handleAddPatient(patient)}
                    >
                      <MaterialCommunityIcons name="plus" size={20} color="white" />
                      <ThemedText style={styles.addButtonText}>Vincular</ThemedText>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.noResultsContainer}>
                <MaterialCommunityIcons name="account-search" size={64} color="#ccc" />
                <ThemedText style={styles.noResultsTitle}>
                  No se encontraron pacientes
                </ThemedText>
                <ThemedText style={styles.noResultsSubtitle}>
                  {searchQuery ? `No hay pacientes disponibles con el email "${searchQuery}"` : 'Intenta con un email diferente'}
                </ThemedText>
              </View>
            )}
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsSection}>
          <ThemedText type="title" style={styles.sectionTitle}>
            Instrucciones
          </ThemedText>
          <View style={styles.instructionsList}>
            <View style={styles.instructionItem}>
              <MaterialCommunityIcons name="numeric-1-circle" size={24} color="#0A7EA4" />
              <ThemedText style={styles.instructionText}>
                Ingresa el email exacto del paciente que deseas vincular
              </ThemedText>
            </View>
            <View style={styles.instructionItem}>
              <MaterialCommunityIcons name="numeric-2-circle" size={24} color="#0A7EA4" />
              <ThemedText style={styles.instructionText}>
                Presiona "Buscar" para encontrar pacientes disponibles
              </ThemedText>
            </View>
            <View style={styles.instructionItem}>
              <MaterialCommunityIcons name="numeric-3-circle" size={24} color="#0A7EA4" />
              <ThemedText style={styles.instructionText}>
                Presiona "Vincular" para añadir el paciente a tu lista
              </ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  searchSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  searchDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  searchContainer: {
    gap: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A7EA4',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchButtonDisabled: {
    backgroundColor: '#999',
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  resultsSection: {
    marginBottom: 30,
  },
  resultsList: {
    gap: 12,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
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
  patientStatus: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  noResultsContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  noResultsSubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  instructionsSection: {
    marginBottom: 20,
  },
  instructionsList: {
    gap: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    lineHeight: 20,
  },
});