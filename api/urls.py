# api/urls.py
from django.urls import path
from . import api_views

urlpatterns = [
    path('analyze-note/', api_views.AnalyzeNoteView.as_view(), name='analyze_note_api'),
    path('patient-notes/', api_views.PatientNotesView.as_view(), name='patient_notes_api'),
    path('caregiver-patients/', api_views.CaregiverPatientsView.as_view(), name='caregiver_patients_api'),
    path('search-patients/', api_views.SearchPatientsView.as_view(), name='search_patients_api'),
    path('link-patient/', api_views.LinkPatientView.as_view(), name='link_patient_api'),
    path('unlink-patient/', api_views.UnlinkPatientView.as_view(), name='unlink_patient_api'),
    path('user-profile/', api_views.UserProfileView.as_view(), name='user_profile_api'),
]