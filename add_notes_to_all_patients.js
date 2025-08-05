// Script para añadir notas a todos los pacientes existentes
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

// Notas de ejemplo para pacientes
const sampleNotes = [
  {
    id: 'note_001',
    content: 'Análisis de ritmo cardíaco: Se observa una frecuencia cardíaca estable de 72 BPM dentro del rango normal (60-100 BPM). No se detectan anomalías significativas en el patrón cardíaco.',
    createdAt: '2024-01-15 14:30:00',
    type: 'analysis',
    category: 'cardiovascular',
    priority: 'normal'
  },
  {
    id: 'note_002',
    content: 'Recomendación: Mantener actividad física moderada y seguir una dieta equilibrada. Realizar ejercicio cardiovascular 3 veces por semana durante 30 minutos. Incluir ejercicios de respiración profunda.',
    createdAt: '2024-01-14 10:15:00',
    type: 'recommendation',
    category: 'general',
    priority: 'medium'
  },
  {
    id: 'note_003',
    content: 'Observación: Los niveles de sudoración han disminuido ligeramente de 45% a 38%. Esto puede indicar una mejor hidratación o cambios en la actividad física. Monitorear tendencias.',
    createdAt: '2024-01-13 16:45:00',
    type: 'observation',
    category: 'sudor',
    priority: 'low'
  },
  {
    id: 'note_004',
    content: 'Análisis de temperatura: La temperatura corporal se mantiene estable en 37.2°C, lo cual es normal. No se detectan signos de fiebre o hipotermia. Patrón diurno normal.',
    createdAt: '2024-01-12 09:20:00',
    type: 'analysis',
    category: 'temperatura',
    priority: 'normal'
  },
  {
    id: 'note_005',
    content: 'Alerta: Se detectó un pico en la frecuencia cardíaca durante el ejercicio (140 BPM). Esto es normal para la actividad realizada, pero se recomienda monitoreo continuo.',
    createdAt: '2024-01-11 15:30:00',
    type: 'observation',
    category: 'cardiovascular',
    priority: 'medium'
  },
  {
    id: 'note_006',
    content: 'Recomendación nutricional: Aumentar la ingesta de agua a 2.5 litros diarios. Incluir alimentos ricos en potasio como plátanos y aguacates para mantener el equilibrio electrolítico.',
    createdAt: '2024-01-10 11:45:00',
    type: 'recommendation',
    category: 'nutricion',
    priority: 'medium'
  },
  {
    id: 'note_007',
    content: 'Análisis de patrones: Se observa una correlación positiva entre la actividad física y la temperatura corporal. Los picos de temperatura coinciden con sesiones de ejercicio.',
    createdAt: '2024-01-09 13:20:00',
    type: 'analysis',
    category: 'general',
    priority: 'normal'
  },
  {
    id: 'note_008',
    content: 'Observación de sueño: Los niveles de sudoración nocturna han disminuido, indicando mejor calidad del sueño. Se recomienda mantener la rutina actual de descanso.',
    createdAt: '2024-01-08 08:15:00',
    type: 'observation',
    category: 'sueño',
    priority: 'low'
  },
  {
    id: 'note_009',
    content: 'Recomendación de ejercicio: Implementar ejercicios de resistencia 2 veces por semana para mejorar la salud cardiovascular. Incluir ejercicios de flexibilidad.',
    createdAt: '2024-01-07 16:30:00',
    type: 'recommendation',
    category: 'ejercicio',
    priority: 'high'
  },
  {
    id: 'note_010',
    content: 'Análisis de tendencias: Los últimos 7 días muestran una estabilidad general en todos los parámetros biométricos. El paciente mantiene un buen estado de salud.',
    createdAt: '2024-01-06 12:00:00',
    type: 'analysis',
    category: 'general',
    priority: 'normal'
  }
];

async function addNotesToAllPatients() {
  console.log('🚀 Añadiendo notas a todos los pacientes...\n');

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

    // 2. Añadir notas a cada paciente
    console.log('\n2️⃣ Añadiendo notas...');
    let totalNotesAdded = 0;
    
    for (const patientId of patientIds) {
      console.log(`   📝 Procesando paciente ${patientId}...`);
      
      const notesRef = ref(db, `patients/${patientId}/notes`);
      
      // Verificar si ya tiene notas
      const existingNotesSnapshot = await get(notesRef);
      if (existingNotesSnapshot.exists()) {
        const existingNotes = existingNotesSnapshot.val();
        const existingNotesCount = Object.keys(existingNotes).length;
        console.log(`      ⚠️  Ya tiene ${existingNotesCount} notas, saltando...`);
        continue;
      }
      
      // Añadir notas
      for (const note of sampleNotes) {
        const newNoteRef = push(notesRef);
        await set(newNoteRef, {
          ...note,
          patientId: patientId,
          createdAt: new Date(note.createdAt).toISOString()
        });
      }
      
      totalNotesAdded += sampleNotes.length;
      console.log(`      ✅ ${sampleNotes.length} notas añadidas`);
    }

    console.log('\n✅ ¡Proceso completado!');
    console.log(`📊 Resumen:`);
    console.log(`   - ${patientIds.length} pacientes procesados`);
    console.log(`   - ${totalNotesAdded} notas añadidas en total`);
    console.log(`   - ${sampleNotes.length} notas por paciente`);

  } catch (error) {
    console.error('❌ Error añadiendo notas:', error);
  }
}

// Ejecutar el script
addNotesToAllPatients().then(() => {
  console.log('\n🎉 Proceso completado');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error en el proceso:', error);
  process.exit(1);
});