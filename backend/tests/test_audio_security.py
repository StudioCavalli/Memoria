"""Audio-at-rest security: encrypted on disk, only served through the authenticated
ownership-checked endpoint (never a public/static URL)."""

from app.core.encryption import decrypt_bytes, encrypt_bytes
from app.models.session import Session as ConvSession
from app.services.storage_service import UPLOADS_DIR


def test_encrypt_bytes_roundtrip():
    data = b"\x00\x01raw audio bytes \xff\xfe" * 10
    blob = encrypt_bytes(data)
    assert blob != data  # ciphertext
    assert data not in blob
    assert decrypt_bytes(blob) == data


def test_audio_encrypted_at_rest_and_streamed_back(client, senior_id, db):
    """Upload → the file on disk is ciphertext; GET returns the original bytes."""
    session = client.post("/api/sessions/start", json={"senior_id": senior_id}).json()
    sid = session["id"]
    original = b"PRETEND_AUDIO_" + bytes(range(256)) * 4

    up = client.post(
        f"/api/sessions/{sid}/audio",
        files={"file": ("rec.webm", original, "audio/webm")},
    )
    assert up.status_code == 200

    db.expire_all()
    key = db.query(ConvSession).filter(ConvSession.id == sid).first().audio_url
    assert key and key.endswith(".enc")

    # On-disk bytes must NOT be the plaintext
    stored = (UPLOADS_DIR / key).read_bytes()
    try:
        assert stored != original
        assert original not in stored

        # The authenticated endpoint returns the original decrypted audio
        got = client.get(f"/api/sessions/{sid}/audio")
        assert got.status_code == 200
        assert got.content == original
        assert got.headers["content-type"].startswith("audio/webm")
    finally:
        (UPLOADS_DIR / key).unlink(missing_ok=True)


def test_audio_requires_ownership(client, senior_id, db):
    """A user not linked to the senior cannot read their audio."""
    session = client.post("/api/sessions/start", json={"senior_id": senior_id}).json()
    sid = session["id"]

    reg = client.post("/api/auth/register", json={
        "email": "intrus@memoria.fr", "password": "password123",
        "first_name": "In", "last_name": "Trus", "gdpr_consent": True,
    })
    intruder = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    resp = client.get(f"/api/sessions/{sid}/audio", headers=intruder)
    assert resp.status_code == 403
