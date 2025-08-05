# Funcionalidad de Vincular Pacientes al Cuidador

## Descripción General

Esta funcionalidad permite a los cuidadores vincular y desvincular pacientes a su cuenta, gestionando las relaciones cuidador-paciente de manera eficiente y segura.

## Características Implementadas

### ✅ **API Endpoints**

1. **POST `/api/link-patient/`** - Vincular paciente
2. **DELETE `/api/unlink-patient/`** - Desvincular paciente  
3. **GET `/api/available-patients/`** - Obtener pacientes disponibles
4. **GET `/api/caregiver-patients/`** - Obtener pacientes vinculados

### ✅ **Interfaz Web**

1. **`manage_patient_links.html`** - Gestión completa de vínculos
2. **Vistas AJAX** - Operaciones asíncronas
3. **Búsqueda en tiempo real** - Filtrado de pacientes
4. **Estadísticas** - Contadores de pacientes

### ✅ **Aplicación Móvil**

1. **`manage-patient-links.tsx`** - Pantalla React Native
2. **Servicios TypeScript** - Llamadas a API
3. **Estados de carga** - Indicadores visuales
4. **Confirmaciones** - Alertas de seguridad

## Estructura de Datos

### Modelo Django
```python
class CaregiverPatientLink(models.Model):
    caregiver = models.ForeignKey(FirebaseUser, on_delete=models.CASCADE, related_name='cuidados')
    patient = models.ForeignKey(FirebaseUser, on_delete=models.CASCADE, related_name='cuidadores')
    linked_at = models.DateTimeField(auto_now_add=True)
```

### Firestore
```javascript
// Colección: caregiverPatientLinks
{
  caregiverUid: "uid_del_cuidador",
  patientUid: "uid_del_paciente", 
  linkedAt: "2024-01-15T10:30:00Z",
  caregiverEmail: "cuidador@email.com",
  patientEmail: "paciente@email.com"
}
```

## Endpoints API Detallados

### 1. Vincular Paciente
```http
POST /api/link-patient/
Content-Type: application/json
Authorization: Bearer <token>

{
  "caregiver_uid": "uid_del_cuidador",
  "patient_uid": "uid_del_paciente"
}
```

**Respuesta exitosa:**
```json
{
  "message": "Paciente vinculado exitosamente",
  "caregiver_uid": "uid_del_cuidador",
  "patient_uid": "uid_del_paciente",
  "linked_at": "2024-01-15T10:30:00Z"
}
```

### 2. Desvincular Paciente
```http
DELETE /api/unlink-patient/?caregiver_uid=<uid>&patient_uid=<uid>
Authorization: Bearer <token>
```

**Respuesta exitosa:**
```json
{
  "message": "Paciente desvinculado exitosamente",
  "caregiver_uid": "uid_del_cuidador",
  "patient_uid": "uid_del_paciente"
}
```

### 3. Pacientes Disponibles
```http
GET /api/available-patients/?caregiver_uid=<uid>
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "caregiver_uid": "uid_del_cuidador",
  "available_patients": [
    {
      "uid": "uid_del_paciente",
      "email": "paciente@email.com",
      "user_type": "patient"
    }
  ],
  "total_available": 1
}
```

## Flujo de Usuario

### 1. **Acceso a la Gestión**
- Cuidador inicia sesión
- Navega a "Gestionar Pacientes" desde el dashboard
- Ve estadísticas de pacientes vinculados y disponibles

### 2. **Vincular Paciente**
- Ve lista de pacientes disponibles
- Busca paciente por email (filtrado en tiempo real)
- Hace clic en "Vincular"
- Confirma la acción
- Sistema crea vínculo en Django y Firestore
- Lista se actualiza automáticamente

### 3. **Desvincular Paciente**
- Ve lista de pacientes vinculados
- Hace clic en "Desvincular"
- Confirma la acción
- Sistema elimina vínculo de ambas bases de datos
- Lista se actualiza automáticamente

### 4. **Verificación de Permisos**
- Sistema verifica que el usuario sea cuidador
- Valida que el paciente exista
- Comprueba que no exista vínculo duplicado
- Maneja errores de forma elegante

## Características de Seguridad

### ✅ **Validaciones**
- Verificación de tipo de usuario (caregiver)
- Existencia de paciente y cuidador
- Prevención de vínculos duplicados
- Validación de tokens de autenticación

### ✅ **Sincronización**
- Vínculos se crean/eliminan en Django y Firestore
- Rollback automático si falla una base de datos
- Consistencia de datos garantizada

### ✅ **Manejo de Errores**
- Respuestas HTTP apropiadas
- Mensajes de error descriptivos
- Logging detallado para debugging
- Fallback a datos mock en desarrollo

## Interfaz de Usuario

### Web (Django)
- **Diseño responsivo** con CSS moderno
- **Búsqueda en tiempo real** con JavaScript
- **Alertas dinámicas** para feedback
- **Estadísticas visuales** con contadores
- **Confirmaciones** antes de acciones críticas

### Móvil (React Native)
- **Navegación intuitiva** con Expo Router
- **Estados de carga** con ActivityIndicator
- **Pull-to-refresh** para actualizar datos
- **Alertas nativas** para confirmaciones
- **Búsqueda integrada** en TextInput

## Servicios TypeScript

### CaregiverService
```typescript
// Vincular paciente
async linkPatient(caregiverUid: string, patientUid: string): Promise<ApiResponse<any>>

// Desvincular paciente  
async unlinkPatient(caregiverUid: string, patientUid: string): Promise<ApiResponse<any>>

// Obtener pacientes disponibles
async getAvailablePatients(caregiverUid: string): Promise<ApiResponse<any>>
```

### Manejo de Estados
```typescript
// Estados de carga
const [linkingPatient, setLinkingPatient] = useState<string | null>(null);
const [unlinkingPatient, setUnlinkingPatient] = useState<string | null>(null);

// Filtrado de búsqueda
const filteredAvailablePatients = availablePatients.filter(patient =>
  patient.email.toLowerCase().includes(searchTerm.toLowerCase())
);
```

## Casos de Uso

### 1. **Cuidador Nuevo**
- Inicia sesión por primera vez
- Ve que no tiene pacientes vinculados
- Busca pacientes disponibles
- Vincula pacientes uno por uno

### 2. **Gestión de Pacientes**
- Cuidador experimentado
- Ve lista de pacientes vinculados
- Desvincula pacientes que ya no atiende
- Vincula nuevos pacientes

### 3. **Búsqueda Eficiente**
- Cuidador con muchos pacientes
- Usa búsqueda para encontrar pacientes específicos
- Filtra por email o ID
- Gestiona vínculos de forma rápida

### 4. **Verificación de Permisos**
- Sistema verifica que solo cuidadores puedan gestionar
- Valida que los pacientes existan
- Previene vínculos duplicados
- Maneja errores de permisos

## Mejoras Futuras

### 1. **Notificaciones**
- Email al paciente cuando se vincula/desvincula
- Notificaciones push en la app móvil
- Historial de cambios de vínculos

### 2. **Filtros Avanzados**
- Filtrar por fecha de registro
- Filtrar por tipo de paciente
- Ordenar por nombre, email, fecha

### 3. **Bulk Operations**
- Vincular múltiples pacientes a la vez
- Desvincular múltiples pacientes
- Importar/exportar listas de pacientes

### 4. **Analytics**
- Estadísticas de vínculos por período
- Tendencias de vinculación/desvinculación
- Reportes de actividad del cuidador

## Troubleshooting

### Problemas Comunes

1. **Error 409 - Vínculo duplicado**
   - El paciente ya está vinculado al cuidador
   - Verificar en la lista de pacientes vinculados

2. **Error 404 - Paciente no encontrado**
   - El UID del paciente no existe en la base de datos
   - Verificar que el paciente esté registrado

3. **Error 403 - Sin permisos**
   - El usuario no es un cuidador
   - Verificar el tipo de usuario en Firebase

4. **Error de sincronización**
   - Fallo en una de las bases de datos
   - Verificar logs del servidor
   - Reintentar la operación

### Debugging

```bash
# Verificar vínculos en Django
python manage.py shell
>>> from api.models import CaregiverPatientLink
>>> CaregiverPatientLink.objects.all()

# Verificar en Firestore
firebase firestore:get caregiverPatientLinks
```

## Testing

### Tests Unitarios
```python
# test_link_patient.py
def test_link_patient_success():
    # Test vinculación exitosa
    
def test_link_patient_duplicate():
    # Test vínculo duplicado
    
def test_unlink_patient_success():
    # Test desvinculación exitosa
```

### Tests de Integración
```typescript
// test_caregiver_service.ts
describe('CaregiverService', () => {
  test('should link patient successfully', async () => {
    // Test servicio de vinculación
  });
  
  test('should unlink patient successfully', async () => {
    // Test servicio de desvinculación
  });
});
```

La funcionalidad está completamente implementada y lista para uso en producción, proporcionando una gestión robusta y segura de las relaciones cuidador-paciente.