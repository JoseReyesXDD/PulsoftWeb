import logging
from django.contrib.auth import authenticate
from django.contrib import messages
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from firebase_config import db, db_realtime
from google.cloud import firestore
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.models import User
from .forms import CambiarCorreoForm, CambiarContrasenaForm
from firebase_admin import auth
from api.decorators import firebase_login_required


# Importa todas las vistas de Django/DRF que actúan como endpoints de API.
from .api_views import AnalyzeNoteView

# Configuración del logger para este archivo
logger = logging.getLogger(__name__)

@firebase_login_required
def configuracion_usuario(request):
    return render(request, 'configuracion_usuario.html')

@firebase_login_required
def cambiar_correo(request):
    uid = request.session.get('uid')
    if not uid:
        return redirect('login')  # no hay sesión válida

    if request.method == 'POST':
        form = CambiarCorreoForm(request.POST)
        if form.is_valid():
            nuevo_correo = form.cleaned_data['nuevo_correo']
            try:
                auth.update_user(uid, email=nuevo_correo)
                messages.success(request, 'Correo actualizado correctamente.')
                return redirect('configuracion_usuario')
            except Exception as e:
                messages.error(request, f'Error al actualizar el correo: {e}')
    else:
        form = CambiarCorreoForm()

    return render(request, 'cambiar_correo.html', {'form': form})

@firebase_login_required
def cambiar_contrasena(request):
    uid = request.session.get('uid')
    if not uid:
        return redirect('login')

    if request.method == 'POST':
        form = CambiarContrasenaForm(request.POST)
        if form.is_valid():
            nueva_contrasena = form.cleaned_data['nueva_contrasena']
            try:
                auth.update_user(uid, password=nueva_contrasena)
                messages.success(request, 'Contraseña actualizada correctamente.')
                return redirect('configuracion_usuario')
            except Exception as e:
                messages.error(request, f'Error al actualizar la contraseña: {e}')
    else:
        form = CambiarContrasenaForm()

    return render(request, 'cambiar_contrasena.html', {'form': form})