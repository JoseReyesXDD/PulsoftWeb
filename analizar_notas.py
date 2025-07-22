import firebase_admin
from firebase_admin import credentials, firestore
import requests
from datetime import datetime

# Inicializar Firebase Admin SDK una sola vez
try:
    firebase_admin.get_app()
except ValueError:
    cred = credentials.Certificate("firebase_key.json")  # Asegúrate de que esté en la raíz del proyecto
    firebase_admin.initialize_app(cred)

db = firestore.client()

def analizar_y_guardar_analisis_ia():
    print("Iniciando análisis de notas...")
    usuarios_ref = db.collection('users')
    usuarios = usuarios_ref.stream()

    for usuario in usuarios:
        uid = usuario.id
        print(f"Analizando notas del usuario: {uid}")
        notas_ref = usuarios_ref.document(uid).collection('notes')

        #No filtramos por analisis_IA para evitar inconsistencias
        notas = notas_ref.limit(10).stream()

        for nota_doc in notas:
            nota_data = nota_doc.to_dict()
            content = nota_data.get("content")
            ya_tiene_analisis = "analisis_IA" in nota_data

            if content and not ya_tiene_analisis:
                try:
                    print(f"Analizando nota {nota_doc.id}...")
                    response = requests.post(
                        "http://127.0.0.1:8000/api/analyze-note/",
                        json={"note": content},
                        timeout=120  # Aumentado para IA lenta
                    )

                    if response.status_code == 200:
                        analisis = response.json().get("analisis_completo", "Sin análisis")
                        notas_ref.document(nota_doc.id).update({
                            "analisis_IA": analisis,
                            "analizadoEn": datetime.utcnow()
                        })
                        print(f"Análisis guardado para nota {nota_doc.id}")
                    else:
                        print(f"Falló análisis: {response.status_code} - {response.text}")

                except requests.exceptions.Timeout:
                    print(f"Timeout alcanzado en la nota {nota_doc.id} de {uid}.")
                except Exception as e:
                    print(f"Error inesperado con UID {uid}, nota {nota_doc.id}: {e}")
            else:
                if ya_tiene_analisis:
                    print(f"Nota {nota_doc.id} ya tiene análisis.")
                else:
                    print(f"Nota {nota_doc.id} vacía o sin contenido válido.")

    print("Proceso de análisis finalizado.")

if __name__ == "__main__":
    analizar_y_guardar_analisis_ia()
