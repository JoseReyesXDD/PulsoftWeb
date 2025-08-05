// Script para añadir notas de ejemplo a los pacientes
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set, push, get } = require('firebase/database');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

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
const auth = getAuth(app);
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

// Datos biométricos de ejemplo para pacientes
const sampleBiometricData = {
  cardiovascular: 72,
  sudor: 38,
  temperatura: 37.2,
  lastUpdate: new Date().toISOString(),
  trends: {
    cardiovascular: [68, 70, 72, 71, 73, 72, 72],
    sudor: [42, 40, 38, 39, 37, 38, 38],
    temperatura: [37.1, 37.3, 37.2, 37.1, 37.4, 37.2, 37.2]
  }
};

async function addSampleData() {
  console.log('🚀 Iniciando adición de datos de ejemplo...\n');

  try {
    // 1. Verificar si hay usuarios existentes
    console.log('1️⃣ Verificando usuarios existentes...');
    const usersRef = ref(db, 'users');
    const usersSnapshot = await get(usersRef);
    
    let patientIds = [];
    
    if (usersSnapshot.exists()) {
      const users = usersSnapshot.val();
      patientIds = Object.keys(users).filter(uid => 
        users[uid] && users[uid].role === 'Paciente'
      );
      console.log(`✅ Encontrados ${patientIds.length} pacientes existentes`);
    } else {
      console.log('❌ No hay usuarios registrados');
      return;
    }

    if (patientIds.length === 0) {
      console.log('❌ No hay pacientes registrados');
      return;
    }

    // 2. Añadir datos biométricos a cada paciente
    console.log('\n2️⃣ Añadiendo datos biométricos...');
    for (const patientId of patientIds) {
      const patientDataRef = ref(db, `patients/${patientId}`);
      await set(patientDataRef, sampleBiometricData);
      console.log(`✅ Datos biométricos añadidos para paciente ${patientId}`);
    }

    // 3. Añadir notas a cada paciente
    console.log('\n3️⃣ Añadiendo notas de ejemplo...');
    for (const patientId of patientIds) {
      const notesRef = ref(db, `patients/${patientId}/notes`);
      
      for (const note of sampleNotes) {
        const newNoteRef = push(notesRef);
        await set(newNoteRef, {
          ...note,
          patientId: patientId,
          createdAt: new Date(note.createdAt).toISOString()
        });
      }
      
      console.log(`✅ ${sampleNotes.length} notas añadidas para paciente ${patientId}`);
    }

    // 4. Crear datos de ejemplo adicionales para cuidadores
    console.log('\n4️⃣ Añadiendo datos para cuidadores...');
    const caregiversRef = ref(db, 'users');
    const caregiversSnapshot = await get(caregiversRef);
    
    if (caregiversSnapshot.exists()) {
      const users = caregiversSnapshot.val();
      const caregiverIds = Object.keys(users).filter(uid => 
        users[uid] && users[uid].role === 'Cuidador'
      );
      
      for (const caregiverId of caregiverIds) {
        const caregiverDataRef = ref(db, `caregivers/${caregiverId}`);
        await set(caregiverDataRef, {
          assignedPatients: patientIds.slice(0, 2), // Asignar primeros 2 pacientes
          lastActivity: new Date().toISOString(),
          notifications: [
            {
              id: 'notif_001',
              message: 'Paciente Juan Pérez ha completado su sesión de ejercicio',
              timestamp: new Date().toISOString(),
              read: false
            },
            {
              id: 'notif_002',
              message: 'Nuevos datos biométricos disponibles para revisión',
              timestamp: new Date().toISOString(),
              read: false
            }
          ]
        });
        console.log(`✅ Datos de cuidador añadidos para ${caregiverId}`);
      }
    }

    console.log('\n✅ ¡Datos de ejemplo añadidos exitosamente!');
    console.log(`📊 Resumen:`);
    console.log(`   - ${patientIds.length} pacientes actualizados`);
    console.log(`   - ${sampleNotes.length} notas por paciente`);
    console.log(`   - Datos biométricos de ejemplo añadidos`);
    console.log(`   - Datos de cuidadores actualizados`);

  } catch (error) {
    console.error('❌ Error añadiendo datos de ejemplo:', error);
  }
}

// Función para crear un paciente de ejemplo si no existe ninguno
async function createSamplePatient() {
  console.log('👤 Creando paciente de ejemplo...');
  
  try {
    const samplePatient = {
      email: 'paciente@ejemplo.com',
      name: 'Juan Pérez',
      role: 'Paciente',
      createdAt: new Date().toISOString(),
      profile: {
        age: 45,
        gender: 'Masculino',
        medicalHistory: 'Sin antecedentes relevantes',
        emergencyContact: {
          name: 'María Pérez',
          phone: '+1234567890',
          relationship: 'Esposa'
        }
      }
    };

    const usersRef = ref(db, 'users');
    const newPatientRef = push(usersRef);
    await set(newPatientRef, samplePatient);
    
    const patientId = newPatientRef.key;
    console.log(`✅ Paciente de ejemplo creado con ID: ${patientId}`);
    
    return patientId;
  } catch (error) {
    console.error('❌ Error creando paciente de ejemplo:', error);
    return null;
  }
}

// Función principal
async function main() {
  console.log('🔧 Herramienta de datos de ejemplo para Pulsoft\n');
  
  // Verificar si hay pacientes existentes
  const usersRef = ref(db, 'users');
  const usersSnapshot = await get(usersRef);
  
  if (!usersSnapshot.exists()) {
    console.log('❌ No hay usuarios registrados. Creando paciente de ejemplo...');
    const patientId = await createSamplePatient();
    if (!patientId) {
      console.log('❌ No se pudo crear el paciente de ejemplo');
      return;
    }
  }
  
  // Añadir datos de ejemplo
  await addSampleData();
}

// Ejecutar el script
main().then(() => {
  console.log('\n🎉 Proceso completado');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error en el proceso:', error);
  process.exit(1);
});