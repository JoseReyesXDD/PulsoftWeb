import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth, signOut } from 'firebase/auth';
import { getDatabase, ref, onValue } from 'firebase/database';
import { firebaseApp } from '../firebaseConfig';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface PatientData {
  email: string;
  uid: string;
  cardiovascular: number;
  sudor: number;
  temperatura: number;
  lastUpdate?: string;
}

export default function PatientDashboardScreen() {
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const router = useRouter();
  const auth = getAuth(firebaseApp);

  useEffect(() => {
    // Cargar datos reales del paciente desde Firebase
    const loadPatientData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const db = getDatabase(firebaseApp);
          const patientId = user.uid; // Usar el UID del usuario actual
          const patientRef = ref(db, `patients/${patientId}`);
          
          // Escuchar cambios en tiempo real
          const unsubscribe = onValue(patientRef, (snapshot) => {
            const data = snapshot.val();
            setIsConnected(true);
                         if (data) {
               setPatientData({
                 email: user.email || 'paciente@ejemplo.com',
                 uid: user.uid,
                 cardiovascular: data.cardiovascular || 0,
                 sudor: data.sudor || 0,
                 temperatura: data.temperatura || 0,
                 lastUpdate: new Date().toLocaleTimeString()
               });
             } else {
               // Si no hay datos, usar valores por defecto
               setPatientData({
                 email: user.email || 'paciente@ejemplo.com',
                 uid: user.uid,
                 cardiovascular: 0,
                 sudor: 0,
                 temperatura: 0,
                 lastUpdate: new Date().toLocaleTimeString()
               });
             }
            setLoading(false);
                     }, (error) => {
             console.error('Error loading patient data:', error);
             setIsConnected(false);
             // En caso de error, usar valores por defecto
             setPatientData({
               email: user.email || 'paciente@ejemplo.com',
               uid: user.uid,
               cardiovascular: 0,
               sudor: 0,
               temperatura: 0
             });
             setLoading(false);
           });

          // Limpiar la suscripción cuando el componente se desmonte
          return () => unsubscribe();
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading patient data:', error);
        setLoading(false);
      }
    };

    loadPatientData();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      Alert.alert('Error', 'No se pudo cerrar sesión');
    }
  };

  const handleViewNotes = () => {
    router.push('/patient-notes');
  };

  const handleSettings = () => {
    router.push('/configuracion-usuario');
  };

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText>Cargando...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <MaterialCommunityIcons name="account-heart" size={32} color="#0A7EA4" />
          <View style={styles.headerText}>
            <ThemedText type="title" style={styles.title}>
              Dashboard del Paciente
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Bienvenido {patientData?.email}
            </ThemedText>
                         {patientData?.lastUpdate && (
               <ThemedText style={styles.updateText}>
                 Última actualización: {patientData.lastUpdate}
               </ThemedText>
             )}
             {patientData?.uid && (
               <ThemedText style={styles.uidText}>
                 ID: {patientData.uid}
               </ThemedText>
             )}
          </View>
        </View>
        <View style={styles.headerActions}>
          <View style={[styles.connectionIndicator, { backgroundColor: isConnected ? '#4CAF50' : '#FF6B6B' }]}>
            <MaterialCommunityIcons 
              name={isConnected ? "wifi" : "wifi-off"} 
              size={16} 
              color="white" 
            />
          </View>
          <TouchableOpacity onPress={handleSettings} style={styles.settingsButton}>
            <MaterialCommunityIcons name="cog" size={24} color="#0A7EA4" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {/* Métricas rápidas */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <MaterialCommunityIcons name="heart-pulse" size={32} color="#FF6B6B" />
            <ThemedText style={styles.metricValue}>{patientData?.cardiovascular}</ThemedText>
            <ThemedText style={styles.metricLabel}>Cardiovascular</ThemedText>
          </View>
          
          <View style={styles.metricCard}>
            <MaterialCommunityIcons name="water" size={32} color="#4BC0C0" />
            <ThemedText style={styles.metricValue}>{patientData?.sudor}</ThemedText>
            <ThemedText style={styles.metricLabel}>Sudor</ThemedText>
          </View>
          
          <View style={styles.metricCard}>
            <MaterialCommunityIcons name="thermometer" size={32} color="#FFCD56" />
            <ThemedText style={styles.metricValue}>{patientData?.temperatura}°C</ThemedText>
            <ThemedText style={styles.metricLabel}>Temperatura</ThemedText>
          </View>
        </View>

        {/* Acciones principales */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleViewNotes}>
            <MaterialCommunityIcons name="note-text" size={24} color="white" />
            <ThemedText style={styles.actionButtonText}>Ver mis notas</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]} 
            onPress={() => router.push('/explore')}
          >
            <MaterialCommunityIcons name="chart-line" size={24} color="#0A7EA4" />
            <ThemedText style={[styles.actionButtonText, styles.secondaryButtonText]}>
              Ver gráficas
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Información adicional */}
        <View style={styles.infoContainer}>
          <ThemedText type="title" style={styles.infoTitle}>
            Estado de salud
          </ThemedText>
          <View style={styles.statusCard}>
            <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
            <ThemedText style={styles.statusText}>Estable</ThemedText>
          </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
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
  settingsButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  connectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  uidText: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
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
    fontSize: 24,
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
  actionsContainer: {
    marginBottom: 30,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A7EA4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#0A7EA4',
  },
  secondaryButtonText: {
    color: '#0A7EA4',
  },
  infoContainer: {
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 8,
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