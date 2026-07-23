from __future__ import annotations

import base64
import os

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

from app.core.config import settings

# Derive a proper 32-byte AES-256 key from the configured secret via HKDF-SHA256.
# This replaces the old scheme (truncate/pad the raw secret with NUL bytes), which
# produced low-entropy keys from short secrets. HKDF is deterministic here (fixed
# salt + info), so ciphertext stays decryptable as long as the secret is unchanged.
#
# NOTE: this derivation differs from the legacy NUL-padding one, so data encrypted
# with the old scheme is not readable after the switch (acceptable pre-launch).
_HKDF_SALT = b"memoria-aes-gcm-v1"
_HKDF_INFO = b"transcription-encryption-key"


def _get_key() -> bytes:
    return HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=_HKDF_SALT,
        info=_HKDF_INFO,
    ).derive(settings.aes_encryption_key.encode("utf-8"))


def encrypt_text(plaintext: str) -> str:
    key = _get_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    return base64.b64encode(nonce + ciphertext).decode("utf-8")


def decrypt_text(encrypted: str) -> str:
    key = _get_key()
    aesgcm = AESGCM(key)
    raw = base64.b64decode(encrypted)
    nonce = raw[:12]
    ciphertext = raw[12:]
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    return plaintext.decode("utf-8")


def encrypt_bytes(data: bytes) -> bytes:
    """Encrypt binary data at rest (e.g. audio recordings). Returns nonce + ciphertext."""
    aesgcm = AESGCM(_get_key())
    nonce = os.urandom(12)
    return nonce + aesgcm.encrypt(nonce, data, None)


def decrypt_bytes(blob: bytes) -> bytes:
    aesgcm = AESGCM(_get_key())
    return aesgcm.decrypt(blob[:12], blob[12:], None)
