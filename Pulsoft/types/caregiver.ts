// Tipos para la funcionalidad del cuidador

export interface PatientData {
  uid: string;
  email: string;
  user_type: string;
  cardiovascular?: number;
  sudor?: number;
  temperatura?: number;
  lastUpdate?: string;
  notesCount?: number;
}

export interface PatientAnalysis {
  note_id: string;
  analisis_IA: string;
  analizadoEn: string;
  patient_email: string;
  severity?: 'low' | 'medium' | 'high';
  category?: 'cardiovascular' | 'sudor' | 'temperatura' | 'general';
}

export interface CaregiverPatientsResponse {
  caregiver_uid: string;
  linked_patients: PatientData[];
  total_patients: number;
}

export interface PatientNotesResponse {
  patient_uid: string;
  patient_email: string;
  caregiver_uid: string;
  notes: PatientAnalysis[];
  total_notes: number;
}

export interface CaregiverDashboardState {
  selectedPatient: PatientData | null;
  linkedPatients: PatientData[];
  loading: boolean;
  refreshing: boolean;
}

export interface CaregiverNotesState {
  analyses: PatientAnalysis[];
  loading: boolean;
  refreshing: boolean;
  patientEmail: string;
  patientId: string;
  totalNotes: number;
}

// Tipos para las acciones del cuidador
export type CaregiverAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_REFRESHING'; payload: boolean }
  | { type: 'SET_LINKED_PATIENTS'; payload: PatientData[] }
  | { type: 'SET_SELECTED_PATIENT'; payload: PatientData | null }
  | { type: 'SET_ANALYSES'; payload: PatientAnalysis[] }
  | { type: 'SET_PATIENT_INFO'; payload: { email: string; id: string; totalNotes: number } };

// Tipos para los parámetros de navegación
export interface CaregiverNotesParams {
  patientId: string;
  patientEmail?: string;
}

// Tipos para las respuestas de la API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Tipos para las métricas del paciente
export interface PatientMetrics {
  cardiovascular?: number;
  sudor?: number;
  temperatura?: number;
  lastUpdate?: string;
}

// Tipos para las notificaciones
export interface CaregiverNotification {
  id: string;
  type: 'analysis' | 'alert' | 'reminder';
  title: string;
  message: string;
  patientId: string;
  timestamp: string;
  read: boolean;
}