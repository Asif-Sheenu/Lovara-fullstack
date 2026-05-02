import requests

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
            print("Weather API failed:", res.status_code)
            return None

    except Exception as e:
        print("Exception:", e)
        return None


def check_weather_and_notify(booking):
    print("🔥 FUNCTION TRIGGERED")   # add this

    from notifications.tasks import send_booking_notification

    weather = get_weather_for_booking(
        booking.work.latitude,
        booking.work.longitude,
        booking.service_date
    )


    if not weather:
        print(" No weather data")
        return

    condition = weather.get("condition", "")
    print(" CONDITION:", condition)

    if "rain" in condition.lower():
        booking.status = "weather_risk"
        booking.save()

        print("⚠️ UPDATED TO WEATHER RISK")

        send_booking_notification.delay(
            booking.user.id,
            "Rain expected on your booking date 🌧️"
        )