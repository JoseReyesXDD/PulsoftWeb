// Script de debug para obtener UID del cuidador
// Copia y pega este código en la consola de tu app (F12)

console.log('🔍 Debug de autenticación...');

// Función para verificar el estado de autenticación
function debugAuth() {
    console.log('=== DEBUG DE AUTENTICACIÓN ===');
    
    // Verificar si Firebase está disponible
    console.log('1. Verificando Firebase...');
    if (typeof firebase !== 'undefined') {
        console.log('✅ Firebase está disponible');
        console.log('Firebase version:', firebase.SDK_VERSION);
    } else {
        console.log('❌ Firebase no está disponible globalmente');
    }
    
    // Verificar si auth está disponible
    console.log('\n2. Verificando auth...');
    if (typeof auth !== 'undefined') {
        console.log('✅ Variable auth está disponible');
        console.log('Auth object:', auth);
        
        if (auth.currentUser) {
            console.log('✅ Usuario autenticado encontrado');
            console.log('UID:', auth.currentUser.uid);
            console.log('Email:', auth.currentUser.email);
        } else {
            console.log('❌ No hay usuario autenticado en auth.currentUser');
        }
    } else {
        console.log('❌ Variable auth no está disponible');
    }
    
    // Intentar obtener auth desde diferentes fuentes
    console.log('\n3. Intentando obtener auth desde diferentes fuentes...');
    
    // Método 1: Desde firebase.auth()
    try {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            const firebaseAuth = firebase.auth();
            const user = firebaseAuth.currentUser;
            if (user) {
                console.log('✅ Usuario encontrado via firebase.auth():');
                console.log('UID:', user.uid);
                console.log('Email:', user.email);
            } else {
                console.log('❌ No hay usuario en firebase.auth()');
            }
        }
    } catch (error) {
        console.log('❌ Error con firebase.auth():', error.message);
    }
    
    // Método 2: Desde getAuth()
    try {
        if (typeof getAuth !== 'undefined') {
            const authInstance = getAuth();
            const user = authInstance.currentUser;
            if (user) {
                console.log('✅ Usuario encontrado via getAuth():');
                console.log('UID:', user.uid);
                console.log('Email:', user.email);
            } else {
                console.log('❌ No hay usuario en getAuth()');
            }
        }
    } catch (error) {
        console.log('❌ Error con getAuth():', error.message);
    }
    
    // Método 3: Buscar en el contexto global
    console.log('\n4. Buscando auth en el contexto global...');
    const globalVars = Object.keys(window).filter(key => 
        key.toLowerCase().includes('auth') || 
        key.toLowerCase().includes('firebase') ||
        key.toLowerCase().includes('user')
    );
    console.log('Variables globales relacionadas:', globalVars);
    
    // Verificar si hay algún listener de auth
    console.log('\n5. Verificando listeners de auth...');
    if (typeof auth !== 'undefined' && auth.onAuthStateChanged) {
        console.log('✅ auth.onAuthStateChanged está disponible');
        auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('🎉 Usuario detectado via onAuthStateChanged:');
                console.log('UID:', user.uid);
                console.log('Email:', user.email);
            } else {
                console.log('❌ No hay usuario (onAuthStateChanged)');
            }
        });
    }
}

// Función para obtener UID usando diferentes métodos
async function getUIDMultipleMethods() {
    console.log('\n=== OBTENIENDO UID CON MÚLTIPLES MÉTODOS ===');
    
    const methods = [
        {
            name: 'auth.currentUser',
            func: () => {
                if (typeof auth !== 'undefined' && auth.currentUser) {
                    return auth.currentUser.uid;
                }
                return null;
            }
        },
        {
            name: 'firebase.auth().currentUser',
            func: () => {
                if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
                    return firebase.auth().currentUser.uid;
                }
                return null;
            }
        },
        {
            name: 'getAuth().currentUser',
            func: () => {
                if (typeof getAuth !== 'undefined') {
                    const authInstance = getAuth();
                    if (authInstance.currentUser) {
                        return authInstance.currentUser.uid;
                    }
                }
                return null;
            }
        }
    ];
    
    for (const method of methods) {
        try {
            const uid = method.func();
            if (uid) {
                console.log(`✅ ${method.name}: ${uid}`);
                return uid;
            } else {
                console.log(`❌ ${method.name}: No disponible`);
            }
        } catch (error) {
            console.log(`❌ ${method.name}: Error - ${error.message}`);
        }
    }
    
    return null;
}

// Función para verificar si estás en la página correcta
function checkPageContext() {
    console.log('\n=== VERIFICANDO CONTEXTO DE PÁGINA ===');
    console.log('URL actual:', window.location.href);
    console.log('Título de la página:', document.title);
    
    // Verificar si estás en la app de Pulsoft
    if (window.location.href.includes('pulsoft') || 
        document.title.toLowerCase().includes('pulsoft')) {
        console.log('✅ Parece que estás en la app de Pulsoft');
    } else {
        console.log('⚠️ No parece estar en la app de Pulsoft');
        console.log('💡 Asegúrate de estar en tu app y logueado');
    }
}

// Función para mostrar instrucciones
function showInstructions() {
    console.log('\n=== INSTRUCCIONES ===');
    console.log('1. Asegúrate de estar en tu app de Pulsoft');
    console.log('2. Inicia sesión como cuidador');
    console.log('3. Ve al dashboard del cuidador');
    console.log('4. Abre la consola (F12)');
    console.log('5. Ejecuta: debugAuth()');
    console.log('6. Si hay usuario, ejecuta: getUIDMultipleMethods()');
}

// Ejecutar debug automáticamente
debugAuth();
checkPageContext();

// Mostrar comandos disponibles
console.log('\n📋 Comandos disponibles:');
console.log('- debugAuth() - Debug completo de autenticación');
console.log('- getUIDMultipleMethods() - Obtener UID con múltiples métodos');
console.log('- checkPageContext() - Verificar contexto de página');
console.log('- showInstructions() - Mostrar instrucciones');

// Verificar si hay usuario después de un delay
setTimeout(() => {
    console.log('\n🔄 Verificando usuario después de 2 segundos...');
    if (typeof auth !== 'undefined' && auth.currentUser) {
        console.log('✅ Usuario encontrado:', auth.currentUser.uid);
    } else {
        console.log('❌ Aún no hay usuario autenticado');
        showInstructions();
    }
}, 2000);