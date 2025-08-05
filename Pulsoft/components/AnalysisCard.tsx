import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { PatientAnalysis } from '../types/caregiver';
import { caregiverService } from '../utils/caregiverService';

interface AnalysisCardProps {
  analysis: PatientAnalysis;
  onShare?: (analysis: PatientAnalysis) => void;
  onExport?: (analysis: PatientAnalysis) => void;
}

export const AnalysisCard: React.FC<AnalysisCardProps> = ({
  analysis,
  onShare,
  onExport,
}) => {
  const severityIcon = caregiverService.getSeverityIcon(analysis.severity);
  const categoryIcon = caregiverService.getCategoryIcon(analysis.category);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.typeContainer}>
          <MaterialCommunityIcons 
            name={categoryIcon.name as any} 
            size={20} 
            color={categoryIcon.color} 
          />
          <ThemedText style={[styles.type, { color: categoryIcon.color }]}>
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
              {caregiverService.getSeverityLabel(analysis.severity)}
            </ThemedText>
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <ThemedText style={styles.analysisText}>
          {analysis.analisis_IA}
        </ThemedText>
      </View>
      
      <View style={styles.footer}>
        <ThemedText style={styles.date}>
          {caregiverService.formatDate(analysis.analizadoEn)}
        </ThemedText>
        
        <View style={styles.actions}>
          {onShare && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => onShare(analysis)}
            >
              <MaterialCommunityIcons name="share" size={16} color="#666" />
              <ThemedText style={styles.actionText}>Compartir</ThemedText>
            </TouchableOpacity>
          )}
          {onExport && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => onExport(analysis)}
            >
              <MaterialCommunityIcons name="download" size={16} color="#666" />
              <ThemedText style={styles.actionText}>Exportar</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  type: {
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
  content: {
    marginBottom: 16,
  },
  analysisText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: '#666',
  },
  actions: {
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
});