"""
Expert Connector — Kisan AI
============================
ARCHITECTURAL NOTE: Expert selection is NOT handled here.

Expert matching is an integral step inside crop_diagnosis_agent.py.
After Gemini Vision identifies the disease, that same pipeline loads
experts.json and selects the nearest specialist whose 'specialization'
field matches the farmer's crop type.  There is no separate expert-
selection network call or agent; doing so would duplicate the vision
context and produce inconsistent results.

Delegation: crop_diagnosis_agent.run_crop_diagnosis_agent()
           (Step 7 of the diagnosis pipeline — see crop_diagnosis_agent.py)

This module re-exports run_crop_diagnosis_agent so that any caller
who imports from expert_connector gets the full pipeline that includes
expert selection.
"""

# Re-export the coordinator that owns expert-selection logic.
from agents.crop_diagnosis_agent import run_crop_diagnosis_agent  # noqa: F401
