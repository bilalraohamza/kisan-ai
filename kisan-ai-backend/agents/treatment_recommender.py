"""
Treatment Recommender — Kisan AI
==================================
ARCHITECTURAL NOTE: Treatment recommendation is NOT handled here.

Once crop_diagnosis_agent.py receives the disease identification from
Gemini 2.5 Flash Vision, it immediately calls the OpenRouter LLM with
a treatment prompt that includes the diagnosed disease name, severity,
spread risk, crop type, and farm acreage.  The LLM returns medicines
available in Pakistan with per-acre quantities and total cost in PKR.

Separating this into its own network call would require passing the
full vision output across an extra hop and would introduce an
unnecessary latency penalty for farmers on slow connections.

Delegation: crop_diagnosis_agent.run_crop_diagnosis_agent()
           (Step 5-6 of the diagnosis pipeline — see crop_diagnosis_agent.py)

This module re-exports run_crop_diagnosis_agent so that any caller
who imports from treatment_recommender gets the full pipeline that
includes LLM-driven treatment generation.
"""

# Re-export the coordinator that owns treatment-recommendation logic.
from agents.crop_diagnosis_agent import run_crop_diagnosis_agent  # noqa: F401
