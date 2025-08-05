import { getAuth } from 'firebase/auth';
import { firebaseApp } from '../firebaseConfig';
import { 
  PatientData, 
  PatientAnalysis, 
  CaregiverPatientsResponse, 
  PatientNotesResponse,
  ApiResponse 
} from '../types/caregiver';

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
    return this.makeRequest<CaregiverPatientsResponse>(
      `/caregiver-patients/?caregiver_uid=${caregiverUid}`
    );
  }

  /**
   * Obtiene las notas de un paciente específico
   */
  async getPatientNotes(
    patientUid: string, 
    caregiverUid: string
  ): Promise<ApiResponse<PatientNotesResponse>> {
    return this.makeRequest<PatientNotesResponse>(
      `/patient-notes/?patient_uid=${patientUid}&caregiver_uid=${caregiverUid}`
    );
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
  async getPatientChartData(patientUid: string, caregiverUid: string): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(
      `/patient-chart-data/?patient_uid=${patientUid}&caregiver_uid=${caregiverUid}`
    );
  }

  /**
   * Obtiene métricas actuales del paciente
   */
  async getPatientMetrics(patientUid: string, caregiverUid: string): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(
      `/patient-metrics/?patient_uid=${patientUid}&caregiver_uid=${caregiverUid}`
    );
  }

  /**
   * Obtiene datos mock para desarrollo
   */
  getMockPatients(): PatientData[] {
    return [
      {
        uid: '1',
        email: 'paciente1@ejemplo.com',
        user_type: 'patient',
        cardiovascular: 75,
        sudor: 45,
        temperatura: 37.2,
        lastUpdate: new Date().toLocaleString(),
        notesCount: 3
      },
      {
        uid: '2',
        email: 'paciente2@ejemplo.com',
        user_type: 'patient',
        cardiovascular: 82,
        sudor: 38,
        temperatura: 36.8,
        lastUpdate: new Date().toLocaleString(),
        notesCount: 1
      }
    ];
  }

  /**
   * Obtiene análisis mock para desarrollo
   */
  getMockAnalyses(patientEmail: string): PatientAnalysis[] {
    return [
      {
        note_id: '1',
        analisis_IA: 'Análisis de ritmo cardíaco: Se detecta una frecuencia cardíaca ligeramente elevada (85 bpm) que puede indicar estrés o actividad física reciente. Se recomienda monitorear durante las próximas horas.',
        analizadoEn: '2024-01-15T14:30:00Z',
        patient_email: patientEmail,
        severity: 'medium',
        category: 'cardiovascular'
      },
      {
        note_id: '2',
        analisis_IA: 'Análisis de sudoración: Los niveles de GSR muestran una disminución del 15% comparado con el promedio semanal. Esto puede indicar mejor hidratación o reducción del estrés.',
        analizadoEn: '2024-01-14T10:15:00Z',
        patient_email: patientEmail,
        severity: 'low',
        category: 'sudor'
      },
      {
        note_id: '3',
        analisis_IA: 'Análisis de temperatura: La temperatura corporal se mantiene estable en 37.1°C, dentro del rango normal. No se detectan signos de fiebre o hipotermia.',
        analizadoEn: '2024-01-13T16:45:00Z',
        patient_email: patientEmail,
        severity: 'low',
        category: 'temperatura'
      },
      {
        note_id: '4',
        analisis_IA: 'Análisis general: El paciente muestra patrones saludables en todos los biomarcadores. Se recomienda mantener la rutina actual y continuar con el monitoreo regular.',
        analizadoEn: '2024-01-12T09:20:00Z',
        patient_email: patientEmail,
        severity: 'low',
        category: 'general'
      }
    ];
  }

  /**
   * Obtiene pacientes disponibles mock para desarrollo
   */
  getMockAvailablePatients(): PatientData[] {
    return [
      {
        uid: '3',
        email: 'paciente3@ejemplo.com',
        user_type: 'patient'
      },
      {
        uid: '4',
        email: 'paciente4@ejemplo.com',
        user_type: 'patient'
      },
      {
        uid: '5',
        email: 'paciente5@ejemplo.com',
        user_type: 'patient'
      }
    ];
  }

  /**
   * Obtiene datos de gráficas mock para desarrollo
   */
  getMockChartData(): any {
    return {
      cardiovascular: [65, 70, 75, 80, 85, 82, 78],
      sudor: [40, 45, 50, 48, 42, 45, 43],
      temperatura: [36.8, 37.0, 37.2, 37.1, 36.9, 37.0, 37.1],
      labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
      metrics: {
        cardiovascular: 75,
        sudor: 45,
        temperatura: 37.2,
        lastUpdate: new Date().toLocaleString()
      }
    };
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