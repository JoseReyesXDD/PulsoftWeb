// Script para vincular 2 pacientes a un cuidador - USAR EN CONSOLA DEL NAVEGADOR
// Copia y pega este código en la consola del navegador (F12)

// Configuración - REEMPLAZA CON LOS UIDs REALES
const config = {
  caregiverUid: 'TU_CAREGIVER_UID', // Reemplaza con el UID del cuidador
  patient1Uid: 'TU_PATIENT1_UID',   // Reemplaza con el UID del primer paciente
  patient2Uid: 'TU_PATIENT2_UID'    // Reemplaza con el UID del segundo paciente
};

// Función para vincular pacientes
async function linkPatientsToCaregiver() {
  try {
    console.log('🔗 Iniciando vinculación de pacientes...');
    
    // Verificar configuración
    if (config.caregiverUid === 'TU_CAREGIVER_UID') {
      console.error('❌ Error: Debes reemplazar los UIDs en la configuración');
      console.log('📝 Ejemplo de configuración:');
      console.log('const config = {');
      console.log('  caregiverUid: "abc123...",');
      console.log('  patient1Uid: "def456...",');
      console.log('  patient2Uid: "ghi789..."');
      console.log('};');
      return;
    }

    // Obtener Firebase desde la app
    const { getDatabase, ref, set, get } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js');
    const db = getDatabase();
    
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

    // Crear datos básicos para pacientes si no existen
    const patientsData = {
      [config.patient1Uid]: {
        email: 'maria.garcia@ejemplo.com',
        cardiovascular: 75,
        sudor: 45,
        temperatura: 37.2,
        lastUpdate: new Date().toISOString()
      },
      [config.patient2Uid]: {
        email: 'juan.lopez@ejemplo.com',
        cardiovascular: 82,
        sudor: 38,
        temperatura: 36.8,
        lastUpdate: new Date().toISOString()
      }
    };

    // Escribir datos de pacientes
    for (const [patientId, data] of Object.entries(patientsData)) {
      const patientRef = ref(db, `patients/${patientId}`);
      await set(patientRef, data);
      console.log(`✅ Datos creados para paciente: ${patientId}`);
    }

    // Verificar la vinculación
    const verificationRef = ref(db, `caregivers/${config.caregiverUid}`);
    const verificationSnapshot = await get(verificationRef);
    
    if (verificationSnapshot.exists()) {
      const data = verificationSnapshot.val();
      const linkedCount = Object.keys(data.linkedPatients || {}).length;
      console.log(`✅ Verificación exitosa: ${linkedCount} pacientes vinculados`);
      console.log('📋 Pacientes vinculados:', Object.keys(data.linkedPatients));
    }

    console.log('\n🎉 ¡Vinculación completada!');
    console.log('📋 Resumen:');
    console.log(`- Cuidador: ${config.caregiverUid}`);
    console.log(`- Pacientes: ${config.patient1Uid}, ${config.patient2Uid}`);
    console.log('- Los pacientes aparecerán en el dashboard del cuidador');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Función para obtener UID del usuario actual
function getCurrentUserUID() {
  // Intentar obtener desde la app
  if (typeof auth !== 'undefined' && auth.currentUser) {
    console.log('👤 Usuario actual:');
    console.log('UID:', auth.currentUser.uid);
    console.log('Email:', auth.currentUser.email);
    return auth.currentUser.uid;
  } else {
    console.log('⚠️ No se pudo obtener el usuario actual');
    console.log('💡 Asegúrate de estar logueado en la app');
    return null;
  }
}

// Función para mostrar ayuda
function showHelp() {
  console.log('\n📋 AYUDA PARA VINCULAR PACIENTES:');
  console.log('==================================');
  console.log('');
  console.log('1. 🔍 Obtener UIDs:');
  console.log('   - Ejecuta: getCurrentUserUID()');
  console.log('   - Anota los UIDs del cuidador y los 2 pacientes');
  console.log('');
  console.log('2. ✏️ Configurar:');
  console.log('   - Edita la variable "config" arriba');
  console.log('   - Reemplaza los UIDs con los valores reales');
  console.log('');
  console.log('3. 🚀 Ejecutar:');
  console.log('   - Ejecuta: linkPatientsToCaregiver()');
  console.log('');
  console.log('4. ✅ Verificar:');
  console.log('   - Ve al dashboard del cuidador');
  console.log('   - Deberías ver 2 pacientes vinculados');
  console.log('');
}

// Mostrar ayuda al cargar
showHelp();

// Exportar funciones para uso en consola
window.linkPatientsToCaregiver = linkPatientsToCaregiver;
window.getCurrentUserUID = getCurrentUserUID;
window.showHelp = showHelp;

console.log('✅ Script cargado. Usa:');
console.log('- getCurrentUserUID() para obtener el UID actual');
console.log('- linkPatientsToCaregiver() para vincular pacientes');
console.log('- showHelp() para ver las instrucciones');