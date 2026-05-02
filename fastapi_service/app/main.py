from fastapi import FastAPI, HTTPException, Query
import requests
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

API_KEY = os.getenv("OPENWEATHER_API_KEY")


def fetch_forecast(lat: float, lon: float):
    url = (
        f"https://api.openweathermap.org/data/2.5/forecast"
        f"?lat={lat}&lon={lon}&units=metric&appid={API_KEY}"
    )

    res = requests.get(url)

    if res.status_code != 200:
        raise HTTPException(status_code=500, detail="Forecast fetch failed")

    return res.json()


@app.get("/predict_forecast/")
def predict_forecast(
    lat: float,
    lon: float,
    date: str = Query(..., description="Format: YYYY-MM-DD")
):
    data = fetch_forecast(lat, lon)

    target_date = datetime.strptime(date, "%Y-%m-%d").date()

    matched_data = [
        item for item in data["list"]
        if datetime.fromtimestamp(item["dt"]).date() == target_date
    ]

    if not matched_data:
        raise HTTPException(status_code=404, detail="No data for this date")

    temps = [x["main"]["temp"] for x in matched_data]
    weather_desc = matched_data[0]["weather"][0]["description"]

    return {
        "date": str(target_date),
        "avg_temp": sum(temps) / len(temps),
        "min_temp": min(temps),
        "max_temp": max(temps),
        "condition": weather_desc
    }