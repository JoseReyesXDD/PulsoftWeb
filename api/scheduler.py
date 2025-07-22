import os
from apscheduler.schedulers.background import BackgroundScheduler
from analizar_notas import analizar_y_guardar_analisis_ia


def start():
    # Evita que se ejecute dos veces por el auto-reload de Django runserver
    if os.environ.get('RUN_MAIN') != 'true':
        return

    scheduler = BackgroundScheduler()
    scheduler.add_job(analizar_y_guardar_analisis_ia, 'interval', minutes=5)
    scheduler.start()
    print("⏰ Scheduler iniciado: ejecutando análisis cada 5 minutos.")
