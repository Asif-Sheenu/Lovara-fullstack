from pydantic import BaseModel

class WeatherInput(BaseModel):
    MinTemp: float
    MaxTemp: float
    Rainfall: float
    Humidity9am: float
    Humidity3pm: float
    Pressure9am: float
    Pressure3pm: float
    Temp9am: float