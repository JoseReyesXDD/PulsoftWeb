from django.shortcuts import render, redirect
from django.contrib.auth import login, logout
from api.decorators import firebase_login_required
from firebase_admin import auth as firebase_auth
from firebase_admin import firestore # Importa Firestore
from api.models import FirebaseUser, CaregiverPatientLink
import firebase_admin
from firebase_config import db
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json

def login_view(request):
    if request.method == 'POST':
        id_token = request.POST.get('id_token')
        try:
            decoded_token = firebase_auth.verify_id_token(id_token)
            uid = decoded_token['uid']
            email = decoded_token.get('email')

            # Verificar si ya existe en la base de datos de Django
            try:
                user = FirebaseUser.objects.get(uid=uid)
                user_type = user.user_type
                print(f"DEBUG: Usuario existente en Django con UID: {uid}, Tipo: {user_type}")
            except FirebaseUser.DoesNotExist:
                # Si no existe en Django, intenta obtener el user_type de Firestore
                print(f"DEBUG: Usuario con UID: {uid} no encontrado en Django. Intentando leer de Firestore...")
                
                # --- Lógica para leer de Firestore ---
                # Asegúrate de que 'db' (la instancia de Firestore client) esté disponible.
                # Si no la inicializaste globalmente, inicialízala aquí:
                try:
                    db = firestore.client() # Obtén la instancia de Firestore client
                    
                    # Accede a la colección 'users' y al documento con el UID
                    user_doc_ref = db.collection('users').document(uid)
                    user_doc = user_doc_ref.get()

                    if user_doc.exists:
                        firestore_data = user_doc.to_dict()
                        firestore_user_type = firestore_data.get('user_type')
                        
                        if firestore_user_type:
                            user_type = firestore_user_type
                            # Crear usuario nuevo en Django con el tipo de Firestore
                            user = FirebaseUser.objects.create(
                                uid=uid,
                                email=email,
                                user_type=user_type
                            )
                            print(f"DEBUG: Usuario creado en Django con UID: {uid}, Tipo de Firestore: {user_type}")
                        else:
                            # Si el documento existe pero no tiene 'user_type', asigna un valor por defecto
                            default_user_type = 'patient' # O el que consideres adecuado
                            user = FirebaseUser.objects.create(
                                uid=uid,
                                email=email,
                                user_type=default_user_type
                            )
                            user_type = default_user_type
                            print(f"DEBUG: Usuario creado en Django con UID: {uid}, Tipo por defecto (Firestore sin user_type): {user_type}")
                    else:
                        # Si el usuario no existe en Firestore, crea en Django con tipo por defecto
                        default_user_type = 'patient' # O el que consideres adecuado
                        user = FirebaseUser.objects.create(
                            uid=uid,
                            email=email,
                            user_type=default_user_type
                        )
                        user_type = default_user_type
                        print(f"DEBUG: Usuario creado en Django con UID: {uid}, Tipo por defecto (no encontrado en Firestore): {user_type}")
                except Exception as firestore_e:
                    print(f"ERROR: Fallo al leer de Firestore para UID {uid}: {firestore_e}")
                    # Si falla la lectura de Firestore, aún puedes crear con un tipo por defecto
                    default_user_type = 'patient'
                    user = FirebaseUser.objects.create(
                        uid=uid,
                        email=email,
                        user_type=default_user_type
                    )
                    user_type = default_user_type
                    print(f"DEBUG: Usuario creado en Django con UID: {uid}, Tipo por defecto (Fallo Firestore): {user_type}")


            request.session['uid'] = uid
            request.session['user_type'] = user_type

            if user_type == 'caregiver':
                return redirect('select_patient')
            else:
                return redirect('patient_dashboard')

        except Exception as e:
            print(f"Login error: {e}")
            return render(request, 'login.html', {'error': 'No se pudo verificar el token o crear/actualizar el usuario.'})

    return render(request, 'login.html')

@firebase_login_required
def logout_view(request):
    logout(request)
    return redirect('login')

def select_patient(request):
    uid = request.session.get('uid')
    user_type = request.session.get('user_type')

    if not uid or user_type != 'caregiver':
        return redirect('login')
    
    try:
        # --- Obtener todos los documentos en Firestore donde el cuidador sea el actual ---
        query = db.collection('caregiverPatientLinks').where('caregiverUid', '==', uid).stream()
        patient_uids = [doc.to_dict().get('patientUid') for doc in query]

        # --- Buscar en PostgreSQL los datos de cada paciente por su UID ---
        linked_patients = FirebaseUser.objects.filter(uid__in=patient_uids)
    except Exception as e:
        print(f"ERROR: No se pudo recuperar pacientes desde Firestore o PostgreSQL: {e}")
        linked_patients = []

    if request.method == 'POST':
        selected_patient_uid = request.POST.get('selected_patient')
        if selected_patient_uid:
            request.session['selected_patient_uid'] = selected_patient_uid
            return redirect('caregiver_dashboard')
        else:
            return render(request, 'select_patient.html', {
                'linked_patients': linked_patients,
                'error': 'Por favor, selecciona un paciente.'
            })

    return render(request, 'select_patient.html', {'linked_patients': linked_patients})

def caregiver_dashboard(request):
    uid = request.session.get('uid')
    selected_patient_uid = request.session.get('selected_patient_uid')
    user_type = request.session.get('user_type') # Obtén user_type de la sesión

    if not uid or user_type != 'caregiver' or not selected_patient_uid: # Verifica también el user_type
        return redirect('login')

    try:
        patient = FirebaseUser.objects.get(uid=selected_patient_uid)
    except FirebaseUser.DoesNotExist:
        print(f"Error: Paciente con UID {selected_patient_uid} no encontrado en FirebaseUser (en caregiver_dashboard).")
        return redirect('login') # Redirigir si el perfil del paciente no existe
    
    return render(request, 'caregiver_dashboard.html', {'patient': patient})

def patient_dashboard(request):
    uid = request.session.get('uid')
    user_type = request.session.get('user_type') # Obtén user_type de la sesión

    if not uid or user_type != 'patient': # Verifica también el user_type
        return redirect('login')
    
    try:
        patient = FirebaseUser.objects.get(uid=uid)
    except FirebaseUser.DoesNotExist:
        print(f"Error: Paciente con UID {uid} no encontrado en FirebaseUser (en patient_dashboard).")
        return redirect('login') # Redirigir si el perfil del paciente no existe
    
    return render(request, 'patient_dashboard.html', {'patient': patient})

def patient_notes_view(request):
    uid = request.session.get('uid')
    user_type = request.session.get('user_type')

    if not uid or user_type != 'patient':
        return redirect('login')

    # Consultar notas desde Firestore
    notes_ref = db.collection('users').document(uid).collection('notes')
    notes = [doc.to_dict() for doc in notes_ref.stream()]

    return render(request, 'patient_notes.html', {'notes': notes})

def caregiver_notes_view(request):
    uid = request.session.get('uid')
    user_type = request.session.get('user_type')
    patient_uid = request.session.get('selected_patient_uid')

    if not uid or user_type != 'caregiver' or not patient_uid:
        return redirect('login')

    # Obtener email del paciente desde Django (si está sincronizado)
    try:
        patient = FirebaseUser.objects.get(uid=patient_uid)
        patient_email = patient.email
    except FirebaseUser.DoesNotExist:
        patient_email = "Desconocido"

    # Consultar notas desde Firestore
    notes_ref = db.collection('users').document(patient_uid).collection('notes')
    notes = [doc.to_dict() for doc in notes_ref.stream()]

    return render(request, 'caregiver_notes.html', {
        'notes': notes,
        'patient_uid': patient_uid,
        'patient_email': patient_email
    })

@firebase_login_required
def manage_patient_links(request):
    """
    Vista para gestionar los vínculos de pacientes del cuidador.
    """
    uid = request.session.get('uid')
    user_type = request.session.get('user_type')

    if not uid or user_type != 'caregiver':
        return redirect('login')

    try:
        caregiver = FirebaseUser.objects.get(uid=uid, user_type='caregiver')
        
        # Obtener pacientes vinculados
        linked_patients = CaregiverPatientLink.objects.filter(caregiver=caregiver).select_related('patient')
        
        # Obtener pacientes disponibles para vincular
        linked_patient_uids = linked_patients.values_list('patient__uid', flat=True)
        available_patients = FirebaseUser.objects.filter(
            user_type='patient'
        ).exclude(uid__in=linked_patient_uids)

        context = {
            'caregiver': caregiver,
            'linked_patients': linked_patients,
            'available_patients': available_patients,
            'total_linked': linked_patients.count(),
            'total_available': available_patients.count(),
        }
        
        return render(request, 'manage_patient_links.html', context)
        
    except FirebaseUser.DoesNotExist:
        return redirect('login')
    except Exception as e:
        print(f"Error en manage_patient_links: {e}")
        return render(request, 'manage_patient_links.html', {
            'error': 'Error al cargar los datos de pacientes'
        })

@csrf_exempt
@require_http_methods(["POST"])
def link_patient_ajax(request):
    """
    Endpoint AJAX para vincular un paciente al cuidador.
    """
    try:
        data = json.loads(request.body)
        caregiver_uid = data.get('caregiver_uid')
        patient_uid = data.get('patient_uid')
        
        if not caregiver_uid or not patient_uid:
            return JsonResponse({
                'success': False,
                'error': 'caregiver_uid y patient_uid son requeridos'
            }, status=400)

        # Verificar que el cuidador existe
        try:
            caregiver = FirebaseUser.objects.get(uid=caregiver_uid, user_type='caregiver')
        except FirebaseUser.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Cuidador no encontrado'
            }, status=404)

        # Verificar que el paciente existe
        try:
            patient = FirebaseUser.objects.get(uid=patient_uid, user_type='patient')
        except FirebaseUser.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Paciente no encontrado'
            }, status=404)

        # Verificar que no existe ya el vínculo
        existing_link = CaregiverPatientLink.objects.filter(
            caregiver=caregiver,
            patient=patient
        ).first()
        
        if existing_link:
            return JsonResponse({
                'success': False,
                'error': 'El paciente ya está vinculado a este cuidador'
            }, status=409)

        # Crear el vínculo
        link = CaregiverPatientLink.objects.create(
            caregiver=caregiver,
            patient=patient
        )

        # Crear el vínculo en Firestore también
        try:
            db.collection('caregiverPatientLinks').add({
                'caregiverUid': caregiver_uid,
                'patientUid': patient_uid,
                'linkedAt': link.linked_at.isoformat(),
                'caregiverEmail': caregiver.email,
                'patientEmail': patient.email
            })
        except Exception as firestore_error:
            print(f"Error al crear vínculo en Firestore: {firestore_error}")
            # Si falla Firestore, eliminar el vínculo de Django
            link.delete()
            return JsonResponse({
                'success': False,
                'error': 'Error al crear el vínculo en la base de datos'
            }, status=500)

        return JsonResponse({
            'success': True,
            'message': 'Paciente vinculado exitosamente',
            'link_id': link.id,
            'linked_at': link.linked_at.isoformat()
        })

    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'JSON inválido'
        }, status=400)
    except Exception as e:
        print(f"Error en link_patient_ajax: {e}")
        return JsonResponse({
            'success': False,
            'error': 'Error interno del servidor'
        }, status=500)

@csrf_exempt
@require_http_methods(["DELETE"])
def unlink_patient_ajax(request):
    """
    Endpoint AJAX para desvincular un paciente del cuidador.
    """
    try:
        data = json.loads(request.body)
        caregiver_uid = data.get('caregiver_uid')
        patient_uid = data.get('patient_uid')
        
        if not caregiver_uid or not patient_uid:
            return JsonResponse({
                'success': False,
                'error': 'caregiver_uid y patient_uid son requeridos'
            }, status=400)

        # Verificar que el cuidador existe
        try:
            caregiver = FirebaseUser.objects.get(uid=caregiver_uid, user_type='caregiver')
        except FirebaseUser.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Cuidador no encontrado'
            }, status=404)

        # Verificar que el paciente existe
        try:
            patient = FirebaseUser.objects.get(uid=patient_uid, user_type='patient')
        except FirebaseUser.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'Paciente no encontrado'
            }, status=404)

        # Buscar y eliminar el vínculo
        try:
            link = CaregiverPatientLink.objects.get(caregiver=caregiver, patient=patient)
            link.delete()
        except CaregiverPatientLink.DoesNotExist:
            return JsonResponse({
                'success': False,
                'error': 'No existe vínculo entre el cuidador y el paciente'
            }, status=404)

        # Eliminar el vínculo en Firestore también
        try:
            query = db.collection('caregiverPatientLinks').where('caregiverUid', '==', caregiver_uid).where('patientUid', '==', patient_uid).stream()
            for doc in query:
                doc.reference.delete()
        except Exception as firestore_error:
            print(f"Error al eliminar vínculo en Firestore: {firestore_error}")
            # No fallar si Firestore falla, el vínculo ya se eliminó en Django

        return JsonResponse({
            'success': True,
            'message': 'Paciente desvinculado exitosamente'
        })

    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'JSON inválido'
        }, status=400)
    except Exception as e:
        print(f"Error en unlink_patient_ajax: {e}")
        return JsonResponse({
            'success': False,
            'error': 'Error interno del servidor'
        }, status=500)
