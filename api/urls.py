# api/urls.py
from django.urls import path
from . import api_views

urlpatterns = [
    path('analyze-note/', api_views.AnalyzeNoteView.as_view(), name='analyze_note_api'),
    path('patient-notes/', api_views.PatientNotesView.as_view(), name='patient_notes_api'),
    path('caregiver-patients/', api_views.CaregiverPatientsView.as_view(), name='caregiver_patients_api'),
]