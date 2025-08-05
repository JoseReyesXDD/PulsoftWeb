import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { ThemedText } from './ThemedText';
import { caregiverService } from '../utils/caregiverService';

interface ChartData {
  cardiovascular: number[];
  sudor: number[];
  temperatura: number[];
  labels: string[];
  patientInfo?: {
    name: string;
    age: number;
    condition: string;
  };
}

interface PatientChartsProps {
  patientData: {
    uid: string;
    email: string;
    cardiovascular?: number;
    sudor?: number;
    temperatura?: number;
    name?: string;
    age?: number;
    condition?: string;
  };
  chartData?: ChartData;
  realTime?: boolean;
}

const screenWidth = Dimensions.get('window').width;

export const PatientCharts: React.FC<PatientChartsProps> = ({ 
  patientData, 
  chartData, 
  realTime = false 
}) => {
  const [currentMetrics, setCurrentMetrics] = useState(patientData);
  const [isRealTime, setIsRealTime] = useState(realTime);

  useEffect(() => {
    if (realTime) {
      // Simular actualización en tiempo real
      const cleanup = caregiverService.simulateRealTimeUpdate(patientData.uid, (metrics) => {
        setCurrentMetrics(prev => ({
          ...prev,
          cardiovascular: metrics.cardiovascular,
          sudor: metrics.sudor,
          temperatura: metrics.temperatura
        }));
      });

      return cleanup;
    }
  }, [realTime, patientData.uid]);

  // Datos mock para las gráficas si no hay datos reales
  const mockChartData: ChartData = {
    cardiovascular: [65, 70, 75, 80, 85, 82, 78],
    sudor: [40, 45, 50, 48, 42, 45, 43],
    temperatura: [36.8, 37.0, 37.2, 37.1, 36.9, 37.0, 37.1],
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    patientInfo: {
      name: patientData.name || 'Paciente',
      age: patientData.age || 70,
      condition: patientData.condition || 'General'
    }
  };

  const data = chartData || mockChartData;

  // Configuración para las gráficas
  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(10, 126, 164, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#0A7EA4',
    },
  };

  // Datos para gráfica de línea (cardiovascular)
  const cardiovascularData = {
    labels: data.labels,
    datasets: [
      {
        data: data.cardiovascular,
        color: (opacity = 1) => `rgba(255, 107, 107, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  // Datos para gráfica de barras (sudor)
  const sudorData = {
    labels: data.labels,
    datasets: [
      {
        data: data.sudor,
      },
    ],
  };

  // Datos para gráfica de temperatura
  const temperaturaData = {
    labels: data.labels,
    datasets: [
      {
        data: data.temperatura,
        color: (opacity = 1) => `rgba(255, 205, 86, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  // Datos para gráfica de pastel (distribución actual)
  const pieData = [
    {
      name: 'Cardiovascular',
      population: currentMetrics.cardiovascular || 75,
      color: '#FF6B6B',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: 'Sudor',
      population: currentMetrics.sudor || 45,
      color: '#4BC0C0',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
    {
      name: 'Temperatura',
      population: Math.round((currentMetrics.temperatura || 37.0) * 10),
      color: '#FFCD56',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12,
    },
  ];

  const getStatusColor = () => {
    const cardio = currentMetrics.cardiovascular || 0;
    const temp = currentMetrics.temperatura || 0;
    
    if (cardio > 90 || temp > 38) return '#FF6B6B';
    if (cardio > 85 || temp > 37.5) return '#FFA726';
    return '#4CAF50';
  };

  return (
    <View style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        📊 Gráficas de {patientData.name || patientData.email}
      </ThemedText>

      {/* Información del paciente */}
      {data.patientInfo && (
        <View style={styles.patientInfoCard}>
          <ThemedText style={styles.patientInfoTitle}>
            👤 Información del Paciente
          </ThemedText>
          <View style={styles.patientInfoRow}>
            <ThemedText style={styles.patientInfoLabel}>Nombre:</ThemedText>
            <ThemedText style={styles.patientInfoValue}>{data.patientInfo.name}</ThemedText>
          </View>
          <View style={styles.patientInfoRow}>
            <ThemedText style={styles.patientInfoLabel}>Edad:</ThemedText>
            <ThemedText style={styles.patientInfoValue}>{data.patientInfo.age} años</ThemedText>
          </View>
          <View style={styles.patientInfoRow}>
            <ThemedText style={styles.patientInfoLabel}>Condición:</ThemedText>
            <ThemedText style={styles.patientInfoValue}>{data.patientInfo.condition}</ThemedText>
          </View>
        </View>
      )}

      {/* Estado en tiempo real */}
      {isRealTime && (
        <View style={[styles.realTimeIndicator, { backgroundColor: getStatusColor() }]}>
          <ThemedText style={styles.realTimeText}>
            🔴 Datos en tiempo real - Última actualización: {new Date().toLocaleTimeString()}
          </ThemedText>
        </View>
      )}

      {/* Gráfica de línea - Cardiovascular */}
      <View style={styles.chartContainer}>
        <ThemedText style={styles.chartTitle}>💓 Ritmo Cardíaco (Última Semana)</ThemedText>
        <LineChart
          data={cardiovascularData}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>

      {/* Gráfica de barras - Sudor */}
      <View style={styles.chartContainer}>
        <ThemedText style={styles.chartTitle}>💧 Niveles de Sudoración (Última Semana)</ThemedText>
        <BarChart
          data={sudorData}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          style={styles.chart}
          fromZero
        />
      </View>

      {/* Gráfica de línea - Temperatura */}
      <View style={styles.chartContainer}>
        <ThemedText style={styles.chartTitle}>🌡️ Temperatura Corporal (Última Semana)</ThemedText>
        <LineChart
          data={temperaturaData}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>

      {/* Gráfica de pastel - Distribución actual */}
      <View style={styles.chartContainer}>
        <ThemedText style={styles.chartTitle}>📈 Distribución Actual de Biomarcadores</ThemedText>
        <PieChart
          data={pieData}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          style={styles.chart}
        />
      </View>

      {/* Resumen de métricas actuales */}
      <View style={styles.metricsContainer}>
        <ThemedText style={styles.metricsTitle}>📋 Métricas Actuales</ThemedText>
        
        <View style={styles.metricRow}>
          <View style={styles.metricItem}>
            <ThemedText style={styles.metricLabel}>Cardiovascular</ThemedText>
            <ThemedText style={[styles.metricValue, { color: getStatusColor() }]}>
              {currentMetrics.cardiovascular || 'N/A'}
            </ThemedText>
          </View>
          <View style={styles.metricItem}>
            <ThemedText style={styles.metricLabel}>Sudor</ThemedText>
            <ThemedText style={styles.metricValue}>
              {currentMetrics.sudor || 'N/A'}
            </ThemedText>
          </View>
          <View style={styles.metricItem}>
            <ThemedText style={styles.metricLabel}>Temperatura</ThemedText>
            <ThemedText style={styles.metricValue}>
              {currentMetrics.temperatura ? `${currentMetrics.temperatura}°C` : 'N/A'}
            </ThemedText>
          </View>
        </View>

        {/* Estado de salud */}
        <View style={[styles.healthStatus, { backgroundColor: getStatusColor() + '20' }]}>
          <ThemedText style={[styles.healthStatusText, { color: getStatusColor() }]}>
            Estado: {getStatusColor() === '#4CAF50' ? 'Saludable' : 
                     getStatusColor() === '#FFA726' ? 'Atención' : 'Alerta'}
          </ThemedText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2c3e50',
  },
  patientInfoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  patientInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
    textAlign: 'center',
  },
  patientInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  patientInfoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  patientInfoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  realTimeIndicator: {
    padding: 8,
    borderRadius: 8,
    marginBottom: 20,
  },
  realTimeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  metricsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
    textAlign: 'center',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A7EA4',
  },
  healthStatus: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  healthStatusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});