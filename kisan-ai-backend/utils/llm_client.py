import requests
import os
import json
import time
from dotenv import load_dotenv

load_dotenv()

_last_request_time: float = 0
_min_interval: float = 0

OPENROUTER_MODELS = [
    "openrouter/auto",
    "openai/gpt-oss-120b:free",
    "qwen/qwen3-30b-a3b:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "deepseek/deepseek-v4-flash:free"
]




def call_openrouter(prompt: str, timeout: int = 40) -> dict:
    """Call OpenRouter as fallback."""
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise Exception("No OPENROUTER_API_KEY")

    for model in OPENROUTER_MODELS:
        try:
            print(f"[llm_client] Trying OpenRouter: {model}")
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://github.com/kisan-ai",
                    "X-Title": "Kisan AI"
                },
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3
                },
                timeout=timeout
            )

            data = response.json()

            if response.status_code == 429 or "error" in data:
                print(f"[llm_client] OpenRouter {model} failed. Trying next.")
                time.sleep(2)
                continue

            raw_text = data["choices"][0]["message"]["content"].strip()

            if raw_text.startswith("```"):
                raw_text = raw_text.split("```")[1]
                if raw_text.startswith("json"):
                    raw_text = raw_text[4:]
            raw_text = raw_text.strip()

            result = json.loads(raw_text)
            print(f"[llm_client] Success with OpenRouter: {model}")
            return result

        except requests.exceptions.Timeout:
            print(f"[llm_client] OpenRouter {model} timed out. Trying next.")
            continue
        except json.JSONDecodeError:
            print(f"[llm_client] OpenRouter {model} invalid JSON. Trying next.")
            continue
        except Exception as e:
            print(f"[llm_client] OpenRouter {model} error: {str(e)}. Trying next.")
            continue

    raise Exception("All OpenRouter models failed")


def call_groq(prompt: str, timeout: int = 15) -> dict:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise Exception("No GROQ_API_KEY")

    GROQ_MODELS = [
        "llama-3.3-70b-versatile",
        "llama-4-scout",
        "gpt-oss-120b"
        
    ]

    for model in GROQ_MODELS:
        try:
            print(f"[llm_client] Trying Groq: {model}")
            response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3
                },
                timeout=timeout
            )

            data = response.json()

            if response.status_code == 429:
                print(f"[llm_client] Groq {model} rate limited. Trying next.")
                time.sleep(2)
                continue

            if response.status_code != 200:
                print(f"[llm_client] Groq {model} error {response.status_code}. Trying next.")
                continue

            raw_text = data["choices"][0]["message"]["content"].strip()

            if raw_text.startswith("```"):
                raw_text = raw_text.split("```")[1]
                if raw_text.startswith("json"):
                    raw_text = raw_text[4:]
            raw_text = raw_text.strip()

            result = json.loads(raw_text)
            print(f"[llm_client] Success with Groq: {model}")
            return result

        except requests.exceptions.Timeout:
            print(f"[llm_client] Groq {model} timed out. Trying next.")
            continue
        except json.JSONDecodeError:
            print(f"[llm_client] Groq {model} invalid JSON. Trying next.")
            continue
        except Exception as e:
            print(f"[llm_client] Groq {model} error: {str(e)}. Trying next.")
            continue

    raise Exception("All Groq models failed")

def call_llm(prompt: str) -> dict:
    global _last_request_time

    elapsed = time.time() - _last_request_time
    if elapsed < _min_interval:
        time.sleep(_min_interval - elapsed)
    _last_request_time = time.time()

    # 1. Try Groq first — fastest
    try:
        return call_groq(prompt, timeout=15)
    except Exception as e:
        print(f"[llm_client] Groq failed: {e}. Trying OpenRouter.")

    # 2. OpenRouter as fallback
    try:
        return call_openrouter(prompt, timeout=40)
    except Exception as e:
        print(f"[llm_client] All providers failed: {e}")
        raise Exception("All LLM providers failed.")