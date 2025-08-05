// Script de prueba para verificar la conexión a Firebase
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, onValue } = require('firebase/database');
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

async function testFirebaseConnection() {
  console.log('🔍 Iniciando pruebas de conexión a Firebase...\n');

  try {
    // 1. Verificar conexión a la base de datos
    console.log('1️⃣ Probando conexión a Realtime Database...');
    const testRef = ref(db, 'test');
    const snapshot = await get(testRef);
    console.log('✅ Conexión a Realtime Database exitosa');

    // 2. Verificar estructura de datos
    console.log('\n2️⃣ Verificando estructura de datos...');
    
    // Verificar si existe la colección 'patients'
    const patientsRef = ref(db, 'patients');
    const patientsSnapshot = await get(patientsRef);
    
    if (patientsSnapshot.exists()) {
      console.log('✅ Colección "patients" existe');
      console.log('📊 Datos en patients:', patientsSnapshot.val());
    } else {
      console.log('❌ Colección "patients" no existe o está vacía');
    }

    // Verificar si existe la colección 'users'
    const usersRef = ref(db, 'users');
    const usersSnapshot = await get(usersRef);
    
    if (usersSnapshot.exists()) {
      console.log('✅ Colección "users" existe');
      console.log('📊 Datos en users:', usersSnapshot.val());
    } else {
      console.log('❌ Colección "users" no existe o está vacía');
    }

    // 3. Listar todos los nodos en la raíz
    console.log('\n3️⃣ Explorando estructura completa de la base de datos...');
    const rootRef = ref(db, '/');
    const rootSnapshot = await get(rootRef);
    
    if (rootSnapshot.exists()) {
      console.log('📋 Estructura completa de la base de datos:');
      console.log(JSON.stringify(rootSnapshot.val(), null, 2));
    } else {
      console.log('❌ La base de datos está completamente vacía');
    }

    // 4. Probar autenticación (opcional)
    console.log('\n4️⃣ Probando autenticación...');
    console.log('⚠️  Para probar autenticación, necesitas credenciales válidas');
    console.log('💡 Puedes usar: node test_firebase_connection.js <email> <password>');

    if (process.argv.length >= 4) {
      const email = process.argv[2];
      const password = process.argv[3];
      
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('✅ Autenticación exitosa');
        console.log('👤 Usuario:', userCredential.user.email);
        console.log('🆔 UID:', userCredential.user.uid);
        
        // Verificar datos específicos del usuario
        const userDataRef = ref(db, `patients/${userCredential.user.uid}`);
        const userDataSnapshot = await get(userDataRef);
        
        if (userDataSnapshot.exists()) {
          console.log('✅ Datos del paciente encontrados:');
          console.log(JSON.stringify(userDataSnapshot.val(), null, 2));
        } else {
          console.log('❌ No se encontraron datos para este paciente');
        }
        
      } catch (authError) {
        console.log('❌ Error de autenticación:', authError.message);
      }
    }

  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  }
}

// Función para escuchar cambios en tiempo real
function listenToPatientData(patientId) {
  console.log(`\n5️⃣ Escuchando cambios en tiempo real para paciente: ${patientId}`);
  
  const patientRef = ref(db, `patients/${patientId}`);
  const unsubscribe = onValue(patientRef, (snapshot) => {
    console.log('📡 Datos actualizados en tiempo real:');
    if (snapshot.exists()) {
      console.log(JSON.stringify(snapshot.val(), null, 2));
    } else {
      console.log('❌ No hay datos para este paciente');
    }
  }, (error) => {
    console.error('❌ Error escuchando datos:', error);
  });

  // Detener la escucha después de 10 segundos
  setTimeout(() => {
    console.log('⏰ Deteniendo escucha en tiempo real...');
    unsubscribe();
  }, 10000);
}

// Ejecutar pruebas
testFirebaseConnection().then(() => {
  console.log('\n✅ Pruebas completadas');
  
  // Si se proporcionó un UID, escuchar cambios en tiempo real
  if (process.argv.length >= 5) {
    const patientId = process.argv[4];
    listenToPatientData(patientId);
  }
}).catch(error => {
  console.error('❌ Error ejecutando pruebas:', error);
});