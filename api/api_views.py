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

@method_decorator(csrf_exempt, name='dispatch')
class SearchPatientsView(APIView):
    def get(self, request, *args, **kwargs):
        """
        Busca pacientes disponibles que un cuidador puede vincular.
        """
        try:
            caregiver_uid = request.GET.get('caregiver_uid')
            search_query = request.GET.get('search', '').strip()
            
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

            # Obtener IDs de pacientes ya vinculados
            linked_patient_ids = CaregiverPatientLink.objects.filter(
                caregiver=caregiver
            ).values_list('patient__uid', flat=True)

            # Buscar pacientes no vinculados
            patients_query = FirebaseUser.objects.filter(user_type='patient').exclude(
                uid__in=linked_patient_ids
            )

            # Aplicar filtro de búsqueda si se proporciona
            if search_query:
                patients_query = patients_query.filter(email__icontains=search_query)

            # Limitar resultados a 20
            patients = patients_query[:20]
            
            patients_data = []
            for patient in patients:
                patient_data = {
                    'uid': patient.uid,
                    'email': patient.email
                }
                patients_data.append(patient_data)

            logger.info(f"SearchPatientsView: Se encontraron {len(patients_data)} pacientes disponibles")
            return Response({'patients': patients_data}, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"SearchPatientsView: Error inesperado. Detalles: {e}", exc_info=True)
            return Response({
                'error': 'Error interno del servidor al buscar pacientes.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@method_decorator(csrf_exempt, name='dispatch')
class LinkPatientView(APIView):
    def post(self, request, *args, **kwargs):
        """
        Vincula un paciente a un cuidador.
        """
        try:
            caregiver_uid = request.data.get('caregiver_uid')
            patient_uid = request.data.get('patient_uid')
            
            if not all([caregiver_uid, patient_uid]):
                return Response({
                    'error': 'Los parámetros caregiver_uid y patient_uid son requeridos'
                }, status=status.HTTP_400_BAD_REQUEST)

            try:
                caregiver = FirebaseUser.objects.get(uid=caregiver_uid, user_type='caregiver')
                patient = FirebaseUser.objects.get(uid=patient_uid, user_type='patient')
            except FirebaseUser.DoesNotExist:
                return Response({
                    'error': 'Cuidador o paciente no encontrado'
                }, status=status.HTTP_404_NOT_FOUND)

            # Verificar si ya existe la vinculación
            if CaregiverPatientLink.objects.filter(caregiver=caregiver, patient=patient).exists():
                return Response({
                    'error': 'El paciente ya está vinculado a este cuidador'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Crear la vinculación
            link = CaregiverPatientLink.objects.create(
                caregiver=caregiver,
                patient=patient
            )

            logger.info(f"LinkPatientView: Paciente {patient.email} vinculado al cuidador {caregiver.email}")
            return Response({
                'message': 'Paciente vinculado exitosamente',
                'link': {
                    'patient_uid': patient.uid,
                    'patient_email': patient.email,
                    'linked_at': link.linked_at.isoformat()
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"LinkPatientView: Error inesperado. Detalles: {e}", exc_info=True)
            return Response({
                'error': 'Error interno del servidor al vincular el paciente.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@method_decorator(csrf_exempt, name='dispatch')
class UnlinkPatientView(APIView):
    def post(self, request, *args, **kwargs):
        """
        Desvincula un paciente de un cuidador.
        """
        try:
            caregiver_uid = request.data.get('caregiver_uid')
            patient_uid = request.data.get('patient_uid')
            
            if not all([caregiver_uid, patient_uid]):
                return Response({
                    'error': 'Los parámetros caregiver_uid y patient_uid son requeridos'
                }, status=status.HTTP_400_BAD_REQUEST)

            try:
                caregiver = FirebaseUser.objects.get(uid=caregiver_uid, user_type='caregiver')
                patient = FirebaseUser.objects.get(uid=patient_uid, user_type='patient')
            except FirebaseUser.DoesNotExist:
                return Response({
                    'error': 'Cuidador o paciente no encontrado'
                }, status=status.HTTP_404_NOT_FOUND)

            # Buscar y eliminar la vinculación
            try:
                link = CaregiverPatientLink.objects.get(caregiver=caregiver, patient=patient)
                link.delete()
                
                logger.info(f"UnlinkPatientView: Paciente {patient.email} desvinculado del cuidador {caregiver.email}")
                return Response({
                    'message': 'Paciente desvinculado exitosamente'
                }, status=status.HTTP_200_OK)
                
            except CaregiverPatientLink.DoesNotExist:
                return Response({
                    'error': 'No existe vinculación entre este cuidador y paciente'
                }, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            logger.error(f"UnlinkPatientView: Error inesperado. Detalles: {e}", exc_info=True)
            return Response({
                'error': 'Error interno del servidor al desvincular el paciente.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@method_decorator(csrf_exempt, name='dispatch')
class UserProfileView(APIView):
    def get(self, request, *args, **kwargs):
        """
        Obtiene el perfil de un usuario (paciente o cuidador) con estadísticas.
        """
        try:
            user_uid = request.GET.get('user_uid')
            user_type = request.GET.get('user_type')
            
            if not all([user_uid, user_type]):
                return Response({
                    'error': 'Los parámetros user_uid y user_type son requeridos'
                }, status=status.HTTP_400_BAD_REQUEST)

            try:
                user = FirebaseUser.objects.get(uid=user_uid, user_type=user_type)
            except FirebaseUser.DoesNotExist:
                return Response({
                    'error': 'Usuario no encontrado'
                }, status=status.HTTP_404_NOT_FOUND)

            # Datos básicos del usuario
            profile_data = {
                'uid': user.uid,
                'email': user.email,
                'user_type': user.user_type,
                'created_at': user.id  # Usando el ID como proxy para fecha de creación
            }

            # Obtener estadísticas específicas según el tipo de usuario
            if user_type == 'patient':
                # Estadísticas del paciente
                notes_ref = db.collection('users').document(user_uid).collection('notes')
                notes_count = len(list(notes_ref.stream()))
                
                # Contar cuidadores vinculados
                caregivers_count = CaregiverPatientLink.objects.filter(patient=user).count()
                
                # Obtener notas por tipo
                notes_by_type = {}
                for doc in notes_ref.stream():
                    note_data = doc.to_dict()
                    note_type = note_data.get('type', 'unknown')
                    notes_by_type[note_type] = notes_by_type.get(note_type, 0) + 1
                
                profile_data.update({
                    'statistics': {
                        'total_notes': notes_count,
                        'caregivers_count': caregivers_count,
                        'notes_by_type': notes_by_type,
                        'last_activity': 'today'  # Placeholder
                    }
                })

            elif user_type == 'caregiver':
                # Estadísticas del cuidador
                patients_count = CaregiverPatientLink.objects.filter(caregiver=user).count()
                
                # Obtener pacientes vinculados
                linked_patients = CaregiverPatientLink.objects.filter(caregiver=user).select_related('patient')
                
                # Contar notas totales de todos los pacientes
                total_notes = 0
                for link in linked_patients:
                    patient_notes_ref = db.collection('users').document(link.patient.uid).collection('notes')
                    total_notes += len(list(patient_notes_ref.stream()))
                
                profile_data.update({
                    'statistics': {
                        'patients_count': patients_count,
                        'total_notes_access': total_notes,
                        'average_notes_per_patient': round(total_notes / patients_count, 1) if patients_count > 0 else 0,
                        'active_since': linked_patients.first().linked_at.isoformat() if linked_patients.exists() else None
                    }
                })

            logger.info(f"UserProfileView: Perfil obtenido para {user.email}")
            return Response({'profile': profile_data}, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"UserProfileView: Error inesperado. Detalles: {e}", exc_info=True)
            return Response({
                'error': 'Error interno del servidor al obtener el perfil.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, *args, **kwargs):
        """
        Actualiza información del perfil de usuario.
        """
        try:
            user_uid = request.data.get('user_uid')
            user_type = request.data.get('user_type')
            
            if not all([user_uid, user_type]):
                return Response({
                    'error': 'Los parámetros user_uid y user_type son requeridos'
                }, status=status.HTTP_400_BAD_REQUEST)

            try:
                user = FirebaseUser.objects.get(uid=user_uid, user_type=user_type)
            except FirebaseUser.DoesNotExist:
                return Response({
                    'error': 'Usuario no encontrado'
                }, status=status.HTTP_404_NOT_FOUND)

            # Actualizar email si se proporciona
            new_email = request.data.get('email')
            if new_email and new_email != user.email:
                # Verificar que el email no esté en uso
                if FirebaseUser.objects.filter(email=new_email).exclude(uid=user_uid).exists():
                    return Response({
                        'error': 'Este email ya está en uso por otro usuario'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                user.email = new_email
                user.save()

            logger.info(f"UserProfileView: Perfil actualizado para {user.email}")
            return Response({
                'message': 'Perfil actualizado exitosamente',
                'profile': {
                    'uid': user.uid,
                    'email': user.email,
                    'user_type': user.user_type
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"UserProfileView: Error al actualizar perfil. Detalles: {e}", exc_info=True)
            return Response({
                'error': 'Error interno del servidor al actualizar el perfil.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)