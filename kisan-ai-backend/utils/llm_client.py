import requests
import os
import json
import time
from dotenv import load_dotenv

load_dotenv()

_key = os.getenv("OPENROUTER_API_KEY")

_last_request_time: float = 0
_min_interval: float = 2

# Priority order — best Urdu/Roman Urdu first
MODELS = [
    "openrouter/auto",
    "openai/gpt-oss-120b:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "deepseek/deepseek-v4-flash:free",
    "z-ai/glm-4.5-air:free",
]

def call_llm(prompt: str) -> dict:
    global _last_request_time

    elapsed = time.time() - _last_request_time
    if elapsed < _min_interval:
        time.sleep(_min_interval - elapsed)

    for model in MODELS:
        try:
            _last_request_time = time.time()
            print(f"[llm_client] Trying model: {model}")

            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://github.com/kisan-ai",
                    "X-Title": "Kisan AI"
                },
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3
                },
                timeout=30
            )

            data = response.json()

            # Check for rate limit or error response
            if response.status_code == 429 or "error" in data:
                error_msg = data.get("error", {}).get("message", "unknown error")
                print(f"[llm_client] {model} failed: {error_msg}. Switching to next model...")
                time.sleep(2)
                continue

            raw_text = data["choices"][0]["message"]["content"].strip()

            # Strip markdown fences
            if raw_text.startswith("```"):
                raw_text = raw_text.split("```")[1]
                if raw_text.startswith("json"):
                    raw_text = raw_text[4:]
            raw_text = raw_text.strip()

            result = json.loads(raw_text)
            print(f"[llm_client] Success with model: {model}")
            return result

        except json.JSONDecodeError:
            print(f"[llm_client] {model} returned invalid JSON. Switching...")
            continue
        except Exception as e:
            print(f"[llm_client] {model} error: {str(e)}. Switching...")
            time.sleep(2)
            continue

    raise Exception("All models failed. Check OpenRouter API key and model availability.")