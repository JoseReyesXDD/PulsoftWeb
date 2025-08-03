import React from 'react';
import { ScrollView, View, Dimensions, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { firebaseApp } from '../../firebaseConfig.js';
import { BarChart } from 'react-native-chart-kit';
import Svg, { Circle, Text as SvgText, Path, G } from 'react-native-svg';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

// Componente para gráfico de doughnut
interface DoughnutChartProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

const DoughnutChart = ({ value, size = 200, strokeWidth = 20, color = '#FF6B6B' }: DoughnutChartProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  const center = size / 2;

  return (
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
        fontSize="32"
        fontWeight="bold"
        textAnchor="middle"
        fill="#2C3E50"
        fontFamily="Lufga-Bold"
      >
        {value}°C
      </SvgText>
    </Svg>
  );
};

// Componente para Radar Chart
interface RadarChartProps {
  cardiovascular: number;
  size?: number;
}

const RadarChart = ({ cardiovascular, size = 300 }: RadarChartProps) => {
  const center = size / 2;
  const maxRadius = (size - 40) / 2;
  const maxValue = 4000; // Valor máximo para cardiovascular
  
  // Crear puntos del radar (10 puntos para formar un círculo suave)
  const createRadarPoints = () => {
    const points = [];
    const numPoints = 10;
    const angleStep = (2 * Math.PI) / numPoints;
    
    for (let i = 0; i < numPoints; i++) {
      const angle = i * angleStep - Math.PI / 2; // Empezar desde arriba
      const radius = (cardiovascular / maxValue) * maxRadius;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      points.push({ x, y });
    }
    
    return points;
  };

  // Crear círculos de escala
  const createScaleCircles = () => {
    const circles = [];
    for (let i = 1; i <= 5; i++) {
      const radius = (maxRadius / 5) * i;
      circles.push(
        <Circle
          key={`scale-${i}`}
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="#E8E8E8"
          strokeWidth={1}
          opacity={0.3}
        />
      );
    }
    return circles;
  };

  // Crear líneas radiales
  const createRadialLines = () => {
    const lines = [];
    const numLines = 8; // Más líneas para mejor distribución
    const angleStep = (2 * Math.PI) / numLines;
    
    for (let i = 0; i < numLines; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const endX = center + maxRadius * Math.cos(angle);
      const endY = center + maxRadius * Math.sin(angle);
      
      lines.push(
        <Path
          key={`line-${i}`}
          d={`M ${center} ${center} L ${endX} ${endY}`}
          stroke="#E8E8E8"
          strokeWidth={1}
          opacity={0.3}
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
    <Svg width={size} height={size}>
      {/* Círculos de escala de fondo */}
      {createScaleCircles()}
      
      {/* Líneas radiales */}
      {createRadialLines()}
      
      {/* Área del radar */}
      <Path
        d={pathData}
        fill="rgba(59, 130, 246, 0.3)"
        stroke="#3B82F6"
        strokeWidth={3}
      />
      
      {/* Puntos del radar */}
      {radarPoints.map((point, index) => (
        <Circle
          key={`point-${index}`}
          cx={point.x}
          cy={point.y}
          r={3}
          fill="#3B82F6"
          stroke="#FFFFFF"
          strokeWidth={1}
        />
      ))}
      
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
        {cardiovascular}
      </SvgText>
      <SvgText
        x={center}
        y={center + 30}
        fontSize="14"
        textAnchor="middle"
        fill="#2C3E50"
        fontFamily="Lufga-Regular"
      >
        Cardiovascular
      </SvgText>
    </Svg>
  );
};

export default function TabTwoScreen() {
  const [cardio, setCardio] = useState(0);
  const [sudor, setSudor] = useState(0);
  const [temp, setTemp] = useState(0);
  const screenWidth = Math.max(Dimensions.get('window').width - 32, 320);
  const chartWidth = Math.floor((screenWidth - 32) / 3);
  const barChartWidth = Math.max(chartWidth, 120);

  useEffect(() => {
    const db = getDatabase(firebaseApp);
    const patientId = '3hA6DBfpb1OzxRw0IGtEWGDvzHG3';
    const patientRef = ref(db, `patients/${patientId}`);
    onValue(patientRef, (snapshot) => {
      const data = snapshot.val() || {};
      setCardio(data.cardiovascular || 0);
      setSudor(data.sudor || 0);
      setTemp(data.temperatura || 0);
    });
  }, []);

  const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    color: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
    style: { 
      borderRadius: 16,
      fontFamily: 'Lufga-Regular',
    },
    propsForDots: { r: "4", strokeWidth: "2", stroke: "#2C3E50" },
    propsForBackgroundLines: {
      stroke: "#e3e3e3",
      strokeDasharray: "4"
    },
    barPercentage: 4,
  };

  const chartConfigSudor = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    color: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
    style: { 
      borderRadius: 16,
      fontFamily: 'Lufga-Regular',
    },
    propsForDots: { r: "4", strokeWidth: "2", stroke: "#2C3E50" },
    propsForBackgroundLines: {
      stroke: "#e3e3e3",
      strokeDasharray: "4"
    },
    barPercentage: 4,
  };

  const dataSudor = {
    labels: ['Sudor', ''],
    datasets: [{ data: [sudor, 100] }]
  };

  // Forzar el rango de 0 a 100 en las gráficas
  const chartProps = {
    fromZero: true,
    yAxisInterval: 10,
    segments: 10, // 0, 10, 20, ..., 100
    yLabelsOffset: 10,
    verticalLabelRotation: 0,
    withInnerLines: true,
    showBarTops: true,
    maxValue: 100,
    formatYLabel: (yValue: string) => `${Number(yValue)}%`,
    barPercentage: 1,
  };

  return (
    <ScrollView style={{ flex: 1 }}>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Gráficas Biométricas</ThemedText>
      </ThemedView>
    
      <View style={styles.rowCharts}>
        <View style={styles.chartContainerSmall}>
          <ThemedText style={styles.chartTitle}>ECG</ThemedText>
          <ThemedText style={styles.sensorValue}>Cardiovascular: {cardio}</ThemedText>
          <View style={styles.polarContainer}>
            <RadarChart 
              cardiovascular={cardio}
              size={300}
            />
          </View>
        </View>
        <View style={styles.chartContainerSmall}>
          <ThemedText style={styles.chartTitle}>GSR</ThemedText>
          <ThemedText style={styles.sensorValue}>Sudor: {sudor}</ThemedText>
          <BarChart
            data={dataSudor}
            width={barChartWidth}
            height={540}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={chartConfigSudor}
            style={StyleSheet.flatten([styles.chart, { alignSelf: 'center' }])}
            fromZero
            segments={10}
            yLabelsOffset={10}
            verticalLabelRotation={0}
          />
        </View>
        <View style={styles.chartContainerSmall}>
          <ThemedText style={styles.chartTitle}>Temperatura</ThemedText>
          <ThemedText style={styles.sensorValue}>Temperatura: {temp}°C</ThemedText>
          <View style={styles.doughnutContainer}>
            <DoughnutChart 
              value={temp} 
              size={300} 
              strokeWidth={25}
              color="#FF6B6B"
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 2,
    marginTop: 2,
    padding: 16,
  },

  rowCharts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 8,
    marginBottom: 2,
  },
  chartContainerSmall: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 8,
    marginHorizontal: 4,
    flex: 1,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2C3E50',
    fontFamily: 'Lufga-Bold',
  },
  sensorValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    fontFamily: 'Lufga-SemiBold',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    height: 445,
  },
  polarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    height: 445,
  },
  doughnutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    height: 445,
  },
});