#!/usr/bin/env python3
"""
MEMORIA — Script de validation des APIs externes.
Lance ce script après avoir configuré tes clés dans .env.

Usage:
    source .venv/bin/activate
    set -a && source ../.env && set +a
    python3 scripts/validate_apis.py
"""
from __future__ import annotations

import asyncio
import os
import sys
import time

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
NC = "\033[0m"

def ok(msg): print(f"  {GREEN}✓{NC} {msg}")
def fail(msg): print(f"  {RED}✗{NC} {msg}")
def warn(msg): print(f"  {YELLOW}!{NC} {msg}")
def section(msg): print(f"\n{CYAN}{'='*50}{NC}\n{CYAN}{msg}{NC}\n{CYAN}{'='*50}{NC}")


def test_anthropic():
    section("1. Anthropic Claude API")
    key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not key:
        warn("ANTHROPIC_API_KEY non configurée — skip")
        return False

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=key)

        start = time.time()
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=100,
            system="Tu es Memoria, un biographe bienveillant. Réponds en 1 phrase.",
            messages=[{"role": "user", "content": "Bonjour, comment allez-vous ?"}],
        )
        latency = (time.time() - start) * 1000

        text = response.content[0].text
        ok(f"Réponse reçue ({latency:.0f}ms) : \"{text[:80]}...\"")
        ok(f"Modèle : {response.model}")
        ok(f"Tokens : {response.usage.input_tokens} in / {response.usage.output_tokens} out")

        if latency < 2000:
            ok(f"Latence OK ({latency:.0f}ms < 2000ms)")
        else:
            warn(f"Latence élevée ({latency:.0f}ms > 2000ms)")

        return True
    except Exception as e:
        fail(f"Erreur : {e}")
        return False


def test_openai_whisper():
    section("2. OpenAI Whisper STT")
    key = os.environ.get("OPENAI_API_KEY", "")
    if not key:
        warn("OPENAI_API_KEY non configurée — skip")
        return False

    try:
        import httpx
        import tempfile
        import struct
        import math

        # Générer un petit fichier WAV de test (0.5s de silence)
        sample_rate = 16000
        duration = 0.5
        num_samples = int(sample_rate * duration)

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            # WAV header
            data_size = num_samples * 2
            f.write(b"RIFF")
            f.write(struct.pack("<I", 36 + data_size))
            f.write(b"WAVE")
            f.write(b"fmt ")
            f.write(struct.pack("<IHHIIHH", 16, 1, 1, sample_rate, sample_rate * 2, 2, 16))
            f.write(b"data")
            f.write(struct.pack("<I", data_size))
            for i in range(num_samples):
                # Léger bruit pour éviter que Whisper rejette le fichier
                val = int(100 * math.sin(2 * math.pi * 440 * i / sample_rate))
                f.write(struct.pack("<h", val))
            wav_path = f.name

        start = time.time()
        response = httpx.post(
            "https://api.openai.com/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {key}"},
            files={"file": ("test.wav", open(wav_path, "rb"), "audio/wav")},
            data={"model": "whisper-1", "language": "fr", "response_format": "text"},
            timeout=30.0,
        )
        latency = (time.time() - start) * 1000
        os.unlink(wav_path)

        if response.status_code == 200:
            ok(f"Whisper OK ({latency:.0f}ms) — transcription : \"{response.text.strip()[:50]}\"")
            return True
        else:
            fail(f"HTTP {response.status_code} : {response.text[:100]}")
            return False
    except Exception as e:
        fail(f"Erreur : {e}")
        return False


def test_elevenlabs():
    section("3. ElevenLabs TTS")
    key = os.environ.get("ELEVENLABS_API_KEY", "")
    if not key:
        warn("ELEVENLABS_API_KEY non configurée — skip")
        return False

    try:
        import httpx
        voice_id = "EXAVITQu4vr4xnSDxMaL"  # Sarah

        start = time.time()
        response = httpx.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
            headers={
                "xi-api-key": key,
                "Content-Type": "application/json",
            },
            json={
                "text": "Bonjour, je suis Memoria.",
                "model_id": "eleven_multilingual_v2",
                "voice_settings": {"stability": 0.75, "similarity_boost": 0.75},
            },
            timeout=15.0,
        )
        latency = (time.time() - start) * 1000

        if response.status_code == 200:
            size = len(response.content)
            ok(f"Audio reçu ({latency:.0f}ms) — {size/1024:.1f} Ko")
            if latency < 2000:
                ok(f"Latence OK ({latency:.0f}ms)")
            else:
                warn(f"Latence élevée ({latency:.0f}ms)")
            return True
        else:
            fail(f"HTTP {response.status_code} : {response.text[:100]}")
            return False
    except Exception as e:
        fail(f"Erreur : {e}")
        return False


def test_azure_speech():
    section("4. Azure Speech Services (STT + TTS)")
    key = os.environ.get("AZURE_SPEECH_KEY", "")
    region = os.environ.get("AZURE_SPEECH_REGION", "")
    if not key or not region:
        warn("AZURE_SPEECH_KEY / AZURE_SPEECH_REGION non configurées — skip")
        return False

    try:
        import httpx

        # Test TTS
        ssml = """
        <speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='fr-FR'>
            <voice name='fr-FR-DeniseNeural'>Bonjour, je suis Memoria.</voice>
        </speak>
        """
        start = time.time()
        response = httpx.post(
            f"https://{region}.tts.speech.microsoft.com/cognitiveservices/v1",
            headers={
                "Ocp-Apim-Subscription-Key": key,
                "Content-Type": "application/ssml+xml",
                "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
            },
            content=ssml.strip(),
            timeout=15.0,
        )
        latency = (time.time() - start) * 1000

        if response.status_code == 200:
            ok(f"Azure TTS OK ({latency:.0f}ms) — {len(response.content)/1024:.1f} Ko")
            return True
        else:
            fail(f"HTTP {response.status_code}")
            return False
    except Exception as e:
        fail(f"Erreur : {e}")
        return False


def test_sendgrid():
    section("5. SendGrid Email")
    key = os.environ.get("SENDGRID_API_KEY", "")
    if not key:
        warn("SENDGRID_API_KEY non configurée — skip")
        return False

    try:
        import httpx

        # Test validation de la clé (ne pas envoyer de vrai email)
        response = httpx.get(
            "https://api.sendgrid.com/v3/scopes",
            headers={"Authorization": f"Bearer {key}"},
            timeout=10.0,
        )

        if response.status_code == 200:
            scopes = response.json().get("scopes", [])
            ok(f"Clé valide — {len(scopes)} permissions")
            if "mail.send" in scopes:
                ok("Permission mail.send présente")
            else:
                warn("Permission mail.send absente — vérifier les scopes")
            return True
        else:
            fail(f"HTTP {response.status_code} — clé invalide ?")
            return False
    except Exception as e:
        fail(f"Erreur : {e}")
        return False


def test_database():
    section("6. Base de données PostgreSQL")
    db_url = os.environ.get("DATABASE_URL", "")
    if not db_url:
        warn("DATABASE_URL non configurée — skip")
        return False

    try:
        from sqlalchemy import create_engine, text

        url = db_url.replace("postgres://", "postgresql://", 1)
        engine = create_engine(url)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM users"))
            count = result.scalar()
            ok(f"Connexion OK — {count} utilisateur(s) en base")

            result = conn.execute(text("SELECT COUNT(*) FROM themes"))
            themes = result.scalar()
            ok(f"{themes} thèmes en base")

            tables = conn.execute(text(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'"
            )).scalar()
            ok(f"{tables} tables en base")

        return True
    except Exception as e:
        fail(f"Erreur : {e}")
        return False


def main():
    print(f"\n{CYAN}MEMORIA — Validation des APIs externes{NC}")
    print(f"{CYAN}{'='*50}{NC}\n")

    results = {}
    results["Anthropic Claude"] = test_anthropic()
    results["OpenAI Whisper"] = test_openai_whisper()
    results["ElevenLabs TTS"] = test_elevenlabs()
    results["Azure Speech"] = test_azure_speech()
    results["SendGrid Email"] = test_sendgrid()
    results["PostgreSQL"] = test_database()

    # Résumé
    section("RÉSUMÉ")
    passed = sum(1 for v in results.values() if v)
    skipped = sum(1 for v in results.values() if v is False)
    total = len(results)

    for name, status in results.items():
        if status is True:
            ok(name)
        elif status is False:
            fail(f"{name} (non configuré ou erreur)")

    print(f"\n  {passed}/{total} APIs validées")

    if passed >= 3:
        print(f"\n  {GREEN}Le minimum pour la démo est couvert (Claude + STT + TTS){NC}")
    else:
        print(f"\n  {YELLOW}Configure au minimum ANTHROPIC_API_KEY + OPENAI_API_KEY + ELEVENLABS_API_KEY{NC}")

    # Guide rapide
    missing = [k for k, v in results.items() if not v]
    if missing:
        print(f"\n{CYAN}Pour configurer les clés manquantes, éditez .env :{NC}")
        if "Anthropic Claude" in missing:
            print(f"  ANTHROPIC_API_KEY=sk-ant-...  (console.anthropic.com)")
        if "OpenAI Whisper" in missing:
            print(f"  OPENAI_API_KEY=sk-...  (platform.openai.com)")
        if "ElevenLabs TTS" in missing:
            print(f"  ELEVENLABS_API_KEY=...  (elevenlabs.io)")
        if "SendGrid Email" in missing:
            print(f"  SENDGRID_API_KEY=SG....  (app.sendgrid.com)")


if __name__ == "__main__":
    main()
