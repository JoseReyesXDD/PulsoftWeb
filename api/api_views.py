# api/api_views.py
import logging
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView

from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

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