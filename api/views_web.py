from django.shortcuts import render, redirect
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from firebase_admin import auth as firebase_auth
from firebase_admin import firestore # Importa Firestore
from api.models import FirebaseUser, CaregiverPatientLink
import firebase_admin
from firebase_config import db

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

@login_required
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
