// Script para verificar que los datos de ejemplo se añadieron correctamente
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');

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

async function verifyData() {
  console.log('🔍 Verificando datos en Firebase...\n');

  try {
    // 1. Verificar usuarios
    console.log('1️⃣ Verificando usuarios...');
    const usersRef = ref(db, 'users');
    const usersSnapshot = await get(usersRef);
    
    if (usersSnapshot.exists()) {
      const users = usersSnapshot.val();
      const patientIds = Object.keys(users).filter(uid => 
        users[uid] && users[uid].role === 'Paciente'
      );
      
      console.log(`✅ Encontrados ${patientIds.length} pacientes`);
      
      for (const patientId of patientIds) {
        const user = users[patientId];
        console.log(`   👤 Paciente: ${user.name || user.email} (${patientId})`);
      }
    } else {
      console.log('❌ No hay usuarios registrados');
      return;
    }

    // 2. Verificar datos biométricos
    console.log('\n2️⃣ Verificando datos biométricos...');
    const patientsRef = ref(db, 'patients');
    const patientsSnapshot = await get(patientsRef);
    
    if (patientsSnapshot.exists()) {
      const patients = patientsSnapshot.val();
      const patientIds = Object.keys(patients);
      
      console.log(`✅ Encontrados datos para ${patientIds.length} pacientes`);
      
      for (const patientId of patientIds) {
        const patientData = patients[patientId];
        console.log(`   📊 Paciente ${patientId}:`);
        console.log(`      - Cardiovascular: ${patientData.cardiovascular}`);
        console.log(`      - Sudor: ${patientData.sudor}`);
        console.log(`      - Temperatura: ${patientData.temperatura}°C`);
        console.log(`      - Última actualización: ${patientData.lastUpdate}`);
      }
    } else {
      console.log('❌ No hay datos biométricos');
    }

    // 3. Verificar notas
    console.log('\n3️⃣ Verificando notas...');
    const patientsNotesRef = ref(db, 'patients');
    const patientsNotesSnapshot = await get(patientsNotesRef);
    
    if (patientsNotesSnapshot.exists()) {
      const patients = patientsNotesSnapshot.val();
      const patientIds = Object.keys(patients);
      
      let totalNotes = 0;
      
      for (const patientId of patientIds) {
        const patientData = patients[patientId];
        if (patientData.notes) {
          const notesCount = Object.keys(patientData.notes).length;
          totalNotes += notesCount;
          console.log(`   📝 Paciente ${patientId}: ${notesCount} notas`);
          
          // Mostrar algunas notas de ejemplo
          const notes = patientData.notes;
          const noteKeys = Object.keys(notes);
          if (noteKeys.length > 0) {
            const firstNote = notes[noteKeys[0]];
            console.log(`      Ejemplo: "${firstNote.content.substring(0, 50)}..."`);
            console.log(`      Tipo: ${firstNote.type}, Categoría: ${firstNote.category}`);
          }
        } else {
          console.log(`   📝 Paciente ${patientId}: 0 notas`);
        }
      }
      
      console.log(`✅ Total de notas: ${totalNotes}`);
    } else {
      console.log('❌ No hay datos de pacientes');
    }

    // 4. Verificar cuidadores
    console.log('\n4️⃣ Verificando cuidadores...');
    const caregiversRef = ref(db, 'caregivers');
    const caregiversSnapshot = await get(caregiversRef);
    
    if (caregiversSnapshot.exists()) {
      const caregivers = caregiversSnapshot.val();
      const caregiverIds = Object.keys(caregivers);
      
      console.log(`✅ Encontrados ${caregiverIds.length} cuidadores`);
      
      for (const caregiverId of caregiverIds) {
        const caregiverData = caregivers[caregiverId];
        console.log(`   👨‍⚕️ Cuidador ${caregiverId}:`);
        console.log(`      - Pacientes asignados: ${caregiverData.assignedPatients?.length || 0}`);
        console.log(`      - Notificaciones: ${caregiverData.notifications?.length || 0}`);
      }
    } else {
      console.log('❌ No hay datos de cuidadores');
    }

    // 5. Verificar estructura completa
    console.log('\n5️⃣ Estructura completa de la base de datos:');
    const rootRef = ref(db, '/');
    const rootSnapshot = await get(rootRef);
    
    if (rootSnapshot.exists()) {
      const data = rootSnapshot.val();
      console.log('📋 Nodos principales:');
      Object.keys(data).forEach(key => {
        const nodeData = data[key];
        if (typeof nodeData === 'object') {
          const count = Object.keys(nodeData).length;
          console.log(`   - ${key}: ${count} elementos`);
        } else {
          console.log(`   - ${key}: ${nodeData}`);
        }
      });
    }

    console.log('\n✅ Verificación completada exitosamente');
    console.log('\n💡 Para probar la aplicación:');
    console.log('   1. Inicia sesión con un paciente existente');
    console.log('   2. Ve al dashboard del paciente');
    console.log('   3. Verifica que los datos biométricos se muestren');
    console.log('   4. Ve a "Mis notas" para ver las notas de ejemplo');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  }
}

// Ejecutar verificación
verifyData().then(() => {
  console.log('\n🎉 Verificación completada');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error en la verificación:', error);
  process.exit(1);
});