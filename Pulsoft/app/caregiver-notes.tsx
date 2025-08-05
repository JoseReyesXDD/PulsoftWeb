import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth, signOut } from 'firebase/auth';
import { getDatabase, ref, onValue, get } from 'firebase/database';
import { firebaseApp } from '../firebaseConfig';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Svg, { Circle, Text as SvgText, Path, Line } from 'react-native-svg';

interface PatientAnalysis {
  id: string;
  analisis_IA: string;
  analizadoEn: string;
  patient_email: string;
  severity: 'low' | 'medium' | 'high';
  category: 'cardiovascular' | 'sudor' | 'temperatura' | 'general';
  cardiovascular?: number;
  sudor?: number;
  temperatura?: number;
}

interface PatientData {
  cardiovascular: number;
  sudor: number;
  temperatura: number;
  lastUpdate: string;
}

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

// Componente para gráfico de estado de salud
interface HealthStatusChartProps {
  cardiovascular: number;
  sudor: number;
  temperatura: number;
}

const HealthStatusChart = ({ cardiovascular, sudor, temperatura }: HealthStatusChartProps) => {
  const size = 200;
  const center = size / 2;
  const radius = 80;

  const getHealthScore = () => {
    let score = 100;
    
    // Penalizar por valores fuera de rango
    if (temperatura > 37.5) score -= 20;
    if (temperatura > 38) score -= 30;
    if (cardiovascular > 85) score -= 15;
    if (cardiovascular > 100) score -= 25;
    if (sudor > 60) score -= 10;
    if (sudor > 80) score -= 20;
    
    return Math.max(0, score);
  };

  const score = getHealthScore();
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getHealthColor = (score: number) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FFA726';
    return '#FF6B6B';
  };

  const getHealthStatus = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bueno';
    if (score >= 40) return 'Atención';
    return 'Crítico';
  };

  return (
    <View style={styles.healthChartContainer}>
      <ThemedText style={styles.healthChartTitle}>Estado de Salud General</ThemedText>
      <Svg width={size} height={size}>
        {/* Círculo de fondo */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#E8E8E8"
          strokeWidth="12"
          fill="transparent"
        />
        {/* Círculo de progreso */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={getHealthColor(score)}
          strokeWidth="12"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
        {/* Texto central */}
        <SvgText
          x={center}
          y={center + 8}
          fontSize="24"
          fontWeight="bold"
          textAnchor="middle"
          fill="#2C3E50"
          fontFamily="Lufga-Bold"
        >
          {score}%
        </SvgText>
        <SvgText
          x={center}
          y={center + 32}
          fontSize="12"
          textAnchor="middle"
          fill="#666"
        >
          {getHealthStatus(score)}
        </SvgText>
      </Svg>
    </View>
  );
};

export default function CaregiverNotesScreen() {
  const [analyses, setAnalyses] = useState<PatientAnalysis[]>([]);
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [patientEmail, setPatientEmail] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const router = useRouter();
  const params = useLocalSearchParams();
  const auth = getAuth(firebaseApp);

  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    try {
      const patientId = params.patientId as string;
      
      if (!patientId) {
        console.error('No se proporcionó ID del paciente');
        Alert.alert('Error', 'No se pudo identificar al paciente');
        setLoading(false);
        return;
      }

      const db = getDatabase(firebaseApp);
      
      // Obtener datos del paciente
      const patientRef = ref(db, `patients/${patientId}`);
      const patientSnapshot = await get(patientRef);
      
      if (patientSnapshot.exists()) {
        const data = patientSnapshot.val();
        setPatientEmail(data.email || `paciente-${patientId}@ejemplo.com`);
        setPatientData({
          cardiovascular: data.cardiovascular || 0,
          sudor: data.sudor || 0,
          temperatura: data.temperatura || 0,
          lastUpdate: data.lastUpdate || new Date().toLocaleString()
        });
      } else {
        setPatientEmail(`paciente-${patientId}@ejemplo.com`);
      }
      
      // Obtener análisis del paciente
      const analysesRef = ref(db, `patients/${patientId}/analyses`);
      const analysesSnapshot = await get(analysesRef);
      
      if (analysesSnapshot.exists()) {
        const analysesData = analysesSnapshot.val();
        const analyses: PatientAnalysis[] = [];
        
        for (const analysisId in analysesData) {
          const analysis = analysesData[analysisId];
          analyses.push({
            id: analysisId,
            analisis_IA: analysis.analisis_IA || 'Análisis no disponible',
            analizadoEn: analysis.analizadoEn || new Date().toISOString(),
            patient_email: data?.email || `paciente-${patientId}@ejemplo.com`,
            severity: analysis.severity || 'low',
            category: analysis.category || 'general',
            cardiovascular: analysis.cardiovascular || 0,
            sudor: analysis.sudor || 0,
            temperatura: analysis.temperatura || 0
          });
        }
        
        // Ordenar por fecha de análisis (más reciente primero)
        analyses.sort((a, b) => new Date(b.analizadoEn).getTime() - new Date(a.analizadoEn).getTime());
        
        setAnalyses(analyses);
      } else {
        setAnalyses([]);
      }
    } catch (error) {
      console.error('Error loading patient data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del paciente');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPatientData();
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      Alert.alert('Error', 'No se pudo cerrar sesión');
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return { name: 'alert-circle', color: '#FF6B6B' };
      case 'medium':
        return { name: 'alert', color: '#FFA726' };
      case 'low':
        return { name: 'check-circle', color: '#4CAF50' };
      default:
        return { name: 'information', color: '#2196F3' };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cardiovascular':
        return { name: 'heart-pulse', color: '#FF6B6B' };
      case 'sudor':
        return { name: 'water', color: '#4BC0C0' };
      case 'temperatura':
        return { name: 'thermometer', color: '#FFCD56' };
      case 'general':
        return { name: 'chart-line', color: '#2196F3' };
      default:
        return { name: 'chart-line', color: '#666' };
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'Alto';
      case 'medium':
        return 'Medio';
      case 'low':
        return 'Bajo';
      default:
        return 'Normal';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'cardiovascular':
        return 'Cardiovascular';
      case 'sudor':
        return 'Sudoración';
      case 'temperatura':
        return 'Temperatura';
      case 'general':
        return 'General';
      default:
        return 'Otro';
    }
  };

  const filteredAnalyses = selectedCategory === 'all' 
    ? analyses 
    : analyses.filter(analysis => analysis.category === selectedCategory);

  const generateTrendData = (category: string) => {
    const categoryAnalyses = analyses.filter(a => a.category === category);
    return categoryAnalyses.slice(-5).map(analysis => ({
      value: analysis[category as keyof PatientAnalysis] as number || 0,
      date: new Date(analysis.analizadoEn).toLocaleDateString()
    }));
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
        {/* Estado de salud actual */}
        {patientData && (
          <View style={styles.healthStatusSection}>
            <ThemedText type="title" style={styles.sectionTitle}>
              Estado de Salud Actual
            </ThemedText>
            <HealthStatusChart 
              cardiovascular={patientData.cardiovascular}
              sudor={patientData.sudor}
              temperatura={patientData.temperatura}
            />
          </View>
        )}

        {/* Filtros de categoría */}
        <View style={styles.filtersSection}>
          <ThemedText type="title" style={styles.sectionTitle}>
            Filtrar por Categoría
          </ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
            {['all', 'cardiovascular', 'sudor', 'temperatura', 'general'].map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.filterButton,
                  selectedCategory === category && styles.filterButtonActive
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <ThemedText style={[
                  styles.filterButtonText,
                  selectedCategory === category && styles.filterButtonTextActive
                ]}>
                  {category === 'all' ? 'Todos' : getCategoryLabel(category)}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Gráficas de tendencias */}
        {analyses.length > 0 && (
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

        {/* Análisis */}
        <View style={styles.analysesSection}>
          <ThemedText type="title" style={styles.sectionTitle}>
            Análisis Detallados ({filteredAnalyses.length})
          </ThemedText>
          
          {filteredAnalyses.length > 0 ? (
            <View style={styles.analysesContainer}>
              {filteredAnalyses.map((analysis) => {
                const severityIcon = getSeverityIcon(analysis.severity);
                const categoryIcon = getCategoryIcon(analysis.category);
                return (
                  <View key={analysis.id} style={styles.analysisCard}>
                    <View style={styles.analysisHeader}>
                      <View style={styles.analysisTypeContainer}>
                        <MaterialCommunityIcons 
                          name={categoryIcon.name as any} 
                          size={20} 
                          color={categoryIcon.color} 
                        />
                        <ThemedText style={[styles.analysisType, { color: categoryIcon.color }]}>
                          {getCategoryLabel(analysis.category)}
                        </ThemedText>
                      </View>
                      <View style={styles.severityContainer}>
                        <MaterialCommunityIcons 
                          name={severityIcon.name as any} 
                          size={16} 
                          color={severityIcon.color} 
                        />
                        <ThemedText style={[styles.severityLabel, { color: severityIcon.color }]}>
                          {getSeverityLabel(analysis.severity)}
                        </ThemedText>
                      </View>
                    </View>
                    
                    <View style={styles.analysisContent}>
                      <ThemedText style={styles.analysisText}>
                        {analysis.analisis_IA}
                      </ThemedText>
                    </View>
                    
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
                {selectedCategory === 'all' 
                  ? 'Este paciente aún no ha registrado análisis'
                  : `No hay análisis de ${getCategoryLabel(selectedCategory)} disponibles`
                }
              </ThemedText>
            </View>
          )}
        </View>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: 'white',
  },
  healthStatusSection: {
    marginBottom: 30,
    alignItems: 'center',
  },
  healthChartContainer: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  healthChartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  filtersSection: {
    marginBottom: 30,
  },
  filtersContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterButtonActive: {
    backgroundColor: '#0A7EA4',
    borderColor: '#0A7EA4',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  filterButtonTextActive: {
    color: 'white',
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
  analysesSection: {
    marginBottom: 20,
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