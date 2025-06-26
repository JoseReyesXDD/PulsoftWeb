import json
import requests
import logging

from firebase_admin import auth

FIREBASE_WEB_API_KEY = "AIzaSyBnqdXDuWsMrdiKJpsUsElAskLIsEYUCjI"
rest_api_url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword"

logger = logging.getLogger(__name__)

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
