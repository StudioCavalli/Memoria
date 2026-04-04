from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class CognitiveMetricResponse(BaseModel):
    id: int
    senior_id: int
    session_id: int
    unique_words: int
    type_token_ratio: float
    avg_sentence_length: float
    named_entities_count: int
    avg_latency_ms: float
    max_latency_ms: float
    silence_count: int
    evasive_responses: int
    recorded_at: datetime

    model_config = {"from_attributes": True}


class MetricsSummary(BaseModel):
    semantic_richness_trend: str  # "stable", "increasing", "decreasing"
    latency_trend: str
    avg_unique_words_7d: float
    avg_latency_7d: float
    vitality_score: float  # 0-100
    sessions_count_7d: int
