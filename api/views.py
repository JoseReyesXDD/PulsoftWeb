import logging
from django.contrib.auth import authenticate 
from django.contrib import messages 
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from firebase_config import db, db_realtime 
from google.cloud import firestore

# --- Importaciones de los módulos refactorizados ---
# Importa las funciones de utilidad de Firebase Authentication.
from .firebase_utils import create_user, login_firebase_user, logout_firebase_user 

# Importa el Backend de Autenticación de Django para Firebase.
# Es crucial para la configuración AUTHENTICATION_BACKENDS en settings.py.
from .backends import FirebaseBackend 

# Importa la clase de autenticación de DRF para Firebase.
# Usada por las clases APIView que requieren autenticación.
from .authentication import FirebaseAuthentication

# Importa todas las vistas de Django que renderizan plantillas HTML.
from .html_views import home_view, register_html_view, login_html_view, dashboard_view, logout_html_view, patient_selection_html_view, select_patient_view

# Importa todas las vistas de Django/DRF que actúan como endpoints de API.
from .api_views import AnalyzeNoteView, AIDiagnosisView, LinkPatientView

# --- Importaciones de Modelos y Lógica de Negocio ---
# CustomUser es fundamental para los backends de autenticación y la gestión de usuarios.
from api.models import CustomUser
# La lógica de IA es usada por las vistas de análisis/diagnóstico.
from .ia_logic import generate_diagnosis_and_suggestions

# Configuración del logger para este archivo
logger = logging.getLogger(__name__)
