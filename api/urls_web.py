from django.urls import path
from . import views_web

urlpatterns = [
    path('login/', views_web.login_view, name='login'),
    path('logout/', views_web.logout_view, name='logout'),
    path('select-patient/', views_web.select_patient, name='select_patient'),
    path('caregiver-dashboard/', views_web.caregiver_dashboard, name='caregiver_dashboard'),
    path('patient-dashboard/', views_web.patient_dashboard, name='patient_dashboard'),
    path('patient-notes/', views_web.patient_notes_view, name='patient_notes'),
    path('caregiver-notes/', views_web.caregiver_notes_view, name='caregiver_notes'),
]
