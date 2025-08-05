# api/api_views.py
import logging
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView

from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from firebase_config import db
from .models import FirebaseUser, CaregiverPatientLink

# Importamos la lógica de IA
from .ia_logic import generate_diagnosis_and_suggestions

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
class PatientNotesView(APIView):
    def get(self, request, *args, **kwargs):
        """
        Obtiene las notas de un paciente. Permite acceso al propio paciente o a sus cuidadores.
        """
        try:
            patient_uid = request.GET.get('patient_uid')
            requester_uid = request.GET.get('requester_uid')
            requester_type = request.GET.get('requester_type')

            if not all([patient_uid, requester_uid, requester_type]):
                return Response({
                    'error': 'Faltan parámetros requeridos: patient_uid, requester_uid, requester_type'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Verificar permisos
            has_permission = False
            
            if requester_type == 'patient' and patient_uid == requester_uid:
                # El paciente puede ver sus propias notas
                has_permission = True
            elif requester_type == 'caregiver':
                # Verificar si el cuidador tiene acceso a este paciente
                try:
                    caregiver = FirebaseUser.objects.get(uid=requester_uid, user_type='caregiver')
                    patient = FirebaseUser.objects.get(uid=patient_uid, user_type='patient')
                    link_exists = CaregiverPatientLink.objects.filter(
                        caregiver=caregiver, 
                        patient=patient
                    ).exists()
                    has_permission = link_exists
                except FirebaseUser.DoesNotExist:
                    has_permission = False

            if not has_permission:
                return Response({
                    'error': 'No tienes permisos para acceder a estas notas'
                }, status=status.HTTP_403_FORBIDDEN)

            # Obtener notas desde Firestore
            notes_ref = db.collection('users').document(patient_uid).collection('notes')
            notes_docs = notes_ref.order_by('createdAt', direction='DESCENDING').stream()
            
            notes = []
            for doc in notes_docs:
                note_data = doc.to_dict()
                note_data['id'] = doc.id
                notes.append(note_data)

            logger.info(f"PatientNotesView: Se obtuvieron {len(notes)} notas para el paciente {patient_uid}")
            return Response({'notes': notes}, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"PatientNotesView: Error inesperado. Detalles: {e}", exc_info=True)
            return Response({
                'error': 'Error interno del servidor al obtener las notas.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@method_decorator(csrf_exempt, name='dispatch')
class CaregiverPatientsView(APIView):
    def get(self, request, *args, **kwargs):
        """
        Obtiene la lista de pacientes vinculados a un cuidador.
        """
        try:
            caregiver_uid = request.GET.get('caregiver_uid')
            
            if not caregiver_uid:
                return Response({
                    'error': 'El parámetro caregiver_uid es requerido'
                }, status=status.HTTP_400_BAD_REQUEST)

            try:
                caregiver = FirebaseUser.objects.get(uid=caregiver_uid, user_type='caregiver')
            except FirebaseUser.DoesNotExist:
                return Response({
                    'error': 'Cuidador no encontrado'
                }, status=status.HTTP_404_NOT_FOUND)

            # Obtener pacientes vinculados
            links = CaregiverPatientLink.objects.filter(caregiver=caregiver).select_related('patient')
            
            patients = []
            for link in links:
                patient_data = {
                    'uid': link.patient.uid,
                    'email': link.patient.email,
                    'linked_at': link.linked_at.isoformat()
                }
                patients.append(patient_data)

            logger.info(f"CaregiverPatientsView: Se encontraron {len(patients)} pacientes para el cuidador {caregiver_uid}")
            return Response({'patients': patients}, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"CaregiverPatientsView: Error inesperado. Detalles: {e}", exc_info=True)
            return Response({
                'error': 'Error interno del servidor al obtener los pacientes.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)