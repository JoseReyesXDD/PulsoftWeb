# api/urls.py
from django.urls import path
from . import views 

urlpatterns = [
    path('analyze_note/', views.AnalyzeNoteView.as_view(), name='analyze_note_api'),
    path('ai-diagnosis/', views.AIDiagnosisView.as_view(), name='ai_diagnosis_api'),
    path('link-patient/', views.LinkPatientView.as_view(), name='link_patient_api'),
    path('patient-selection/', views.patient_selection_html_view, name='patient_selection_html'),
    path('select-patient/<int:patient_id>/', views.select_patient_view, name='select_patient_html'),
]
