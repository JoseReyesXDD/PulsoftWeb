import json
import requests
import logging

from django.contrib.auth.backends import BaseBackend
from django.contrib import messages
from django.db import IntegrityError 

from api.models import CustomUser
from .firebase_utils import login_firebase_user 

logger = logging.getLogger(__name__)

class FirebaseBackend(BaseBackend):
    """
    Backend de autenticación para Django que se integra con Firebase Authentication.
    Autentica usuarios contra Firebase y los sincroniza con el modelo CustomUser de Django.
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        """
        Método principal para autenticar un usuario.
        Utiliza el email/password para autenticar con Firebase y luego sincroniza
        o crea el CustomUser en la base de datos de Django.
        """
        # Permite que 'email' se pase como 'username' o directamente como 'email'
        if username is None:
            username = kwargs.get('email')

        if not username or not password:
            logger.debug("Intento de autenticación sin email o contraseña.")
            return None

        try:
            # 1. Autenticar con Firebase usando la función de utilidad
            firebase_response = login_firebase_user(username, password)
            uid = firebase_response.get('localId')

            if not uid:
                logger.error(f"Respuesta de Firebase no contiene 'localId' para {username}.")
                return None

            user = None
            try:
                # Intento 1: Buscar el usuario CustomUser por UID (la forma más confiable para un usuario de Firebase)
                user = CustomUser.objects.get(uid=uid)
                
                # Si lo encuentra por UID, asegura que el email/username esté actualizado en Django si ha cambiado en Firebase.
                if user.email != username:
                    user.email = username
                    user.save()
                    logger.info(f"Usuario {username} (UID: {uid}) email actualizado en Django.")
                # Asegúrate de que el username de Django también esté sincronizado con el email de Firebase
                if user.username != username: 
                    user.username = username
                    user.save()
                    logger.info(f"Usuario {username} (UID: {uid}) username actualizado en Django.")

            except CustomUser.DoesNotExist:
                # Intento 2: Si no existe un CustomUser con ese UID, ¿existe un usuario en Django con ese email/username?
                # Esto cubre el caso de usuarios preexistentes o registrados de otras maneras en Django
                # antes de la integración completa con Firebase o si el UID no se guardó previamente.
                try:
                    user = CustomUser.objects.get(username=username) 
                    # Si lo encontramos por username (email) pero no tiene UID de Firebase o el UID es distinto,
                    # vinculamos la cuenta de Django con el UID de Firebase.
                    if not user.uid or user.uid != uid:
                        user.uid = uid
                        user.save()
                        logger.info(f"Usuario {username} encontrado por email en Django, vinculando con UID: {uid}.")

                except CustomUser.DoesNotExist:
                    # Intento 3: Si no existe un CustomUser ni por UID ni por username (email), 
                    # entonces es un usuario completamente nuevo para la base de datos de Django.
                    # Lo creamos y asignamos el UID de Firebase.
                    try:
                        user = CustomUser.objects.create(uid=uid, email=username, username=username)
                        logger.info(f"Nuevo CustomUser creado en Django para {username} (UID: {uid}).")
                    except IntegrityError as ie:
                        logger.error(f"Error de integridad al crear CustomUser para {username}: {ie}", exc_info=True)
                        # Esto podría ocurrir si ya existe un usuario con ese email/username pero no con ese UID
                        # o viceversa, y las restricciones de unicidad fallan.
                        if request:
                            messages.error(request, "Error interno: Ya existe una cuenta con este email pero no se pudo vincular. Contacta al soporte.")
                        return None


            return user # Retorna el objeto CustomUser si la autenticación fue exitosa

        except requests.exceptions.RequestException as e:
            # Captura errores específicos de las peticiones HTTP a la API de Firebase
            error_message = "Error desconocido durante la comunicación con Firebase."
            if e.response:
                try:
                    error_data = e.response.json()
                    error_message = error_data.get('error', {}).get('message', str(e.response.text))
                except json.JSONDecodeError:
                    error_message = f"Error de Firebase: {e.response.text}"
            else:
                error_message = str(e)

            logger.error(f"Error de autenticación Firebase para {username}: {error_message}")
            if request:
                messages.error(request, f"Error de autenticación: {error_message}")
            return None

        except Exception as e:
            # Captura cualquier otra excepción inesperada
            logger.error(f"Error inesperado en FirebaseBackend.authenticate: {e}", exc_info=True)
            if request:
                messages.error(request, f"Error inesperado durante la autenticación: {e}")
            return None

    def get_user(self, user_id):
        """
        Método requerido por BaseBackend para obtener un usuario por su ID de Django.
        """
        try:
            return CustomUser.objects.get(pk=user_id)
        except CustomUser.DoesNotExist:
            logger.debug(f"Usuario CustomUser con ID {user_id} no encontrado.")
            return None
