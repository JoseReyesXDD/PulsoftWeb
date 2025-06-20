# pulsoftWeb/generate_dataset.py

import json
import random

def generate_note_data():
    """Genera una única entrada de nota clínica simulada con diagnóstico y sugerencias."""
    detonantes_comunes = [
        "mucho estrés laboral", "presión académica por exámenes", "problemas financieros inesperados",
        "conflictos familiares recientes", "una discusión con la pareja", "un viaje inminente",
        "cambios importantes en la vida (mudanza, nuevo trabajo)", "problemas de salud de un ser querido",
        "exceso de cafeína", "falta de sueño", "ambiente ruidoso y concurrido",
        "un evento social grande", "noticias negativas en televisión", "sentirse solo",
        "pensamientos rumiantes sobre el futuro", "un olor fuerte en el transporte público",
        "la fecha límite de un proyecto", "presentación en público", "espera de resultados médicos",
        "sentimientos de inseguridad personal", "críticas en el trabajo", "incertidumbre económica",
        "ruido de obras en la calle", "estar atrapado en el tráfico", "sensación de encierro",
        "miedo a no cumplir expectativas", "un correo electrónico inesperado", "una llamada telefónica de un número desconocido",
        "la sobrecarga de información en redes sociales", "un recuerdo traumático"
    ]


    sintomas_comunes = [
        "opresión en el pecho", "dificultad para respirar", "palpitaciones", "sudoración excesiva",
        "mareos", "náuseas", "temblores", "sensación de irrealidad", "entumecimiento en las extremidades",
        "dolor de cabeza tensional", "tensión muscular en cuello y hombros", "problemas digestivos",
        "insomnio", "dificultad para concentrarse", "irritabilidad", "nerviosismo extremo",
        "sensación de nudo en el estómago", "necesidad de moverse constantemente", "boca seca",
        "escalofríos o sofocos", "sensación de garganta cerrada", "visión borrosa temporal",
        "hiperventilación", "sensación de ahogo"
    ]
    pensamientos_comunes = [
        "miedo a perder el control", "pensamientos catastróficos", "miedo a morir o enloquecer",
        "sensación de que algo malo va a pasar", "preocupación excesiva", "autocrítica intensa",
        "pensamientos intrusivos recurrentes", "miedo al juicio de los demás", "sentirse incapaz",
        "estar en peligro inminente", "todo saldrá mal"
    ]
    actividades_comunes = [
        "en el supermercado", "en una reunión de trabajo", "estudiando en casa", "en el transporte público",
        "mientras cenaba con amigos", "antes de dormir", "al despertar por la mañana",
        "viendo las noticias", "navegando por redes sociales", "haciendo ejercicio",
        "en el banco", "en la sala de espera del médico", "conduciendo",
        "durante una llamada telefónica", "mientras veía una película", "en un centro comercial"
    ]

    # Seleccionar elementos aleatorios
    detonante_principal = random.choice(detonantes_comunes)
    sintoma1 = random.choice(sintomas_comunes)
    sintoma2 = random.choice(sintomas_comunes) if random.random() < 0.7 else None # Segundo síntoma opcional
    pensamiento_asociado = random.choice(pensamientos_comunes) if random.random() < 0.6 else None
    actividad = random.choice(actividades_comunes)

    # Construir la nota clínica
    nota_clinica = f"El paciente reporta haber sentido {sintoma1}"
    if sintoma2 and sintoma2 != sintoma1:
        nota_clinica += f" y {sintoma2}"
    nota_clinica += f" {actividad}."

    if "estrés laboral" in detonante_principal or "proyecto" in detonante_principal or "trabajo" in detonante_principal or "críticas en el trabajo" in detonante_principal:
        nota_clinica += f" Esto ocurrió tras {detonante_principal}."
    elif "familiar" in detonante_principal or "pareja" in detonante_principal or "conflicto" in detonante_principal:
        nota_clinica += f" La situación se desencadenó por {detonante_principal}."
    elif "financieros" in detonante_principal or "incertidumbre económica" in detonante_principal:
        nota_clinica += f" Se sintió muy angustiado debido a {detonante_principal}."
    elif "concurrido" in detonante_principal or "ruidoso" in detonante_principal or "social" in detonante_principal or "centro comercial" in actividad:
        nota_clinica += f" El entorno {detonante_principal} contribuyó a la crisis."
    elif "salud" in detonante_principal or "médicos" in detonante_principal:
        nota_clinica += f" Se debió a la preocupación por {detonante_principal}."
    elif "viaje" in detonante_principal or "cambios importantes" in detonante_principal:
        nota_clinica += f" El incidente está relacionado con {detonante_principal}."
    elif "sueño" in detonante_principal or "cafeína" in detonante_principal:
        nota_clinica += f" Factores como {detonante_principal} pudieron influir."
    else:
        nota_clinica += f" Mencionó que se desencadenó por {detonante_principal}."

    if pensamiento_asociado:
        nota_clinica += f" Experimentó {pensamiento_asociado}."

    # Construir el diagnóstico simulado
    diagnostico_simulado = f"Episodio de ansiedad aguda, posiblemente desencadenado por {detonante_principal}. Se observaron síntomas físicos como {sintoma1} y {sintoma2 if sintoma2 else 'malestar general'}, y pensamientos relacionados con {pensamiento_asociado if pensamiento_asociado else 'ansiedad generalizada'}."
    if "en el supermercado" in actividad or "en el transporte público" in actividad:
        diagnostico_simulado += " La situación en un entorno concurrido parece ser un factor contribuyente."

    # Construir las sugerencias simuladas
    sugerencias_simuladas = []

    # Sugerencias basadas en detonantes
    if "estrés laboral" in detonante_principal or "proyecto" in detonante_principal or "críticas en el trabajo" in detonante_principal:
        sugerencias_simuladas.append("Establecer límites claros en el trabajo y priorizar tareas para reducir la sobrecarga.")
        sugerencias_simuladas.append("Explorar técnicas de manejo de estrés específicas para el ámbito laboral.")
    if "financieros" in detonante_principal or "incertidumbre económica" in detonante_principal:
        sugerencias_simuladas.append("Planificar y organizar las finanzas para reducir la incertidumbre. Buscar asesoramiento si es necesario.")
    if "concurrido" in detonante_principal or "ruidoso" in detonante_principal or "social" in detonante_principal or "supermercado" in actividad or "transporte público" in actividad or "centro comercial" in actividad:
        sugerencias_simuladas.append("Identificar y evitar entornos excesivamente estimulantes si es posible, o usar estrategias de afrontamiento (ej. auriculares con ruido blanco) en ellos.")
        sugerencias_simuladas.append("Practicar técnicas de relajación como la respiración profunda antes de exponerse a situaciones de alta estimulación.")
    if "familiar" in detonante_principal or "pareja" in detonante_principal or "conflicto" in detonante_principal:
        sugerencias_simuladas.append("Fomentar la comunicación abierta y honesta con los seres queridos para resolver conflictos de forma constructiva.")
        sugerencias_simuladas.append("Considerar terapia familiar o de pareja si los problemas de relación persisten.")
    if "salud" in detonante_principal or "médicos" in detonante_principal:
        sugerencias_simuladas.append("Buscar información fiable sobre la preocupación de salud para reducir la incertidumbre y el miedo.")
        sugerencias_simuladas.append("Comunicar claramente las preocupaciones al equipo médico para obtener apoyo y claridad.")
    if "viaje" in detonante_principal or "cambios importantes" in detonante_principal:
        sugerencias_simuladas.append("Planificar y preparar los cambios importantes con antelación para reducir la ansiedad ante lo desconocido.")
        sugerencias_simuladas.append("Desarrollar una rutina y buscar estabilidad en otros ámbitos durante periodos de cambio.")
    # ¡Corrección aquí! Asegurarse de que sintoma1 y sintoma2 no sean None
    if "sueño" in detonante_principal or (sintoma1 is not None and "insomnio" in sintoma1) or (sintoma2 is not None and "insomnio" in sintoma2):
        sugerencias_simuladas.append("Mejorar la higiene del sueño: establecer un horario regular, crear un ambiente propicio para dormir y evitar pantallas antes de acostarse.")
    if "cafeína" in detonante_principal:
        sugerencias_simuladas.append("Reducir o eliminar el consumo de cafeína y otras sustancias estimulantes que pueden aumentar la ansiedad.")
    if "presentación en público" in detonante_principal or (pensamiento_asociado is not None and "miedo al juicio" in pensamiento_asociado):
        sugerencias_simuladas.append("Practicar la exposición gradual a situaciones sociales o de presentación.")
        sugerencias_simuladas.append("Desarrollar habilidades de asertividad y autoconfianza.")
    if "recuerdo traumático" in detonante_principal:
        sugerencias_simuladas.append("Explorar terapia enfocada en trauma (ej. EMDR o TCC) con un profesional de la salud mental.")
        sugerencias_simuladas.append("Desarrollar mecanismos de afrontamiento saludables para gestionar flashbacks o recuerdos intrusivos.")

    # Sugerencias genéricas si no se aplica nada específico
    if not sugerencias_simuladas:
        sugerencias_simuladas.append("Practicar técnicas de mindfulness o meditación diariamente para reducir la ansiedad general.")
        sugerencias_simuladas.append("Realizar ejercicio físico regular para liberar tensiones y mejorar el estado de ánimo.")
        sugerencias_simuladas.append("Mantener una dieta equilibrada y un estilo de vida saludable.")
        sugerencias_simuladas.append("Considerar buscar apoyo psicológico para desarrollar estrategias de afrontamiento personalizadas y duraderas.")
        sugerencias_simuladas.append("Identificar actividades que le generen calma y placer, y dedicarse a ellas regularmente.")
        sugerencias_simuladas.append("Aprender a identificar los primeros signos de ansiedad y aplicar técnicas de relajación en ese momento.")


    sugerencias_texto = " - " + " - ".join(sugerencias_simuladas)

    return {
        "text": f"Nota: {nota_clinica} ### Diagnóstico: {diagnostico_simulado} ### Sugerencias:{sugerencias_texto}"
    }

# Generar y guardar las notas en un archivo .jsonl
num_notes = 200
output_filename = "notes_dataset.jsonl" # Este archivo se creará en el mismo directorio que este script

print(f"Generando {num_notes} notas simuladas...")
with open(output_filename, "w", encoding="utf-8") as f:
    for i in range(num_notes):
        data = generate_note_data()
        f.write(json.dumps(data, ensure_ascii=False) + "\n")

print(f"Se han generado {num_notes} notas simuladas en '{output_filename}'.")
print("Asegúrate de mover este archivo a la raíz de tu proyecto 'pulsoftWeb' (donde está manage.py) si lo ejecutas desde otro lugar.")