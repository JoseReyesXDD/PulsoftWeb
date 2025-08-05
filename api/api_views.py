# api/api_views.py
import logging
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView

from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

# Importamos la lógica de IA
from .ia_logic import generate_diagnosis_and_suggestions
from .models import FirebaseUser, CaregiverPatientLink
from firebase_config import db

# Configurar el logger para este módulo
logger = logging.getLogger(__name__)

@method_decorator(csrf_exempt, name='dispatch')
class AnalyzeNoteView(APIView):
    def post(self, request, *args, **kwargs):
        """
        Procesa una nota clínica enviada por POST para generar un diagnóstico y sugerencias de IA.
        """
        try:
            note = request.data.get('note', '')

            if not note:
                logger.warning("AnalyzeNoteView: El campo 'note' es requerido en la solicitud POST.")
                return Response({'error': 'El campo "note" es requerido'}, status=status.HTTP_400_BAD_REQUEST)

            # Llama a la función de lógica de IA
            # generate_diagnosis_and_suggestions devuelve una cadena única
            generated_analysis = generate_diagnosis_and_suggestions(note)

            if generated_analysis.startswith("Error:"):
                logger.error(f"AnalyzeNoteView: Error en la lógica de IA para la nota. Detalles: {generated_analysis}", exc_info=True)
                return Response({'error': generated_analysis}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            logger.info("AnalyzeNoteView: Análisis de IA generado exitosamente.")
            return Response({'analisis_completo': generated_analysis}, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"AnalyzeNoteView: Error inesperado en el método POST. Detalles: {e}", exc_info=True)
            return Response({'error': 'Error interno del servidor al procesar la solicitud.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get(self, request, *args, **kwargs):
        """
        Método GET para AnalyzeNoteView.
        """
        logger.info("AnalyzeNoteView: Solicitud GET recibida.")
        return Response({'message': 'Endpoint de análisis de notas de IA. Usa el método POST para enviar una nota para análisis.'}, status=status.HTTP_200_OK)

@method_decorator(csrf_exempt, name='dispatch')
class CaregiverPatientsView(APIView):
    def get(self, request, *args, **kwargs):
        """
        Obtiene todos los pacientes vinculados a un cuidador.
        Requiere el UID del cuidador como parámetro.
        """
        try:
            caregiver_uid = request.GET.get('caregiver_uid')
            
            if not caregiver_uid:
                return Response({'error': 'El parámetro caregiver_uid es requerido'}, status=status.HTTP_400_BAD_REQUEST)

            # Verificar que el usuario existe y es un cuidador
            try:
                caregiver = FirebaseUser.objects.get(uid=caregiver_uid, user_type='caregiver')
            except FirebaseUser.DoesNotExist:
                return Response({'error': 'Cuidador no encontrado'}, status=status.HTTP_404_NOT_FOUND)

            # Obtener pacientes vinculados desde Firestore
            query = db.collection('caregiverPatientLinks').where('caregiverUid', '==', caregiver_uid).stream()
            patient_uids = [doc.to_dict().get('patientUid') for doc in query]

            # Obtener información de los pacientes desde Django
            linked_patients = FirebaseUser.objects.filter(uid__in=patient_uids, user_type='patient')
            
            patients_data = []
            for patient in linked_patients:
                patients_data.append({
                    'uid': patient.uid,
                    'email': patient.email,
                    'user_type': patient.user_type
                })

            return Response({
                'caregiver_uid': caregiver_uid,
                'linked_patients': patients_data,
                'total_patients': len(patients_data)
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"CaregiverPatientsView: Error inesperado. Detalles: {e}", exc_info=True)
            return Response({'error': 'Error interno del servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@method_decorator(csrf_exempt, name='dispatch')
class PatientNotesView(APIView):
    def get(self, request, *args, **kwargs):
        """
        Obtiene las notas de un paciente específico.
        Requiere el UID del paciente como parámetro.
        """
        try:
            patient_uid = request.GET.get('patient_uid')
            caregiver_uid = request.GET.get('caregiver_uid')
            
            if not patient_uid:
                return Response({'error': 'El parámetro patient_uid es requerido'}, status=status.HTTP_400_BAD_REQUEST)

            if not caregiver_uid:
                return Response({'error': 'El parámetro caregiver_uid es requerido'}, status=status.HTTP_400_BAD_REQUEST)

            # Verificar que el paciente existe
            try:
                patient = FirebaseUser.objects.get(uid=patient_uid, user_type='patient')
            except FirebaseUser.DoesNotExist:
                return Response({'error': 'Paciente no encontrado'}, status=status.HTTP_404_NOT_FOUND)

            # Verificar que el cuidador existe
            try:
                caregiver = FirebaseUser.objects.get(uid=caregiver_uid, user_type='caregiver')
            except FirebaseUser.DoesNotExist:
                return Response({'error': 'Cuidador no encontrado'}, status=status.HTTP_404_NOT_FOUND)

            # Verificar que existe el vínculo entre cuidador y paciente
            query = db.collection('caregiverPatientLinks').where('caregiverUid', '==', caregiver_uid).where('patientUid', '==', patient_uid).stream()
            if not list(query):
                return Response({'error': 'No existe vínculo entre el cuidador y el paciente'}, status=status.HTTP_403_FORBIDDEN)

            # Obtener notas del paciente desde Firestore
            notes_ref = db.collection('users').document(patient_uid).collection('notes')
            notes = []
            for doc in notes_ref.stream():
                note_data = doc.to_dict()
                note_data['note_id'] = doc.id
                notes.append(note_data)

            return Response({
                'patient_uid': patient_uid,
                'patient_email': patient.email,
                'caregiver_uid': caregiver_uid,
                'notes': notes,
                'total_notes': len(notes)
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"PatientNotesView: Error inesperado. Detalles: {e}", exc_info=True)
            return Response({'error': 'Error interno del servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)