"""Tests for senior management endpoints."""


def test_create_senior(client, auth_headers):
    response = client.post("/api/seniors/", json={
        "first_name": "Jeanne",
        "last_name": "Martin",
        "birth_date": "1940-03-15",
        "birth_place": "Nice",
    }, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["first_name"] == "Jeanne"
    assert data["birth_place"] == "Nice"


def test_list_seniors(client, auth_headers, senior_id):
    response = client.get("/api/seniors/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == senior_id


def test_get_senior(client, auth_headers, senior_id):
    response = client.get(f"/api/seniors/{senior_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["first_name"] == "Jeanne"


def test_get_senior_unauthorized(client, senior_id):
    # Register a different user
    reg = client.post("/api/auth/register", json={
        "email": "other@memoria.fr",
        "password": "password123",
        "first_name": "Other",
        "last_name": "User",
        "gdpr_consent": True,
    })
    other_headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    response = client.get(f"/api/seniors/{senior_id}", headers=other_headers)
    assert response.status_code == 403


def test_update_senior(client, auth_headers, senior_id):
    response = client.put(f"/api/seniors/{senior_id}", json={
        "first_name": "Jeannette",
    }, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["first_name"] == "Jeannette"


def test_get_nonexistent_senior(client, auth_headers):
    response = client.get("/api/seniors/999", headers=auth_headers)
    assert response.status_code == 404
