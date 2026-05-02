from django.urls import path
from .views import AIsearchview

urlpatterns = [
    path("ai_search/", AIsearchview.as_view(), name="ai-search"),
]