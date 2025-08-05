# api/urls.py
from django.urls import path
from . import api_views, views_web, views

urlpatterns = [
    path('analyze-note/', api_views.AnalyzeNoteView.as_view(), name='analyze_note_api'),
    path('caregiver-patients/', api_views.CaregiverPatientsView.as_view(), name='caregiver_patients_api'),
    path('patient-notes/', api_views.PatientNotesView.as_view(), name='patient_notes_api'),
    path('link-patient/', api_views.LinkPatientView.as_view(), name='link_patient_api'),
    path('unlink-patient/', api_views.UnlinkPatientView.as_view(), name='unlink_patient_api'),
    path('available-patients/', api_views.AvailablePatientsView.as_view(), name='available_patients_api'),
    path('configuracion/', views.configuracion_usuario, name='configuracion_usuario'),
    path('cambiar-correo/', views.cambiar_correo, name='cambiar_correo'),
    path('cambiar-contrasena/', views.cambiar_contrasena, name='cambiar_contrasena'),
]