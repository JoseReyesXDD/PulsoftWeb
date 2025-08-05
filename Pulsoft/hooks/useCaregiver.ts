import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '../firebaseConfig';
import { caregiverService } from '../utils/caregiverService';
import { 
  PatientData, 
  PatientAnalysis, 
  CaregiverDashboardState,
  CaregiverNotesState 
} from '../types/caregiver';

export const useCaregiverDashboard = () => {
  const [state, setState] = useState<CaregiverDashboardState>({
    selectedPatient: null,
    linkedPatients: [],
    loading: true,
    refreshing: false,
  });

  const auth = getAuth(firebaseApp);

  const loadLinkedPatients = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'No hay usuario autenticado');
        return;
      }

      const response = await caregiverService.getLinkedPatients(currentUser.uid);
      
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          linkedPatients: response.data!.linked_patients,
          selectedPatient: response.data!.linked_patients.length > 0 
            ? response.data!.linked_patients[0] 
            : null,
          loading: false,
          refreshing: false,
        }));
      } else {
        // Fallback a datos mock
        console.log('API no disponible, usando datos mock');
        const mockPatients = caregiverService.getMockPatients();
        setState(prev => ({
          ...prev,
          linkedPatients: mockPatients,
          selectedPatient: mockPatients.length > 0 ? mockPatients[0] : null,
          loading: false,
          refreshing: false,
        }));
      }
    } catch (error) {
      console.error('Error loading linked patients:', error);
      Alert.alert('Error', 'No se pudieron cargar los pacientes vinculados');
      setState(prev => ({ ...prev, loading: false, refreshing: false }));
    }
  }, [auth]);

  const onRefresh = useCallback(() => {
    setState(prev => ({ ...prev, refreshing: true }));
    loadLinkedPatients();
  }, [loadLinkedPatients]);

  const selectPatient = useCallback((patient: PatientData) => {
    setState(prev => ({ ...prev, selectedPatient: patient }));
  }, []);

  useEffect(() => {
    loadLinkedPatients();
  }, [loadLinkedPatients]);

  return {
    ...state,
    onRefresh,
    selectPatient,
    reloadPatients: loadLinkedPatients,
  };
};

export const useCaregiverNotes = (patientId: string, patientEmail: string) => {
  const [state, setState] = useState<CaregiverNotesState>({
    analyses: [],
    loading: true,
    refreshing: false,
    patientEmail,
    patientId,
    totalNotes: 0,
  });

  const auth = getAuth(firebaseApp);

  const loadPatientAnalyses = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'No hay usuario autenticado');
        return;
      }

      const response = await caregiverService.getPatientNotes(patientId, currentUser.uid);
      
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          analyses: response.data!.notes,
          patientEmail: response.data!.patient_email,
          totalNotes: response.data!.total_notes,
          loading: false,
          refreshing: false,
        }));
      } else {
        // Fallback a datos mock
        console.log('API no disponible, usando datos mock');
        const mockAnalyses = caregiverService.getMockAnalyses(patientEmail);
        setState(prev => ({
          ...prev,
          analyses: mockAnalyses,
          totalNotes: mockAnalyses.length,
          loading: false,
          refreshing: false,
        }));
      }
    } catch (error) {
      console.error('Error loading patient analyses:', error);
      Alert.alert('Error', 'No se pudieron cargar los análisis');
      setState(prev => ({ ...prev, loading: false, refreshing: false }));
    }
  }, [patientId, patientEmail, auth]);

  const onRefresh = useCallback(() => {
    setState(prev => ({ ...prev, refreshing: true }));
    loadPatientAnalyses();
  }, [loadPatientAnalyses]);

  useEffect(() => {
    if (patientId) {
      loadPatientAnalyses();
    }
  }, [patientId, loadPatientAnalyses]);

  return {
    ...state,
    onRefresh,
    reloadAnalyses: loadPatientAnalyses,
  };
};

export const useCaregiverActions = () => {
  const handleShareAnalysis = (analysis: PatientAnalysis) => {
    Alert.alert(
      'Compartir Análisis',
      '¿Deseas compartir este análisis?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Compartir', onPress: () => {
          // Aquí implementarías la lógica de compartir
          Alert.alert('Éxito', 'Análisis compartido');
        }}
      ]
    );
  };

  const handleExportAnalysis = (analysis: PatientAnalysis) => {
    Alert.alert(
      'Exportar Análisis',
      '¿Deseas exportar este análisis como PDF?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Exportar', onPress: () => {
          // Aquí implementarías la lógica de exportar
          Alert.alert('Éxito', 'Análisis exportado');
        }}
      ]
    );
  };

  const handleViewAllPatients = () => {
    Alert.alert('Información', 'Funcionalidad para ver todos los pacientes en desarrollo');
  };

  return {
    handleShareAnalysis,
    handleExportAnalysis,
    handleViewAllPatients,
  };
};