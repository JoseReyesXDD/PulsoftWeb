// Script para vincular 2 pacientes a un cuidador
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get } from 'firebase/database';

// Configuración de Firebase de Pulsoft
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

// Configuración - REEMPLAZA CON LOS UIDs REALES DE TUS USUARIOS
const config = {
  caregiverUid: 'TU_CAREGIVER_UID', // Reemplaza con el UID del cuidador
  patient1Uid: 'TU_PATIENT1_UID',   // Reemplaza con el UID del primer paciente
  patient2Uid: 'TU_PATIENT2_UID'    // Reemplaza con el UID del segundo paciente
};

// Función para vincular pacientes al cuidador
async function linkPatientsToCaregiver() {
  try {
    console.log('🔗 Iniciando vinculación de pacientes al cuidador...');
    console.log('Cuidador:', config.caregiverUid);
    console.log('Paciente 1:', config.patient1Uid);
    console.log('Paciente 2:', config.patient2Uid);

    // Verificar que los UIDs no sean los valores por defecto
    if (config.caregiverUid === 'TU_CAREGIVER_UID' || 
        config.patient1Uid === 'TU_PATIENT1_UID' || 
        config.patient2Uid === 'TU_PATIENT2_UID') {
      console.error('❌ Error: Debes reemplazar los UIDs con los valores reales de tus usuarios');
      console.log('📝 Instrucciones:');
      console.log('1. Abre la consola del navegador en tu app (F12)');
      console.log('2. Ejecuta: console.log(auth.currentUser.uid)');
      console.log('3. Copia los UIDs y reemplázalos en este script');
      return;
    }

    // Datos del cuidador
    const caregiverData = {
      email: 'dr.rodriguez@ejemplo.com',
      name: 'Dr. Carlos Rodríguez',
      role: 'caregiver',
      linkedPatients: {
        [config.patient1Uid]: true,
        [config.patient2Uid]: true
      },
      createdAt: new Date().toISOString(),
      lastUpdate: new Date().toISOString()
    };

    // Escribir datos del cuidador
    const caregiverRef = ref(db, `caregivers/${config.caregiverUid}`);
    await set(caregiverRef, caregiverData);
    
    console.log('✅ Cuidador creado exitosamente');
    console.log('📊 Datos del cuidador:', caregiverData);

    // Verificar que los pacientes existan (opcional)
    console.log('\n🔍 Verificando que los pacientes existan...');
    
    const patient1Ref = ref(db, `patients/${config.patient1Uid}`);
    const patient1Snapshot = await get(patient1Ref);
    
    if (patient1Snapshot.exists()) {
      console.log('✅ Paciente 1 encontrado:', patient1Snapshot.val().email);
    } else {
      console.log('⚠️ Paciente 1 no encontrado - se creará automáticamente');
      // Crear datos básicos para el paciente 1
      const patient1Data = {
        email: 'maria.garcia@ejemplo.com',
        cardiovascular: 75,
        sudor: 45,
        temperatura: 37.2,
        lastUpdate: new Date().toISOString()
      };
      await set(patient1Ref, patient1Data);
      console.log('✅ Datos básicos creados para paciente 1');
    }

    const patient2Ref = ref(db, `patients/${config.patient2Uid}`);
    const patient2Snapshot = await get(patient2Ref);
    
    if (patient2Snapshot.exists()) {
      console.log('✅ Paciente 2 encontrado:', patient2Snapshot.val().email);
    } else {
      console.log('⚠️ Paciente 2 no encontrado - se creará automáticamente');
      // Crear datos básicos para el paciente 2
      const patient2Data = {
        email: 'juan.lopez@ejemplo.com',
        cardiovascular: 82,
        sudor: 38,
        temperatura: 36.8,
        lastUpdate: new Date().toISOString()
      };
      await set(patient2Ref, patient2Data);
      console.log('✅ Datos básicos creados para paciente 2');
    }

    // Verificar la vinculación
    console.log('\n🔍 Verificando vinculación...');
    const verificationRef = ref(db, `caregivers/${config.caregiverUid}`);
    const verificationSnapshot = await get(verificationRef);
    
    if (verificationSnapshot.exists()) {
      const data = verificationSnapshot.val();
      const linkedCount = Object.keys(data.linkedPatients || {}).length;
      console.log(`✅ Verificación exitosa: ${linkedCount} pacientes vinculados`);
      console.log('📋 Pacientes vinculados:', Object.keys(data.linkedPatients));
    }

    console.log('\n🎉 ¡Vinculación completada exitosamente!');
    console.log('\n📋 Resumen:');
    console.log(`- Cuidador: ${config.caregiverUid}`);
    console.log(`- Pacientes vinculados: ${config.patient1Uid}, ${config.patient2Uid}`);
    console.log('- Los pacientes aparecerán en el dashboard del cuidador');
    console.log('- El cuidador podrá ver las notas de ambos pacientes');

  } catch (error) {
    console.error('❌ Error vinculando pacientes:', error);
    console.error('Detalles del error:', error.message);
  }
}

// Función para obtener UIDs de usuarios (para debug)
async function getCurrentUserInfo() {
  try {
    console.log('🔍 Información para obtener UIDs:');
    console.log('1. Abre tu app en el navegador');
    console.log('2. Abre la consola (F12)');
    console.log('3. Ejecuta estos comandos:');
    console.log('');
    console.log('// Para obtener el UID del usuario actual:');
    console.log('console.log("UID actual:", auth.currentUser?.uid);');
    console.log('console.log("Email actual:", auth.currentUser?.email);');
    console.log('');
    console.log('// Para ver todos los usuarios autenticados:');
    console.log('auth.onAuthStateChanged((user) => {');
    console.log('  if (user) {');
    console.log('    console.log("Usuario:", user.uid, user.email);');
    console.log('  }');
    console.log('});');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Función para mostrar instrucciones
function showInstructions() {
  console.log('\n📋 INSTRUCCIONES PARA VINCULAR PACIENTES:');
  console.log('==========================================');
  console.log('');
  console.log('1. 🔍 Obtener los UIDs de tus usuarios:');
  console.log('   - Abre tu app en el navegador');
  console.log('   - Abre la consola (F12)');
  console.log('   - Ejecuta: console.log(auth.currentUser.uid)');
  console.log('   - Anota los UIDs del cuidador y los 2 pacientes');
  console.log('');
  console.log('2. ✏️ Editar este script:');
  console.log('   - Reemplaza TU_CAREGIVER_UID con el UID del cuidador');
  console.log('   - Reemplaza TU_PATIENT1_UID con el UID del primer paciente');
  console.log('   - Reemplaza TU_PATIENT2_UID con el UID del segundo paciente');
  console.log('');
  console.log('3. 🚀 Ejecutar el script:');
  console.log('   - node link_patients_to_caregiver.js');
  console.log('');
  console.log('4. ✅ Verificar en la app:');
  console.log('   - El cuidador verá 2 pacientes en su dashboard');
  console.log('   - Podrá acceder a las notas de ambos pacientes');
  console.log('');
}

// Ejecutar las funciones
async function main() {
  showInstructions();
  await linkPatientsToCaregiver();
}

main();