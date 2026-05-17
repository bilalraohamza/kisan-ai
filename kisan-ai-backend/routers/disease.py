"""
Disease Router — /api/disease
Handles crop disease detection via image upload + Gemini 2.5 Flash Vision.
"""

from fastapi import APIRouter, UploadFile, File, Form
from agents.crop_diagnosis_agent import run_crop_diagnosis_agent

router = APIRouter()


@router.post("/analyze", summary="Upload a crop photo for disease diagnosis")
async def analyze_disease(
    image: UploadFile = File(..., description="Crop photo (JPEG or PNG)"),
    crop_type: str = Form(..., description="Crop name e.g. wheat, cotton, rice"),
    acres: float = Form(..., description="Farm size in acres"),
    session_id: str = Form(..., description="Unique session identifier"),
    language: str = Form(default="roman_urdu", description="roman_urdu | urdu | english")
):
    """
    Full disease diagnosis pipeline:
    1. Gemini 2.5 Flash Vision analyses the uploaded crop photo
    2. OpenRouter LLM generates a treatment plan in the farmer's language
    3. Nearest matching expert is recommended from experts.json
    """
    image_bytes = await image.read()
    result = run_crop_diagnosis_agent(
        image_bytes=image_bytes,
        crop_type=crop_type,
        acres=acres,
        session_id=session_id,
        language=language
    )
    return result


@router.get("/", summary="Disease router status")
async def disease_status():
    """Liveness check for the disease router."""
    return {"status": "disease router active — POST to /api/disease/analyze to diagnose a crop"}
