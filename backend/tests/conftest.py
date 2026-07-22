"""Test configuration and fixtures."""

import os

# Must be set before importing the app so Settings picks it up: the in-memory
# rate-limit counters are process-global and would otherwise trip across tests.
os.environ.setdefault("RATE_LIMIT_ENABLED", "false")

import json
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.encryption import encrypt_text
from app.main import app
from app.models.cognitive_metric import CognitiveMetric
from app.models.memory import Memory
from app.models.session import Session as ConvSession
from app.models.theme import Theme
from app.models.transcription import Transcription

# In-memory SQLite for tests
TEST_DATABASE_URL = "sqlite://"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    """Create all tables before each test, drop after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    """Database session fixture."""
    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    """FastAPI test client with overridden DB dependency."""
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers(client):
    """Register a user and return auth headers."""
    response = client.post("/api/auth/register", json={
        "email": "test@memoria.fr",
        "password": "testpassword123",
        "first_name": "Marie",
        "last_name": "Dupont",
        "gdpr_consent": True,
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def senior_id(client, auth_headers):
    """Create a senior and return their ID.

    Also sets the auth header as the client default so subsequent calls to
    ownership-protected routes are authenticated as this senior's family member.
    """
    response = client.post("/api/seniors/", json={
        "first_name": "Jeanne",
        "last_name": "Martin",
        "birth_date": "1940-03-15",
        "birth_place": "Nice",
    }, headers=auth_headers)
    client.headers.update(auth_headers)
    return response.json()["id"]


@pytest.fixture
def senior_with_sessions(client, senior_id, db):
    """Create a senior with 3 completed sessions, each with transcriptions."""
    now = datetime.now(timezone.utc)
    sessions = []

    french_conversations = [
        [
            ("senior", "Je me souviens de mon enfance a Nice, pres de la mer."),
            ("ai", "C'est merveilleux. Pouvez-vous me decrire votre quartier ?"),
            ("senior", "Nous habitions dans le Vieux-Nice, avec ma mere Marie et mon pere Jacques."),
            ("ai", "Le Vieux-Nice, quel beau quartier. Quels souvenirs gardez-vous de cette epoque ?"),
        ],
        [
            ("senior", "J'ai travaille comme institutrice pendant trente ans a l'ecole du village."),
            ("ai", "Trente ans, c'est une belle carriere. Qu'est-ce qui vous plaisait dans ce metier ?"),
            ("senior", "Les enfants, surtout. Je ne sais pas comment expliquer cette joie."),
            ("ai", "C'est tres touchant. Avez-vous garde contact avec certains eleves ?"),
        ],
        [
            ("senior", "Nous avons voyage en Italie avec mon mari Pierre en 1965."),
            ("ai", "L'Italie en 1965, comme c'est romantique ! Ou etes-vous alles ?"),
            ("senior", "Bof, je me souviens plus tres bien. Rome, Florence peut-etre."),
            ("ai", "Rome et Florence, ce sont de magnifiques villes. Y a-t-il un moment particulier ?"),
        ],
    ]

    for i, conversation in enumerate(french_conversations):
        session = ConvSession(
            senior_id=senior_id,
            status="completed",
            started_at=now - timedelta(days=3 - i, hours=2),
            ended_at=now - timedelta(days=3 - i, hours=1),
            duration_seconds=3600,
        )
        db.add(session)
        db.flush()

        for order, (speaker, text) in enumerate(conversation):
            t = Transcription(
                session_id=session.id,
                speaker=speaker,
                content_encrypted=encrypt_text(text),
                sequence_order=order + 1,
                latency_ms=1500.0 + (order * 200) if speaker == "senior" else None,
            )
            db.add(t)

        sessions.append(session)

    db.commit()
    return {"senior_id": senior_id, "sessions": sessions}


@pytest.fixture
def senior_with_metrics(senior_id, db):
    """Create cognitive metrics showing decline over two weeks."""
    now = datetime.now(timezone.utc)

    # Create sessions for the metrics to reference
    sessions = []
    for i in range(6):
        session = ConvSession(
            senior_id=senior_id,
            status="completed",
            started_at=now - timedelta(days=13 - i * 2),
            ended_at=now - timedelta(days=13 - i * 2, hours=-1),
            duration_seconds=3600 if i < 3 else 1800,
        )
        db.add(session)
        db.flush()
        sessions.append(session)

    # Previous week metrics (days 14-7): healthy baseline
    for i, session in enumerate(sessions[:3]):
        metric = CognitiveMetric(
            senior_id=senior_id,
            session_id=session.id,
            unique_words=120 - i * 5,
            type_token_ratio=0.72 - i * 0.01,
            avg_sentence_length=12.5,
            named_entities_count=8,
            avg_latency_ms=1800.0 + i * 100,
            max_latency_ms=3500.0,
            silence_count=1,
            evasive_responses=1,
            recorded_at=now - timedelta(days=13 - i * 2),
        )
        db.add(metric)

    # Recent week metrics (days 7-0): showing decline
    for i, session in enumerate(sessions[3:]):
        metric = CognitiveMetric(
            senior_id=senior_id,
            session_id=session.id,
            unique_words=70 - i * 10,
            type_token_ratio=0.50 - i * 0.05,
            avg_sentence_length=8.0 - i * 0.5,
            named_entities_count=3,
            avg_latency_ms=3200.0 + i * 500,
            max_latency_ms=8000.0 + i * 1000,
            silence_count=4 + i,
            evasive_responses=4 + i * 2,
            recorded_at=now - timedelta(days=6 - i * 2),
        )
        db.add(metric)

    db.commit()
    return {"senior_id": senior_id, "sessions": sessions}


@pytest.fixture
def mock_anthropic():
    """Patch the anthropic client for all LLM calls."""
    mock_response = MagicMock()
    mock_response.content = [MagicMock(text="C'est un souvenir magnifique. Racontez-moi davantage.")]

    mock_client = MagicMock()
    mock_client.messages.create.return_value = mock_response

    with patch("anthropic.Anthropic", return_value=mock_client) as mock_cls:
        mock_cls._instance = mock_client
        yield mock_client
