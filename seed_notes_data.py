#!/usr/bin/env python3
"""
Script para poblar Firebase con datos de ejemplo de notas de pacientes y relaciones cuidador-paciente.
Este script es útil para testing y desarrollo.
"""

import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timedelta
import random
import os
import sys

# Añadir el directorio del proyecto al PATH para importar settings
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
import django
django.setup()

from api.models import FirebaseUser, CaregiverPatientLink

def init_firebase():
    """Inicializar Firebase Admin SDK"""
    try:
        # Intentar obtener la app existente
        firebase_admin.get_app()
        print("✓ Firebase ya está inicializado")
    except ValueError:
        # Si no existe, inicializar
        print("✓ Inicializando Firebase...")
        # Nota: Asegúrate de tener configurado GOOGLE_APPLICATION_CREDENTIALS
        # o el archivo de credenciales en tu entorno
        
    return firestore.client()

def create_sample_users():
    """Crear usuarios de ejemplo en Django"""
    print("📋 Creando usuarios de ejemplo...")
    
    # Crear pacientes
    patients = []
    patient_emails = [
        'paciente1@ejemplo.com',
        'paciente2@ejemplo.com', 
        'maria.garcia@hospital.com',
        'juan.rodriguez@clinica.com',
        'ana.martinez@salud.com'
    ]
    
    for i, email in enumerate(patient_emails):
        patient, created = FirebaseUser.objects.get_or_create(
            uid=f'patient_uid_{i+1}',
            defaults={
                'email': email,
                'user_type': 'patient'
            }
        )
        if created:
            print(f"  ➕ Creado paciente: {patient.email}")
        patients.append(patient)
    
    # Crear cuidadores
    caregivers = []
    caregiver_emails = [
        'cuidador1@ejemplo.com',
        'doctor.smith@hospital.com',
        'enfermera.lopez@clinica.com'
    ]
    
    for i, email in enumerate(caregiver_emails):
        caregiver, created = FirebaseUser.objects.get_or_create(
            uid=f'caregiver_uid_{i+1}',
            defaults={
                'email': email,
                'user_type': 'caregiver'
            }
        )
        if created:
            print(f"  ➕ Creado cuidador: {caregiver.email}")
        caregivers.append(caregiver)
    
    # Crear relaciones cuidador-paciente
    print("🔗 Creando relaciones cuidador-paciente...")
    
    # Cuidador 1 tiene acceso a pacientes 1 y 2
    for patient in patients[:2]:
        link, created = CaregiverPatientLink.objects.get_or_create(
            caregiver=caregivers[0],
            patient=patient
        )
        if created:
            print(f"  🔗 Vinculado: {caregivers[0].email} -> {patient.email}")
    
    # Cuidador 2 (doctor) tiene acceso a pacientes 3, 4 y 5
    for patient in patients[2:]:
        link, created = CaregiverPatientLink.objects.get_or_create(
            caregiver=caregivers[1],
            patient=patient
        )
        if created:
            print(f"  🔗 Vinculado: {caregivers[1].email} -> {patient.email}")
    
    # Cuidador 3 (enfermera) tiene acceso a pacientes 1, 3 y 4
    for patient in [patients[0], patients[2], patients[3]]:
        link, created = CaregiverPatientLink.objects.get_or_create(
            caregiver=caregivers[2],
            patient=patient
        )
        if created:
            print(f"  🔗 Vinculado: {caregivers[2].email} -> {patient.email}")
    
    return patients, caregivers

def create_sample_notes(db, patients):
    """Crear notas de ejemplo en Firestore"""
    print("📝 Creando notas de ejemplo en Firestore...")
    
    note_templates = [
        {
            'content': 'Análisis de ritmo cardíaco: Se observa una frecuencia cardíaca estable dentro del rango normal (72 bpm). No se detectan anomalías significativas en el patrón cardíaco. Los valores están dentro de los parámetros esperados para la edad del paciente.',
            'type': 'analysis'
        },
        {
            'content': 'Recomendación: Mantener actividad física moderada y seguir una dieta equilibrada. Se sugiere realizar ejercicio cardiovascular 3 veces por semana durante 30 minutos. Aumentar consumo de verduras y reducir sal.',
            'type': 'recommendation'
        },
        {
            'content': 'Observación: Los niveles de sudoración han disminuido ligeramente en las últimas 24 horas. Esto puede indicar una mejor hidratación o cambios en la actividad física. El paciente reporta sentirse más cómodo.',
            'type': 'observation'
        },
        {
            'content': 'Análisis de temperatura: La temperatura corporal se mantiene estable en 37.1°C, lo cual está dentro del rango normal. No se detectan signos de fiebre. La variación térmica es mínima.',
            'type': 'analysis'
        },
        {
            'content': 'Recomendación: Aumentar la ingesta de líquidos, especialmente agua. Se recomienda beber al menos 2 litros de agua al día para mantener una hidratación óptima. Evitar bebidas azucaradas.',
            'type': 'recommendation'
        },
        {
            'content': 'Observación: El paciente ha mostrado patrones de sueño más regulares en los últimos días. Esto es un indicador positivo de bienestar general. Se nota mejor estado de ánimo.',
            'type': 'observation'
        },
        {
            'content': 'Análisis de actividad: Los datos muestran un incremento del 15% en la actividad física diaria. El paciente ha sido más activo, lo cual es beneficioso para su salud cardiovascular.',
            'type': 'analysis'
        },
        {
            'content': 'Recomendación: Considerar añadir ejercicios de relajación o meditación a la rutina diaria para mejorar el manejo del estrés. Técnicas de respiración profunda pueden ser útiles.',
            'type': 'recommendation'
        },
        {
            'content': 'Observación: Se detectó un pico inusual en la frecuencia cardíaca durante las primeras horas de la mañana. Puede estar relacionado con estrés o actividad física intensa.',
            'type': 'observation'
        },
        {
            'content': 'Análisis de tendencias: Los datos de las últimas 2 semanas muestran una tendencia positiva en todos los indicadores de salud. La constancia en los hábitos está dando resultados.',
            'type': 'analysis'
        },
        {
            'content': 'Recomendación: Mantener el horario actual de medicamentos. La adherencia al tratamiento ha sido excelente. Continuar con los controles periódicos programados.',
            'type': 'recommendation'
        },
        {
            'content': 'Observación: Notable mejora en los niveles de energía reportados por el paciente. Se correlaciona con la mejora en la calidad del sueño y la actividad física regular.',
            'type': 'observation'
        }
    ]
    
    for patient in patients:
        print(f"  👤 Creando notas para {patient.email}...")
        
        # Crear entre 8-15 notas por paciente
        num_notes = random.randint(8, 15)
        
        for i in range(num_notes):
            # Seleccionar plantilla aleatoria
            template = random.choice(note_templates)
            
            # Crear fecha aleatoria en los últimos 45 días
            days_ago = random.randint(0, 45)
            hours_ago = random.randint(0, 23)
            minutes_ago = random.randint(0, 59)
            
            created_at = datetime.now() - timedelta(
                days=days_ago, 
                hours=hours_ago,
                minutes=minutes_ago
            )
            
            note_data = {
                'content': template['content'],
                'type': template['type'],
                'createdAt': created_at.isoformat(),
                'patientUid': patient.uid,
                'analysisVersion': '1.0',
                'priority': random.choice(['low', 'medium', 'high']),
                'tags': random.sample(['cardiovascular', 'actividad', 'sueño', 'hidratación', 'estrés'], random.randint(1, 3))
            }
            
            # Añadir nota a Firestore
            notes_ref = db.collection('users').document(patient.uid).collection('notes')
            doc_ref = notes_ref.add(note_data)
            print(f"    ✅ Nota creada: {template['type']} (ID: {doc_ref[1].id})")

def create_sample_health_data(db, patients):
    """Crear datos de salud de ejemplo para las gráficas"""
    print("📊 Creando datos de salud para gráficas...")
    
    for patient in patients:
        print(f"  👤 Creando datos de salud para {patient.email}...")
        
        # Crear datos para los últimos 30 días
        health_data = []
        for days_ago in range(30, 0, -1):
            date = datetime.now() - timedelta(days=days_ago)
            
            # Generar datos realistas con variaciones
            base_cardiovascular = 75 + random.randint(-15, 15)
            base_sudor = 40 + random.randint(-10, 10)
            base_temperatura = 37.0 + random.uniform(-0.5, 0.5)
            
            health_point = {
                'date': date.isoformat(),
                'cardiovascular': max(60, min(100, base_cardiovascular)),
                'sudor': max(20, min(60, base_sudor)),
                'temperatura': round(max(36.0, min(38.0, base_temperatura)), 1),
                'timestamp': date.timestamp()
            }
            
            health_data.append(health_point)
        
        # Guardar en Firestore
        health_ref = db.collection('users').document(patient.uid).collection('health_data')
        
        # Guardar en lotes para mejor rendimiento
        batch = db.batch()
        for data_point in health_data:
            doc_ref = health_ref.document()
            batch.set(doc_ref, data_point)
        
        batch.commit()
        print(f"    ✅ Creados {len(health_data)} puntos de datos de salud")

def main():
    """Función principal"""
    print("🚀 Iniciando script de población de datos...")
    
    try:
        # Inicializar Firebase
        db = init_firebase()
        
        # Crear usuarios de ejemplo
        patients, caregivers = create_sample_users()
        
        # Crear notas de ejemplo
        create_sample_notes(db, patients)
        
        # Crear datos de salud de ejemplo
        create_sample_health_data(db, patients)
        
        print("\n✅ ¡Datos de ejemplo creados exitosamente!")
        print("\n📊 Resumen:")
        print(f"  • {len(patients)} pacientes creados")
        print(f"  • {len(caregivers)} cuidadores creados")
        print(f"  • Múltiples relaciones cuidador-paciente establecidas")
        print(f"  • 8-15 notas por paciente creadas")
        print(f"  • 30 días de datos de salud por paciente")
        
        print("\n🔐 Usuarios para testing:")
        print("\n👥 PACIENTES:")
        for patient in patients:
            print(f"  📧 {patient.email} (UID: {patient.uid})")
        
        print("\n👨‍⚕️ CUIDADORES:")
        for caregiver in caregivers:
            print(f"  📧 {caregiver.email} (UID: {caregiver.uid})")
        
        print("\n📋 Funcionalidades para probar:")
        print("  • Login como paciente para ver dashboard con notas")
        print("  • Login como cuidador para gestionar pacientes")
        print("  • Añadir/desvincular pacientes como cuidador")
        print("  • Ver gráficas de salud de pacientes")
        print("  • Navegar entre notas y análisis")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())