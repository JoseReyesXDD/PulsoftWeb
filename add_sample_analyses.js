// Script para añadir análisis de ejemplo a los pacientes
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, push, get } = require('firebase/database');

const firebaseConfig = {
  apiKey: "AIzaSyDQEWZhaViw-7LT-VLs4XdCXcFg25DmrqQ",
  authDomain: "pulsoft-fc676.firebaseapp.com",
  databaseURL: "https://pulsoft-fc676-default-rtdb.firebaseio.com",
  projectId: "pulsoft-fc676",
  storageBucket: "pulsoft-fc676.appspot.com",
  messagingSenderId: "758196176997",
  appId: "1:758196176997:web:f8f023b9c03fca2e489e8c",
  measurementId: "G-K6XJ908EXP"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Análisis de ejemplo para pacientes
const sampleAnalyses = [
  {
    id: 'analysis_001',
    analisis_IA: 'Análisis de ritmo cardíaco: Se detecta una frecuencia cardíaca ligeramente elevada (85 bpm) que puede indicar estrés o actividad física reciente. Se recomienda monitorear durante las próximas horas y considerar técnicas de relajación.',
    analizadoEn: '2024-01-15 14:30:00',
    severity: 'medium',
    category: 'cardiovascular'
  },
  {
    id: 'analysis_002',
    analisis_IA: 'Análisis de sudoración: Los niveles de GSR muestran una disminución del 15% comparado con el promedio semanal. Esto puede indicar mejor hidratación o reducción del estrés. Se recomienda mantener la ingesta de agua actual.',
    analizadoEn: '2024-01-14 10:15:00',
    severity: 'low',
    category: 'sudor'
  },
  {
    id: 'analysis_003',
    analisis_IA: 'Análisis de temperatura: La temperatura corporal se mantiene estable en 37.1°C, dentro del rango normal. No se detectan signos de fiebre o hipotermia. El patrón diurno es consistente con la actividad física.',
    analizadoEn: '2024-01-13 16:45:00',
    severity: 'low',
    category: 'temperatura'
  },
  {
    id: 'analysis_004',
    analisis_IA: 'Análisis general: El paciente muestra patrones saludables en todos los biomarcadores. Se recomienda mantener la rutina actual y continuar con el monitoreo regular. Los niveles de actividad física son apropiados.',
    analizadoEn: '2024-01-12 09:20:00',
    severity: 'low',
    category: 'general'
  },
  {
    id: 'analysis_005',
    analisis_IA: 'ALERTA: Se detectó un pico anormal en la frecuencia cardíaca (120 bpm) durante el período de descanso. Se recomienda evaluación médica inmediata y monitoreo continuo de los signos vitales.',
    analizadoEn: '2024-01-11 15:30:00',
    severity: 'high',
    category: 'cardiovascular'
  },
  {
    id: 'analysis_006',
    analisis_IA: 'Análisis de patrones de sueño: Los niveles de sudoración nocturna han disminuido significativamente, indicando mejor calidad del sueño. Se recomienda mantener la rutina actual de descanso y evitar estimulantes antes de dormir.',
    analizadoEn: '2024-01-10 11:45:00',
    severity: 'low',
    category: 'sudor'
  },
  {
    id: 'analysis_007',
    analisis_IA: 'Análisis de correlación: Se observa una correlación positiva entre la actividad física y la temperatura corporal. Los picos de temperatura coinciden con sesiones de ejercicio, lo cual es normal y saludable.',
    analizadoEn: '2024-01-09 13:20:00',
    severity: 'low',
    category: 'general'
  },
  {
    id: 'analysis_008',
    analisis_IA: 'Análisis de tendencias: Los últimos 7 días muestran una estabilidad general en todos los parámetros biométricos. El paciente mantiene un buen estado de salud con mejoras en la hidratación.',
    analizadoEn: '2024-01-08 08:15:00',
    severity: 'low',
    category: 'general'
  },
  {
    id: 'analysis_009',
    analisis_IA: 'Análisis de respuesta al ejercicio: La frecuencia cardíaca durante el ejercicio se mantiene dentro del rango objetivo (60-80% de la frecuencia máxima). Se recomienda continuar con la rutina de ejercicio actual.',
    analizadoEn: '2024-01-07 16:30:00',
    severity: 'low',
    category: 'cardiovascular'
  },
  {
    id: 'analysis_010',
    analisis_IA: 'Análisis de recuperación: Los niveles de sudoración post-ejercicio indican una buena recuperación. El tiempo de recuperación es apropiado para la intensidad del ejercicio realizado.',
    analizadoEn: '2024-01-06 12:00:00',
    severity: 'low',
    category: 'sudor'
  }
];

async function addSampleAnalyses() {
  console.log('🚀 Añadiendo análisis de ejemplo a los pacientes...\n');

  try {
    // 1. Obtener todos los pacientes
    console.log('1️⃣ Obteniendo lista de pacientes...');
    const patientsRef = ref(db, 'patients');
    const patientsSnapshot = await get(patientsRef);
    
    if (!patientsSnapshot.exists()) {
      console.log('❌ No hay pacientes en la base de datos');
      return;
    }

    const patients = patientsSnapshot.val();
    const patientIds = Object.keys(patients);
    
    console.log(`✅ Encontrados ${patientIds.length} pacientes`);

    // 2. Añadir análisis a cada paciente
    console.log('\n2️⃣ Añadiendo análisis...');
    let totalAnalysesAdded = 0;
    
    for (const patientId of patientIds) {
      console.log(`   📊 Procesando paciente ${patientId}...`);
      
      const analysesRef = ref(db, `patients/${patientId}/analyses`);
      
      // Verificar si ya tiene análisis
      const existingAnalysesSnapshot = await get(analysesRef);
      if (existingAnalysesSnapshot.exists()) {
        const existingAnalyses = existingAnalysesSnapshot.val();
        const existingAnalysesCount = Object.keys(existingAnalyses).length;
        console.log(`      ⚠️  Ya tiene ${existingAnalysesCount} análisis, saltando...`);
        continue;
      }
      
      // Añadir análisis
      for (const analysis of sampleAnalyses) {
        const newAnalysisRef = push(analysesRef);
        await set(newAnalysisRef, {
          ...analysis,
          patientId: patientId,
          analizadoEn: new Date(analysis.analizadoEn).toISOString()
        });
      }
      
      totalAnalysesAdded += sampleAnalyses.length;
      console.log(`      ✅ ${sampleAnalyses.length} análisis añadidos`);
    }

    console.log('\n✅ ¡Proceso completado!');
    console.log(`📊 Resumen:`);
    console.log(`   - ${patientIds.length} pacientes procesados`);
    console.log(`   - ${totalAnalysesAdded} análisis añadidos en total`);
    console.log(`   - ${sampleAnalyses.length} análisis por paciente`);

  } catch (error) {
    console.error('❌ Error añadiendo análisis:', error);
  }
}

// Función para añadir análisis a un paciente específico
async function addAnalysesToSpecificPatient(patientId) {
  console.log(`🚀 Añadiendo análisis al paciente ${patientId}...\n`);

  try {
    const analysesRef = ref(db, `patients/${patientId}/analyses`);
    
    // Verificar si ya tiene análisis
    const existingAnalysesSnapshot = await get(analysesRef);
    if (existingAnalysesSnapshot.exists()) {
      const existingAnalyses = existingAnalysesSnapshot.val();
      const existingAnalysesCount = Object.keys(existingAnalyses).length;
      console.log(`⚠️  El paciente ya tiene ${existingAnalysesCount} análisis`);
      
      // Preguntar si quiere sobrescribir
      console.log('¿Desea sobrescribir los análisis existentes? (s/n)');
      // En un entorno real, aquí se manejaría la entrada del usuario
      return;
    }
    
    // Añadir análisis
    for (const analysis of sampleAnalyses) {
      const newAnalysisRef = push(analysesRef);
      await set(newAnalysisRef, {
        ...analysis,
        patientId: patientId,
        analizadoEn: new Date(analysis.analizadoEn).toISOString()
      });
    }
    
    console.log(`✅ ${sampleAnalyses.length} análisis añadidos al paciente ${patientId}`);

  } catch (error) {
    console.error('❌ Error añadiendo análisis:', error);
  }
}

// Función principal
async function main() {
  console.log('🔧 Herramienta de análisis de ejemplo para Pulsoft\n');
  
  // Verificar argumentos de línea de comandos
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Si se proporciona un ID de paciente específico
    const patientId = args[0];
    console.log(`🎯 Añadiendo análisis al paciente específico: ${patientId}`);
    await addAnalysesToSpecificPatient(patientId);
  } else {
    // Añadir análisis a todos los pacientes
    await addSampleAnalyses();
  }
}

// Ejecutar el script
main().then(() => {
  console.log('\n🎉 Proceso completado');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error en el proceso:', error);
  process.exit(1);
});