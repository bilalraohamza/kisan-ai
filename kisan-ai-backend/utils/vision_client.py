"""
Vision Client — Kisan AI
==========================
Handles ALL image analysis using Gemini 2.5 Flash Vision API.
Text agents use llm_client.py instead — this file is vision-only.
"""

import requests
import os
import base64
import json
import time
from dotenv import load_dotenv

load_dotenv()

_last_request_time: float = 0
_min_interval: float = 6  # 6 seconds between vision calls (rate-limit safe)


def analyze_image(image_bytes: bytes, prompt: str) -> dict:
    """
    Send an image to Gemini 2.5 Flash Vision for analysis.

    Args:
        image_bytes: Raw image bytes (JPEG/PNG).
        prompt:      Analysis prompt to send alongside the image.

    Returns:
        Parsed JSON dict from Gemini's response.

    Raises:
        Exception: After 3 failed retries.
    """
    global _last_request_time

    elapsed = time.time() - _last_request_time
    if elapsed < _min_interval:
        time.sleep(_min_interval - elapsed)

    image_b64 = base64.b64encode(image_bytes).decode("utf-8")

    max_retries = 3
    for attempt in range(max_retries):
        try:
            _last_request_time = time.time()
            print(f"[vision_client] Sending image to Gemini 2.5 Flash...")

            response = requests.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={os.getenv('GEMINI_API_KEY')}",
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{
                        "parts": [
                            {"text": prompt},
                            {
                                "inline_data": {
                                    "mime_type": "image/jpeg",
                                    "data": image_b64
                                }
                            }
                        ]
                    }]
                },
                timeout=30
            )

            data = response.json()

            if response.status_code == 429:
                wait = (attempt + 1) * 15
                print(f"[vision_client] Rate limit. Waiting {wait}s...")
                time.sleep(wait)
                continue

            if response.status_code != 200:
                raise Exception(f"Gemini Vision API error: {data}")

            raw_text = data["candidates"][0]["content"]["parts"][0]["text"].strip()

            # Strip markdown fences if Gemini wraps the JSON
            if raw_text.startswith("```"):
                raw_text = raw_text.split("```")[1]
                if raw_text.startswith("json"):
                    raw_text = raw_text[4:]
            raw_text = raw_text.strip()

            result = json.loads(raw_text)
            print(f"[vision_client] Analysis complete.")
            return result

        except json.JSONDecodeError:
            print(f"[vision_client] Invalid JSON from Gemini. Retrying...")
            time.sleep(10)
        except Exception as e:
            print(f"[vision_client] Error: {str(e)}")
            if attempt < max_retries - 1:
                time.sleep(10)
            else:
                raise e

    raise Exception("Vision analysis failed after 3 retries.")
