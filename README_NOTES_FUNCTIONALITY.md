# Funcionalidad de Notas en el Dashboard del Paciente

## Resumen

Se ha implementado una funcionalidad completa para visualizar las notas de los pacientes tanto en el dashboard del paciente como para que los cuidadores puedan verlas. Esta implementación incluye:

### ✅ Características Implementadas

1. **Dashboard del Paciente Mejorado**
   - Sección prominente de "Notas Recientes" en el dashboard principal
   - Muestra las 3 notas más recientes con iconos y fechas
   - Botón "Ver todas" que lleva a la vista completa de notas
   - Integración con API real en lugar de datos simulados

2. **Acceso de Cuidadores a las Notas**
   - Los cuidadores pueden ver las notas de sus pacientes vinculados
   - Sección de notas en el dashboard del cuidador
   - Verificación de permisos a nivel de API
   - Carga automática de notas al seleccionar un paciente

3. **API Backend Robusta**
   - Endpoint `/api/patient-notes/` con control de permisos
   - Endpoint `/api/caregiver-patients/` para obtener pacientes vinculados
   - Validación de acceso (pacientes ven sus notas, cuidadores ven notas de sus pacientes)
   - Integración con Firebase Firestore para almacenamiento

## Estructura de Archivos Modificados

### Backend (Django)
- `api/api_views.py` - Nuevos endpoints: PatientNotesView, CaregiverPatientsView
- `api/urls.py` - Rutas para los nuevos endpoints
- `api/models.py` - Modelos existentes (FirebaseUser, CaregiverPatientLink)

### Frontend (React Native)
- `Pulsoft/app/patient-dashboard.tsx` - Dashboard mejorado con notas
- `Pulsoft/app/patient-notes.tsx` - Integración con API real
- `Pulsoft/app/caregiver-dashboard.tsx` - Vista de notas de pacientes
- `Pulsoft/app/caregiver-notes.tsx` - Vista completa de notas para cuidadores

### Utilidades
- `seed_notes_data.py` - Script para poblar datos de prueba

## Estructura de Datos en Firebase

Las notas se almacenan en Firebase Firestore con la siguiente estructura:

```
users/
  {patient_uid}/
    notes/
      {note_id}/
        - content: string (contenido de la nota)
        - type: 'analysis' | 'recommendation' | 'observation'
        - createdAt: string (ISO timestamp)
        - patientUid: string
        - analysisVersion: string
```

## API Endpoints

### 1. Obtener Notas del Paciente
```
GET /api/patient-notes/?patient_uid={uid}&requester_uid={uid}&requester_type={type}
```

**Parámetros:**
- `patient_uid`: UID del paciente cuyas notas se quieren obtener
- `requester_uid`: UID del usuario que hace la solicitud
- `requester_type`: 'patient' o 'caregiver'

**Respuesta:**
```json
{
  "notes": [
    {
      "id": "note_id",
      "content": "Contenido de la nota...",
      "type": "analysis",
      "createdAt": "2024-01-15T14:30:00.000Z",
      "patientUid": "patient_uid_1"
    }
  ]
}
```

### 2. Obtener Pacientes Vinculados
```
GET /api/caregiver-patients/?caregiver_uid={uid}
```

**Respuesta:**
```json
{
  "patients": [
    {
      "uid": "patient_uid_1",
      "email": "paciente1@ejemplo.com",
      "linked_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

## Configuración y Testing

### 1. Configurar el Entorno

```bash
# Instalar dependencias de Python
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configurar Firebase
# Asegúrate de tener configurado GOOGLE_APPLICATION_CREDENTIALS
# o el archivo de credenciales en tu entorno

# Aplicar migraciones de Django
python manage.py makemigrations
python manage.py migrate
```

### 2. Poblar Datos de Prueba

```bash
# Ejecutar script de población de datos
python seed_notes_data.py
```

Este script creará:
- 2 pacientes de ejemplo
- 1 cuidador de ejemplo
- Relaciones cuidador-paciente
- 5-8 notas aleatorias por paciente

### 3. Ejecutar el Servidor

```bash
# Servidor Django
python manage.py runserver

# Servidor React Native (en otra terminal)
cd Pulsoft
npm start
```

### 4. Testing de la Funcionalidad

#### Para Pacientes:
1. Iniciar sesión como paciente
2. Verificar que el dashboard muestra la sección "Notas Recientes"
3. Comprobar que se muestran las notas con iconos apropiados
4. Hacer clic en "Ver todas" para ir a la vista completa
5. Verificar que se pueden cargar todas las notas

#### Para Cuidadores:
1. Iniciar sesión como cuidador
2. Verificar que se muestran los pacientes vinculados
3. Seleccionar un paciente
4. Comprobar que se cargan automáticamente las notas del paciente
5. Hacer clic en "Ver todas" para ir a la vista completa de notas

## Tipos de Notas Soportados

1. **Análisis** (`analysis`)
   - Icono: `chart-line`
   - Color: Verde (`#4CAF50`)
   - Ejemplo: Análisis de ritmo cardíaco, temperatura, etc.

2. **Recomendación** (`recommendation`)
   - Icono: `lightbulb`
   - Color: Naranja (`#FF9800`)
   - Ejemplo: Sugerencias de ejercicio, dieta, etc.

3. **Observación** (`observation`)
   - Icono: `eye`
   - Color: Azul (`#2196F3`)
   - Ejemplo: Cambios en patrones, comportamientos, etc.

## Seguridad y Permisos

### Control de Acceso
- **Pacientes**: Solo pueden ver sus propias notas
- **Cuidadores**: Solo pueden ver notas de pacientes vinculados
- Verificación en backend a través de la tabla `CaregiverPatientLink`

### Validaciones
- Verificación de existencia de usuarios en Django
- Validación de relaciones cuidador-paciente
- Manejo de errores con códigos HTTP apropiados (403, 404, 500)

## Posibles Mejoras Futuras

1. **Filtros y Búsqueda**
   - Filtrar notas por tipo
   - Búsqueda de texto en contenido
   - Filtro por rango de fechas

2. **Notificaciones**
   - Notificar a cuidadores cuando se crean nuevas notas
   - Push notifications en el móvil

3. **Gestión de Notas**
   - Permitir que cuidadores agreguen notas
   - Marcar notas como importantes
   - Archivar notas antiguas

4. **Exportación**
   - Exportar notas a PDF
   - Enviar reportes por email

## Troubleshooting

### Error: "No se pudieron cargar las notas"
- Verificar que el servidor Django esté ejecutándose
- Comprobar la conexión a Firebase
- Verificar que los usuarios existan en la base de datos

### Error: "No tienes permisos para acceder a estas notas"
- Verificar que exista la relación cuidador-paciente en la base de datos
- Comprobar que los UIDs sean correctos

### Notas no aparecen en el dashboard
- Verificar que existan notas en Firebase para el usuario
- Comprobar la estructura de datos en Firestore
- Verificar que las fechas estén en formato ISO correcto

## Contacto y Soporte

Para reportar problemas o sugerir mejoras, crear un issue en el repositorio del proyecto con los detalles específicos del problema y pasos para reproducir.