import pickle
import numpy as np
import requests
import pandas as pd
from datetime import datetime

model = pickle.load(open("app/models/rain_model.pkl", "rb"))

def predict_rain(data):
    input_data = np.array([[
        data.MinTemp,
        data.MaxTemp,
        data.Rainfall,
        data.Humidity9am,
        data.Humidity3pm,
        data.Pressure9am,
        data.Pressure3pm,
        data.Temp9am
    ]])

    prediction = model.predict(input_data)

    return "Yes" if prediction[0] == 1 else "No"


API_KEY = "a20a69979fc886121074b708e7ee0cfe"

def get_weather_data(lat, lon):
    url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&units=metric&appid={API_KEY}"
    data = requests.get(url).json()

    return {
        "MinTemp": data["main"]["temp"],   
        "MaxTemp": data["main"]["temp"],
        "Rainfall": data.get("rain", {}).get("1h", 0),
        "Humidity9am": data["main"]["humidity"],
        "Humidity3pm": data["main"]["humidity"],
        "Pressure9am": data["main"]["pressure"],
        "Pressure3pm": data["main"]["pressure"],
        "Month": datetime.now().month
    }    


def predict_from_api(lat, lon):
    weather = get_weather_data(lat, lon)

    df = pd.DataFrame([weather])

    prediction = model.predict(df)

    return {
        "weather_data": weather,
        "prediction": int(prediction[0])
    }



# for future pred 


def get_forecast_data(lat, lon):
    url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&units=metric&appid={API_KEY}"
    data = requests.get(url).json()

    forecasts = []

    for item in data["list"]:
        forecasts.append({
            "MinTemp": item["main"].get("temp_min", item["main"]["temp"]),
            "MaxTemp": item["main"].get("temp_max", item["main"]["temp"]),
            "Rainfall": item.get("rain", {}).get("3h", 0),
            "Humidity9am": item["main"]["humidity"],
            "Humidity3pm": item["main"]["humidity"],
            "Pressure9am": item["main"]["pressure"],
            "Pressure3pm": item["main"]["pressure"],
            "Month": datetime.fromtimestamp(item["dt"]).month,
            "datetime": item["dt_txt"]
        })

    return forecasts



def predict_forecast(lat, lon):
    forecasts = get_forecast_data(lat, lon)

    results = []

    for f in forecasts:
        df = pd.DataFrame([{
            "MinTemp": f["MinTemp"],
            "MaxTemp": f["MaxTemp"],
            "Rainfall": f["Rainfall"],
            "Humidity9am": f["Humidity9am"],
            "Humidity3pm": f["Humidity3pm"],
            "Pressure9am": f["Pressure9am"],
            "Pressure3pm": f["Pressure3pm"],
            "Month": f["Month"]
        }])

        pred = model.predict(df)[0]

        results.append({
            "datetime": f["datetime"],
            "prediction": int(pred)
        })

    return results