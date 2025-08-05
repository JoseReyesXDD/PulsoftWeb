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
    patient1, created = FirebaseUser.objects.get_or_create(
        uid='patient_uid_1',
        defaults={
            'email': 'paciente1@ejemplo.com',
            'user_type': 'patient'
        }
    )
    if created:
        print(f"  ➕ Creado paciente: {patient1.email}")
    
    patient2, created = FirebaseUser.objects.get_or_create(
        uid='patient_uid_2',
        defaults={
            'email': 'paciente2@ejemplo.com',
            'user_type': 'patient'
        }
    )
    if created:
        print(f"  ➕ Creado paciente: {patient2.email}")
    
    # Crear cuidador
    caregiver, created = FirebaseUser.objects.get_or_create(
        uid='caregiver_uid_1',
        defaults={
            'email': 'cuidador1@ejemplo.com',
            'user_type': 'caregiver'
        }
    )
    if created:
        print(f"  ➕ Creado cuidador: {caregiver.email}")
    
    # Crear relaciones cuidador-paciente
    link1, created = CaregiverPatientLink.objects.get_or_create(
        caregiver=caregiver,
        patient=patient1
    )
    if created:
        print(f"  🔗 Vinculado: {caregiver.email} -> {patient1.email}")
    
    link2, created = CaregiverPatientLink.objects.get_or_create(
        caregiver=caregiver,
        patient=patient2
    )
    if created:
        print(f"  🔗 Vinculado: {caregiver.email} -> {patient2.email}")
    
    return [patient1, patient2], caregiver

def create_sample_notes(db, patients):
    """Crear notas de ejemplo en Firestore"""
    print("📝 Creando notas de ejemplo en Firestore...")
    
    note_templates = [
        {
            'content': 'Análisis de ritmo cardíaco: Se observa una frecuencia cardíaca estable dentro del rango normal (72 bpm). No se detectan anomalías significativas en el patrón cardíaco.',
            'type': 'analysis'
        },
        {
            'content': 'Recomendación: Mantener actividad física moderada y seguir una dieta equilibrada. Se sugiere realizar ejercicio cardiovascular 3 veces por semana durante 30 minutos.',
            'type': 'recommendation'
        },
        {
            'content': 'Observación: Los niveles de sudoración han disminuido ligeramente en las últimas 24 horas. Esto puede indicar una mejor hidratación o cambios en la actividad física.',
            'type': 'observation'
        },
        {
            'content': 'Análisis de temperatura: La temperatura corporal se mantiene estable en 37.1°C, lo cual está dentro del rango normal. No se detectan signos de fiebre.',
            'type': 'analysis'
        },
        {
            'content': 'Recomendación: Aumentar la ingesta de líquidos, especialmente agua. Se recomienda beber al menos 2 litros de agua al día para mantener una hidratación óptima.',
            'type': 'recommendation'
        },
        {
            'content': 'Observación: El paciente ha mostrado patrones de sueño más regulares en los últimos días. Esto es un indicador positivo de bienestar general.',
            'type': 'observation'
        },
        {
            'content': 'Análisis de actividad: Los datos muestran un incremento del 15% en la actividad física diaria. El paciente ha sido más activo, lo cual es beneficioso para su salud.',
            'type': 'analysis'
        },
        {
            'content': 'Recomendación: Considerar añadir ejercicios de relajación o meditación a la rutina diaria para mejorar el manejo del estrés.',
            'type': 'recommendation'
        }
    ]
    
    for patient in patients:
        print(f"  👤 Creando notas para {patient.email}...")
        
        # Crear entre 5-8 notas por paciente
        num_notes = random.randint(5, 8)
        
        for i in range(num_notes):
            # Seleccionar plantilla aleatoria
            template = random.choice(note_templates)
            
            # Crear fecha aleatoria en los últimos 30 días
            days_ago = random.randint(0, 30)
            created_at = datetime.now() - timedelta(days=days_ago, 
                                                  hours=random.randint(0, 23),
                                                  minutes=random.randint(0, 59))
            
            note_data = {
                'content': template['content'],
                'type': template['type'],
                'createdAt': created_at.isoformat(),
                'patientUid': patient.uid,
                'analysisVersion': '1.0'
            }
            
            # Añadir nota a Firestore
            notes_ref = db.collection('users').document(patient.uid).collection('notes')
            doc_ref = notes_ref.add(note_data)
            print(f"    ✅ Nota creada: {template['type']} (ID: {doc_ref[1].id})")

def main():
    """Función principal"""
    print("🚀 Iniciando script de población de datos...")
    
    try:
        # Inicializar Firebase
        db = init_firebase()
        
        # Crear usuarios de ejemplo
        patients, caregiver = create_sample_users()
        
        # Crear notas de ejemplo
        create_sample_notes(db, patients)
        
        print("\n✅ ¡Datos de ejemplo creados exitosamente!")
        print("\n📊 Resumen:")
        print(f"  • {len(patients)} pacientes creados")
        print(f"  • 1 cuidador creado")
        print(f"  • 2 relaciones cuidador-paciente establecidas")
        print(f"  • Notas creadas para cada paciente")
        
        print("\n🔐 Usuarios para testing:")
        for patient in patients:
            print(f"  Paciente: {patient.email} (UID: {patient.uid})")
        print(f"  Cuidador: {caregiver.email} (UID: {caregiver.uid})")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())