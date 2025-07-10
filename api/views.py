import logging
from django.contrib.auth import authenticate
from django.contrib import messages
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from firebase_config import db, db_realtime
from google.cloud import firestore

# Importa todas las vistas de Django/DRF que actúan como endpoints de API.
from .api_views import AnalyzeNoteView, AIDiagnosisView, LinkPatientView

# Configuración del logger para este archivo
logger = logging.getLogger(__name__)