// Script para poblar la base de datos Firebase con datos de ejemplo
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, push } from 'firebase/database';

// Configuración de Firebase (usa la misma que en tu app)
const firebaseConfig = {
  // Aquí debes poner tu configuración de Firebase
  // Puedes copiarla desde firebaseConfig.js
  apiKey: "tu-api-key",
  authDomain: "tu-proyecto.firebaseapp.com",
  databaseURL: "https://tu-proyecto-default-rtdb.firebaseio.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.appspot.com",
  messagingSenderId: "123456789",
  appId: "tu-app-id"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Función para poblar datos de pacientes
async function populatePatientData() {
  try {
    console.log('Poblando base de datos con datos de ejemplo...');

    // Datos de ejemplo para pacientes
    const patientsData = {
      // Reemplaza estos UIDs con los UIDs reales de tus usuarios
      'patient_uid_1': {
        email: 'paciente1@ejemplo.com',
        cardiovascular: 75,
        sudor: 45,
        temperatura: 37.2,
        lastUpdate: new Date().toISOString()
      },
      'patient_uid_2': {
        email: 'paciente2@ejemplo.com',
        cardiovascular: 82,
        sudor: 38,
        temperatura: 36.8,
        lastUpdate: new Date().toISOString()
      },
      'patient_uid_3': {
        email: 'paciente3@ejemplo.com',
        cardiovascular: 68,
        sudor: 52,
        temperatura: 37.5,
        lastUpdate: new Date().toISOString()
      }
    };

    // Escribir datos de pacientes
    for (const [patientId, data] of Object.entries(patientsData)) {
      await set(ref(db, `patients/${patientId}`), data);
      console.log(`Datos escritos para paciente: ${patientId}`);
    }

    // Datos de análisis para pacientes
    const analysesData = {
      'patient_uid_1': {
        'analysis_1': {
          analisis_IA: 'Análisis de ritmo cardíaco: Se detecta una frecuencia cardíaca ligeramente elevada (75 bpm) que puede indicar estrés o actividad física reciente. Se recomienda monitorear durante las próximas horas.',
          analizadoEn: '2024-01-15T14:30:00Z',
          severity: 'medium',
          category: 'cardiovascular'
        },
        'analysis_2': {
          analisis_IA: 'Análisis de sudoración: Los niveles de GSR muestran una disminución del 15% comparado con el promedio semanal. Esto puede indicar mejor hidratación o reducción del estrés.',
          analizadoEn: '2024-01-14T10:15:00Z',
          severity: 'low',
          category: 'sudor'
        }
      },
      'patient_uid_2': {
        'analysis_1': {
          analisis_IA: 'Análisis de temperatura: La temperatura corporal se mantiene estable en 36.8°C, dentro del rango normal. No se detectan signos de fiebre o hipotermia.',
          analizadoEn: '2024-01-15T16:45:00Z',
          severity: 'low',
          category: 'temperatura'
        }
      }
    };

    // Escribir análisis
    for (const [patientId, analyses] of Object.entries(analysesData)) {
      for (const [analysisId, analysis] of Object.entries(analyses)) {
        await set(ref(db, `patients/${patientId}/analyses/${analysisId}`), analysis);
        console.log(`Análisis escrito para paciente ${patientId}: ${analysisId}`);
      }
    }

    // Datos de cuidadores con pacientes vinculados
    const caregiversData = {
      'caregiver_uid_1': {
        linkedPatients: {
          'patient_uid_1': true,
          'patient_uid_2': true
        }
      },
      'caregiver_uid_2': {
        linkedPatients: {
          'patient_uid_3': true
        }
      }
    };

    // Escribir datos de cuidadores
    for (const [caregiverId, data] of Object.entries(caregiversData)) {
      await set(ref(db, `caregivers/${caregiverId}`), data);
      console.log(`Datos escritos para cuidador: ${caregiverId}`);
    }

    console.log('¡Base de datos poblada exitosamente!');
    console.log('\nPara usar estos datos:');
    console.log('1. Reemplaza los UIDs en el código con los UIDs reales de tus usuarios');
    console.log('2. Ejecuta este script: node populate_database.js');
    console.log('3. Los datos aparecerán en el dashboard');

  } catch (error) {
    console.error('Error poblando la base de datos:', error);
  }
}

// Ejecutar la función
populatePatientData();