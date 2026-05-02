from django.urls import path
from .views import AddBooking , CancelBooking,VendorBookings,VendorUpdateBooking,BookingWeather

urlpatterns = [
    path("add_booking/<int:work_id>/", AddBooking.as_view(), name="add_booking"),
    path("cancel-booking/<int:booking_id>/", CancelBooking.as_view()),
    path("vendor_allbookings/", VendorBookings.as_view()),
    path("approve_booking/<int:booking_id>/", VendorUpdateBooking.as_view()),
    path("booking/<int:booking_id>/weather/", BookingWeather.as_view())
]