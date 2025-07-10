# api/urls.py
from django.urls import path
from . import api_views, views_web

urlpatterns = [
    path('analyze-note/', api_views.AnalyzeNoteView.as_view(), name='analyze_note_api'),
]