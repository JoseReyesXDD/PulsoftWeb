import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '../firebaseConfig';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

const { width } = Dimensions.get('window');

interface PatientData {
  uid: string;
  email: string;
  cardiovascular: number;
  sudor: number;
  temperatura: number;
}

interface HealthDataPoint {
  date: string;
  cardiovascular: number;
  sudor: number;
  temperatura: number;
}

export default function PatientGraphicsScreen() {
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [healthHistory, setHealthHistory] = useState<HealthDataPoint[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<'cardiovascular' | 'sudor' | 'temperatura'>('cardiovascular');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useLocalSearchParams();
  const auth = getAuth(firebaseApp);

  useEffect(() => {
    loadPatientData();
    generateHealthHistory();
  }, []);

  const loadPatientData = async () => {
    try {
      const patientUid = params.patientId as string;
      
      // En una implementación real, esto vendría de la API
      // Por ahora usamos datos simulados
      setPatientData({
        uid: patientUid,
        email: params.patientEmail as string || 'paciente@ejemplo.com',
        cardiovascular: Math.floor(Math.random() * 30) + 70,
        sudor: Math.floor(Math.random() * 30) + 30,
        temperatura: parseFloat((Math.random() * 2 + 36).toFixed(1))
      });
    } catch (error) {
      console.error('Error loading patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateHealthHistory = () => {
    // Generar datos de ejemplo para los últimos 7 días
    const history: HealthDataPoint[] = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      history.push({
        date: date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
        cardiovascular: Math.floor(Math.random() * 30) + 70,
        sudor: Math.floor(Math.random() * 30) + 30,
        temperatura: parseFloat((Math.random() * 2 + 36).toFixed(1))
      });
    }
    
    setHealthHistory(history);
  };

  const getMetricInfo = (metric: string) => {
    switch (metric) {
      case 'cardiovascular':
        return {
          name: 'Cardiovascular',
          icon: 'heart-pulse',
          color: '#FF6B6B',
          unit: 'bpm',
          range: 'Normal: 60-100'
        };
      case 'sudor':
        return {
          name: 'Sudoración',
          icon: 'water',
          color: '#4BC0C0',
          unit: 'GSR',
          range: 'Normal: 20-60'
        };
      case 'temperatura':
        return {
          name: 'Temperatura',
          icon: 'thermometer',
          color: '#FFCD56',
          unit: '°C',
          range: 'Normal: 36.1-37.2'
        };
      default:
        return {
          name: 'Métrica',
          icon: 'chart-line',
          color: '#666',
          unit: '',
          range: ''
        };
    }
  };

  const getCurrentValue = (metric: string) => {
    if (!patientData) return 0;
    switch (metric) {
      case 'cardiovascular':
        return patientData.cardiovascular;
      case 'sudor':
        return patientData.sudor;
      case 'temperatura':
        return patientData.temperatura;
      default:
        return 0;
    }
  };

  const getStatusColor = (metric: string, value: number) => {
    switch (metric) {
      case 'cardiovascular':
        if (value >= 60 && value <= 100) return '#4CAF50';
        if (value > 100 || value < 60) return '#FF9800';
        return '#FF6B6B';
      case 'sudor':
        if (value >= 20 && value <= 60) return '#4CAF50';
        return '#FF9800';
      case 'temperatura':
        if (value >= 36.1 && value <= 37.2) return '#4CAF50';
        if (value > 37.2) return '#FF6B6B';
        return '#FF9800';
      default:
        return '#666';
    }
  };

  const SimpleChart = ({ data, metric }: { data: HealthDataPoint[], metric: string }) => {
    const metricInfo = getMetricInfo(metric);
    const values = data.map(d => d[metric as keyof HealthDataPoint] as number);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const range = maxValue - minValue;
    
    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <ThemedText style={styles.chartTitle}>{metricInfo.name} - Últimos 7 días</ThemedText>
          <ThemedText style={styles.chartRange}>{metricInfo.range}</ThemedText>
        </View>
        
        <View style={styles.chart}>
          {data.map((point, index) => {
            const value = point[metric as keyof HealthDataPoint] as number;
            const height = range > 0 ? ((value - minValue) / range) * 100 : 50;
            const statusColor = getStatusColor(metric, value);
            
            return (
              <View key={index} style={styles.chartBar}>
                <View style={styles.barContainer}>
                  <View 
                    style={[
                      styles.bar, 
                      { 
                        height: `${Math.max(height, 10)}%`,
                        backgroundColor: statusColor
                      }
                    ]} 
                  />
                </View>
                <ThemedText style={styles.barValue}>
                  {value}{metricInfo.unit}
                </ThemedText>
                <ThemedText style={styles.barLabel}>{point.date}</ThemedText>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Cargando datos del paciente...</ThemedText>
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
          <MaterialCommunityIcons name="chart-line" size={32} color="#0A7EA4" />
          <View style={styles.headerText}>
            <ThemedText type="title" style={styles.title}>
              Gráficas del Paciente
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              {patientData?.email}
            </ThemedText>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Current Metrics */}
        <View style={styles.currentMetricsSection}>
          <ThemedText type="title" style={styles.sectionTitle}>
            Valores Actuales
          </ThemedText>
          
          <View style={styles.metricsContainer}>
            {['cardiovascular', 'sudor', 'temperatura'].map((metric) => {
              const metricInfo = getMetricInfo(metric);
              const currentValue = getCurrentValue(metric);
              const statusColor = getStatusColor(metric, currentValue);
              
              return (
                <TouchableOpacity 
                  key={metric}
                  style={[
                    styles.metricCard,
                    selectedMetric === metric && styles.selectedMetricCard
                  ]}
                  onPress={() => setSelectedMetric(metric as any)}
                >
                  <MaterialCommunityIcons 
                    name={metricInfo.icon as any} 
                    size={32} 
                    color={metricInfo.color} 
                  />
                  <ThemedText style={[styles.metricValue, { color: statusColor }]}>
                    {currentValue}{metricInfo.unit}
                  </ThemedText>
                  <ThemedText style={styles.metricLabel}>{metricInfo.name}</ThemedText>
                  <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Chart */}
        <View style={styles.chartSection}>
          <SimpleChart data={healthHistory} metric={selectedMetric} />
        </View>

        {/* Statistics */}
        <View style={styles.statisticsSection}>
          <ThemedText type="title" style={styles.sectionTitle}>
            Estadísticas de la Semana
          </ThemedText>
          
          <View style={styles.statsContainer}>
            {['cardiovascular', 'sudor', 'temperatura'].map((metric) => {
              const metricInfo = getMetricInfo(metric);
              const values = healthHistory.map(d => d[metric as keyof HealthDataPoint] as number);
              const avg = values.reduce((a, b) => a + b, 0) / values.length;
              const max = Math.max(...values);
              const min = Math.min(...values);
              
              return (
                <View key={metric} style={styles.statCard}>
                  <View style={styles.statHeader}>
                    <MaterialCommunityIcons 
                      name={metricInfo.icon as any} 
                      size={20} 
                      color={metricInfo.color} 
                    />
                    <ThemedText style={styles.statTitle}>{metricInfo.name}</ThemedText>
                  </View>
                  <View style={styles.statValues}>
                    <View style={styles.statItem}>
                      <ThemedText style={styles.statLabel}>Promedio</ThemedText>
                      <ThemedText style={styles.statValue}>
                        {avg.toFixed(1)}{metricInfo.unit}
                      </ThemedText>
                    </View>
                    <View style={styles.statItem}>
                      <ThemedText style={styles.statLabel}>Máximo</ThemedText>
                      <ThemedText style={styles.statValue}>
                        {max}{metricInfo.unit}
                      </ThemedText>
                    </View>
                    <View style={styles.statItem}>
                      <ThemedText style={styles.statLabel}>Mínimo</ThemedText>
                      <ThemedText style={styles.statValue}>
                        {min}{metricInfo.unit}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              );
            })}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  currentMetricsSection: {
    marginBottom: 30,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  selectedMetricCard: {
    borderColor: '#0A7EA4',
    backgroundColor: '#f0f8ff',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  statusIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chartSection: {
    marginBottom: 30,
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartHeader: {
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  chartRange: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 200,
    paddingHorizontal: 8,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  barContainer: {
    height: 140,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
  },
  bar: {
    width: '80%',
    borderRadius: 4,
    minHeight: 10,
  },
  barValue: {
    fontSize: 10,
    color: '#333',
    marginTop: 4,
    textAlign: 'center',
  },
  barLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  statisticsSection: {
    marginBottom: 20,
  },
  statsContainer: {
    gap: 12,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  statValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});