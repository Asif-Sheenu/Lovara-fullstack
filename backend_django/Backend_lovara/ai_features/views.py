from rest_framework.decorators import api_view
from rest_framework.response import Response
from datetime import datetime, date
from .services import get_booking_recommendation
from VendorSide.models import Review
from rest_framework.views import APIView


def get_seasonal_hint(month):
    if month in [6,7,8]:
        return "This period usually has heavy rainfall."
    elif month in [3,4,5]:
        return "This period is generally hot."
    return "Weather is usually moderate."


class ai_recommendation_view(APIView):
    def post (self,request):
        service_date = request.data.get("date")
        weather = request.data.get("weather")
        work_id = request.data.get("work_id") 

        service_date = datetime.strptime(service_date, "%Y-%m-%d").date()
        days_diff = (service_date - date.today()).days

        seasonal_hint = None

        seasonal_hint = get_seasonal_hint(service_date.month)

        reviews = Review.objects.filter(work_id=work_id)\
                .values_list("comment", flat=True)

        reviews_list = list(reviews)[:5]

        message = get_booking_recommendation(
        weather=weather,
        seasonal_hint=seasonal_hint,
        reviews=reviews_list
        )

        return Response({"message": message})