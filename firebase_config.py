import firebase_admin
from firebase_admin import credentials, firestore, db as db_alias

cred = credentials.Certificate('firebase_key.json')
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://pulsoft-fc676-default-rtdb.firebaseio.com/'
})
db = firestore.client()
db_realtime = db_alias.reference()