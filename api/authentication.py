import logging

from rest_framework import authentication
from firebase_admin import auth

from api.models import CustomUser

logger = logging.getLogger(__name__)

class FirebaseAuthentication(authentication.BaseAuthentication):
    """
    Clase de autenticación para Django REST Framework que valida tokens ID de Firebase.
    Se utiliza para proteger los endpoints de la API asegurando que solo usuarios
    autenticados con Firebase puedan acceder.
    """
    def authenticate(self, request):
        """
        Intenta autenticar al usuario usando el token de autorización "Bearer"
        en las cabeceras de la petición.
        Verifica el token con Firebase y busca/crea el CustomUser en Django.
        """
        token = request.headers.get('Authorization')
        if not token:
            logger.debug("No se encontró el token de autorización en la cabecera.")
            return None

        try:
            # Se espera que el token esté en el formato "Bearer <token_id_firebase>"
            token = token.split(" ")[1]
            # Verifica el token ID con Firebase Authentication.
            # check_revoked=True asegura que el token no haya sido revocado.
            decoded_token = auth.verify_id_token(token, check_revoked=True)
            uid = decoded_token["uid"]
            logger.info(f"Token Firebase verificado para UID: {uid}")
        except IndexError:
            logger.warning("Formato de token de autorización inválido (no 'Bearer <token>').")
            return None
        except Exception as e:
            logger.warning(f"Fallo en la verificación de token Firebase: {e}")
            return None

        try:
            # Busca o crea el CustomUser en la base de datos de Django.
            # Esto es esencial para que `request.user` funcione correctamente
            # con un objeto User de Django en las vistas de DRF.
            user, created = CustomUser.objects.get_or_create(
                uid=uid,
                defaults={
                    'email': decoded_token.get('email'), 
                    'username': decoded_token.get('email') # Django AuthenticationForm usa 'username' por defecto
                }
            )
            
            # Si el usuario ya existía y su email o username en Django difiere del de Firebase,
            # lo actualizamos para mantener la sincronización.
            if not created and (user.email != decoded_token.get('email') or \
                               (hasattr(user, 'username') and user.username != decoded_token.get('email'))):
                user.email = decoded_token.get('email')
                if hasattr(user, 'username'): # Asegúrate de que el campo 'username' exista
                    user.username = decoded_token.get('email')
                user.save()
                logger.info(f"CustomUser {user.email} (UID: {uid}) actualizado en Django.")
            elif created:
                logger.info(f"Nuevo CustomUser creado en Django para UID: {uid}.")

            return user, None # Autenticación exitosa, retorna (user, auth_token) donde auth_token es None para DRF

        except CustomUser.DoesNotExist:
            logger.error(f"CustomUser con UID {uid} no encontrado en la base de datos local después de verificación.")
            return None
        except Exception as e:
            logger.error(f"Error al obtener/crear CustomUser en FirebaseAuthentication: {e}", exc_info=True)
            return None

    def get_user(self, user_id):
        """
        Método requerido por BaseAuthentication para obtener un usuario por su ID de Django.
        Se usa principalmente para la serialización de sesiones si es necesario,
        pero en DRF con tokens, el método `authenticate` es el más relevante.
        """
        try:
            return CustomUser.objects.get(pk=user_id)
        except CustomUser.DoesNotExist:
            logger.debug(f"Usuario CustomUser con ID {user_id} no encontrado.")
            return None
