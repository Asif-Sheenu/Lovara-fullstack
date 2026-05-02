from fastapi import APIRouter
from app.schemas.predict_schema import WeatherInput
from app.services.prediction_service import predict_rain, predict_from_api, predict_forecast

router = APIRouter()

@router.post("/")
def predict(data:WeatherInput):
    result = predict_rain(data)
    return {"prediction": result}


@router.get("/predict_live")
def predict_live(lat: float, lon: float):
    return predict_from_api(lat, lon)



@router.get("/predict_forecast")
def predict_forecast_api(lat: float, lon: float):
    return predict_forecast(lat, lon)