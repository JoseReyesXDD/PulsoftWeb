# pulsoft/urls.py
from django.contrib import admin
from django.urls import path, include
from api import views # Importa solo las vistas HTML aquí, o refactoriza las API views a otro archivo si quieres

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.home_view, name='home'),
    path('register/', views.register_html_view, name='register_html'),
    path('login/', views.login_html_view, name='login_html'),
    path('dashboard/', views.dashboard_view, name='dashboard'),
    path('logout/', views.logout_html_view, name='logout_html'),
    path('api/', include('api.urls')), 
]