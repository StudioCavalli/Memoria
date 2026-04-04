"""Tests for AES-256 encryption/decryption."""

from app.core.encryption import decrypt_text, encrypt_text


def test_encrypt_decrypt():
    original = "Mon enfance a Nice etait merveilleuse"
    encrypted = encrypt_text(original)
    assert encrypted != original
    assert decrypt_text(encrypted) == original


def test_encrypt_produces_different_ciphertexts():
    text = "Souvenir de famille"
    enc1 = encrypt_text(text)
    enc2 = encrypt_text(text)
    # Different nonces should produce different ciphertexts
    assert enc1 != enc2
    # But both decrypt to the same text
    assert decrypt_text(enc1) == text
    assert decrypt_text(enc2) == text


def test_encrypt_empty_string():
    encrypted = encrypt_text("")
    assert decrypt_text(encrypted) == ""


def test_encrypt_unicode():
    text = "Les annees 60, c'etait formidable !"
    encrypted = encrypt_text(text)
    assert decrypt_text(encrypted) == text
