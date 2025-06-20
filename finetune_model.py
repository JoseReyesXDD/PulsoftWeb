# pulsoftWeb/finetune_model.py

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, TrainingArguments, Trainer, DataCollatorForLanguageModeling
from datasets import load_dataset, DatasetDict
import os # Necesario para os.cpu_count() y otras operaciones de sistema

# --- 1. Definir rutas y nombres ---
# Ruta donde se encuentra tu archivo JSONL
# Este archivo debe estar en la misma carpeta que este script (pulsoftWeb)
dataset_path = "./notes_dataset.jsonl"

# Directorio donde se guardará el modelo fine-tuneado
# Se creará en la raíz de tu proyecto pulsoftWeb
output_dir = "./fine_tuned_distilgpt2_model"

# Nombre del modelo base de Hugging Face que vamos a fine-tunear
model_name = "distilgpt2"

# --- 2. Cargar el Tokenizador y el Modelo Base ---
# Se cargan fuera del bloque `if __name__ == '__main__':`
# para que la función `tokenize_function` pueda acceder al tokenizador
print(f"Cargando tokenizador y modelo base '{model_name}'...")
tokenizer = AutoTokenizer.from_pretrained(model_name)

# Es una buena práctica asegurar que el token de padding esté definido.
# Para modelos generativos como GPT, a menudo se usa el token de fin de secuencia (EOS) como padding.
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token

model = AutoModelForCausalLM.from_pretrained(model_name)
print("Tokenizador y modelo cargados.")


# --- Función de tokenización ---
# Esta función será aplicada a cada ejemplo del dataset.
# Es importante que sea una función de nivel superior (no anidada) si se usa con multiprocessing.
def tokenize_function(examples):
    # 'text' es la columna por defecto que `load_dataset` crea para archivos JSONL.
    # `truncation=True` asegura que las secuencias largas se corten a `max_length`.
    # `max_length=512` es un valor común para DistilGPT-2.
    return tokenizer(examples["text"], truncation=True, max_length=512)


# --- Bloque principal para asegurar la compatibilidad con multiprocessing en Windows ---
# Todo el código de creación de procesos (como `dataset.map` con `num_proc > 1`)
# debe estar dentro de este bloque en sistemas Windows.
if __name__ == '__main__':
    # `freeze_support()` es esencial para el funcionamiento de `multiprocessing` en Windows
    # cuando se empaqueta o se usa de ciertas maneras.
    from multiprocessing import freeze_support
    freeze_support()

    # --- 3. Cargar y Preprocesar el Dataset ---
    print(f"Cargando dataset desde '{dataset_path}'...")
    # `load_dataset` detecta automáticamente el formato JSONL si el archivo tiene extensión .jsonl
    dataset = load_dataset("json", data_files=dataset_path)

    # Si `load_dataset` carga un `DatasetDict` (lo cual es común), accedemos a la clave 'train'.
    # Si ya es un `Dataset`, esta línea no hará nada.
    if isinstance(dataset, DatasetDict) and 'train' in dataset:
        dataset = dataset['train']

    print(f"Dataset cargado. Primer ejemplo (primeros 200 chars): {dataset[0]['text'][:200]}...")

    # Tokenizar el dataset
    print("Tokenizando el dataset...")
    # Se usa `num_proc=1` para evitar el `RuntimeError` en sistemas Windows.
    # Para 200 ejemplos, el paralelismo no es crítico y la ejecución será rápida de todas formas.
    tokenized_dataset = dataset.map(tokenize_function, batched=True, num_proc=1, remove_columns=["text"])
    print("Dataset tokenizado.")

    # --- 4. Crear el Data Collator ---
    # El Data Collator se encarga de preparar los lotes de datos para el modelo,
    # incluyendo el relleno (padding) de secuencias a la misma longitud y la creación de las etiquetas (labels).
    # `mlm=False` es crucial para modelos de lenguaje causal (como GPT-2), ya que no usan Masked Language Modeling.
    data_collator = DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False)

    # --- 5. Dividir el Dataset en Entrenamiento y Validación ---
    print("Dividiendo el dataset en entrenamiento y validación...")
    # Se divide el dataset en un 90% para entrenamiento y un 10% para validación.
    # `seed=42` asegura que la división sea la misma cada vez que se ejecuta el script.
    train_test_split = tokenized_dataset.train_test_split(test_size=0.1, seed=42)
    train_dataset = train_test_split["train"]
    eval_dataset = train_test_split["test"]

    print(f"Número de ejemplos de entrenamiento: {len(train_dataset)}")
    print(f"Número de ejemplos de validación: {len(eval_dataset)}")

    # --- 6. Configurar los Argumentos de Entrenamiento ---
    print("Configurando argumentos de entrenamiento...")
    # `TrainingArguments` define la configuración para el proceso de entrenamiento.
    training_args = TrainingArguments(
        output_dir=output_dir,                # Directorio donde el Trainer guardará checkpoints y el modelo final
        overwrite_output_dir=True,            # Permite sobrescribir el directorio de salida si ya existe
        num_train_epochs=10,                  # Número total de épocas de entrenamiento (pasadas completas sobre el dataset)
        per_device_train_batch_size=4,        # Tamaño del lote por dispositivo (CPU/GPU) para entrenamiento
        per_device_eval_batch_size=4,         # Tamaño del lote por dispositivo para evaluación
        learning_rate=3e-5,                   # Tasa de aprendizaje inicial, un valor común para fine-tuning
        weight_decay=0.01,                    # Regularización L2 para evitar el sobreajuste (overfitting)
        logging_dir="./logs",                 # Directorio para los logs de TensorBoard (útil para monitorear el entrenamiento)
        logging_steps=20,                     # Cuántos pasos antes de registrar las métricas de entrenamiento
        save_steps=100,                       # Cuántos pasos antes de guardar un checkpoint del modelo
        save_total_limit=2,                   # Limita el número de checkpoints guardados (mantiene los 2 últimos)
        # CORRECCIÓN: 'evaluation_strategy' se ha renombrado a 'eval_strategy' en versiones recientes de transformers.
        eval_strategy="steps",                # Estrategia de evaluación: "steps" para evaluar cada `eval_steps`
        eval_steps=100,                       # Realizar una evaluación cada 100 pasos de entrenamiento
        load_best_model_at_end=True,          # Cargar el mejor modelo encontrado (según `metric_for_best_model`) al final del entrenamiento
        metric_for_best_model="eval_loss",    # La métrica usada para determinar el "mejor" modelo durante la evaluación
        greater_is_better=False,              # Para 'eval_loss', un valor más bajo es mejor
        report_to="tensorboard",              # Habilita el reporte de métricas a TensorBoard (requiere `pip install tensorboard`)
        # fp16=True if torch.cuda.is_available() else False, # Descomentar y descomentar la importación de `torch` si tienes una GPU NVIDIA con CUDA                             # Esto permite usar entrenamiento de precisión mixta para acelerar.
    )

    # --- 7. Crear el Trainer y Entrenar el Modelo ---
    print("Creando el Trainer...")
    # El Trainer es la clase principal de Hugging Face para el fine-tuning.
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,
        tokenizer=tokenizer,      # Se pasa el tokenizador al Trainer para ciertas operaciones internas
        data_collator=data_collator, # Se pasa el data collator para procesar los lotes
    )

    # ¡Inicia el entrenamiento!
    print("Iniciando el entrenamiento...")
    try:
        trainer.train() # Este método ejecuta el ciclo de entrenamiento
        print("Entrenamiento finalizado.")

        # --- 8. Guardar el Modelo Fine-tuneado Final ---
        # Aunque `load_best_model_at_end=True` carga el mejor modelo,
        # guardarlo explícitamente asegura que tengas la versión final en disco.
        trainer.save_model(output_dir)
        tokenizer.save_pretrained(output_dir) # Siempre guarda el tokenizador junto con el modelo

        print(f"Modelo fine-tuneado guardado en: {output_dir}")

    except Exception as e:
        print(f"Ocurrió un error durante el entrenamiento: {e}")
        print("Por favor, verifica:")
        print("- Que todas las dependencias (transformers, datasets, accelerate, torch) estén instaladas.")
        print("- Que el archivo 'notes_dataset.jsonl' exista en la misma ubicación que este script.")
        print("- Que tu sistema tenga suficiente memoria RAM para el proceso (especialmente en CPU).")