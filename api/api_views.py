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

@method_decorator(csrf_exempt, name='dispatch')
class LinkPatientView(APIView):
    def post(self, request, *args, **kwargs):
        """
        Vincula un paciente a un cuidador.
        Requiere caregiver_uid y patient_uid en el body.
        """
        try:
            caregiver_uid = request.data.get('caregiver_uid')
            patient_uid = request.data.get('patient_uid')
            
            if not caregiver_uid:
                return Response({'error': 'El campo caregiver_uid es requerido'}, status=status.HTTP_400_BAD_REQUEST)
            
            if not patient_uid:
                return Response({'error': 'El campo patient_uid es requerido'}, status=status.HTTP_400_BAD_REQUEST)

            # Verificar que el cuidador existe
            try:
                caregiver = FirebaseUser.objects.get(uid=caregiver_uid, user_type='caregiver')
            except FirebaseUser.DoesNotExist:
                return Response({'error': 'Cuidador no encontrado'}, status=status.HTTP_404_NOT_FOUND)

            # Verificar que el paciente existe
            try:
                patient = FirebaseUser.objects.get(uid=patient_uid, user_type='patient')
            except FirebaseUser.DoesNotExist:
                return Response({'error': 'Paciente no encontrado'}, status=status.HTTP_404_NOT_FOUND)

            # Verificar que no existe ya el vínculo
            existing_link = CaregiverPatientLink.objects.filter(
                caregiver=caregiver,
                patient=patient
            ).first()
            
            if existing_link:
                return Response({
                    'error': 'El paciente ya está vinculado a este cuidador',
                    'linked_at': existing_link.linked_at
                }, status=status.HTTP_409_CONFLICT)

            # Crear el vínculo en Django
            link = CaregiverPatientLink.objects.create(
                caregiver=caregiver,
                patient=patient
            )

            # Crear el vínculo en Firestore también
            try:
                db.collection('caregiverPatientLinks').add({
                    'caregiverUid': caregiver_uid,
                    'patientUid': patient_uid,
                    'linkedAt': link.linked_at.isoformat(),
                    'caregiverEmail': caregiver.email,
                    'patientEmail': patient.email
                })
            except Exception as firestore_error:
                logger.error(f"Error al crear vínculo en Firestore: {firestore_error}")
                # Si falla Firestore, eliminar el vínculo de Django
                link.delete()
                return Response({'error': 'Error al crear el vínculo en la base de datos'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            return Response({
                'message': 'Paciente vinculado exitosamente',
                'caregiver_uid': caregiver_uid,
                'patient_uid': patient_uid,
                'linked_at': link.linked_at.isoformat()
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"LinkPatientView: Error inesperado. Detalles: {e}", exc_info=True)
            return Response({'error': 'Error interno del servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@method_decorator(csrf_exempt, name='dispatch')
class UnlinkPatientView(APIView):
    def delete(self, request, *args, **kwargs):
        """
        Desvincula un paciente de un cuidador.
        Requiere caregiver_uid y patient_uid como parámetros.
        """
        try:
            caregiver_uid = request.GET.get('caregiver_uid')
            patient_uid = request.GET.get('patient_uid')
            
            if not caregiver_uid:
                return Response({'error': 'El parámetro caregiver_uid es requerido'}, status=status.HTTP_400_BAD_REQUEST)
            
            if not patient_uid:
                return Response({'error': 'El parámetro patient_uid es requerido'}, status=status.HTTP_400_BAD_REQUEST)

            # Verificar que el cuidador existe
            try:
                caregiver = FirebaseUser.objects.get(uid=caregiver_uid, user_type='caregiver')
            except FirebaseUser.DoesNotExist:
                return Response({'error': 'Cuidador no encontrado'}, status=status.HTTP_404_NOT_FOUND)

            # Verificar que el paciente existe
            try:
                patient = FirebaseUser.objects.get(uid=patient_uid, user_type='patient')
            except FirebaseUser.DoesNotExist:
                return Response({'error': 'Paciente no encontrado'}, status=status.HTTP_404_NOT_FOUND)

            # Buscar y eliminar el vínculo en Django
            try:
                link = CaregiverPatientLink.objects.get(caregiver=caregiver, patient=patient)
                link.delete()
            except CaregiverPatientLink.DoesNotExist:
                return Response({'error': 'No existe vínculo entre el cuidador y el paciente'}, status=status.HTTP_404_NOT_FOUND)

            # Eliminar el vínculo en Firestore también
            try:
                query = db.collection('caregiverPatientLinks').where('caregiverUid', '==', caregiver_uid).where('patientUid', '==', patient_uid).stream()
                for doc in query:
                    doc.reference.delete()
            except Exception as firestore_error:
                logger.error(f"Error al eliminar vínculo en Firestore: {firestore_error}")
                # No fallar si Firestore falla, el vínculo ya se eliminó en Django

            return Response({
                'message': 'Paciente desvinculado exitosamente',
                'caregiver_uid': caregiver_uid,
                'patient_uid': patient_uid
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"UnlinkPatientView: Error inesperado. Detalles: {e}", exc_info=True)
            return Response({'error': 'Error interno del servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@method_decorator(csrf_exempt, name='dispatch')
class AvailablePatientsView(APIView):
    def get(self, request, *args, **kwargs):
        """
        Obtiene todos los pacientes disponibles para vincular a un cuidador.
        Excluye los pacientes que ya están vinculados.
        """
        try:
            caregiver_uid = request.GET.get('caregiver_uid')
            
            if not caregiver_uid:
                return Response({'error': 'El parámetro caregiver_uid es requerido'}, status=status.HTTP_400_BAD_REQUEST)

            # Verificar que el cuidador existe
            try:
                caregiver = FirebaseUser.objects.get(uid=caregiver_uid, user_type='caregiver')
            except FirebaseUser.DoesNotExist:
                return Response({'error': 'Cuidador no encontrado'}, status=status.HTTP_404_NOT_FOUND)

            # Obtener pacientes ya vinculados
            linked_patients = CaregiverPatientLink.objects.filter(caregiver=caregiver).values_list('patient__uid', flat=True)

            # Obtener todos los pacientes que no están vinculados
            available_patients = FirebaseUser.objects.filter(
                user_type='patient'
            ).exclude(uid__in=linked_patients)

            patients_data = []
            for patient in available_patients:
                patients_data.append({
                    'uid': patient.uid,
                    'email': patient.email,
                    'user_type': patient.user_type
                })

            return Response({
                'caregiver_uid': caregiver_uid,
                'available_patients': patients_data,
                'total_available': len(patients_data)
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"AvailablePatientsView: Error inesperado. Detalles: {e}", exc_info=True)
            return Response({'error': 'Error interno del servidor'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)