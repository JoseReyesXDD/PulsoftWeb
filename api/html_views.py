import json
import logging

from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.forms import AuthenticationForm
from django.contrib import messages
from django.db import transaction

# Importar funciones de utilidad de Firebase y el backend de autenticación
from .firebase_utils import create_user, login_firebase_user, logout_firebase_user # <--- Asegúrate de importar login_firebase_user
from .backends import FirebaseBackend
from api.models import CustomUser, Patient, Caregiver, CaregiverPatientLink 

from firebase_config import db_realtime 

logger = logging.getLogger(__name__)

# --- Funciones de utilidad ---

def leer_datos(patient_uid, label):
    """
    Lee datos de Firebase Realtime Database para un patient_uid y etiqueta de sensor específicos.
    Asume una estructura de datos en Firebase como: patients/{patient_uid}/{label}
    """
    if not patient_uid:
        logger.warning(f"leer_datos: No se proporcionó patient_uid. No se pueden leer datos para '{label}'.")
        return None

    ruta = f"patients/{patient_uid}/{label}"
    try:
        valor = db_realtime.child(ruta).get() 
        logger.debug(f"leer_datos: Intentando leer datos de la ruta: {ruta}")
        if valor is not None:
            logger.debug(f"leer_datos: Datos encontrados para {ruta}: {valor}")
            return valor
        else:
            logger.debug(f"leer_datos: No se encontraron datos para la ruta: {ruta}")
            return None
    except Exception as e:
        logger.error(f"leer_datos: Error al leer datos de Firebase Realtime DB para {ruta}: {e}", exc_info=True)
        return None

# --- Vistas para renderizar Plantillas HTML ---

def home_view(request):
    """Renderiza la página de inicio."""
    return render(request, 'home.html')

def register_html_view(request):
    """
    Maneja el registro de usuarios a través de un formulario HTML.
    Crea el usuario en Firebase Authentication, en CustomUser de Django,
    y luego crea el perfil de Paciente o Cuidador.
    """
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')
        user_type = request.POST.get('user_type')

        if not email or not password or not user_type:
            messages.error(request, 'Email, contraseña y tipo de usuario son requeridos.')
            return render(request, 'register.html', {'error': 'Email, contraseña y tipo de usuario son requeridos.'})

        if user_type not in ['patient', 'caregiver']:
            messages.error(request, 'Tipo de usuario inválido seleccionado.')
            return render(request, 'register.html', {'error': 'Tipo de usuario inválido seleccionado.'})

        try:
            with transaction.atomic():
                # 1. Crear el usuario en Firebase Authentication
                # NOTE: create_user no retorna el idToken, solo el UID.
                # Para obtener el idToken tras el registro, el usuario debería loguearse
                # inmediatamente después, o el flujo de registro también realizar un login.
                uid = create_user(email, password)
                logger.info(f"Register HTML: Usuario Firebase creado para {email} con UID: {uid}")

                # 2. Crear o actualizar el CustomUser en la base de datos de Django
                user, created = CustomUser.objects.get_or_create(
                    email=email,
                    defaults={'uid': uid, 'username': email, 'user_type': user_type}
                )
                if not created:
                    if not user.uid or user.uid != uid:
                        user.uid = uid
                    if user.user_type != user_type: 
                        user.user_type = user_type
                    user.username = email 
                    user.save()
                    logger.info(f"Register HTML: CustomUser existente para {email} (UID: {uid}) actualizado.")
                else:
                    logger.info(f"Register HTML: Nuevo CustomUser creado en Django para {email} (UID: {uid}) como {user_type}.")

                if user_type == 'patient':
                    patient_profile, profile_created = Patient.objects.get_or_create(user=user)
                    if profile_created:
                        logger.info(f"Register HTML: Perfil de Paciente creado para {user.email}.")
                    else:
                        logger.info(f"Register HTML: Perfil de Paciente ya existe para {user.email}.")
                    messages.success(request, '¡Registro de Paciente exitoso! Has iniciado sesión.')
                elif user_type == 'caregiver':
                    caregiver_profile, profile_created = Caregiver.objects.get_or_create(user=user)
                    if profile_created:
                        logger.info(f"Register HTML: Perfil de Cuidador creado para {user.email}.")
                    else:
                        logger.info(f"Register HTML: Perfil de Cuidador ya existe para {user.email}.")
                    messages.success(request, '¡Registro de Cuidador exitoso! Has iniciado sesión.')
                
                # Después de crear el CustomUser y su perfil, ahora realizamos el login para obtener el ID Token
                # NOTA: Este login aquí no es redundante, ya que el 'create_user' no devuelve el ID Token.
                # El 'authenticate' lo obtiene.
                authenticated_user = authenticate(request=request, email=email, password=password, backend='api.backends.FirebaseBackend')
                
                if authenticated_user:
                    login(request, authenticated_user) 
                    # Guarda el Firebase ID Token en la sesión si está disponible en el request.user
                    # (aunque CustomUser no tiene un campo para idToken, authenticate podría adjuntarlo temporalmente
                    # o se podría obtener de la respuesta de login_firebase_user)
                    # Para asegurarnos, lo obtendremos directamente de login_firebase_user de nuevo aquí.
                    firebase_response = login_firebase_user(email, password)
                    if 'idToken' in firebase_response:
                        request.session['firebase_id_token'] = firebase_response['idToken']
                        logger.info(f"Register HTML: Firebase ID Token guardado en sesión para {email}.")
                else:
                    messages.error(request, "Error interno al iniciar sesión después del registro. Contacta al soporte.")
                    logger.error(f"Register HTML: Falló el autenticado automático después del registro para {email}.")
                    return render(request, 'register.html', {'error': 'Error interno de autenticación.'})
                
                return redirect('dashboard') 

        except Exception as e:
            logger.error(f"Register HTML: Error en register_html_view: {e}", exc_info=True)
            messages.error(request, f'Error al registrar usuario: {e}')
            return render(request, 'register.html', {'error': str(e)}) 
    return render(request, 'register.html')


def login_html_view(request):
    """
    Maneja el inicio de sesión de usuarios a través de un formulario HTML.
    Autentica con Firebase Authentication y loguea en la sesión de Django.
    Guarda el Firebase ID Token en la sesión de Django para uso en el frontend.
    """
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            email = form.cleaned_data.get('username') 
            password = form.cleaned_data.get('password')
            
            user = None
            try:
                # El backend de autenticación llama a login_firebase_user, pero no expone el idToken.
                # Para pruebas, haremos una llamada directa aquí para obtenerlo.
                firebase_response = login_firebase_user(email, password) # <-- Obtener la respuesta completa de Firebase
                if 'idToken' not in firebase_response:
                    messages.error(request, "Error de autenticación: No se pudo obtener el token de Firebase.")
                    logger.error(f"Login HTML: No se recibió idToken de Firebase para {email}.")
                    return render(request, 'login.html', {'form': form, 'messages': messages.get_messages(request)})

                # Intentar autenticar con Django usando el backend de Firebase
                user = authenticate(request=request, email=email, password=password, backend='api.backends.FirebaseBackend')
                
                if user is not None:
                    login(request, user)
                    request.session['firebase_id_token'] = firebase_response['idToken'] # <-- Guarda el idToken en la sesión
                    messages.success(request, '¡Inicio de sesión exitoso!')
                    logger.info(f"Login HTML: Usuario {email} logueado y Firebase ID Token guardado en sesión.")
                    return redirect('dashboard')
                else:
                    messages.error(request, "Credenciales inválidas o error de autenticación. Por favor, verifica tu email y contraseña.")
                    logger.warning(f"Login HTML: Credenciales inválidas para {email}.")
            
            except Exception as e:
                logger.error(f"Login HTML: Error durante el intento de login Django: {e}", exc_info=True)
                messages.error(request, f"Error inesperado durante la autenticación: {e}")
                
        else:
            for field, errors in form.errors.items():
                for error in errors:
                    messages.error(request, f"Error en {field}: {error}")
            messages.error(request, "Por favor, corrige los errores en el formulario.")
        
    else:
        form = AuthenticationForm() 
    return render(request, 'login.html', {'form': form, 'messages': messages.get_messages(request)})


@login_required(login_url='/login/')
def dashboard_view(request):
    """
    Renderiza el dashboard del usuario.
    Muestra datos del propio paciente o redirige al cuidador a seleccionar un paciente.
    Para pacientes, muestra su token de enlace.
    Pasa el Firebase ID Token del usuario logueado al contexto.
    """
    user = request.user
    patient_uid_to_display = None
    selected_patient_email = None # Para mostrar en el dashboard del cuidador
    caregiver_link_token = None 

    # Obtiene el Firebase ID Token de la sesión
    firebase_id_token_for_frontend = request.session.get('firebase_id_token', None) # <-- Obtiene el token de sesión

    if user.is_patient():
        try:
            patient_profile = Patient.objects.get(user=user)
            patient_uid_to_display = patient_profile.user.uid
            selected_patient_email = patient_profile.user.email
            caregiver_link_token = patient_profile.caregiver_link_token
            logger.info(f"Dashboard: Paciente {user.email} accediendo a su propio dashboard. Token: {caregiver_link_token}")
        except Patient.DoesNotExist:
            messages.error(request, "Tu perfil de paciente no fue encontrado. Contacta al soporte.")
            logger.error(f"Dashboard: Perfil de paciente no encontrado para {user.email}.")
            return redirect('home')

    elif user.is_caregiver():
        selected_patient_id_from_session = request.session.get('selected_patient_id')
        
        if selected_patient_id_from_session:
            try:
                patient_profile = Patient.objects.get(pk=selected_patient_id_from_session)
                caregiver_profile = Caregiver.objects.get(user=user)
                if not CaregiverPatientLink.objects.filter(
                    caregiver=caregiver_profile, 
                    patient=patient_profile, 
                    is_active=True
                ).exists():
                    del request.session['selected_patient_id']
                    messages.warning(request, "El paciente seleccionado no está vinculado a tu cuenta. Por favor, selecciona un paciente de tu lista.")
                    logger.warning(f"Dashboard: Cuidador {user.email} intentó acceder a paciente {patient_profile.user.email} sin vínculo activo.")
                    return redirect('patient_selection_html')
                
                patient_uid_to_display = patient_profile.user.uid
                selected_patient_email = patient_profile.user.email
                logger.info(f"Dashboard: Cuidador {user.email} accediendo al dashboard de paciente {patient_profile.user.email}.")

            except (Patient.DoesNotExist, Caregiver.DoesNotExist):
                if 'selected_patient_id' in request.session:
                    del request.session['selected_patient_id']
                messages.warning(request, "El paciente seleccionado no es válido o no existe. Por favor, selecciona un paciente de tu lista.")
                logger.warning(f"Dashboard: Cuidador {user.email} con ID de paciente en sesión inválido: {selected_patient_id_from_session}.")
                return redirect('patient_selection_html')
        else:
            messages.info(request, "Por favor, selecciona un paciente para ver su dashboard.")
            logger.info(f"Dashboard: Cuidador {user.email} redirigido a la selección de paciente (no hay paciente en sesión).")
            return redirect('patient_selection_html')

    else:
        messages.error(request, "Tipo de usuario no reconocido. Contacta al soporte.")
        logger.error(f"Dashboard: Tipo de usuario desconocido para {user.email}.")
        return redirect('home')

    datos_labels = ["temperatura", "sudor", "cardiovascular"]
    values_data = []

    try:
        for label in datos_labels:
            valor = leer_datos(patient_uid_to_display, label)
            try:
                processed_value = float(valor) if valor is not None else 0
                values_data.append(processed_value)
            except (ValueError, TypeError) as e:
                values_data.append(0) 
                logger.warning(f"Dashboard: El valor de '{label}' ({valor}) no es numérico o es nulo para UID {patient_uid_to_display}. Usando 0. Error: {e}")

        logger.info(f"Dashboard: Datos finales para la gráfica. Labels={datos_labels}, Values={values_data} para UID {patient_uid_to_display}.")

    except Exception as e:
        logger.error(f"Dashboard: Error general al cargar datos de gráfica para UID {patient_uid_to_display}: {e}", exc_info=True)
        values_data = [0 for _ in datos_labels] 
        messages.error(request, f"Hubo un error al cargar los datos para la gráfica: {e}")

    context = {
        'labels': json.dumps(datos_labels),
        'data': json.dumps(values_data),    
        'user': request.user,
        'messages': messages.get_messages(request),
        'selected_patient_email': selected_patient_email,
        'caregiver_link_token': caregiver_link_token,
        'firebase_id_token': firebase_id_token_for_frontend # <-- Pasa el token al contexto
    }
    logger.debug(f"Dashboard context: {context}")
    return render(request, 'dashboard.html', context)


def logout_html_view(request):
    """
    Cierra la sesión del usuario tanto en Firebase (revocando tokens) como en Django.
    También limpia el Firebase ID Token de la sesión de Django.
    """
    if request.user.is_authenticated:
        # Limpiar cualquier paciente seleccionado en la sesión al cerrar sesión
        if 'selected_patient_id' in request.session:
            del request.session['selected_patient_id']
            logger.info(f"Logout: Paciente seleccionado limpiado de la sesión para {request.user.email}.")
        
        # Limpiar el Firebase ID Token de la sesión
        if 'firebase_id_token' in request.session: # <-- Limpia el token de sesión
            del request.session['firebase_id_token']
            logger.info(f"Logout: Firebase ID Token limpiado de la sesión para {request.user.email}.")

        try:
            logout_firebase_user(request.user.uid)
            messages.info(request, 'Has cerrado sesión en Firebase.')
        except Exception as e:
            logger.warning(f"Logout: Error al revocar token de Firebase para UID {request.user.uid}: {e}")
            messages.warning(request, 'No se pudo cerrar sesión en Firebase, pero tu sesión local será cerrada.')
        logout(request)
        messages.success(request, 'Has cerrado sesión correctamente.')
    else:
        messages.info(request, 'No tenías una sesión activa.')
    return redirect('home')

def patient_selection_html_view(request):
    """
    Muestra una lista de pacientes vinculados para que el cuidador los seleccione.
    Solo accesible para usuarios de tipo 'caregiver'.
    Pasa el Firebase ID Token del usuario logueado al contexto.
    """
    user = request.user
    if not user.is_caregiver():
        messages.error(request, "Solo los cuidadores pueden acceder a la selección de pacientes.")
        logger.warning(f"Patient Selection: Acceso denegado a {user.email} (no cuidador) intentando acceder a la selección de pacientes.")
        return redirect('dashboard')

    try:
        caregiver_profile = Caregiver.objects.get(user=user)
        linked_patients = [
            link.patient for link in CaregiverPatientLink.objects.filter(
                caregiver=caregiver_profile, 
                is_active=True
            ).select_related('patient__user')
        ]
        
        logger.info(f"Patient Selection: Cuidador {user.email} viendo {len(linked_patients)} pacientes vinculados.")

    except Caregiver.DoesNotExist:
        messages.error(request, "Tu perfil de cuidador no fue encontrado. Contacta al soporte.")
        logger.error(f"Patient Selection: Perfil de cuidador no encontrado para {user.email}.")
        return redirect('home')

    # Obtiene el Firebase ID Token de la sesión para pasarlo al frontend
    firebase_id_token_for_frontend = request.session.get('firebase_id_token', None) # <-- Obtiene el token de sesión

    context = {
        'linked_patients': linked_patients,
        'messages': messages.get_messages(request),
        'user': user,
        'firebase_id_token': firebase_id_token_for_frontend # <-- Pasa el token al contexto
    }
    return render(request, 'patient_selection.html', context)

def select_patient_view(request, patient_id):
    """Establece el ID del paciente seleccionado en la sesión del cuidador y redirige al dashboard."""
    user = request.user
    if not user.is_caregiver():
        messages.error(request, "Solo los cuidadores pueden seleccionar pacientes.")
        logger.warning(f"Select Patient: Acceso denegado a {user.email} (no cuidador) intentando seleccionar paciente {patient_id}.")
        return redirect('dashboard')

    try:
        patient_profile = Patient.objects.get(pk=patient_id)
        caregiver_profile = Caregiver.objects.get(user=user)

        if not CaregiverPatientLink.objects.filter(
            caregiver=caregiver_profile, 
            patient=patient_profile, 
            is_active=True
        ).exists():
            messages.error(request, "No estás autorizado para ver este paciente.")
            logger.warning(f"Select Patient: Cuidador {user.email} intentó seleccionar paciente {patient_profile.user.email} sin vínculo activo.")
            return redirect('patient_selection_html')

        request.session['selected_patient_id'] = patient_id
        messages.success(request, f"Ahora estás viendo los datos de {patient_profile.user.email}.")
        logger.info(f"Select Patient: Cuidador {user.email} seleccionó al paciente {patient_profile.user.email} (ID: {patient_id}).")
        return redirect('dashboard')

    except (Patient.DoesNotExist, Caregiver.DoesNotExist):
        messages.error(request, "Paciente o perfil de cuidador no válido.")
        logger.error(f"Select Patient: Paciente {patient_id} o perfil de cuidador para {user.email} no encontrado.")
        return redirect('patient_selection_html')
    except Exception as e:
        messages.error(request, f"Error al seleccionar paciente: {e}")
        logger.error(f"Select Patient: Error inesperado al seleccionar paciente {patient_id} para {user.email}. Detalles: {e}", exc_info=True)
        return redirect('patient_selection_html')
