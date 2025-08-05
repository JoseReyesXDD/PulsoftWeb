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
  name?: string;
  age?: number;
  condition?: string;
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

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
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
  totalNotes: number;
}

export interface CaregiverAction {
  type: string;
  payload?: any;
}

export interface CaregiverNotesParams {
  patientId: string;
  patientEmail: string;
}

export interface PatientMetrics {
  cardiovascular: number;
  sudor: number;
  temperatura: number;
  lastUpdate: string;
  status: 'normal' | 'warning' | 'alert';
  patientInfo?: {
    name: string;
    age: number;
    condition: string;
  };
}

export interface ChartData {
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

export interface CaregiverNotification {
  id: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  title: string;
  message: string;
  timestamp: string;
  patientId?: string;
  read: boolean;
}

export interface RealTimeData {
  patientId: string;
  metrics: PatientMetrics;
  chartData: ChartData;
  lastUpdate: string;
}