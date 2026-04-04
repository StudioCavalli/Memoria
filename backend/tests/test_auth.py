"""Tests for authentication endpoints."""


def test_register_success(client):
    response = client.post("/api/auth/register", json={
        "email": "new@memoria.fr",
        "password": "password123",
        "first_name": "Test",
        "last_name": "User",
        "gdpr_consent": True,
    })
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_register_without_gdpr_consent(client):
    response = client.post("/api/auth/register", json={
        "email": "new@memoria.fr",
        "password": "password123",
        "first_name": "Test",
        "last_name": "User",
        "gdpr_consent": False,
    })
    assert response.status_code == 400


def test_register_duplicate_email(client):
    data = {
        "email": "dup@memoria.fr",
        "password": "password123",
        "first_name": "Test",
        "last_name": "User",
        "gdpr_consent": True,
    }
    client.post("/api/auth/register", json=data)
    response = client.post("/api/auth/register", json=data)
    assert response.status_code == 409


def test_login_success(client):
    client.post("/api/auth/register", json={
        "email": "login@memoria.fr",
        "password": "password123",
        "first_name": "Test",
        "last_name": "User",
        "gdpr_consent": True,
    })
    response = client.post("/api/auth/login", json={
        "email": "login@memoria.fr",
        "password": "password123",
    })
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_wrong_password(client):
    client.post("/api/auth/register", json={
        "email": "wrong@memoria.fr",
        "password": "password123",
        "first_name": "Test",
        "last_name": "User",
        "gdpr_consent": True,
    })
    response = client.post("/api/auth/login", json={
        "email": "wrong@memoria.fr",
        "password": "wrongpassword",
    })
    assert response.status_code == 401


def test_me_endpoint(client, auth_headers):
    response = client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@memoria.fr"
    assert data["first_name"] == "Marie"


def test_me_without_auth(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 403


def test_refresh_token(client):
    reg = client.post("/api/auth/register", json={
        "email": "refresh@memoria.fr",
        "password": "password123",
        "first_name": "Test",
        "last_name": "User",
        "gdpr_consent": True,
    })
    refresh_token = reg.json()["refresh_token"]

    response = client.post("/api/auth/refresh", json={
        "refresh_token": refresh_token,
    })
    assert response.status_code == 200
    assert "access_token" in response.json()
