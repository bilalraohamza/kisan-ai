"""
Labor Agent — Kisan AI
=======================
ARCHITECTURAL NOTE: Labor coordination is NOT handled here.

Labor provider matching follows exactly the same flow as harvester or
tractor coordination: load providers.json, compute real road distances
via Google Distance Matrix (Haversine fallback), then let the LLM rank
providers by availability, proximity, trust score, and daily rate.

Duplicating that pipeline here would mean maintaining two copies of the
same distance-fetch and LLM-ranking logic — a maintenance liability
with no functional benefit.

Delegation: equipment_agent.run_equipment_agent(service_type="labor")
           (see equipment_agent.py — service_type filters providers.json)

This module re-exports run_equipment_agent so that any caller who
imports from labor_agent gets the full coordinator pipeline with
service_type set externally by the caller.
"""

# Re-export the coordinator that owns labor-coordination logic.
from agents.equipment_agent import run_equipment_agent  # noqa: F401
