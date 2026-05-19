import sqlite3
import json
import os
from datetime import datetime

DB_PATH = "/tmp/kisan_ai.db"

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS chat_sessions (
            session_id     TEXT PRIMARY KEY,
            language       TEXT DEFAULT 'roman_urdu',
            crop_type      TEXT,
            acres          REAL,
            location       TEXT,
            lat            REAL,
            lng            REAL,
            planting_date  TEXT,
            intent_history TEXT DEFAULT '[]',
            messages       TEXT DEFAULT '[]',
            created_at     TEXT,
            updated_at     TEXT
        )
    """)
    conn.commit()
    conn.close()

def get_session(session_id: str) -> dict:
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM chat_sessions WHERE session_id = ?",
        (session_id,)
    ).fetchone()
    conn.close()
    if not row:
        return {}
    data = dict(row)
    data['messages'] = json.loads(data['messages'] or '[]')
    data['intent_history'] = json.loads(data['intent_history'] or '[]')
    return data

def save_session(session_id: str, updates: dict):
    conn = get_connection()
    existing = conn.execute(
        "SELECT * FROM chat_sessions WHERE session_id = ?",
        (session_id,)
    ).fetchone()
    now = datetime.utcnow().isoformat()

    if not existing:
        conn.execute("""
            INSERT INTO chat_sessions
            (session_id, language, crop_type, acres, location,
             lat, lng, planting_date, intent_history, messages, 
             created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            session_id,
            updates.get('language', 'roman_urdu'),
            updates.get('crop_type'),
            updates.get('acres'),
            updates.get('location'),
            updates.get('lat'),
            updates.get('lng'),
            updates.get('planting_date'),
            json.dumps([]),
            json.dumps([]),
            now, now
        ))
    else:
        data = dict(existing)
        for key in ['language','crop_type','acres','location',
                    'lat','lng','planting_date']:
            val = updates.get(key)
            if val is not None and val != "" and val != "unknown":
                data[key] = val

        existing_msgs = json.loads(data['messages'] or '[]')
        new_msgs = updates.get('new_messages', [])
        existing_msgs.extend(new_msgs)
        data['messages'] = json.dumps(existing_msgs[-50:])

        existing_intents = json.loads(data['intent_history'] or '[]')
        if updates.get('intent'):
            existing_intents.append({
                'intent': updates['intent'],
                'timestamp': now
            })
        data['intent_history'] = json.dumps(existing_intents[-20:])
        data['updated_at'] = now

        conn.execute("""
            UPDATE chat_sessions SET
                language=?, crop_type=?, acres=?, location=?,
                lat=?, lng=?, planting_date=?, intent_history=?,
                messages=?, updated_at=?
            WHERE session_id=?
        """, (
            data['language'], data['crop_type'], data['acres'],
            data['location'], data['lat'], data['lng'],
            data['planting_date'], data['intent_history'],
            data['messages'], data['updated_at'], session_id
        ))

    conn.commit()
    conn.close()

def append_messages(session_id: str, new_messages: list):
    save_session(session_id, {'new_messages': new_messages})

def get_recent_messages(session_id: str, limit: int = 10) -> list:
    session = get_session(session_id)
    return session.get('messages', [])[-limit:]
