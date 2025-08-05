# Notas Estáticas y Datos en Tiempo Real

## Descripción General

Esta funcionalidad proporciona notas de análisis estáticas para los pacientes y datos de gráficas en tiempo real para mostrar al cuidador, simulando un entorno de monitoreo médico real.

## Características Implementadas

### ✅ **Notas Estáticas de Pacientes**

1. **Servicio MockDataService** - `mockDataService.ts`
   - 5 pacientes con datos realistas
   - Notas específicas por condición médica
   - Análisis detallados con recomendaciones
   - Fechas y horarios realistas

2. **Pacientes de Prueba**
   - María González (68 años, Hipertensión)
   - Juan Rodríguez (72 años, Diabetes)
   - Ana Martínez (65 años, Artritis)
   - Carlos López (70 años, Problemas cardíacos)
   - Lucía Hernández (67 años, Asma)

### ✅ **Datos en Tiempo Real**

1. **Simulación de Métricas**
   - Variaciones realistas en valores
   - Actualización cada 5 segundos
   - Estados de salud (normal, warning, alert)
   - Gráficas dinámicas

2. **Gráficas Interactivas**
   - Datos de la última semana
   - 4 tipos de gráficas diferentes
   - Información del paciente integrada
   - Estados visuales de salud

## Estructura de Datos

### **Pacientes Mock**

```typescript
interface MockPatient {
  uid: string;
  email: string;
  name: string;
  age: number;
  condition: string;
  lastUpdate: string;
  notesCount: number;
  cardiovascular: number;
  sudor: number;
  temperatura: number;
}
```

### **Notas de Análisis**

```typescript
interface PatientAnalysis {
  note_id: string;
  analisis_IA: string;
  analizadoEn: string;
  patient_email: string;
  severity?: 'low' | 'medium' | 'high';
  category?: 'cardiovascular' | 'sudor' | 'temperatura' | 'general';
}
```

### **Datos de Gráficas**

```typescript
interface ChartData {
  cardiovascular: number[];
  sudor: number[];
  temperatura: number[];
  labels: string[];
  patientInfo?: {
    name: string;
    age: number;
    condition: string;
  };
}
```

## Pacientes de Prueba

### **1. María González**
- **Edad:** 68 años
- **Condición:** Hipertensión
- **Métricas:** Cardiovascular: 78, Sudor: 42, Temperatura: 37.1
- **Notas:** 5 análisis incluyendo específicos para hipertensión

### **2. Juan Rodríguez**
- **Edad:** 72 años
- **Condición:** Diabetes
- **Métricas:** Cardiovascular: 85, Sudor: 38, Temperatura: 36.8
- **Notas:** 3 análisis incluyendo específicos para diabetes

### **3. Ana Martínez**
- **Edad:** 65 años
- **Condición:** Artritis
- **Métricas:** Cardiovascular: 72, Sudor: 45, Temperatura: 37.3
- **Notas:** 4 análisis generales

### **4. Carlos López**
- **Edad:** 70 años
- **Condición:** Problemas cardíacos
- **Métricas:** Cardiovascular: 92, Sudor: 35, Temperatura: 36.9
- **Notas:** 6 análisis con alertas cardiovasculares

### **5. Lucía Hernández**
- **Edad:** 67 años
- **Condición:** Asma
- **Métricas:** Cardiovascular: 75, Sudor: 48, Temperatura: 37.0
- **Notas:** 2 análisis básicos

## Notas Estáticas por Paciente

### **Análisis Generales**
Cada paciente tiene notas que incluyen:

1. **Análisis Cardiovascular**
   - Frecuencia cardíaca actual
   - Comparación con rangos normales
   - Recomendaciones específicas

2. **Análisis de Sudoración**
   - Niveles de GSR (Galvanic Skin Response)
   - Relación con la condición del paciente
   - Evaluación de hidratación

3. **Análisis de Temperatura**
   - Temperatura corporal actual
   - Detección de fiebre o hipotermia
   - Patrones de estabilidad

4. **Análisis General**
   - Perfil completo de biomarcadores
   - Evaluación de salud general
   - Recomendaciones de monitoreo

5. **Evaluación de Tendencias**
   - Análisis de patrones semanales
   - Comparación con datos históricos
   - Sugerencias de tratamiento

### **Análisis Específicos por Condición**

#### **Hipertensión (María González)**
- Evaluación de valores cardiovasculares
- Comparación con rangos para hipertensos
- Recomendaciones de medicación

#### **Diabetes (Juan Rodríguez)**
- Análisis de sudoración relacionado con glucosa
- Evaluación de control glucémico
- Monitoreo de fluctuaciones

## Datos en Tiempo Real

### **Simulación de Métricas**

```typescript
generateRealTimeMetrics(patientUid: string) {
  // Variaciones realistas
  const cardiovascularVariation = (Math.random() - 0.5) * 6;
  const sudorVariation = (Math.random() - 0.5) * 4;
  const temperaturaVariation = (Math.random() - 0.5) * 0.4;
  
  // Cálculo de valores actuales
  const cardiovascular = Math.round((baseValue + variation) * 10) / 10;
  
  // Determinación de estado
  let status = 'normal';
  if (cardiovascular > 90 || temperatura > 38) status = 'alert';
  else if (cardiovascular > 85 || temperatura > 37.5) status = 'warning';
}
```

### **Estados de Salud**

- **🟢 Normal:** Valores dentro del rango saludable
- **🟡 Warning:** Valores ligeramente elevados
- **🔴 Alert:** Valores que requieren atención inmediata

### **Actualización Automática**

```typescript
simulateRealTimeUpdate(patientUid: string, callback: (data: any) => void) {
  const interval = setInterval(() => {
    const metrics = this.generateRealTimeMetrics(patientUid);
    callback(metrics);
  }, 5000); // Actualizar cada 5 segundos
  
  return () => clearInterval(interval);
}
```

## Gráficas en Tiempo Real

### **Tipos de Gráficas**

1. **Gráfica de Línea - Cardiovascular**
   - Datos de la última semana
   - Variaciones en tiempo real
   - Indicadores de tendencia

2. **Gráfica de Barras - Sudoración**
   - Niveles de GSR diarios
   - Comparación semanal
   - Patrones de actividad

3. **Gráfica de Línea - Temperatura**
   - Temperatura corporal
   - Detección de fiebre
   - Estabilidad térmica

4. **Gráfica de Pastel - Distribución**
   - Proporción de biomarcadores
   - Estado actual de salud
   - Balance general

### **Información del Paciente**

```typescript
patientInfo: {
  name: string;
  age: number;
  condition: string;
}
```

## Componentes Actualizados

### **PatientCharts Component**

```typescript
interface PatientChartsProps {
  patientData: PatientData;
  chartData?: ChartData;
  realTime?: boolean;
}
```

**Características:**
- Modo tiempo real/estático
- Información del paciente
- Estados de salud visuales
- Actualización automática

### **MockDataService**

```typescript
class MockDataService {
  generateStaticNotes(patientUid: string): PatientAnalysis[]
  generateRealTimeChartData(patientUid: string): ChartData
  generateRealTimeMetrics(patientUid: string): PatientMetrics
  simulateRealTimeUpdate(patientUid: string, callback: Function)
}
```

## Flujo de Datos

### **1. Carga Inicial**
```
Usuario selecciona paciente → Cargar datos mock → Mostrar gráficas estáticas
```

### **2. Modo Tiempo Real**
```
Activar modo tiempo real → Simular actualizaciones → Actualizar gráficas
```

### **3. Notas Estáticas**
```
Cargar notas del paciente → Mostrar análisis específicos → Permitir compartir/exportar
```

## Características de Seguridad

### ✅ **Validación de Datos**
- Verificación de rangos normales
- Detección de valores anómalos
- Estados de alerta apropiados

### ✅ **Fallback Robusto**
- Datos mock cuando API no está disponible
- Simulación realista de errores
- Recuperación automática

### ✅ **Integridad de Información**
- Datos consistentes entre pacientes
- Fechas y horarios realistas
- Información médica apropiada

## Experiencia de Usuario

### **Diseño Intuitivo**
- Indicadores visuales de estado
- Información clara del paciente
- Navegación fluida entre modos

### **Funcionalidad Completa**
- Notas detalladas y específicas
- Gráficas interactivas
- Datos en tiempo real
- Acciones de compartir/exportar

### **Responsividad**
- Actualización automática
- Estados de carga apropiados
- Feedback inmediato

## Casos de Uso

### **1. Cuidador Revisando Paciente**
- Ve información completa del paciente
- Revisa notas de análisis específicas
- Monitorea gráficas en tiempo real
- Toma decisiones basadas en datos

### **2. Análisis de Tendencias**
- Compara datos semanales
- Identifica patrones de salud
- Evalúa efectividad de tratamientos
- Planifica seguimiento

### **3. Alertas y Notificaciones**
- Recibe alertas de valores anómalos
- Monitorea cambios en tiempo real
- Responde a emergencias médicas
- Comunica con equipo médico

## Mejoras Futuras

### **1. Notificaciones Push**
- Alertas en tiempo real
- Recordatorios de medicación
- Notificaciones de emergencia

### **2. Historial Completo**
- Datos históricos extensos
- Comparación de períodos
- Análisis de tendencias

### **3. Integración con Dispositivos**
- Conectividad con wearables
- Datos de sensores reales
- Sincronización automática

### **4. IA Predictiva**
- Predicción de eventos médicos
- Análisis de riesgo
- Recomendaciones proactivas

## Testing

### **Datos Mock**
```typescript
// Verificar generación de datos
const notes = mockDataService.generateStaticNotes('1');
const chartData = mockDataService.generateRealTimeChartData('1');
const metrics = mockDataService.generateRealTimeMetrics('1');

// Verificar consistencia
expect(notes.length).toBeGreaterThan(0);
expect(chartData.cardiovascular.length).toBe(7);
expect(metrics.cardiovascular).toBeGreaterThan(0);
```

### **Tiempo Real**
```typescript
// Verificar actualización
const cleanup = mockDataService.simulateRealTimeUpdate('1', (data) => {
  expect(data.cardiovascular).toBeDefined();
  expect(data.status).toBeDefined();
});
```

La funcionalidad está completamente implementada y proporciona una experiencia realista de monitoreo médico con datos estáticos detallados y simulación de tiempo real para el desarrollo y pruebas.