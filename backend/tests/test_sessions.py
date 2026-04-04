"""Tests for session and conversation endpoints."""


def test_start_session(client, senior_id):
    response = client.post("/api/sessions/start", json={
        "senior_id": senior_id,
    })
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "active"
    assert data["senior_id"] == senior_id


def test_send_message(client, senior_id):
    # Start session
    session = client.post("/api/sessions/start", json={"senior_id": senior_id}).json()

    # Send message (uses fallback AI since no API key in tests)
    response = client.post(f"/api/sessions/{session['id']}/message", json={
        "text": "Je me souviens de mon enfance a Nice",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["user_text"] == "Je me souviens de mon enfance a Nice"
    assert len(data["ai_response"]) > 0
    assert data["latency_ms"] > 0


def test_end_session(client, senior_id):
    session = client.post("/api/sessions/start", json={"senior_id": senior_id}).json()

    response = client.post(f"/api/sessions/{session['id']}/end")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "completed"
    assert data["ended_at"] is not None


def test_get_session(client, senior_id):
    session = client.post("/api/sessions/start", json={"senior_id": senior_id}).json()

    response = client.get(f"/api/sessions/{session['id']}")
    assert response.status_code == 200
    assert response.json()["id"] == session["id"]


def test_message_on_ended_session(client, senior_id):
    session = client.post("/api/sessions/start", json={"senior_id": senior_id}).json()
    client.post(f"/api/sessions/{session['id']}/end")

    response = client.post(f"/api/sessions/{session['id']}/message", json={
        "text": "test",
    })
    assert response.status_code == 404
