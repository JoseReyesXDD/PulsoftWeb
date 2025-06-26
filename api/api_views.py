import json
import logging

from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction # Importar transaction

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from firebase_config import db 
from google.cloud import firestore 
from .authentication import FirebaseAuthentication
from .ia_logic import generate_diagnosis_and_suggestions

# Importar los modelos necesarios para la vinculación
from api.models import Patient, Caregiver, CaregiverPatientLink, CustomUser # Importar CustomUser también

logger = logging.getLogger(__name__)

@method_decorator(csrf_exempt, name='dispatch')
class AnalyzeNoteView(View):
    """
    Vista de Django (no DRF) para analizar una nota y guardar el análisis en Firestore.
    Esta vista está diseñada para ser un endpoint de API.
    Requiere desactivación CSRF si se accede desde un cliente que no maneja tokens CSRF de Django.
    """
    def post(self, request, *args, **kwargs):
        try:
            data = json.loads(request.body)
            note = data.get('note', '')

            if not note:
                logger.warning("AnalyzeNoteView: El campo 'note' es requerido en la solicitud.")
                return JsonResponse({'error': 'El campo "note" es requerido'}, status=400)

            # Genera el diagnóstico y las sugerencias usando la lógica de IA
            generated_response = generate_diagnosis_and_suggestions(note)

            if generated_response.startswith("Error:"):
                logger.error(f"AnalyzeNoteView: Error en la lógica de IA para la nota. Detalles: {generated_response}")
                return JsonResponse({'error': generated_response}, status=500)

            try:
                # Intenta guardar la nota original y el análisis de la IA en Firebase Firestore.
                # El mensaje de log solo incluye el ID del documento, no la nota completa.
                doc_ref = db.collection('analisis_clinicos').document()
                doc_ref.set({
                    'nota_original': note,
                    'analisis_ia': generated_response,
                    'fecha_creacion': firestore.SERVER_TIMESTAMP # Utiliza el timestamp del servidor de Firestore
                })
                logger.info(f"AnalyzeNoteView: Análisis guardado en Firestore con ID: {doc_ref.id}")
            except Exception as firebase_error:
                # Loguea errores al guardar en Firebase, sin afectar la respuesta de la IA si fue exitosa.
                logger.error(f"AnalyzeNoteView: Error al guardar el análisis en Firebase Firestore. Detalles: {firebase_error}", exc_info=True)

            return JsonResponse({'analisis_completo': generated_response})

        except json.JSONDecodeError:
            # Mensaje de advertencia si el formato JSON es inválido.
            logger.warning("AnalyzeNoteView: Solicitud con formato JSON inválido.")
            return JsonResponse({'error': 'Formato JSON inválido en el cuerpo de la solicitud'}, status=400)
        except Exception as e:
            # Loguea cualquier otro error inesperado.
            logger.error(f"AnalyzeNoteView: Error inesperado en el método POST. Detalles: {e}", exc_info=True)
            return JsonResponse({'error': str(e)}, status=500)

    def get(self, request, *args, **kwargs):
        """
        Método GET para AnalyzeNoteView.
        """
        return JsonResponse({'message': 'Endpoint de análisis de notas. Usa POST para enviar una nota.'}, status=200)

class AIDiagnosisView(APIView):
    """
    Vista de Django REST Framework para obtener un diagnóstico y sugerencias de IA.
    Requiere que el usuario esté autenticado con Firebase (usando FirebaseAuthentication).
    """
    authentication_classes = [FirebaseAuthentication] 
    permission_classes = [IsAuthenticated] 

    def post(self, request):
        """
        Procesa los datos de entrada para generar un diagnóstico y sugerencias de IA.
        """
        input_data = request.data.get('input_data')

        if not input_data:
            logger.warning("AIDiagnosisView: Se requieren datos de entrada para el diagnóstico.")
            return Response({"error": "Se requieren datos de entrada para el diagnóstico."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            diagnosis, suggestions = generate_diagnosis_and_suggestions(input_data)
            logger.info(f"AIDiagnosisView: Diagnóstico de IA generado exitosamente para el usuario {request.user.email if request.user.is_authenticated else 'Anónimo'}.")
            
            return Response(
                {"diagnosis": diagnosis, "suggestions": suggestions},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"AIDiagnosisView: Error al generar diagnóstico de IA. Detalles: {e}", exc_info=True)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LinkPatientView(APIView):
    """
    APIView para que un cuidador vincule un paciente usando el token de enlace del paciente.
    Solo accesible para usuarios autenticados que sean de tipo 'caregiver'.
    """
    authentication_classes = [FirebaseAuthentication] # Requiere autenticación Firebase
    permission_classes = [IsAuthenticated] # Requiere que el usuario esté autenticado

    def post(self, request):
        """
        Maneja la solicitud POST para vincular un cuidador con un paciente.
        """
        # Verifica que el usuario autenticado sea un cuidador
        if not hasattr(request.user, 'user_type') or request.user.user_type != 'caregiver':
            logger.warning(f"LinkPatientView: Intento de vinculación por usuario no cuidador: {request.user.email}")
            return Response(
                {"error": "Solo los cuidadores pueden vincular pacientes."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        caregiver_user = request.user # El CustomUser autenticado
        
        # Intenta obtener el perfil de cuidador asociado al CustomUser
        try:
            caregiver_profile = Caregiver.objects.get(user=caregiver_user)
        except Caregiver.DoesNotExist:
            logger.error(f"LinkPatientView: Perfil de cuidador no encontrado para {caregiver_user.email} (UID: {caregiver_user.uid}).")
            return Response(
                {"error": "No se encontró el perfil de cuidador asociado."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        link_token = request.data.get('link_token')

        if not link_token:
            logger.warning(f"LinkPatientView: Solicitud de vinculación sin token de enlace para cuidador {caregiver_user.email}.")
            return Response(
                {"error": "El token de enlace del paciente es requerido."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                # Busca el paciente por el token de enlace
                patient_profile = Patient.objects.get(caregiver_link_token=link_token)
                
                # Opcional: Impedir que un cuidador se vincule a sí mismo si accidentalmente usa su propio token.
                if patient_profile.user == caregiver_user:
                    logger.warning(f"LinkPatientView: Cuidador {caregiver_user.email} intentó vincularse a sí mismo.")
                    return Response(
                        {"error": "No puedes vincularte a ti mismo como paciente."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                # Verifica si el enlace ya existe y está activo
                existing_link = CaregiverPatientLink.objects.filter(
                    caregiver=caregiver_profile,
                    patient=patient_profile,
                    is_active=True
                ).exists()

                if existing_link:
                    logger.info(f"LinkPatientView: Enlace ya existente y activo entre cuidador {caregiver_user.email} y paciente {patient_profile.user.email}.")
                    return Response(
                        {"message": "El cuidador ya está vinculado a este paciente."},
                        status=status.HTTP_200_OK # O 409 CONFLICT si quieres indicar que ya existe
                    )

                # Crea el nuevo enlace
                CaregiverPatientLink.objects.create(
                    caregiver=caregiver_profile,
                    patient=patient_profile,
                    is_active=True
                )
                logger.info(f"LinkPatientView: Enlace exitoso entre cuidador {caregiver_user.email} y paciente {patient_profile.user.email}.")
                return Response(
                    {"message": f"Enlace exitoso con el paciente {patient_profile.user.email}.", "patient_email": patient_profile.user.email},
                    status=status.HTTP_201_CREATED
                )

        except Patient.DoesNotExist:
            logger.warning(f"LinkPatientView: Token de enlace '{link_token}' no encontrado para cuidador {caregiver_user.email}.")
            return Response(
                {"error": "Token de enlace de paciente no válido o no encontrado."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"LinkPatientView: Error inesperado al vincular paciente para cuidador {caregiver_user.email}. Detalles: {e}", exc_info=True)
            return Response(
                {"error": "Error interno al procesar la solicitud de vinculación."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

