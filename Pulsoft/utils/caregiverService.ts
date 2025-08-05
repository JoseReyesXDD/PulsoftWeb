import { getAuth } from 'firebase/auth';
import { firebaseApp } from '../firebaseConfig';
import { 
  PatientData, 
  PatientAnalysis, 
  CaregiverPatientsResponse, 
  PatientNotesResponse,
  ApiResponse,
  ChartData,
  PatientMetrics
} from '../types/caregiver';
import { mockDataService } from './mockDataService';

const API_BASE_URL = 'http://localhost:8000/api';

class CaregiverService {
  private auth = getAuth(firebaseApp);

  private async getAuthToken(): Promise<string> {
    const currentUser = this.auth.currentUser;
    if (!currentUser) {
      throw new Error('No hay usuario autenticado');
    }
    return await currentUser.getIdToken();
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('API request failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }

  /**
   * Obtiene todos los pacientes vinculados a un cuidador
   */
  async getLinkedPatients(caregiverUid: string): Promise<ApiResponse<CaregiverPatientsResponse>> {
    try {
      const response = await this.makeRequest<CaregiverPatientsResponse>(
        `/caregiver-patients/?caregiver_uid=${caregiverUid}`
      );

      if (response.success && response.data) {
        return response;
      } else {
        // Fallback a datos mock
        const mockPatients = mockDataService.getAllPatients();
        return {
          success: true,
          data: {
            caregiver_uid: caregiverUid,
            linked_patients: mockPatients,
            total_patients: mockPatients.length
          }
        };
      }
    } catch (error) {
      // Fallback a datos mock en caso de error
      const mockPatients = mockDataService.getAllPatients();
      return {
        success: true,
        data: {
          caregiver_uid: caregiverUid,
          linked_patients: mockPatients,
          total_patients: mockPatients.length
        }
      };
    }
  }

  /**
   * Obtiene las notas de un paciente específico
   */
  async getPatientNotes(
    patientUid: string, 
    caregiverUid: string
  ): Promise<ApiResponse<PatientNotesResponse>> {
    try {
      const response = await this.makeRequest<PatientNotesResponse>(
        `/patient-notes/?patient_uid=${patientUid}&caregiver_uid=${caregiverUid}`
      );

      if (response.success && response.data) {
        return response;
      } else {
        // Fallback a datos mock
        const mockNotes = mockDataService.generateStaticNotes(patientUid);
        const patient = mockDataService.getPatient(patientUid);
        
        return {
          success: true,
          data: {
            patient_uid: patientUid,
            patient_email: patient?.email || 'paciente@ejemplo.com',
            caregiver_uid: caregiverUid,
            notes: mockNotes,
            total_notes: mockNotes.length
          }
        };
      }
    } catch (error) {
      // Fallback a datos mock en caso de error
      const mockNotes = mockDataService.generateStaticNotes(patientUid);
      const patient = mockDataService.getPatient(patientUid);
      
      return {
        success: true,
        data: {
          patient_uid: patientUid,
          patient_email: patient?.email || 'paciente@ejemplo.com',
          caregiver_uid: caregiverUid,
          notes: mockNotes,
          total_notes: mockNotes.length
        }
      };
    }
  }

  /**
   * Vincula un paciente a un cuidador
   */
  async linkPatient(caregiverUid: string, patientUid: string): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(
      `/link-patient/`,
      {
        method: 'POST',
        body: JSON.stringify({
          caregiver_uid: caregiverUid,
          patient_uid: patientUid
        })
      }
    );
  }

  /**
   * Desvincula un paciente de un cuidador
   */
  async unlinkPatient(caregiverUid: string, patientUid: string): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(
      `/unlink-patient/?caregiver_uid=${caregiverUid}&patient_uid=${patientUid}`,
      {
        method: 'DELETE'
      }
    );
  }

  /**
   * Obtiene pacientes disponibles para vincular
   */
  async getAvailablePatients(caregiverUid: string): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(
      `/available-patients/?caregiver_uid=${caregiverUid}`
    );
  }

  /**
   * Obtiene datos de gráficas de un paciente
   */
  async getPatientChartData(patientUid: string, caregiverUid: string): Promise<ApiResponse<ChartData>> {
    try {
      const response = await this.makeRequest<ChartData>(
        `/patient-chart-data/?patient_uid=${patientUid}&caregiver_uid=${caregiverUid}`
      );

      if (response.success && response.data) {
        return response;
      } else {
        // Fallback a datos mock
        const mockChartData = mockDataService.generateRealTimeChartData(patientUid);
        return {
          success: true,
          data: mockChartData
        };
      }
    } catch (error) {
      // Fallback a datos mock en caso de error
      const mockChartData = mockDataService.generateRealTimeChartData(patientUid);
      return {
        success: true,
        data: mockChartData
      };
    }
  }

  /**
   * Obtiene métricas actuales del paciente
   */
  async getPatientMetrics(patientUid: string, caregiverUid: string): Promise<ApiResponse<PatientMetrics>> {
    try {
      const response = await this.makeRequest<PatientMetrics>(
        `/patient-metrics/?patient_uid=${patientUid}&caregiver_uid=${caregiverUid}`
      );

      if (response.success && response.data) {
        return response;
      } else {
        // Fallback a datos mock
        const mockMetrics = mockDataService.generateRealTimeMetrics(patientUid);
        return {
          success: true,
          data: mockMetrics
        };
      }
    } catch (error) {
      // Fallback a datos mock en caso de error
      const mockMetrics = mockDataService.generateRealTimeMetrics(patientUid);
      return {
        success: true,
        data: mockMetrics
      };
    }
  }

  /**
   * Obtiene datos mock para desarrollo
   */
  getMockPatients(): PatientData[] {
    return mockDataService.getAllPatients();
  }

  /**
   * Obtiene análisis mock para desarrollo
   */
  getMockAnalyses(patientEmail: string): PatientAnalysis[] {
    const patient = mockDataService.getAllPatients().find(p => p.email === patientEmail);
    if (patient) {
      return mockDataService.generateStaticNotes(patient.uid);
    }
    return mockDataService.getDefaultNotes();
  }

  /**
   * Obtiene pacientes disponibles mock para desarrollo
   */
  getMockAvailablePatients(): PatientData[] {
    return mockDataService.getAllPatients().slice(0, 3); // Solo los primeros 3 como disponibles
  }

  /**
   * Obtiene datos de gráficas mock para desarrollo
   */
  getMockChartData(patientUid?: string): ChartData {
    if (patientUid) {
      return mockDataService.generateRealTimeChartData(patientUid);
    }
    return mockDataService.getDefaultChartData();
  }

  /**
   * Obtiene métricas en tiempo real
   */
  getRealTimeMetrics(patientUid: string): PatientMetrics {
    return mockDataService.generateRealTimeMetrics(patientUid);
  }

  /**
   * Simula actualización en tiempo real
   */
  simulateRealTimeUpdate(patientUid: string, callback: (data: PatientMetrics) => void) {
    return mockDataService.simulateRealTimeUpdate(patientUid, callback);
  }

  /**
   * Formatea una fecha para mostrar en la interfaz
   */
  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  }

  /**
   * Obtiene el icono y color para la severidad
   */
  getSeverityIcon(severity?: string) {
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
  }

  /**
   * Obtiene el icono y color para la categoría
   */
  getCategoryIcon(category?: string) {
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
  }

  /**
   * Obtiene la etiqueta de severidad en español
   */
  getSeverityLabel(severity?: string): string {
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
  }

  /**
   * Obtiene el color de estado del paciente
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'alert':
        return '#FF6B6B';
      case 'warning':
        return '#FFA726';
      case 'normal':
        return '#4CAF50';
      default:
        return '#2196F3';
    }
  }

  /**
   * Valida si un paciente está vinculado al cuidador
   */
  async validatePatientLink(caregiverUid: string, patientUid: string): Promise<boolean> {
    try {
      const response = await this.getLinkedPatients(caregiverUid);
      if (response.success && response.data) {
        return response.data.linked_patients.some(patient => patient.uid === patientUid);
      }
      return false;
    } catch (error) {
      console.error('Error validating patient link:', error);
      return false;
    }
  }

  /**
   * Obtiene estadísticas del cuidador
   */
  async getCaregiverStats(caregiverUid: string): Promise<any> {
    try {
      const linkedResponse = await this.getLinkedPatients(caregiverUid);
      if (linkedResponse.success && linkedResponse.data) {
        return {
          totalPatients: linkedResponse.data.total_patients,
          linkedPatients: linkedResponse.data.linked_patients.length,
          lastActivity: new Date().toLocaleString()
        };
      }
      return {
        totalPatients: 0,
        linkedPatients: 0,
        lastActivity: new Date().toLocaleString()
      };
    } catch (error) {
      console.error('Error getting caregiver stats:', error);
      return {
        totalPatients: 0,
        linkedPatients: 0,
        lastActivity: new Date().toLocaleString()
      };
    }
  }
}

export const caregiverService = new CaregiverService();