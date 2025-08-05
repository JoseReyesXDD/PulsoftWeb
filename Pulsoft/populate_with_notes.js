// Script para poblar la base de datos Firebase con pacientes, notas y vínculos con cuidadores
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, push } from 'firebase/database';

// Configuración de Firebase - REEMPLAZA CON TU CONFIGURACIÓN
const firebaseConfig = {
  // Copia tu configuración desde firebaseConfig.js
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

// Datos de ejemplo para pacientes
const patientsData = {
  // REEMPLAZA ESTOS UIDs CON LOS UIDs REALES DE TUS USUARIOS
  'patient_uid_1': {
    email: 'maria.garcia@ejemplo.com',
    cardiovascular: 75,
    sudor: 45,
    temperatura: 37.2,
    lastUpdate: new Date().toISOString()
  },
  'patient_uid_2': {
    email: 'juan.lopez@ejemplo.com',
    cardiovascular: 82,
    sudor: 38,
    temperatura: 36.8,
    lastUpdate: new Date().toISOString()
  }
};

// Notas de ejemplo para cada paciente
const patientNotes = {
  'patient_uid_1': [
    {
      analisis_IA: 'Análisis de ritmo cardíaco: Se detecta una frecuencia cardíaca de 75 bpm, dentro del rango normal. El paciente muestra patrones cardíacos estables sin anomalías detectables. Se recomienda continuar con el monitoreo regular.',
      analizadoEn: '2024-01-15T14:30:00Z',
      severity: 'low',
      category: 'cardiovascular'
    },
    {
      analisis_IA: 'Análisis de sudoración (GSR): Los niveles de conductancia de la piel muestran una disminución del 15% comparado con el promedio semanal. Esto puede indicar mejor hidratación o reducción del estrés. Los valores actuales están en el rango saludable.',
      analizadoEn: '2024-01-14T10:15:00Z',
      severity: 'low',
      category: 'sudor'
    },
    {
      analisis_IA: 'Análisis de temperatura corporal: La temperatura se mantiene estable en 37.2°C, dentro del rango normal (36.5-37.5°C). No se detectan signos de fiebre o hipotermia. El paciente mantiene una temperatura corporal saludable.',
      analizadoEn: '2024-01-13T16:45:00Z',
      severity: 'low',
      category: 'temperatura'
    },
    {
      analisis_IA: 'Análisis general del estado de salud: El paciente muestra patrones saludables en todos los biomarcadores monitoreados. La frecuencia cardíaca, sudoración y temperatura están dentro de rangos normales. Se recomienda mantener la rutina actual y continuar con el monitoreo regular.',
      analizadoEn: '2024-01-12T09:20:00Z',
      severity: 'low',
      category: 'general'
    },
    {
      analisis_IA: 'Análisis de tendencias: Se observa una mejora gradual en los patrones de sudoración durante la última semana, lo que sugiere mejor gestión del estrés. La frecuencia cardíaca se mantiene estable, indicando buena condición cardiovascular.',
      analizadoEn: '2024-01-11T11:30:00Z',
      severity: 'low',
      category: 'cardiovascular'
    }
  ],
  'patient_uid_2': [
    {
      analisis_IA: 'Análisis de ritmo cardíaco: Frecuencia cardíaca ligeramente elevada (82 bpm) que puede indicar estrés o actividad física reciente. Se recomienda monitorear durante las próximas horas y verificar si hay factores estresantes.',
      analizadoEn: '2024-01-15T15:45:00Z',
      severity: 'medium',
      category: 'cardiovascular'
    },
    {
      analisis_IA: 'Análisis de sudoración: Los niveles de GSR están en el rango normal (38 unidades). No se detectan patrones anómalos. La sudoración se mantiene estable, indicando buen control del sistema nervioso autónomo.',
      analizadoEn: '2024-01-14T12:20:00Z',
      severity: 'low',
      category: 'sudor'
    },
    {
      analisis_IA: 'Análisis de temperatura: Temperatura corporal de 36.8°C, ligeramente por debajo del promedio pero dentro del rango normal. No hay signos de hipotermia. Se recomienda verificar si el paciente ha estado en ambientes fríos.',
      analizadoEn: '2024-01-13T18:10:00Z',
      severity: 'low',
      category: 'temperatura'
    },
    {
      analisis_IA: 'Análisis general: El paciente presenta una ligera elevación en la frecuencia cardíaca que requiere atención. Los demás parámetros están normales. Se sugiere evaluar factores de estrés y actividad física reciente.',
      analizadoEn: '2024-01-12T13:55:00Z',
      severity: 'medium',
      category: 'general'
    },
    {
      analisis_IA: 'Análisis de correlación: Se observa una correlación entre la frecuencia cardíaca elevada y posibles factores estresantes. La temperatura ligeramente baja podría estar relacionada con el ambiente. Se recomienda seguimiento cercano.',
      analizadoEn: '2024-01-11T16:30:00Z',
      severity: 'medium',
      category: 'cardiovascular'
    }
  ]
};

// Datos del cuidador con pacientes vinculados
const caregiverData = {
  'caregiver_uid_1': {
    email: 'dr.rodriguez@ejemplo.com',
    name: 'Dr. Carlos Rodríguez',
    linkedPatients: {
      'patient_uid_1': true,
      'patient_uid_2': true
    }
  }
};

// Función para poblar la base de datos
async function populateDatabase() {
  try {
    console.log('🚀 Iniciando población de la base de datos...');

    // 1. Escribir datos de pacientes
    console.log('📝 Escribiendo datos de pacientes...');
    for (const [patientId, data] of Object.entries(patientsData)) {
      await set(ref(db, `patients/${patientId}`), data);
      console.log(`✅ Datos escritos para paciente: ${patientId} (${data.email})`);
    }

    // 2. Escribir notas de análisis para cada paciente
    console.log('📊 Escribiendo notas de análisis...');
    for (const [patientId, notes] of Object.entries(patientNotes)) {
      for (let i = 0; i < notes.length; i++) {
        const noteId = `analysis_${i + 1}`;
        await set(ref(db, `patients/${patientId}/analyses/${noteId}`), notes[i]);
        console.log(`✅ Nota ${i + 1} escrita para paciente ${patientId}`);
      }
    }

    // 3. Escribir datos del cuidador y vínculos
    console.log('👨‍⚕️ Escribiendo datos del cuidador...');
    for (const [caregiverId, data] of Object.entries(caregiverData)) {
      await set(ref(db, `caregivers/${caregiverId}`), data);
      console.log(`✅ Datos escritos para cuidador: ${caregiverId} (${data.name})`);
    }

    console.log('\n🎉 ¡Base de datos poblada exitosamente!');
    console.log('\n📋 Resumen:');
    console.log(`- ${Object.keys(patientsData).length} pacientes creados`);
    console.log(`- ${Object.values(patientNotes).flat().length} notas de análisis creadas`);
    console.log(`- ${Object.keys(caregiverData).length} cuidador creado`);
    console.log(`- ${Object.values(caregiverData).reduce((acc, cg) => acc + Object.keys(cg.linkedPatients).length, 0)} vínculos paciente-cuidador creados`);

    console.log('\n🔧 Para usar estos datos:');
    console.log('1. Reemplaza los UIDs en el código con los UIDs reales de tus usuarios');
    console.log('2. Ejecuta: node populate_with_notes.js');
    console.log('3. Los datos aparecerán en el dashboard y las notas del cuidador');

    console.log('\n📊 Estructura de datos creada:');
    console.log('patients/{uid}/ - Datos del paciente');
    console.log('patients/{uid}/analyses/{id} - Notas de análisis');
    console.log('caregivers/{uid}/ - Datos del cuidador con pacientes vinculados');

  } catch (error) {
    console.error('❌ Error poblando la base de datos:', error);
  }
}

// Función para verificar la estructura de datos
async function verifyDataStructure() {
  try {
    console.log('\n🔍 Verificando estructura de datos...');
    
    const { get } = await import('firebase/database');
    
    // Verificar pacientes
    for (const patientId of Object.keys(patientsData)) {
      const patientRef = ref(db, `patients/${patientId}`);
      const patientSnapshot = await get(patientRef);
      
      if (patientSnapshot.exists()) {
        console.log(`✅ Paciente ${patientId} encontrado`);
        
        // Verificar análisis
        const analysesRef = ref(db, `patients/${patientId}/analyses`);
        const analysesSnapshot = await get(analysesRef);
        
        if (analysesSnapshot.exists()) {
          const analysesCount = Object.keys(analysesSnapshot.val()).length;
          console.log(`  📊 ${analysesCount} análisis encontrados`);
        } else {
          console.log(`  ⚠️ No se encontraron análisis para ${patientId}`);
        }
      } else {
        console.log(`❌ Paciente ${patientId} no encontrado`);
      }
    }
    
    // Verificar cuidador
    for (const caregiverId of Object.keys(caregiverData)) {
      const caregiverRef = ref(db, `caregivers/${caregiverId}`);
      const caregiverSnapshot = await get(caregiverRef);
      
      if (caregiverSnapshot.exists()) {
        console.log(`✅ Cuidador ${caregiverId} encontrado`);
        const data = caregiverSnapshot.val();
        const linkedCount = Object.keys(data.linkedPatients || {}).length;
        console.log(`  👥 ${linkedCount} pacientes vinculados`);
      } else {
        console.log(`❌ Cuidador ${caregiverId} no encontrado`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error verificando datos:', error);
  }
}

// Ejecutar las funciones
async function main() {
  await populateDatabase();
  await verifyDataStructure();
}

main();