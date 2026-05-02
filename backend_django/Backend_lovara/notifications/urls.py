from django.urls import path
from .views import get_rain_prediction

urlpatterns = [
    path('predict/', get_rain_prediction.as_view()),
]