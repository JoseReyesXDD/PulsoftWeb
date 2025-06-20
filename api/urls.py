# api/urls.py
from django.urls import path
from . import views 

urlpatterns = [
    path("register/", views.RegisterUserView.as_view(), name="api_register"), # Renombré para evitar confusión
    path("login/", views.LoginUserView.as_view(), name="api_login"),         # Renombré para evitar confusión
    path("logout/", views.LogoutUserView.as_view(), name="api_logout"),     # Renombré para evitar confusión
    path("change-password/", views.ChangePasswordView.as_view(), name="api_change_password"),
    path("change-email/", views.ChangeEmailView.as_view(), name="api_change_email"),
    path("delete-user/", views.DeleteUserView.as_view(), name="api_delete_user"),
    path('analyze_note/', views.AnalyzeNoteView.as_view(), name='analyze_note_api'), # Renombré para mayor claridad
    path('ai-diagnosis/', views.AIDiagnosisView.as_view(), name='ai_diagnosis_api'), # Añadido el nombre de la vista de IA
]