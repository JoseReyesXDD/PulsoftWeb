import firebase_admin
from firebase_admin import firestore, db as db_alias
try:
    default_app = firebase_admin.get_app()
except ValueError:
    print("Error: La aplicación Firebase no ha sido inicializada. Asegúrate de que settings.py se carga correctamente.")
db = firestore.client(app=default_app)
db_realtime = db_alias.reference(app=default_app)