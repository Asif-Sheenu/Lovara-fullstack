from django.urls import path
from .views import ai_recommendation_view

urlpatterns = [
    path('recommendation/', ai_recommendation_view.as_view()),
]