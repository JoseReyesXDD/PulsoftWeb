# Funcionalidad del Cuidador - Visualización de Notas de Pacientes

## Descripción General

Esta funcionalidad permite a los cuidadores ver las notas y análisis de IA de sus pacientes vinculados. El sistema ya está completamente implementado y funcional.

## Características Implementadas

### 1. Autenticación y Autorización
- Los cuidadores deben iniciar sesión con su cuenta de Firebase
- El sistema verifica que el usuario sea de tipo 'caregiver'
- Se valida que exista un vínculo entre el cuidador y el paciente

### 2. Selección de Paciente
- Los cuidadores pueden ver una lista de todos sus pacientes vinculados
- Pueden seleccionar un paciente específico para ver sus notas
- La información se obtiene desde Firestore y se sincroniza con Django

### 3. Visualización de Notas
- Los cuidadores pueden ver todas las notas del paciente seleccionado
- Cada nota incluye:
  - Fecha de análisis
  - Análisis completo generado por IA
  - ID único de la nota

### 4. Interfaz de Usuario
- Dashboard moderno y responsivo
- Navegación intuitiva entre pacientes
- Diseño limpio y profesional

## Flujo de Usuario

1. **Inicio de Sesión**: El cuidador inicia sesión con Firebase
2. **Selección de Paciente**: Elige un paciente de su lista de pacientes vinculados
3. **Dashboard**: Ve información del paciente seleccionado
4. **Visualización de Notas**: Accede a las notas del paciente
5. **Navegación**: Puede cambiar de paciente o cerrar sesión

## Endpoints API Disponibles

### GET `/api/caregiver-patients/`
Obtiene todos los pacientes vinculados a un cuidador.

**Parámetros:**
- `caregiver_uid`: UID del cuidador

**Respuesta:**
```json
{
    "caregiver_uid": "uid_del_cuidador",
    "linked_patients": [
        {
            "uid": "uid_del_paciente",
            "email": "paciente@email.com",
            "user_type": "patient"
        }
    ],
    "total_patients": 1
}
```

### GET `/api/patient-notes/`
Obtiene las notas de un paciente específico.

**Parámetros:**
- `patient_uid`: UID del paciente
- `caregiver_uid`: UID del cuidador

**Respuesta:**
```json
{
    "patient_uid": "uid_del_paciente",
    "patient_email": "paciente@email.com",
    "caregiver_uid": "uid_del_cuidador",
    "notes": [
        {
            "note_id": "id_de_la_nota",
            "analisis_IA": "Análisis generado por IA",
            "analizadoEn": "2024-01-01T00:00:00Z"
        }
    ],
    "total_notes": 1
}
```

## Estructura de Datos

### Modelos Django
```python
class FirebaseUser(models.Model):
    uid = models.CharField(max_length=100, unique=True)
    email = models.EmailField()
    user_type = models.CharField(max_length=20, choices=[
        ('patient', 'Paciente'), 
        ('caregiver', 'Cuidador')
    ])

class CaregiverPatientLink(models.Model):
    caregiver = models.ForeignKey(FirebaseUser, on_delete=models.CASCADE, related_name='cuidados')
    patient = models.ForeignKey(FirebaseUser, on_delete=models.CASCADE, related_name='cuidadores')
    linked_at = models.DateTimeField(auto_now_add=True)
```

### Estructura en Firestore
- Colección `users`: Información de usuarios
- Colección `caregiverPatientLinks`: Vínculos entre cuidadores y pacientes
- Subcolección `notes`: Notas de cada paciente

## Seguridad

- Verificación de autenticación Firebase
- Validación de permisos de cuidador
- Verificación de vínculos entre cuidador y paciente
- Protección CSRF en endpoints web

## Archivos Principales

- `api/views_web.py`: Vistas web para la interfaz de usuario
- `api/api_views.py`: Endpoints API REST
- `api/models.py`: Modelos de datos
- `templates/caregiver_dashboard.html`: Dashboard del cuidador
- `templates/caregiver_notes.html`: Vista de notas del paciente
- `templates/select_patient.html`: Selección de paciente

## Uso

1. Acceder a la aplicación web
2. Iniciar sesión como cuidador
3. Seleccionar un paciente de la lista
4. Hacer clic en "Ver Análisis del Paciente"
5. Revisar las notas y análisis disponibles

La funcionalidad está completamente implementada y lista para usar.