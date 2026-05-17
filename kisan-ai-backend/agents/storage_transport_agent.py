"""
Storage & Transport Agent — Kisan AI
======================================
ARCHITECTURAL NOTE: Storage and transport coordination are NOT handled here.

Both service types share identical coordination logic with harvesters,
tractors, and labor: load providers.json filtered by type, enrich each
record with real road distances from Google Distance Matrix (Haversine
fallback), then pass the enriched list to the LLM for intelligent
ranking and booking-message generation.

Creating separate agents for storage and transport would triplicate the
same distance-and-ranking code with only a one-word difference in the
service_type filter — an unmaintainable pattern.

Delegation:
  equipment_agent.run_equipment_agent(service_type="storage")
  equipment_agent.run_equipment_agent(service_type="transport")
  (see equipment_agent.py — service_type filters providers.json)

This module re-exports run_equipment_agent so that any caller who
imports from storage_transport_agent gets the full coordinator pipeline
with service_type passed in by the caller.
"""

# Re-export the coordinator that owns storage and transport logic.
from agents.equipment_agent import run_equipment_agent  # noqa: F401
