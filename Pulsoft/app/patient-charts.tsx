import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, Alert, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getDatabase, ref, onValue, get } from 'firebase/database';
import { firebaseApp } from '../firebaseConfig';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Svg, { Circle, Text as SvgText, Path, Line } from 'react-native-svg';

interface PatientChartData {
  cardiovascular: number;
  sudor: number;
  temperatura: number;
  lastUpdate: string;
}

interface PatientAnalysis {
  id: string;
  analisis_IA: string;
  analizadoEn: string;
  severity: 'low' | 'medium' | 'high';
  category: 'cardiovascular' | 'sudor' | 'temperatura' | 'general';
  cardiovascular?: number;
  sudor?: number;
  temperatura?: number;
}

// Componente para gráfico de doughnut
interface DoughnutChartProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

const DoughnutChart = ({ value, size = 200, strokeWidth = 20, color = '#FF6B6B', label = '' }: DoughnutChartProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  const center = size / 2;

  return (
    <View style={styles.chartContainer}>
      <Svg width={size} height={size}>
        {/* Círculo de fondo */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#E8E8E8"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Círculo de progreso */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
        {/* Texto central */}
        <SvgText
          x={center}
          y={center + 12}
          fontSize="24"
          fontWeight="bold"
          textAnchor="middle"
          fill="#2C3E50"
          fontFamily="Lufga-Bold"
        >
          {value}
        </SvgText>
      </Svg>
      {label && (
        <ThemedText style={styles.chartLabel}>{label}</ThemedText>
      )}
    </View>
  );
};

// Componente para gráfico de tendencias
interface TrendChartProps {
  data: { value: number; date: string }[];
  title: string;
  color: string;
  maxValue: number;
}

const TrendChart = ({ data, title, color, maxValue }: TrendChartProps) => {
  if (data.length < 2) return null;

  const width = 300;
  const height = 150;
  const padding = 20;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;

  const points = data.map((item, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = height - padding - (item.value / maxValue) * chartHeight;
    return { x, y, value: item.value };
  });

  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');

  return (
    <View style={styles.trendChartContainer}>
      <ThemedText style={styles.trendChartTitle}>{title}</ThemedText>
      <Svg width={width} height={height}>
        {/* Líneas de fondo */}
        {[0, 25, 50, 75, 100].map((percent, index) => {
          const y = height - padding - (percent / 100) * chartHeight;
          return (
            <Line
              key={index}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="#E8E8E8"
              strokeWidth="1"
            />
          );
        })}
        
        {/* Línea de tendencia */}
        <Path
          d={pathData}
          stroke={color}
          strokeWidth="3"
          fill="none"
        />
        
        {/* Puntos de datos */}
        {points.map((point, index) => (
          <Circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill={color}
          />
        ))}
      </Svg>
      <ThemedText style={styles.trendChartValue}>
        Último valor: {data[data.length - 1]?.value || 0}
      </ThemedText>
    </View>
  );
};

// Componente para Radar Chart
interface RadarChartProps {
  cardiovascular: number;
  size?: number;
}

const RadarChart = ({ cardiovascular, size = 300 }: RadarChartProps) => {
  const center = size / 2;
  const radius = (size - 40) / 2;
  const maxValue = 100;

  const createRadarPoints = () => {
    const points = [];
    const numPoints = 6;
    const angleStep = (2 * Math.PI) / numPoints;
    
    for (let i = 0; i < numPoints; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const value = cardiovascular * (0.8 + 0.2 * Math.sin(i * 2));
      const pointRadius = (value / maxValue) * radius;
      const x = center + pointRadius * Math.cos(angle);
      const y = center + pointRadius * Math.sin(angle);
      points.push({ x, y });
    }
    
    return points;
  };

  const createScaleCircles = () => {
    const circles = [];
    for (let i = 1; i <= 5; i++) {
      const circleRadius = (radius * i) / 5;
      circles.push(
        <Circle
          key={i}
          cx={center}
          cy={center}
          r={circleRadius}
          stroke="#E8E8E8"
          strokeWidth="1"
          fill="transparent"
        />
      );
    }
    return circles;
  };

  const createRadialLines = () => {
    const lines = [];
    const numLines = 6;
    const angleStep = (2 * Math.PI) / numLines;
    
    for (let i = 0; i < numLines; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      lines.push(
        <Path
          key={i}
          d={`M ${center} ${center} L ${x} ${y}`}
          stroke="#E8E8E8"
          strokeWidth="1"
        />
      );
    }
    return lines;
  };

  const radarPoints = createRadarPoints();
  const pathData = radarPoints.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ') + ' Z';

  return (
    <View style={styles.chartContainer}>
      <Svg width={size} height={size}>
        {createScaleCircles()}
        {createRadialLines()}
        <Path
          d={pathData}
          fill="rgba(255, 107, 107, 0.3)"
          stroke="#FF6B6B"
          strokeWidth="2"
        />
        {radarPoints.map((point, index) => (
          <Circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#FF6B6B"
          />
        ))}
      </Svg>
      <ThemedText style={styles.chartLabel}>Ritmo Cardíaco</ThemedText>
    </View>
  );
};

// Componente para Polar Area Chart de Sudor
interface PolarAreaChartSudorProps {
  sudor: number;
  size?: number;
}

const PolarAreaChartSudor = ({ sudor, size = 300 }: PolarAreaChartSudorProps) => {
  const center = size / 2;
  const maxRadius = (size - 40) / 2;
  const maxValue = 200;
  
  const createPolarSectors = () => {
    const sectors = [];
    const numSectors = 8;
    const angleStep = (2 * Math.PI) / numSectors;
    const radius = (sudor / maxValue) * maxRadius;
    
    for (let i = 0; i < numSectors; i++) {
      const startAngle = i * angleStep - Math.PI / 2;
      const endAngle = (i + 1) * angleStep - Math.PI / 2;
      
      const x1 = center + radius * Math.cos(startAngle);
      const y1 = center + radius * Math.sin(startAngle);
      const x2 = center + radius * Math.cos(endAngle);
      const y2 = center + radius * Math.sin(endAngle);
      
      const largeArcFlag = angleStep > Math.PI ? 1 : 0;
      
      const pathData = [
        `M ${center} ${center}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');
      
      const opacity = 0.3 + (0.7 * (i / numSectors));
      sectors.push(
        <Path
          key={i}
          d={pathData}
          fill={`rgba(75, 192, 192, ${opacity})`}
          stroke="#4BC0C0"
          strokeWidth="1"
        />
      );
    }
    
    return sectors;
  };

  return (
    <View style={styles.chartContainer}>
      <Svg width={size} height={size}>
        {createPolarSectors()}
        <Circle
          cx={center}
          cy={center}
          r="8"
          fill="#4BC0C0"
        />
      </Svg>
      <ThemedText style={styles.chartLabel}>Nivel de Sudoración</ThemedText>
    </View>
  );
};

export default function PatientChartsScreen() {
  const [patientData, setPatientData] = useState<PatientChartData | null>(null);
  const [analyses, setAnalyses] = useState<PatientAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChart, setSelectedChart] = useState<string>('overview');
  const router = useRouter();
  const params = useLocalSearchParams();
  const patientId = params.patientId as string;
  const patientEmail = params.patientEmail as string;

  useEffect(() => {
    if (!patientId) {
      Alert.alert('Error', 'No se proporcionó ID del paciente');
      router.back();
      return;
    }

    const db = getDatabase(firebaseApp);
    const patientRef = ref(db, `patients/${patientId}`);
    
    const unsubscribe = onValue(patientRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPatientData({
          cardiovascular: data.cardiovascular || 0,
          sudor: data.sudor || 0,
          temperatura: data.temperatura || 0,
          lastUpdate: data.lastUpdate || new Date().toLocaleString()
        });
      } else {
        setPatientData({
          cardiovascular: 0,
          sudor: 0,
          temperatura: 0,
          lastUpdate: new Date().toLocaleString()
        });
      }
      setLoading(false);
    }, (error) => {
      console.error('Error loading patient data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del paciente');
      setLoading(false);
    });

    // Cargar análisis del paciente
    const analysesRef = ref(db, `patients/${patientId}/analyses`);
    const analysesUnsubscribe = onValue(analysesRef, (snapshot) => {
      if (snapshot.exists()) {
        const analysesData = snapshot.val();
        const analyses: PatientAnalysis[] = [];
        
        for (const analysisId in analysesData) {
          const analysis = analysesData[analysisId];
          analyses.push({
            id: analysisId,
            analisis_IA: analysis.analisis_IA || 'Análisis no disponible',
            analizadoEn: analysis.analizadoEn || new Date().toISOString(),
            severity: analysis.severity || 'low',
            category: analysis.category || 'general',
            cardiovascular: analysis.cardiovascular || 0,
            sudor: analysis.sudor || 0,
            temperatura: analysis.temperatura || 0
          });
        }
        
        analyses.sort((a, b) => new Date(b.analizadoEn).getTime() - new Date(a.analizadoEn).getTime());
        setAnalyses(analyses);
      } else {
        setAnalyses([]);
      }
    });

    return () => {
      unsubscribe();
      analysesUnsubscribe();
    };
  }, [patientId]);

  const getHealthStatus = (cardiovascular: number, sudor: number, temperatura: number) => {
    if (temperatura > 38 || cardiovascular > 100 || sudor > 80) {
      return { status: 'Crítico', color: '#FF6B6B', icon: 'alert-circle' };
    } else if (temperatura > 37.5 || cardiovascular > 85 || sudor > 60) {
      return { status: 'Atención', color: '#FFA726', icon: 'alert' };
    } else {
      return { status: 'Estable', color: '#4CAF50', icon: 'check-circle' };
    }
  };

  const generateTrendData = (category: string) => {
    const categoryAnalyses = analyses.filter(a => a.category === category);
    return categoryAnalyses.slice(-5).map(analysis => ({
      value: analysis[category as keyof PatientAnalysis] as number || 0,
      date: new Date(analysis.analizadoEn).toLocaleDateString()
    }));
  };

  const getLatestAnalysis = (category: string) => {
    return analyses.find(a => a.category === category);
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Cargando gráficas...</ThemedText>
      </ThemedView>
    );
  }

  const healthStatus = patientData ? getHealthStatus(patientData.cardiovascular, patientData.sudor, patientData.temperatura) : null;

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
              {patientEmail}
            </ThemedText>
            {healthStatus && (
              <View style={styles.healthStatusHeader}>
                <MaterialCommunityIcons name={healthStatus.icon as any} size={16} color={healthStatus.color} />
                <ThemedText style={[styles.healthStatusText, { color: healthStatus.color }]}>
                  {healthStatus.status}
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Selector de gráficas */}
        <View style={styles.chartSelector}>
          <ThemedText type="title" style={styles.sectionTitle}>
            Tipo de Gráfica
          </ThemedText>
          <View style={styles.selectorContainer}>
            {[
              { id: 'overview', label: 'Resumen', icon: 'view-dashboard' },
              { id: 'trends', label: 'Tendencias', icon: 'trending-up' },
              { id: 'analysis', label: 'Análisis', icon: 'chart-line' }
            ].map((chart) => (
              <TouchableOpacity
                key={chart.id}
                style={[
                  styles.selectorButton,
                  selectedChart === chart.id && styles.selectorButtonActive
                ]}
                onPress={() => setSelectedChart(chart.id)}
              >
                <MaterialCommunityIcons 
                  name={chart.icon as any} 
                  size={20} 
                  color={selectedChart === chart.id ? 'white' : '#666'} 
                />
                <ThemedText style={[
                  styles.selectorButtonText,
                  selectedChart === chart.id && styles.selectorButtonTextActive
                ]}>
                  {chart.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Resumen de métricas */}
        {selectedChart === 'overview' && patientData && (
          <View style={styles.metricsSummary}>
            <ThemedText type="title" style={styles.sectionTitle}>
              Resumen de Métricas
            </ThemedText>
            
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <MaterialCommunityIcons name="heart-pulse" size={24} color="#FF6B6B" />
                <ThemedText style={styles.metricValue}>{patientData.cardiovascular}</ThemedText>
                <ThemedText style={styles.metricLabel}>Cardiovascular</ThemedText>
              </View>
              
              <View style={styles.metricCard}>
                <MaterialCommunityIcons name="water" size={24} color="#4BC0C0" />
                <ThemedText style={styles.metricValue}>{patientData.sudor}</ThemedText>
                <ThemedText style={styles.metricLabel}>Sudor</ThemedText>
              </View>
              
              <View style={styles.metricCard}>
                <MaterialCommunityIcons name="thermometer" size={24} color="#FFCD56" />
                <ThemedText style={styles.metricValue}>{patientData.temperatura}°C</ThemedText>
                <ThemedText style={styles.metricLabel}>Temperatura</ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Gráficas principales */}
        {selectedChart === 'overview' && patientData && (
          <View style={styles.chartsSection}>
            <ThemedText type="title" style={styles.sectionTitle}>
              Gráficas Biométricas
            </ThemedText>
            
            <View style={styles.chartsContainer}>
              {/* Gráfico de temperatura */}
              <View style={styles.chartWrapper}>
                <ThemedText style={styles.chartTitle}>Temperatura Corporal</ThemedText>
                <DoughnutChart 
                  value={patientData.temperatura} 
                  size={200} 
                  color="#FFCD56"
                  label="°C"
                />
              </View>

              {/* Radar chart cardiovascular */}
              <View style={styles.chartWrapper}>
                <ThemedText style={styles.chartTitle}>Ritmo Cardíaco</ThemedText>
                <RadarChart 
                  cardiovascular={patientData.cardiovascular}
                  size={250}
                />
              </View>

              {/* Polar area chart sudor */}
              <View style={styles.chartWrapper}>
                <ThemedText style={styles.chartTitle}>Nivel de Sudoración</ThemedText>
                <PolarAreaChartSudor 
                  sudor={patientData.sudor}
                  size={250}
                />
              </View>
            </View>
          </View>
        )}

        {/* Gráficas de tendencias */}
        {selectedChart === 'trends' && analyses.length > 0 && (
          <View style={styles.trendsSection}>
            <ThemedText type="title" style={styles.sectionTitle}>
              Tendencias Recientes
            </ThemedText>
            <View style={styles.trendsContainer}>
              <TrendChart 
                data={generateTrendData('cardiovascular')}
                title="Ritmo Cardíaco"
                color="#FF6B6B"
                maxValue={100}
              />
              <TrendChart 
                data={generateTrendData('sudor')}
                title="Nivel de Sudoración"
                color="#4BC0C0"
                maxValue={100}
              />
              <TrendChart 
                data={generateTrendData('temperatura')}
                title="Temperatura"
                color="#FFCD56"
                maxValue={40}
              />
            </View>
          </View>
        )}

        {/* Análisis detallados */}
        {selectedChart === 'analysis' && (
          <View style={styles.analysisSection}>
            <ThemedText type="title" style={styles.sectionTitle}>
              Análisis Detallados
            </ThemedText>
            
            {analyses.length > 0 ? (
              <View style={styles.analysisContainer}>
                {analyses.slice(0, 3).map((analysis) => (
                  <View key={analysis.id} style={styles.analysisCard}>
                    <View style={styles.analysisHeader}>
                      <MaterialCommunityIcons 
                        name="chart-line" 
                        size={20} 
                        color="#0A7EA4" 
                      />
                      <ThemedText style={styles.analysisCategory}>
                        {analysis.category.charAt(0).toUpperCase() + analysis.category.slice(1)}
                      </ThemedText>
                    </View>
                    
                    <ThemedText style={styles.analysisText}>
                      {analysis.analisis_IA}
                    </ThemedText>
                    
                    <View style={styles.analysisFooter}>
                      <ThemedText style={styles.analysisDate}>
                        {new Date(analysis.analizadoEn).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="chart-line-off" size={64} color="#ccc" />
                <ThemedText style={styles.emptyTitle}>
                  No hay análisis disponibles
                </ThemedText>
                <ThemedText style={styles.emptySubtitle}>
                  Este paciente aún no tiene análisis detallados
                </ThemedText>
              </View>
            )}
          </View>
        )}

        {/* Información adicional */}
        {patientData && (
          <View style={styles.infoSection}>
            <ThemedText type="title" style={styles.sectionTitle}>
              Información Adicional
            </ThemedText>
            
            <View style={styles.infoCard}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#666" />
              <ThemedText style={styles.infoText}>
                Última actualización: {patientData.lastUpdate}
              </ThemedText>
            </View>
            
            <View style={styles.infoCard}>
              <MaterialCommunityIcons name="account-heart" size={20} color="#666" />
              <ThemedText style={styles.infoText}>
                Paciente: {patientEmail}
              </ThemedText>
            </View>

            <View style={styles.infoCard}>
              <MaterialCommunityIcons name="chart-line" size={20} color="#666" />
              <ThemedText style={styles.infoText}>
                Análisis disponibles: {analyses.length}
              </ThemedText>
            </View>
          </View>
        )}
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
  healthStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  healthStatusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: 'white',
  },
  chartSelector: {
    marginBottom: 30,
  },
  selectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  selectorButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectorButtonActive: {
    backgroundColor: '#0A7EA4',
    borderColor: '#0A7EA4',
  },
  selectorButtonText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  selectorButtonTextActive: {
    color: 'white',
  },
  metricsSummary: {
    marginBottom: 30,
  },
  metricsGrid: {
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#333',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  chartsSection: {
    marginBottom: 30,
  },
  chartsContainer: {
    gap: 20,
  },
  chartWrapper: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  chartContainer: {
    alignItems: 'center',
  },
  chartLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  trendsSection: {
    marginBottom: 30,
  },
  trendsContainer: {
    gap: 20,
  },
  trendChartContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trendChartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  trendChartValue: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  analysisSection: {
    marginBottom: 30,
  },
  analysisContainer: {
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
    alignItems: 'center',
    marginBottom: 12,
  },
  analysisCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0A7EA4',
    marginLeft: 8,
  },
  analysisText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    marginBottom: 12,
  },
  analysisFooter: {
    alignItems: 'flex-end',
  },
  analysisDate: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
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
  infoSection: {
    marginBottom: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
  },
});