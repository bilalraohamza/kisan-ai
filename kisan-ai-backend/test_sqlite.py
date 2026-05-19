from fastapi.testclient import TestClient
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from main import app

with TestClient(app) as client:
    print("--- MESSAGE 1 ---")
    resp1 = client.post("/api/chat", json={
      "message": "Gandam ka rate kya hy",
      "session_id": "sqlite_test_1",
      "language": "roman_urdu",
      "farmer_profile": {}
    })
    print(resp1.json())

    print("\n--- MESSAGE 2 ---")
    resp2 = client.post("/api/chat", json={
      "message": "Multan",
      "session_id": "sqlite_test_1",
      "language": "roman_urdu",
      "farmer_profile": {}
    })
    print(resp2.json())

    print("\n--- MESSAGE 3 ---")
    resp3 = client.post("/api/chat", json={
      "message": "5 acre",
      "session_id": "sqlite_test_1",
      "language": "roman_urdu",
      "farmer_profile": {}
    })
    print(resp3.json())
