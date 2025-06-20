import os
from transformers import pipeline, AutoTokenizer, AutoModelForCausalLM
import torch

FINE_TUNED_MODEL_PATH = os.path.abspath(os.path.join(os.getcwd(), 'fine_tuned_distilgpt2_model'))

generator_pipeline = None
tokenizer = None
model = None
device = None

print(f"DEBUG: Intentando cargar el modelo fine-tuneado desde: {FINE_TUNED_MODEL_PATH}")

try:
    tokenizer = AutoTokenizer.from_pretrained(FINE_TUNED_MODEL_PATH)
    model = AutoModelForCausalLM.from_pretrained(FINE_TUNED_MODEL_PATH)

    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device)
    model.eval()

    generator_pipeline = pipeline(
        "text-generation",
        model=model,
        tokenizer=tokenizer,
        device=0 if torch.cuda.is_available() else -1,
    )
    print("DEBUG: Modelo fine-tuneado para generación de texto cargado correctamente en Django.")

except Exception as e:
    print(f"ERROR: No se pudo cargar el modelo fine-tuneado en ia_logic.py. Detalles: {e}")
    print(f"Asegúrate de que la ruta '{FINE_TUNED_MODEL_PATH}' es correcta y el modelo existe.")
    generator_pipeline = None


def generate_diagnosis_and_suggestions(note: str) -> str:
    """
    Genera un texto de diagnóstico y sugerencias para un paciente
    basado en una nota clínica, utilizando el modelo de generación de texto fine-tuneado.
    """
    if generator_pipeline is None:
        return "Error: El modelo de IA no se pudo cargar en la aplicación Django. Por favor, revisa la configuración y los logs."

    prompt = f"""
Nota: {note}
### Análisis del caso:
1. **Causa probable:** Describe de forma concreta el evento o situación que desencadenó el problema, evitando el uso de "posiblemente".
2. **Diagnóstico:** Indica claramente el diagnóstico principal.
3. **Sugerencias de Prevención/Manejo:** Ofrece pasos de acción específicos y concretos para evitar que la situación se repita o para manejarla.
"""
    try:
        generated_results = generator_pipeline(
            prompt,
            max_new_tokens=500,       
            num_return_sequences=1,
            temperature=0.7,            
            top_p=0.9,                  
            do_sample=True,            
            num_beams=1,                
            no_repeat_ngram_size=3,    
            early_stopping=False,       
            pad_token_id=tokenizer.pad_token_id,
        )
        generated_text = generated_results[0]['generated_text']

        print("\n--- TEXTO GENERADO CRUDO (ANTES DEL POST-PROCESAMIENTO) ---")
        print(generated_text)
        print("----------------------------------------------------------\n")

        final_response = generated_text
        clean_prompt = ' '.join(prompt.split()).strip()
        start_index = generated_text.find(prompt) 
        if start_index == -1:
            start_index = generated_text.find(clean_prompt)
        
        if start_index != -1:
            if generated_text[start_index : start_index + len(prompt)] == prompt:
                final_response = generated_text[start_index + len(prompt):].strip()
            elif generated_text[start_index : start_index + len(clean_prompt)] == clean_prompt:
                final_response = generated_text[start_index + len(clean_prompt):].strip()
            else:
                final_response = generated_text[start_index:].strip()
        else:
            final_response = generated_text.strip()
        
        if "Nota:" in final_response:
            final_response = final_response.split("Nota:", 1)[0].strip()
        
        if not final_response:
            print("DEBUG: La respuesta final después del post-procesamiento está vacía. Devolviendo texto generado crudo para depuración.")
            return generated_text 

        return final_response

    except Exception as e:
        print(f"ERROR: Excepción en generate_diagnosis_and_suggestions: {e}")
        return f"Error al generar diagnóstico/sugerencias con el modelo fine-tuneado: {e}"