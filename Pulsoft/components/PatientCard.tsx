import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { PatientData } from '../types/caregiver';

interface PatientCardProps {
  patient: PatientData;
  isSelected: boolean;
  onSelect: (patient: PatientData) => void;
}

export const PatientCard: React.FC<PatientCardProps> = ({
  patient,
  isSelected,
  onSelect,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && styles.selectedCard
      ]}
      onPress={() => onSelect(patient)}
    >
      <View style={styles.patientInfo}>
        <MaterialCommunityIcons 
          name="account-heart" 
          size={24} 
          color={isSelected ? "#0A7EA4" : "#666"} 
        />
        <View style={styles.patientDetails}>
          <ThemedText style={[
            styles.patientEmail,
            isSelected && styles.selectedPatientText
          ]}>
            {patient.email}
          </ThemedText>
          <View style={styles.patientStats}>
            <ThemedText style={styles.lastUpdate}>
              Última actualización: {patient.lastUpdate || 'No disponible'}
            </ThemedText>
            {patient.notesCount !== undefined && (
              <ThemedText style={styles.notesCount}>
                {patient.notesCount} notas
              </ThemedText>
            )}
          </View>
        </View>
      </View>
      {isSelected && (
        <MaterialCommunityIcons name="check-circle" size={20} color="#0A7EA4" />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
  },
  selectedCard: {
    borderColor: '#0A7EA4',
    backgroundColor: '#f0f8ff',
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
  selectedPatientText: {
    color: '#0A7EA4',
  },
  patientStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  lastUpdate: {
    fontSize: 12,
    color: '#666',
  },
  notesCount: {
    fontSize: 12,
    color: '#0A7EA4',
    fontWeight: '600',
  },
});