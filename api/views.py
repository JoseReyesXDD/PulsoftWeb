import os
import json
import requests
import logging

from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login, logout
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.backends import BaseBackend
from django.contrib import messages # Importar el módulo messages

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework import authentication

from firebase_admin import auth
from firebase_config import db
from google.cloud import firestore

from api.models import CustomUser
from .ia_logic import generate_diagnosis_and_suggestions

logger = logging.getLogger(__name__)


FIREBASE_WEB_API_KEY = "AIzaSyBnqdXDuWsMrdiKJpsUsElAskLIsEYUCjI"
rest_api_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword"


# --- Funciones de utilidad de Firebase ---
def create_user(email, password):
    """Crea un usuario en Firebase Authentication."""
    created_user = auth.create_user(email=email, password=password)
    return created_user.uid


def change_firebase_user_password(new_password, uid):
    """Cambia la contraseña de un usuario en Firebase Authentication."""
    auth.update_user(uid, password=new_password)


def change_firebase_user_email(uid, new_email):
    """Cambia el email de un usuario en Firebase Authentication."""
    auth.update_user(uid, email=new_email)


def delete_firebase_user(uid):
    """Elimina un usuario de Firebase Authentication."""
    auth.delete_user(uid)


def login_firebase_user(email, password):
    """Inicia sesión con un usuario en Firebase Authentication y retorna tokens."""
    payload = json.dumps({
        "email": email,
        "password": password,
        "returnSecureToken": True
    })

    r = requests.post(rest_api_url,
                      params={"key": FIREBASE_WEB_API_KEY},
                      data=payload)
    r.raise_for_status() # Lanza una excepción para códigos de estado de error (4xx o 5xx)
    return r.json()


def logout_firebase_user(uid):
    """Revoca los tokens de refresco de un usuario en Firebase Authentication."""
    auth.revoke_refresh_tokens(uid)


# --- Backend de Autenticación de Django para Firebase ---
class FirebaseBackend(BaseBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get('email')

        if not username or not password:
            return None

        try:
            # 1. Autenticar con Firebase
            firebase_response = login_firebase_user(username, password)
            uid = firebase_response.get('localId')

            user = None
            try:
                # Intento 1: Buscar el usuario por UID (la forma más confiable para un usuario de Firebase)
                user = CustomUser.objects.get(uid=uid)
                # Si lo encuentra por UID, asegura que el email/username esté actualizado en Django si ha cambiado en Firebase
                if user.email != username:
                    user.email = username
                    user.save()
                    logger.info(f"Usuario {username} (UID: {uid}) email actualizado en Django.")
                if user.username != username: # Esto es importante si el 'username' de Django es tu email
                    user.username = username
                    user.save()
                    logger.info(f"Usuario {username} (UID: {uid}) username actualizado en Django.")

            except CustomUser.DoesNotExist:
                # Intento 2: Si no existe un CustomUser con ese UID, ¿existe un usuario en Django con ese email/username?
                # Esto cubre el caso de usuarios preexistentes o registrados de otras maneras.
                try:
                    user = CustomUser.objects.get(username=username) 
                    # Si lo encontramos por username (email) pero no tiene UID de Firebase o el UID es distinto,
                    # significa que este es el mismo usuario, pero su cuenta de Django aún no está vinculada correctamente a Firebase.
                    # Vinculamos asignándole el UID de Firebase.
                    if not user.uid or user.uid != uid:
                        user.uid = uid
                        user.save()
                        logger.info(f"Usuario {username} encontrado por email en Django, vinculando con UID: {uid}.")

                except CustomUser.DoesNotExist:
                    # Intento 3: Si no existe un CustomUser ni por UID ni por username (email), entonces es un usuario completamente nuevo para la base de datos de Django.
                    user = CustomUser.objects.create(uid=uid, email=username, username=username)
                    logger.info(f"Nuevo CustomUser creado en Django para {username} (UID: {uid}).")

            return user

        except requests.exceptions.RequestException as e:
            error_message = ""
            if e.response:
                try:
                    error_data = e.response.json()
                    error_message = error_data.get('error', {}).get('message', str(e))
                except json.JSONDecodeError:
                    error_message = f"Error de Firebase: {e.response.text}"
            else:
                error_message = str(e)

            logger.error(f"Error de autenticación Firebase para {username}: {error_message}")
            if request:
                messages.error(request, f"Error de autenticación: {error_message}")
            return None

        except Exception as e: # Esto capturará cualquier otra excepción, incluyendo IntegrityError si la lógica anterior falla
            logger.error(f"Error inesperado en FirebaseBackend.authenticate: {e}", exc_info=True)
            if request:
                messages.error(request, f"Error inesperado durante la autenticación: {e}")
            return None

    def get_user(self, user_id):
        try:
            return CustomUser.objects.get(pk=user_id)
        except CustomUser.DoesNotExist:
            return None


# --- Autenticación de DRF para APIs (basada en token Firebase) ---
class FirebaseAuthentication(authentication.BaseAuthentication):
    """
    Clase de autenticación para Django REST Framework que valida tokens ID de Firebase.
    """
    def authenticate(self, request):
        token = request.headers.get('Authorization')
        if not token:
            return None

        try:
            # Esperamos "Bearer <token>"
            token = token.split(" ")[1]
            # Verifica el token ID con Firebase
            decoded_token = auth.verify_id_token(token, check_revoked=True)
            uid = decoded_token["uid"]
        except Exception as e:
            logger.warning(f"Fallo en la verificación de token Firebase: {e}")
            return None

        try:
            # Busca o crea el CustomUser en la base de datos de Django
            # Esto es importante para que request.user funcione con un objeto Django User
            user, created = CustomUser.objects.get_or_create(
                uid=uid,
                defaults={'email': decoded_token.get('email'), 'username': decoded_token.get('email')}
            )
            # Si el usuario fue creado, o si el email/username cambió en Firebase
            if created or user.email != decoded_token.get('email'):
                user.email = decoded_token.get('email')
                # Si tu CustomUser tiene un campo 'username', actualízalo también
                if hasattr(user, 'username') and user.username != decoded_token.get('email'):
                    user.username = decoded_token.get('email')
                user.save()

            return user, None # Autenticación exitosa, retorna (user, auth)

        except CustomUser.DoesNotExist:
            logger.error(f"CustomUser con UID {uid} no encontrado en la base de datos local.")
            return None
        except Exception as e:
            logger.error(f"Error al obtener CustomUser en FirebaseAuthentication: {e}", exc_info=True)
            return None

    def get_user(self, user_id):
        """Método requerido por BaseAuthentication para obtener el usuario."""
        try:
            return CustomUser.objects.get(pk=user_id)
        except CustomUser.DoesNotExist:
            return None


# --- Vistas para renderizar Plantillas HTML (Django Views) ---
def home_view(request):
    """Renderiza la página de inicio."""
    return render(request, 'home.html')

def register_html_view(request):
    """
    Maneja el registro de usuarios a través de un formulario HTML.
    Crea el usuario en Firebase y lo loguea en Django.
    """
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')

        if not email or not password:
            messages.error(request, 'Email y contraseña son requeridos.')
            return render(request, 'register.html', {'error': 'Email y contraseña son requeridos.'})

        try:
            uid = create_user(email, password) # Llama a tu función de Firebase
            
            # Crea o actualiza el CustomUser en la base de datos de Django
            user, created = CustomUser.objects.get_or_create(
                email=email,
                defaults={'uid': uid, 'username': email} # username de Django lo igualamos al email
            )
            if not created and not user.uid: # Si ya existía pero sin UID, asignárselo
                user.uid = uid
                user.save()
            
            # Loguea al usuario en la sesión de Django usando el backend de Firebase
            login(request, user, backend='api.backends.FirebaseBackend') 
            
            messages.success(request, '¡Registro exitoso! Has iniciado sesión.')
            return redirect('dashboard') # Redirige al dashboard después del registro exitoso
        except Exception as e:
            logger.error(f"Error en register_html_view: {e}", exc_info=True)
            messages.error(request, f'Error al registrar usuario: {e}')
            return render(request, 'register.html', {'error': str(e)}) # Mantener el error para compatibilidad
    return render(request, 'register.html')


def login_html_view(request):
    """
    Maneja el inicio de sesión de usuarios a través de un formulario HTML.
    Autentica con Firebase y loguea en Django.
    """
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            email = form.cleaned_data.get('username') # AuthenticationForm usa 'username' por defecto
            password = form.cleaned_data.get('password')
            
            user = None
            try:
                # *** CAMBIO CLAVE AQUÍ ***
                # Importa la función authenticate para usar tu backend directamente
                from django.contrib.auth import authenticate 
                
                # Primero, llama a tu backend para autenticar al usuario y obtener el objeto user
                user = authenticate(request=request, email=email, password=password, backend='api.backends.FirebaseBackend')
                
                if user is not None:
                    # Si la autenticación es exitosa y obtenemos un objeto user, entonces lo logueamos en Django
                    login(request, user) # La función login() ya no necesita 'username', 'password' ni 'backend' aquí
                                         # porque el usuario ya ha sido autenticado.
                    messages.success(request, '¡Inicio de sesión exitoso!')
                    return redirect('dashboard')
                else:
                    # Si el usuario es None, significa que la autenticación falló en el backend
                    messages.error(request, "Credenciales inválidas o error de autenticación. Por favor, verifica tu email y contraseña.")
            
            except Exception as e:
                logger.error(f"Error durante el intento de login Django: {e}", exc_info=True)
                messages.error(request, f"Error inesperado durante la autenticación: {e}")
                # Si ocurrió una excepción, no intentes login con un user que no existe o es None
                
        else:
            # Si el formulario no es válido (ej. campos vacíos)
            for field, errors in form.errors.items():
                for error in errors:
                    messages.error(request, f"Error en {field}: {error}")
            messages.error(request, "Por favor, corrige los errores en el formulario.")
        
    else:
        form = AuthenticationForm() # Crea un formulario vacío para GET
    return render(request, 'login.html', {'form': form, 'messages': messages.get_messages(request)})


@login_required(login_url='/login/') # Redirige a /login/ si el usuario no está autenticado
def dashboard_view(request):
    """Renderiza el panel de control del usuario (requiere autenticación)."""
    return render(request, 'dashboard.html')


def logout_html_view(request):
    """Cierra la sesión del usuario tanto en Firebase como en Django."""
    if request.user.is_authenticated:
        try:
            # Primero intenta revocar el token en Firebase
            logout_firebase_user(request.user.uid)
            messages.info(request, 'Has cerrado sesión en Firebase.')
        except Exception as e:
            logger.warning(f"Error al revocar token de Firebase para UID {request.user.uid}: {e}")
            messages.warning(request, 'No se pudo cerrar sesión en Firebase, pero tu sesión local será cerrada.')
        logout(request) # Cierra la sesión de Django
        messages.success(request, 'Has cerrado sesión correctamente.')
    else:
        messages.info(request, 'No tenías una sesión activa.')
    return redirect('home') # Redirige a la página de inicio


# --- Vistas API (Django REST Framework) ---

@method_decorator(csrf_exempt, name='dispatch') # Para permitir POST sin CSRF token en esta vista (si es directa y no DRF APIView)
class AnalyzeNoteView(View): # NOTA: Esta es una django.views.View, no una rest_framework.views.APIView
    def post(self, request, *args, **kwargs):
        try:
            data = json.loads(request.body)
            note = data.get('note', '')

            if not note:
                return JsonResponse({'error': 'El campo "note" es requerido'}, status=400)

            generated_response = generate_diagnosis_and_suggestions(note)

            if generated_response.startswith("Error:"):
                return JsonResponse({'error': generated_response}, status=500)

            try:
                doc_ref = db.collection('analisis_clinicos').document()
                doc_ref.set({
                    'nota_original': note,
                    'analisis_ia': generated_response,
                    'fecha_creacion': firestore.SERVER_TIMESTAMP
                })
                logger.info(f"Análisis guardado en Firebase con ID: {doc_ref.id}")
            except Exception as firebase_error:
                logger.error(f"Error al guardar en Firebase: {firebase_error}", exc_info=True)

            return JsonResponse({'analisis_completo': generated_response})

        except json.JSONDecodeError:
            return JsonResponse({'error': 'Formato JSON inválido en el cuerpo de la solicitud'}, status=400)
        except Exception as e:
            logger.error(f"Error en AnalyzeNoteView: {e}", exc_info=True)
            return JsonResponse({'error': str(e)}, status=500)

    def get(self, request, *args, **kwargs):
        return JsonResponse({'message': 'Endpoint de análisis de notas. Usa POST para enviar una nota.'}, status=200)


class RegisterUserView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({"error": "Email y contraseña son requeridos."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            uid = create_user(email, password)
            user, created = CustomUser.objects.get_or_create(
                email=email,
                defaults={'uid': uid, 'username': email}
            )
            if not created:
                logger.info(f"Usuario {email} ya existía en Django, solo se confirmó UID de Firebase.")

            return Response(
                {"message": "Usuario registrado exitosamente.", "uid": uid},
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            logger.error(f"Error al registrar usuario API: {e}", exc_info=True)
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class LoginUserView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({"error": "Email y contraseña son requeridos."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            firebase_response = login_firebase_user(email, password)
            return Response(firebase_response, status=status.HTTP_200_OK)
        except requests.exceptions.RequestException as e:
            error_data = e.response.json() if e.response else {"message": "Error desconocido durante el inicio de sesión."}
            logger.error(f"Error de login Firebase (API): {error_data}", exc_info=True)
            return Response({"error": error_data}, status=e.response.status_code if e.response else status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            logger.error(f"Error inesperado en LoginUserView: {e}", exc_info=True)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ChangePasswordView(APIView):
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        new_password = request.data.get('new_password')
        user = request.user

        if not new_password:
            return Response({"error": "La nueva contraseña es requerida."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            change_firebase_user_password(new_password, user.uid)
            return Response({"message": "Contraseña cambiada exitosamente."}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error al cambiar contraseña: {e}", exc_info=True)
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ChangeEmailView(APIView):
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        new_email = request.data.get('new_email')
        user = request.user

        if not new_email:
            return Response({"error": "El nuevo email es requerido."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            change_firebase_user_email(user.uid, new_email)
            user.email = new_email
            # Si tu CustomUser tiene un campo 'username', actualízalo también
            if hasattr(user, 'username'):
                user.username = new_email
            user.save()
            return Response({"message": "Email cambiado exitosamente."}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error al cambiar email: {e}", exc_info=True)
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class DeleteUserView(APIView):
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        user = request.user

        try:
            delete_firebase_user(user.uid)
            user.delete() # Elimina el usuario de la DB de Django también
            return Response({"message": "Usuario eliminado exitosamente."}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Error al eliminar usuario: {e}", exc_info=True)
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class LogoutUserView(APIView):
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        try:
            logout_firebase_user(user.uid)
            return Response({"message": "Sesión de usuario cerrada (token de refresco revocado)."}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error al cerrar sesión API: {e}", exc_info=True)
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class AIDiagnosisView(APIView):
    authentication_classes = [FirebaseAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        input_data = request.data.get('input_data')

        if not input_data:
            return Response({"error": "Se requieren datos de entrada para el diagnóstico."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            diagnosis, suggestions = generate_diagnosis_and_suggestions(input_data)
            return Response(
                {"diagnosis": diagnosis, "suggestions": suggestions},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"Error en AIDiagnosisView: {e}", exc_info=True)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)