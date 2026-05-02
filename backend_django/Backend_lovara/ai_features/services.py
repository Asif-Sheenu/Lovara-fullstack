from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY")
)


def get_booking_recommendation(weather=None, seasonal_hint=None, reviews=None):
    try:
        reviews_text = "\n".join(reviews) if reviews else "No reviews available"

        prompt = f"""
You are a strict booking decision engine.

RULES (MANDATORY):
- Use ONLY the given data.
- If weather is available → IGNORE seasonal trend.
- If weather is "Unknown" or "Not available" → use seasonal trend.
- DO NOT assume any extra weather conditions.
- DO NOT add explanations outside the format.

DATA:
Weather: {weather}
Season: {seasonal_hint}
Reviews: {reviews_text}

OUTPUT FORMAT (STRICT — NO EXTRA TEXT):

Weather Impact: <one short sentence>
Vendor Reliability: <one short sentence>
Final Suggestion: <Proceed / Caution / Avoid with reason>
"""

        response = client.chat.completions.create(
            model="meta-llama/llama-3-8b-instruct",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3 
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        return f"AI Error: {str(e)}"