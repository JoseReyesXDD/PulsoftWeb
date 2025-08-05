import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { PatientAnalysis } from '../types/caregiver';
import { caregiverService } from '../utils/caregiverService';

interface PatientNotesListProps {
  analyses: PatientAnalysis[];
  onShare?: (analysis: PatientAnalysis) => void;
  onExport?: (analysis: PatientAnalysis) => void;
  patientEmail: string;
}

export const PatientNotesList: React.FC<PatientNotesListProps> = ({ 
  analyses, 
  onShare, 
  onExport, 
  patientEmail 
}) => {
  if (analyses.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="file-document-outline" size={64} color="#ccc" />
        <ThemedText style={styles.emptyTitle}>No hay notas disponibles</ThemedText>
        <ThemedText style={styles.emptySubtitle}>
          Este paciente aún no ha registrado datos para su análisis
        </ThemedText>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          📋 Análisis de {patientEmail}
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          {analyses.length} análisis disponible{analyses.length !== 1 ? 's' : ''}
        </ThemedText>
      </View>

      <View style={styles.notesContainer}>
        {analyses.map((analysis, index) => {
          const severityIcon = caregiverService.getSeverityIcon(analysis.severity);
          const categoryIcon = caregiverService.getCategoryIcon(analysis.category);
          const severityLabel = caregiverService.getSeverityLabel(analysis.severity);

          return (
            <View key={analysis.note_id} style={styles.noteCard}>
              {/* Header de la nota */}
              <View style={styles.noteHeader}>
                <View style={styles.noteInfo}>
                  <View style={styles.noteIcons}>
                    <MaterialCommunityIcons 
                      name={categoryIcon.name as any} 
                      size={20} 
                      color={categoryIcon.color} 
                    />
                    <MaterialCommunityIcons 
                      name={severityIcon.name as any} 
                      size={20} 
                      color={severityIcon.color} 
                    />
                  </View>
                  <View style={styles.noteMeta}>
                    <ThemedText style={styles.noteDate}>
                      {caregiverService.formatDate(analysis.analizadoEn)}
                    </ThemedText>
                    <View style={styles.noteTags}>
                      <View style={[styles.tag, styles[`tag_${analysis.severity || 'normal'}`]]}>
                        <ThemedText style={styles.tagText}>{severityLabel}</ThemedText>
                      </View>
                      {analysis.category && (
                        <View style={styles.tag}>
                          <ThemedText style={styles.tagText}>{analysis.category}</ThemedText>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                <View style={styles.noteActions}>
                  {onShare && (
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => onShare(analysis)}
                    >
                      <MaterialCommunityIcons name="share" size={16} color="#0A7EA4" />
                    </TouchableOpacity>
                  )}
                  {onExport && (
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => onExport(analysis)}
                    >
                      <MaterialCommunityIcons name="download" size={16} color="#0A7EA4" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Contenido de la nota */}
              <View style={styles.noteContent}>
                <ThemedText style={styles.analysisText}>
                  {analysis.analisis_IA}
                </ThemedText>
              </View>

              {/* Footer de la nota */}
              <View style={styles.noteFooter}>
                <View style={styles.noteStats}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color="#666" />
                  <ThemedText style={styles.noteStatText}>
                    Analizado el {caregiverService.formatDate(analysis.analizadoEn)}
                  </ThemedText>
                </View>
                <View style={styles.noteStats}>
                  <MaterialCommunityIcons name="account" size={14} color="#666" />
                  <ThemedText style={styles.noteStatText}>
                    {analysis.patient_email}
                  </ThemedText>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  notesContainer: {
    padding: 20,
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  noteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  noteIcons: {
    flexDirection: 'row',
    gap: 8,
    marginRight: 12,
  },
  noteMeta: {
    flex: 1,
  },
  noteDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  noteTags: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  tag_high: {
    backgroundColor: '#ffebee',
  },
  tag_medium: {
    backgroundColor: '#fff3e0',
  },
  tag_low: {
    backgroundColor: '#e8f5e8',
  },
  tag_normal: {
    backgroundColor: '#f0f0f0',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
  },
  noteActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  noteContent: {
    marginBottom: 12,
  },
  analysisText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  noteStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  noteStatText: {
    fontSize: 12,
    color: '#666',
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
  },
});