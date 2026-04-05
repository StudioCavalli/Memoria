"""Tests for gazette generation: PDF creation, LLM narrative, storage, endpoints."""

import json
from datetime import date, datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

from app.core.encryption import encrypt_text
from app.models.gazette import Gazette
from app.models.memory import Memory
from app.models.session import Session as ConvSession
from app.services.gazette_service import GazetteGeneratorService


def _create_memories_for_gazette(db, senior_id, count=3):
    """Create memories dated within last week for gazette generation."""
    today = date.today()
    week_start = today - timedelta(days=today.weekday() + 7)
    memories = []
    for i in range(count):
        mem = Memory(
            senior_id=senior_id,
            title=f"Souvenir de la semaine {i + 1}",
            summary_encrypted=encrypt_text(
                f"Jeanne a raconte un magnifique souvenir numero {i + 1} "
                f"a propos de son enfance a Nice."
            ),
            period="Enfance",
            people=json.dumps(["Marie", "Jacques"], ensure_ascii=False),
            places=json.dumps(["Nice"], ensure_ascii=False),
            created_at=datetime.combine(
                week_start + timedelta(days=i),
                datetime.min.time(),
            ).replace(tzinfo=timezone.utc),
        )
        db.add(mem)
        memories.append(mem)
    db.commit()
    return memories


def _create_sessions_for_gazette(db, senior_id, count=2):
    """Create completed sessions dated within last week."""
    today = date.today()
    week_start = today - timedelta(days=today.weekday() + 7)
    for i in range(count):
        session = ConvSession(
            senior_id=senior_id,
            status="completed",
            started_at=datetime.combine(
                week_start + timedelta(days=i),
                datetime.min.time(),
            ).replace(tzinfo=timezone.utc),
            ended_at=datetime.combine(
                week_start + timedelta(days=i),
                datetime.min.time(),
            ).replace(tzinfo=timezone.utc) + timedelta(hours=1),
            duration_seconds=3600,
        )
        db.add(session)
    db.commit()


@patch("app.services.gazette_service.GazetteGeneratorService._store_pdf")
@patch("app.services.gazette_service.GazetteGeneratorService._send_gazette_email")
def test_generate_gazette_creates_pdf(mock_email, mock_store, client, senior_id, db):
    """Generating a gazette produces a valid Gazette record."""
    mock_store.return_value = "https://storage.example.com/gazette.pdf"

    _create_memories_for_gazette(db, senior_id)
    _create_sessions_for_gazette(db, senior_id)

    service = GazetteGeneratorService(db)
    gazette = service.generate_for_senior(senior_id)

    assert gazette is not None
    assert gazette.senior_id == senior_id
    assert "Jeanne" in gazette.title
    assert gazette.pdf_url == "https://storage.example.com/gazette.pdf"
    assert gazette.week_start is not None
    assert gazette.week_end is not None


@patch("app.services.gazette_service.GazetteGeneratorService._store_pdf")
@patch("app.services.gazette_service.GazetteGeneratorService._send_gazette_email")
def test_generate_gazette_pdf_is_bytes(mock_email, mock_store, client, senior_id, db):
    """The _build_pdf method returns bytes (valid PDF content)."""
    mock_store.return_value = "/fake/url.pdf"

    _create_memories_for_gazette(db, senior_id)
    _create_sessions_for_gazette(db, senior_id)

    service = GazetteGeneratorService(db)

    from app.models.senior import Senior
    senior = db.query(Senior).filter(Senior.id == senior_id).first()
    memories = db.query(Memory).filter(Memory.senior_id == senior_id).all()
    sessions = db.query(ConvSession).filter(
        ConvSession.senior_id == senior_id, ConvSession.status == "completed"
    ).all()

    today = date.today()
    week_start = today - timedelta(days=today.weekday() + 7)
    week_end = week_start + timedelta(days=6)

    narrative = "Jeanne a partage de merveilleux souvenirs cette semaine."
    pdf_bytes = service._build_pdf(
        f"La Gazette de {senior.first_name}",
        senior, memories, sessions, narrative, week_start, week_end,
    )

    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 100
    # PDF files start with %PDF
    assert pdf_bytes[:5] == b"%PDF-"


@patch("app.services.gazette_service.GazetteGeneratorService._store_pdf")
@patch("app.services.gazette_service.GazetteGeneratorService._send_gazette_email")
def test_generate_gazette_no_memories_returns_none(mock_email, mock_store, client, senior_id, db):
    """No gazette is generated when there are no memories for the week."""
    service = GazetteGeneratorService(db)
    gazette = service.generate_for_senior(senior_id)
    assert gazette is None


@patch("app.services.gazette_service.GazetteGeneratorService._store_pdf")
@patch("app.services.gazette_service.GazetteGeneratorService._send_gazette_email")
def test_generate_gazette_calls_store(mock_email, mock_store, client, senior_id, db):
    """PDF storage service is called during gazette generation."""
    mock_store.return_value = "https://s3.example.com/gazette.pdf"

    _create_memories_for_gazette(db, senior_id)
    _create_sessions_for_gazette(db, senior_id)

    service = GazetteGeneratorService(db)
    service.generate_for_senior(senior_id)

    mock_store.assert_called_once()


@patch("app.services.gazette_service.GazetteGeneratorService._store_pdf")
@patch("app.services.gazette_service.GazetteGeneratorService._send_gazette_email")
def test_generate_for_all_seniors(mock_email, mock_store, client, senior_id, db):
    """generate_for_all_seniors processes each senior."""
    mock_store.return_value = "https://s3.example.com/gazette.pdf"

    _create_memories_for_gazette(db, senior_id)
    _create_sessions_for_gazette(db, senior_id)

    service = GazetteGeneratorService(db)
    gazettes = service.generate_for_all_seniors()
    assert len(gazettes) == 1


def test_gazette_fallback_narrative(client, senior_id, db):
    """Fallback narrative uses raw memory summaries when no API key."""
    _create_memories_for_gazette(db, senior_id, count=2)

    from app.models.senior import Senior
    senior = db.query(Senior).filter(Senior.id == senior_id).first()
    memories = db.query(Memory).filter(Memory.senior_id == senior_id).all()

    service = GazetteGeneratorService(db)
    narrative = service._fallback_narrative(senior, memories)

    assert len(narrative) > 0
    assert "souvenir" in narrative.lower() or "Jeanne" in narrative


@patch("app.services.gazette_service.settings")
def test_generate_narrative_with_mock_llm(mock_settings, client, senior_id, db):
    """Narrative generation uses Anthropic when API key is available."""
    mock_settings.anthropic_api_key = "fake-key"

    _create_memories_for_gazette(db, senior_id)

    from app.models.senior import Senior
    senior = db.query(Senior).filter(Senior.id == senior_id).first()
    memories = db.query(Memory).filter(Memory.senior_id == senior_id).all()

    mock_response = MagicMock()
    mock_response.content = [MagicMock(text="Jeanne a partage de magnifiques souvenirs cette semaine.")]

    with patch("anthropic.Anthropic") as mock_anthropic_cls:
        mock_anthropic_cls.return_value.messages.create.return_value = mock_response

        service = GazetteGeneratorService(db)
        narrative = service._generate_narrative(senior, memories)

    assert "Jeanne" in narrative


def test_list_gazettes_empty(client, senior_id):
    """Gazette list is empty when no gazettes exist."""
    response = client.get(f"/api/gazettes/?senior_id={senior_id}")
    assert response.status_code == 200
    assert response.json() == []


def test_list_gazettes_returns_data(client, senior_id, db):
    """Gazette list endpoint returns existing gazettes."""
    today = date.today()
    gazette = Gazette(
        senior_id=senior_id,
        title="La Gazette de Jeanne",
        pdf_url="https://storage.example.com/gazette.pdf",
        week_start=today - timedelta(days=7),
        week_end=today - timedelta(days=1),
    )
    db.add(gazette)
    db.commit()

    response = client.get(f"/api/gazettes/?senior_id={senior_id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "La Gazette de Jeanne"
    assert data[0]["pdf_url"] == "https://storage.example.com/gazette.pdf"


def test_get_gazette_by_id(client, senior_id, db):
    """Single gazette retrieval by ID."""
    gazette = Gazette(
        senior_id=senior_id,
        title="Gazette Test",
        pdf_url="https://storage.example.com/test.pdf",
        week_start=date(2025, 1, 6),
        week_end=date(2025, 1, 12),
    )
    db.add(gazette)
    db.commit()
    db.refresh(gazette)

    response = client.get(f"/api/gazettes/{gazette.id}")
    assert response.status_code == 200
    assert response.json()["title"] == "Gazette Test"


def test_get_gazette_not_found(client):
    """Requesting a non-existent gazette returns 404."""
    response = client.get("/api/gazettes/99999")
    assert response.status_code == 404


def test_download_gazette_pdf_redirects(client, senior_id, db):
    """PDF download endpoint returns a redirect to the PDF URL."""
    gazette = Gazette(
        senior_id=senior_id,
        title="Gazette PDF",
        pdf_url="https://storage.example.com/download.pdf",
        week_start=date(2025, 2, 3),
        week_end=date(2025, 2, 9),
    )
    db.add(gazette)
    db.commit()
    db.refresh(gazette)

    response = client.get(f"/api/gazettes/{gazette.id}/pdf", follow_redirects=False)
    assert response.status_code == 307
    assert "storage.example.com" in response.headers.get("location", "")
