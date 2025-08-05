// Script para obtener el UID del cuidador
// Copia y pega este código en la consola de tu app (F12)

console.log('🔍 Obteniendo UID del cuidador...');

// Función para obtener el UID del usuario actual
function getCaregiverUID() {
    try {
        // Intentar obtener desde Firebase Auth
        if (typeof auth !== 'undefined' && auth.currentUser) {
            const uid = auth.currentUser.uid;
            const email = auth.currentUser.email;
            
            console.log('✅ UID del cuidador encontrado:');
            console.log('UID:', uid);
            console.log('Email:', email);
            
            // Copiar al portapapeles
            navigator.clipboard.writeText(uid).then(() => {
                console.log('📋 UID copiado al portapapeles');
            }).catch(() => {
                console.log('⚠️ No se pudo copiar al portapapeles');
            });
            
            return uid;
        } else {
            console.log('❌ No hay usuario autenticado');
            console.log('💡 Asegúrate de estar logueado como cuidador');
            return null;
        }
    } catch (error) {
        console.error('❌ Error obteniendo UID:', error);
        return null;
    }
}

// Función para mostrar información detallada del usuario
function showUserInfo() {
    try {
        if (typeof auth !== 'undefined' && auth.currentUser) {
            const user = auth.currentUser;
            console.log('👤 Información del usuario:');
            console.log('UID:', user.uid);
            console.log('Email:', user.email);
            console.log('Email verificado:', user.emailVerified);
            console.log('Proveedor:', user.providerData[0]?.providerId);
            console.log('Fecha de creación:', new Date(user.metadata.creationTime));
            console.log('Último login:', new Date(user.metadata.lastSignInTime));
        } else {
            console.log('❌ No hay usuario autenticado');
        }
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Función para verificar si el usuario es cuidador
async function checkIfCaregiver() {
    try {
        if (typeof auth !== 'undefined' && auth.currentUser) {
            const user = auth.currentUser;
            console.log('🔍 Verificando si el usuario es cuidador...');
            console.log('Email:', user.email);
            
            // Verificar en la base de datos si es cuidador
            const { getDatabase, ref, get } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js');
            const db = getDatabase();
            const caregiverRef = ref(db, `caregivers/${user.uid}`);
            const snapshot = await get(caregiverRef);
            
            if (snapshot.exists()) {
                const data = snapshot.val();
                console.log('✅ Usuario es cuidador');
                console.log('Nombre:', data.name);
                console.log('Pacientes vinculados:', Object.keys(data.linkedPatients || {}));
            } else {
                console.log('⚠️ Usuario no está registrado como cuidador en la base de datos');
                console.log('💡 Puede ser un paciente o un usuario nuevo');
            }
        } else {
            console.log('❌ No hay usuario autenticado');
        }
    } catch (error) {
        console.error('❌ Error verificando cuidador:', error);
    }
}

// Ejecutar automáticamente
const uid = getCaregiverUID();

// Mostrar comandos disponibles
console.log('\n📋 Comandos disponibles:');
console.log('- getCaregiverUID() - Obtener UID del cuidador');
console.log('- showUserInfo() - Mostrar información detallada del usuario');
console.log('- checkIfCaregiver() - Verificar si el usuario es cuidador');

// Si se obtuvo el UID, mostrar información adicional
if (uid) {
    console.log('\n💡 UID obtenido:', uid);
    console.log('💡 Usa este UID para vincular pacientes al cuidador');
}