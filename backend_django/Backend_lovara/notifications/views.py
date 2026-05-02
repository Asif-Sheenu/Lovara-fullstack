from django.shortcuts import render
import requests
from django.http import JsonResponse
from django.conf import settings
from rest_framework.response import Response
from rest_framework.views import APIView
# Create your views here.

FASTAPI_URL = "http://127.0.0.1:8001"


def get_weather_for_booking(lat, lon, date):
    try:
        res = requests.get(
            f"{FASTAPI_URL}/predict_forecast/",
            params={"lat": lat, "lon": lon, "date": str(date)},
            timeout=3 
        )

        if res.status_code == 200:
            return res.json()
        else:
            return None

    except Exception as e:
        print("Weather API error:", e)
        return None


class get_rain_prediction(APIView):
    def get(self, request):
        return Response({"message": "Rain prediction endpoint working"})    