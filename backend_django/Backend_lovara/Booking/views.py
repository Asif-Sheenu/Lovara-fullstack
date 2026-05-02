from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import Booking
from .serializers import BookingSerializer
from VendorSide.models import VendorWorks
from notifications.tasks import send_booking_notification
from Booking.services import check_weather_and_notify,get_weather_for_booking

class AddBooking(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, work_id):

        print("REQUEST DATA:", request.data)

        work = get_object_or_404(VendorWorks, id=work_id)

        serializer = BookingSerializer(data=request.data)

        if serializer.is_valid():

            booking = serializer.save(
                user=request.user,
                vendor=work.vendor,
                work=work
            )

            print("BOOKING CREATED:", booking.id)

            check_weather_and_notify(booking)

            return Response(serializer.data)

        print("SERIALIZER ERRORS:", serializer.errors)
        return Response(serializer.errors)



class CancelBooking(APIView):

    permission_classes = [IsAuthenticated]

    def patch(self, request, booking_id):

        booking = get_object_or_404(Booking, id=booking_id)

        if booking.user != request.user:
            return Response({"error": "Not allowed"}, status=403)

        if booking.status in ["COMPLETED", "CANCELLED", "REJECTED"]:
            return Response({"error": "Booking cannot be cancelled"})

        booking.status = "CANCELLED"
        booking.save()

        return Response({"message": "Booking cancelled successfully"})        



# see all bookng (vendor)

class VendorBookings(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        bookings = Booking.objects.filter(vendor=request.user)

        data = []

        for booking in bookings:
            serialized = BookingSerializer(booking).data

            
            data.append(serialized)

        return Response(data)

    #   approve booking   


class VendorUpdateBooking(APIView):

    permission_classes = [IsAuthenticated]

    def patch(self, request, booking_id):

        booking = get_object_or_404(Booking, id=booking_id)

        if booking.vendor != request.user:
            return Response({"error": "Not allowed"}, status=403)

        status = request.data.get("status")

        if status not in ["APPROVED", "REJECTED"]:
            return Response({"error": "Invalid status"})

        booking.status = status
        booking.save()

        user_id = booking.user.id 
        send_booking_notification.delay(user_id)



        return Response({"message": "Booking updated"})    





        # weather  


from rest_framework.views import APIView
from rest_framework.response import Response
from .services import get_weather_for_booking
from .models import Booking

class BookingWeather(APIView):
    def get(self, request, booking_id):
        booking = Booking.objects.get(id=booking_id)

        weather = get_weather_for_booking(
            booking.work.latitude,
            booking.work.longitude,
            booking.service_date
        )

        return Response({"weather": weather})        