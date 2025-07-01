import { ScrollView, View, Dimensions, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { firebaseApp } from '../../firebaseConfig.js';
import { BarChart, LineChart } from 'react-native-chart-kit';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function TabTwoScreen() {
  const [cardio, setCardio] = useState(0);
  const [sudor, setSudor] = useState(0);
  const [temp, setTemp] = useState(0);
  const screenWidth = Math.max(Dimensions.get('window').width - 32, 320);
  const chartWidth = Math.floor((screenWidth - 32) / 3);
  const barChartWidth = Math.max(chartWidth, 120);

  useEffect(() => {
    const db = getDatabase(firebaseApp);
    const patientId = 'NBsn1Co2ABPHaStRMp8zKj3UYQ42';
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
    style: { borderRadius: 16 },
    propsForDots: { r: "4", strokeWidth: "2", stroke: "#2C3E50" },
    propsForBackgroundLines: {
      stroke: "#e3e3e3",
      strokeDasharray: "4"
    },
    barPercentage: 4,
  };

  const dataCardio = {
    labels: ['', 'Cardiovascular'],
    datasets: [{ data: [100, cardio] }]
  };
  const dataSudor = {
    labels: ['', 'Sudor'],
    datasets: [{ data: [100, sudor] }]
  };
  const dataTemp = {
    labels: ['', 'Temperatura'],
    datasets: [{ data: [100, temp] }]
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
          <BarChart
            data={dataCardio}
            width={barChartWidth}
            height={540}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={chartConfig}
            style={StyleSheet.flatten([styles.chart, { alignSelf: 'center' }])}
            fromZero
            segments={10}
            yLabelsOffset={10}
            verticalLabelRotation={0}
          />
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
            chartConfig={chartConfig}
            style={StyleSheet.flatten([styles.chart, { alignSelf: 'center' }])}
            fromZero
            segments={10}
            yLabelsOffset={10}
            verticalLabelRotation={0}
          />
        </View>
        <View style={styles.chartContainerSmall}>
          <ThemedText style={styles.chartTitle}>Temperatura</ThemedText>
          <ThemedText style={styles.sensorValue}>Temperatura: {temp}</ThemedText>
          <BarChart
            data={dataTemp}
            width={barChartWidth}
            height={540}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={chartConfig}
            style={StyleSheet.flatten([styles.chart, { alignSelf: 'center' }])}
            fromZero
            segments={10}
            yLabelsOffset={10}
            verticalLabelRotation={0}
          />
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
    marginBottom: 16,
    marginTop: 16,
    padding: 16,
  },
  ThemedText: {
    fontSize: 16,
    margin: 8,
    color: '#black',
  },
  rowCharts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 8,
    marginBottom: 24,
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
  },
  sensorValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50'
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});