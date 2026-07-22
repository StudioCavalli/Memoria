"""Tests for memory endpoints: creation, retrieval, filtering, themes."""

import json
from datetime import datetime, timezone

from app.core.encryption import encrypt_text
from app.models.memory import Memory
from app.models.theme import Theme


def _create_themes(db):
    """Helper to create themes in the database."""
    themes = []
    for name in ["Enfance", "Famille", "Travail", "Voyages", "Cuisine"]:
        t = Theme(name=name, description=f"Theme {name}")
        db.add(t)
        themes.append(t)
    db.commit()
    return {t.name: t for t in themes}


def _create_memory(db, senior_id, title, summary, period=None, themes=None, people=None, places=None):
    """Helper to create a memory directly in the database."""
    m = Memory(
        senior_id=senior_id,
        title=title,
        summary_encrypted=encrypt_text(summary),
        period=period,
        people=json.dumps(people or [], ensure_ascii=False),
        places=json.dumps(places or [], ensure_ascii=False),
        themes=themes or [],
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


def test_list_memories_empty(client, senior_id):
    """Listing memories for a senior with no memories returns empty list."""
    response = client.get(f"/api/memories/?senior_id={senior_id}")
    assert response.status_code == 200
    assert response.json() == []


def test_list_memories_returns_data(client, senior_id, db):
    """Memories endpoint returns decrypted data."""
    themes = _create_themes(db)
    _create_memory(
        db, senior_id,
        title="Les etes a Nice",
        summary="Jeanne passait ses etes au bord de la mer a Nice avec sa famille.",
        period="Enfance",
        themes=[themes["Enfance"]],
        people=["Marie", "Jacques"],
        places=["Nice"],
    )

    response = client.get(f"/api/memories/?senior_id={senior_id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Les etes a Nice"
    assert "Jeanne passait ses etes" in data[0]["summary"]
    assert data[0]["period"] == "Enfance"
    assert "Marie" in data[0]["people"]
    assert "Nice" in data[0]["places"]
    assert "Enfance" in data[0]["themes"]


def test_list_memories_filter_by_theme(client, senior_id, db):
    """Filtering by theme_id returns only matching memories."""
    themes = _create_themes(db)
    _create_memory(db, senior_id, "Souvenir d'enfance", "Un beau souvenir.", period="Enfance", themes=[themes["Enfance"]])
    _create_memory(db, senior_id, "Recette de cuisine", "La tarte aux pommes.", period="Vie adulte", themes=[themes["Cuisine"]])

    enfance_id = themes["Enfance"].id
    response = client.get(f"/api/memories/?senior_id={senior_id}&theme_id={enfance_id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Souvenir d'enfance"


def test_list_memories_filter_by_period(client, senior_id, db):
    """Filtering by period returns only matching memories."""
    _create_memory(db, senior_id, "Enfance Nice", "Souvenir de Nice.", period="Enfance")
    _create_memory(db, senior_id, "Travail a Paris", "Premier emploi.", period="Annees 60")

    response = client.get(f"/api/memories/?senior_id={senior_id}&period=Enfance")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Enfance Nice"


def test_list_memories_pagination_skip(client, senior_id, db):
    """Skip parameter works for pagination."""
    for i in range(5):
        _create_memory(db, senior_id, f"Souvenir {i}", f"Contenu du souvenir numero {i}.")

    response = client.get(f"/api/memories/?senior_id={senior_id}&skip=3&limit=10")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2


def test_list_memories_pagination_limit(client, senior_id, db):
    """Limit parameter caps the number of results."""
    for i in range(5):
        _create_memory(db, senior_id, f"Souvenir {i}", f"Contenu {i}.")

    response = client.get(f"/api/memories/?senior_id={senior_id}&limit=2")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2


def test_get_single_memory(client, senior_id, db):
    """Retrieving a single memory by ID returns full details."""
    themes = _create_themes(db)
    mem = _create_memory(
        db, senior_id,
        title="Le jardin de grand-mere",
        summary="Un magnifique jardin fleuri avec des roses et du jasmin.",
        period="Enfance",
        themes=[themes["Famille"]],
        people=["Grand-mere Lucienne"],
        places=["Provence"],
    )

    response = client.get(f"/api/memories/{mem.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Le jardin de grand-mere"
    assert "magnifique jardin" in data["summary"]
    assert data["senior_id"] == senior_id
    assert "Famille" in data["themes"]


def test_get_memory_not_found(client, auth_headers):
    """Requesting a non-existent memory returns 404."""
    response = client.get("/api/memories/99999", headers=auth_headers)
    assert response.status_code == 404


def test_list_themes(client, db, auth_headers):
    """Themes endpoint returns all registered themes."""
    _create_themes(db)

    response = client.get("/api/memories/themes/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 5
    names = [t["name"] for t in data]
    assert "Enfance" in names
    assert "Cuisine" in names


def test_list_themes_empty(client, auth_headers):
    """Themes endpoint returns empty list when no themes exist."""
    response = client.get("/api/memories/themes/", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == []


def test_memories_ordered_by_created_at(client, senior_id, db):
    """Memories are returned in reverse chronological order."""
    import time
    m1 = _create_memory(db, senior_id, "Premier souvenir", "Le plus ancien.")
    # Force a slight time gap by adjusting created_at
    m2 = _create_memory(db, senior_id, "Deuxieme souvenir", "Le plus recent.")

    response = client.get(f"/api/memories/?senior_id={senior_id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    # Most recent first
    assert data[0]["title"] == "Deuxieme souvenir"


def test_memory_with_multiple_themes(client, senior_id, db):
    """A memory can belong to multiple themes."""
    themes = _create_themes(db)
    mem = _create_memory(
        db, senior_id,
        title="Noel en famille a Nice",
        summary="Les fetes de Noel avec toute la famille reunis a Nice.",
        themes=[themes["Famille"], themes["Enfance"]],
    )

    response = client.get(f"/api/memories/{mem.id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data["themes"]) == 2
    assert "Famille" in data["themes"]
    assert "Enfance" in data["themes"]
