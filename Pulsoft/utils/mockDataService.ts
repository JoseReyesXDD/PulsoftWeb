import { PatientAnalysis, PatientData, ChartData } from '../types/caregiver';

interface MockPatient {
  uid: string;
  email: string;
  name: string;
  age: number;
  condition: string;
  lastUpdate: string;
  notesCount: number;
  cardiovascular: number;
  sudor: number;
  temperatura: number;
}

class MockDataService {
  private patients: MockPatient[] = [
    {
      uid: '1',
      email: 'maria.gonzalez@email.com',
      name: 'María González',
      age: 68,
      condition: 'Hipertensión',
      lastUpdate: new Date().toLocaleString(),
      notesCount: 5,
      cardiovascular: 78,
      sudor: 42,
      temperatura: 37.1
    },
    {
      uid: '2',
      email: 'juan.rodriguez@email.com',
      name: 'Juan Rodríguez',
      age: 72,
      condition: 'Diabetes',
      lastUpdate: new Date().toLocaleString(),
      notesCount: 3,
      cardiovascular: 85,
      sudor: 38,
      temperatura: 36.8
    },
    {
      uid: '3',
      email: 'ana.martinez@email.com',
      name: 'Ana Martínez',
      age: 65,
      condition: 'Artritis',
      lastUpdate: new Date().toLocaleString(),
      notesCount: 4,
      cardiovascular: 72,
      sudor: 45,
      temperatura: 37.3
    },
    {
      uid: '4',
      email: 'carlos.lopez@email.com',
      name: 'Carlos López',
      age: 70,
      condition: 'Problemas cardíacos',
      lastUpdate: new Date().toLocaleString(),
      notesCount: 6,
      cardiovascular: 92,
      sudor: 35,
      temperatura: 36.9
    },
    {
      uid: '5',
      email: 'lucia.hernandez@email.com',
      name: 'Lucía Hernández',
      age: 67,
      condition: 'Asma',
      lastUpdate: new Date().toLocaleString(),
      notesCount: 2,
      cardiovascular: 75,
      sudor: 48,
      temperatura: 37.0
    }
  ];

  /**
   * Genera datos de gráficas en tiempo real para un paciente
   */
  generateRealTimeChartData(patientUid: string): ChartData {
    const patient = this.patients.find(p => p.uid === patientUid);
    if (!patient) {
      return this.getDefaultChartData();
    }

    // Generar datos de la última semana con variaciones realistas
    const baseCardio = patient.cardiovascular;
    const baseSudor = patient.sudor;
    const baseTemp = patient.temperatura;

    const cardiovascular = this.generateWeeklyData(baseCardio, 8);
    const sudor = this.generateWeeklyData(baseSudor, 5);
    const temperatura = this.generateWeeklyData(baseTemp, 0.3);

    return {
      cardiovascular,
      sudor,
      temperatura,
      labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
      patientInfo: {
        name: patient.name,
        age: patient.age,
        condition: patient.condition
      }
    };
  }

  /**
   * Genera datos semanales con variaciones realistas
   */
  private generateWeeklyData(baseValue: number, maxVariation: number): number[] {
    return Array.from({ length: 7 }, () => {
      const variation = (Math.random() - 0.5) * maxVariation;
      return Math.round((baseValue + variation) * 10) / 10;
    });
  }

  /**
   * Obtiene datos de gráficas por defecto
   */
  getDefaultChartData(): ChartData {
    return {
      cardiovascular: [65, 70, 75, 80, 85, 82, 78],
      sudor: [40, 45, 50, 48, 42, 45, 43],
      temperatura: [36.8, 37.0, 37.2, 37.1, 36.9, 37.0, 37.1],
      labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
      patientInfo: {
        name: 'Paciente',
        age: 70,
        condition: 'General'
      }
    };
  }

  /**
   * Genera notas de análisis estáticas para un paciente
   */
  generateStaticNotes(patientUid: string): PatientAnalysis[] {
    const patient = this.patients.find(p => p.uid === patientUid);
    if (!patient) {
      return this.getDefaultNotes();
    }

    const notes: PatientAnalysis[] = [
      {
        note_id: '1',
        analisis_IA: `Análisis de ritmo cardíaco para ${patient.name}: Se detecta una frecuencia cardíaca de ${patient.cardiovascular} bpm, que está ${patient.cardiovascular > 80 ? 'ligeramente elevada' : 'dentro del rango normal'}. Se observa un patrón estable durante las últimas 24 horas. Se recomienda ${patient.cardiovascular > 80 ? 'monitorear más de cerca y considerar ajustes en la medicación' : 'mantener la rutina actual'}.`,
        analizadoEn: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
        patient_email: patient.email,
        severity: patient.cardiovascular > 80 ? 'medium' : 'low',
        category: 'cardiovascular'
      },
      {
        note_id: '2',
        analisis_IA: `Análisis de sudoración para ${patient.name}: Los niveles de GSR muestran ${patient.sudor} unidades, indicando ${patient.sudor > 45 ? 'una actividad sudoral elevada' : 'niveles normales de sudoración'}. Esto puede estar relacionado con ${patient.condition.toLowerCase()}. Se recomienda ${patient.sudor > 45 ? 'evaluar la hidratación y el estrés' : 'mantener los hábitos actuales'}.`,
        analizadoEn: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 horas atrás
        patient_email: patient.email,
        severity: patient.sudor > 45 ? 'medium' : 'low',
        category: 'sudor'
      },
      {
        note_id: '3',
        analisis_IA: `Análisis de temperatura corporal para ${patient.name}: La temperatura se mantiene en ${patient.temperatura}°C, que está ${patient.temperatura > 37.2 ? 'ligeramente elevada' : 'dentro del rango normal'}. No se detectan signos de fiebre o hipotermia. El patrón es consistente con el historial del paciente.`,
        analizadoEn: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 horas atrás
        patient_email: patient.email,
        severity: 'low',
        category: 'temperatura'
      },
      {
        note_id: '4',
        analisis_IA: `Análisis general de biomarcadores para ${patient.name}: El paciente muestra un perfil general ${patient.cardiovascular < 80 && patient.sudor < 45 && patient.temperatura < 37.2 ? 'saludable' : 'que requiere atención'}. Los valores están ${patient.cardiovascular < 80 && patient.sudor < 45 && patient.temperatura < 37.2 ? 'dentro de los rangos esperados' : 'fuera del rango óptimo'}. Se recomienda continuar con el monitoreo regular.`,
        analizadoEn: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 horas atrás
        patient_email: patient.email,
        severity: patient.cardiovascular > 80 || patient.sudor > 45 || patient.temperatura > 37.2 ? 'medium' : 'low',
        category: 'general'
      },
      {
        note_id: '5',
        analisis_IA: `Evaluación de tendencias para ${patient.name}: Se observa una ${patient.cardiovascular > 80 ? 'tendencia al alza' : 'estabilidad'} en los valores cardiovasculares durante la última semana. Los niveles de sudoración muestran ${patient.sudor > 45 ? 'variabilidad' : 'consistencia'}. La temperatura corporal se mantiene estable. Se sugiere ${patient.cardiovascular > 80 ? 'ajustar el plan de tratamiento' : 'mantener la rutina actual'}.`,
        analizadoEn: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 horas atrás
        patient_email: patient.email,
        severity: patient.cardiovascular > 80 ? 'medium' : 'low',
        category: 'general'
      }
    ];

    // Agregar notas adicionales según la condición del paciente
    if (patient.condition === 'Hipertensión') {
      notes.push({
        note_id: '6',
        analisis_IA: `Análisis específico para hipertensión - ${patient.name}: Los valores cardiovasculares de ${patient.cardiovascular} bpm están ${patient.cardiovascular > 80 ? 'por encima del rango recomendado para pacientes hipertensos' : 'dentro del rango controlado'}. Se recomienda ${patient.cardiovascular > 80 ? 'revisar la medicación antihipertensiva' : 'mantener el tratamiento actual'}.`,
        analizadoEn: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 día atrás
        patient_email: patient.email,
        severity: patient.cardiovascular > 80 ? 'high' : 'low',
        category: 'cardiovascular'
      });
    }

    if (patient.condition === 'Diabetes') {
      notes.push({
        note_id: '7',
        analisis_IA: `Análisis específico para diabetes - ${patient.name}: Los niveles de sudoración de ${patient.sudor} unidades pueden indicar ${patient.sudor > 45 ? 'posibles fluctuaciones en los niveles de glucosa' : 'control glucémico estable'}. Se recomienda ${patient.sudor > 45 ? 'monitorear más de cerca los niveles de azúcar' : 'continuar con el control regular'}.`,
        analizadoEn: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 día atrás
        patient_email: patient.email,
        severity: patient.sudor > 45 ? 'medium' : 'low',
        category: 'sudor'
      });
    }

    return notes;
  }

  /**
   * Obtiene notas por defecto
   */
  getDefaultNotes(): PatientAnalysis[] {
    return [
      {
        note_id: '1',
        analisis_IA: 'Análisis de ritmo cardíaco: Se detecta una frecuencia cardíaca ligeramente elevada (85 bpm) que puede indicar estrés o actividad física reciente. Se recomienda monitorear durante las próximas horas.',
        analizadoEn: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        patient_email: 'paciente@ejemplo.com',
        severity: 'medium',
        category: 'cardiovascular'
      },
      {
        note_id: '2',
        analisis_IA: 'Análisis de sudoración: Los niveles de GSR muestran una disminución del 15% comparado con el promedio semanal. Esto puede indicar mejor hidratación o reducción del estrés.',
        analizadoEn: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        patient_email: 'paciente@ejemplo.com',
        severity: 'low',
        category: 'sudor'
      },
      {
        note_id: '3',
        analisis_IA: 'Análisis de temperatura: La temperatura corporal se mantiene estable en 37.1°C, dentro del rango normal. No se detectan signos de fiebre o hipotermia.',
        analizadoEn: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        patient_email: 'paciente@ejemplo.com',
        severity: 'low',
        category: 'temperatura'
      }
    ];
  }

  /**
   * Obtiene todos los pacientes mock
   */
  getAllPatients(): PatientData[] {
    return this.patients.map(patient => ({
      uid: patient.uid,
      email: patient.email,
      user_type: 'patient',
      cardiovascular: patient.cardiovascular,
      sudor: patient.sudor,
      temperatura: patient.temperatura,
      lastUpdate: patient.lastUpdate,
      notesCount: patient.notesCount,
      name: patient.name,
      age: patient.age,
      condition: patient.condition
    }));
  }

  /**
   * Obtiene un paciente específico
   */
  getPatient(patientUid: string): PatientData | null {
    const patient = this.patients.find(p => p.uid === patientUid);
    if (!patient) return null;

    return {
      uid: patient.uid,
      email: patient.email,
      user_type: 'patient',
      cardiovascular: patient.cardiovascular,
      sudor: patient.sudor,
      temperatura: patient.temperatura,
      lastUpdate: patient.lastUpdate,
      notesCount: patient.notesCount,
      name: patient.name,
      age: patient.age,
      condition: patient.condition
    };
  }

  /**
   * Genera datos de métricas en tiempo real
   */
  generateRealTimeMetrics(patientUid: string) {
    const patient = this.patients.find(p => p.uid === patientUid);
    if (!patient) {
      return {
        cardiovascular: 75,
        sudor: 45,
        temperatura: 37.0,
        lastUpdate: new Date().toLocaleString(),
        status: 'normal'
      };
    }

    // Simular variaciones en tiempo real
    const cardiovascularVariation = (Math.random() - 0.5) * 6;
    const sudorVariation = (Math.random() - 0.5) * 4;
    const temperaturaVariation = (Math.random() - 0.5) * 0.4;

    const cardiovascular = Math.round((patient.cardiovascular + cardiovascularVariation) * 10) / 10;
    const sudor = Math.round((patient.sudor + sudorVariation) * 10) / 10;
    const temperatura = Math.round((patient.temperatura + temperaturaVariation) * 10) / 10;

    let status = 'normal';
    if (cardiovascular > 85 || sudor > 50 || temperatura > 37.5) {
      status = 'warning';
    } else if (cardiovascular > 90 || temperatura > 38) {
      status = 'alert';
    }

    return {
      cardiovascular,
      sudor,
      temperatura,
      lastUpdate: new Date().toLocaleString(),
      status,
      patientInfo: {
        name: patient.name,
        age: patient.age,
        condition: patient.condition
      }
    };
  }

  /**
   * Simula actualización de datos en tiempo real
   */
  simulateRealTimeUpdate(patientUid: string, callback: (data: any) => void) {
    const interval = setInterval(() => {
      const metrics = this.generateRealTimeMetrics(patientUid);
      callback(metrics);
    }, 5000); // Actualizar cada 5 segundos

    return () => clearInterval(interval);
  }
}

export const mockDataService = new MockDataService();