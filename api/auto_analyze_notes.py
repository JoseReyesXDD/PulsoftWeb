import os
import time
import torch
import logging
from datetime import datetime, timedelta
from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM
from firebase_admin import firestore

# Configurar logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from firebase_config import db

# Ruta del modelo fine-tuneado
MODEL_PATH = os.path.join(os.getcwd(), 'fine_tuned_distilgpt2_model')

# Cargar modelo y tokenizer
logger.debug(f"Intentando cargar el modelo fine-tuneado desde: {MODEL_PATH}")
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = AutoModelForCausalLM.from_pretrained(MODEL_PATH)

# Forzar CPU
device = torch.device("cpu")
model.to(device)
logger.info("Modelo fine-tuneado para generación de texto cargado correctamente en Django.")

# Crear el pipeline de generación de texto
generator = pipeline("text-generation", model=model, tokenizer=tokenizer, device=-1)

# Intervalo de análisis (segundos)
INTERVAL = 10

def analyze_notes():
    logger.info("Iniciando escaneo de notas recientes...")

    users_ref = db.collection("users")
    users = users_ref.stream()

    for user in users:
        user_id = user.id
        notes_ref = users_ref.document(user_id).collection("notes")
        notes = notes_ref.stream()

        for note in notes:
            note_data = note.to_dict()
            note_id = note.id

            # Saltar si ya tiene análisis
            if "analysis" in note_data:
                continue

            content = note_data.get("content", "")
            if not content:
                continue

            logger.debug(f"Analizando nota para user {user_id}: {note_id}")

            # Generar análisis
            analysis_output = generator(content, max_length=100, num_return_sequences=1)[0]["generated_text"]

            # Guardar análisis en Firestore
            notes_ref.document(note_id).update({
                "analysis": analysis_output,
                "analyzed_at": datetime.utcnow()
            })

            logger.info(f"Análisis guardado para nota {note_id} del usuario {user_id}")

if __name__ == "__main__":
    logger.info("Iniciando loop automático de análisis cada 10 segundos...\n")
    while True:
        try:
            analyze_notes()
            time.sleep(INTERVAL)
        except Exception as e:
            logger.error(f"Error durante el análisis automático: {e}")
            time.sleep(INTERVAL)
