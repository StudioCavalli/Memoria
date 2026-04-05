#!/usr/bin/env python3
"""
MEMORIA — Test bout-en-bout du pipeline vocal.
Simule une session complète : démarrage → message → extraction → métriques → alertes.

Usage:
    source .venv/bin/activate
    set -a && source ../.env && set +a
    python3 scripts/test_pipeline.py
"""
from __future__ import annotations

import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
NC = "\033[0m"

def ok(msg): print(f"  {GREEN}✓{NC} {msg}")
def fail(msg): print(f"  {RED}✗{NC} {msg}")
def section(msg): print(f"\n{CYAN}{msg}{NC}\n{'-'*50}")


def main():
    print(f"\n{CYAN}MEMORIA — Test pipeline bout-en-bout{NC}\n{'='*50}\n")

    from app.core.database import SessionLocal
    from app.core.config import settings
    from app.core.encryption import decrypt_text

    db = SessionLocal()

    try:
        # 1. Vérifier le senior de démo
        section("1. Vérification du senior de démo")
        from app.models.senior import Senior
        senior = db.query(Senior).first()
        if not senior:
            fail("Aucun senior en base — lance d'abord le seed")
            return
        ok(f"Senior trouvé : {senior.first_name} {senior.last_name} (id={senior.id})")

        # 2. Créer une session
        section("2. Création d'une session")
        from app.models.session import Session as ConvSession
        session = ConvSession(senior_id=senior.id, status="active")
        db.add(session)
        db.commit()
        db.refresh(session)
        ok(f"Session créée (id={session.id})")

        # 3. Envoyer un message via AIConversationService
        section("3. Test conversation IA")
        from app.services.ai_conversation import AIConversationService
        from app.core.encryption import encrypt_text
        from app.models.transcription import Transcription

        ai = AIConversationService()
        user_text = "Je me souviens de mon enfance à Nice, on jouait sur la Promenade des Anglais."

        # Sauvegarder le message utilisateur
        user_trans = Transcription(
            session_id=session.id,
            speaker="senior",
            content_encrypted=encrypt_text(user_text),
            sequence_order=1,
        )
        db.add(user_trans)
        db.flush()

        start = time.time()
        response = ai.get_response(session.id, user_text, db)
        latency = (time.time() - start) * 1000

        ok(f"Réponse IA ({latency:.0f}ms) : \"{response[:100]}...\"")

        # Sauvegarder la réponse IA
        ai_trans = Transcription(
            session_id=session.id,
            speaker="ai",
            content_encrypted=encrypt_text(response),
            sequence_order=2,
            latency_ms=latency,
        )
        db.add(ai_trans)
        db.commit()

        if latency < 2000:
            ok(f"Latence LLM OK ({latency:.0f}ms)")
        else:
            fail(f"Latence LLM trop élevée ({latency:.0f}ms > 2000ms)")

        # 4. Envoyer un 2e message
        section("4. Deuxième échange")
        user_text2 = "Oui, mon père m'emmenait pêcher le dimanche matin près du port."
        user_trans2 = Transcription(
            session_id=session.id, speaker="senior",
            content_encrypted=encrypt_text(user_text2), sequence_order=3,
        )
        db.add(user_trans2)
        db.flush()

        start = time.time()
        response2 = ai.get_response(session.id, user_text2, db)
        latency2 = (time.time() - start) * 1000
        ok(f"Réponse IA ({latency2:.0f}ms) : \"{response2[:80]}...\"")

        ai_trans2 = Transcription(
            session_id=session.id, speaker="ai",
            content_encrypted=encrypt_text(response2), sequence_order=4,
            latency_ms=latency2,
        )
        db.add(ai_trans2)
        db.commit()

        # 5. Terminer la session
        section("5. Fin de session")
        from datetime import datetime, timezone
        session.status = "completed"
        session.ended_at = datetime.now(timezone.utc)
        if session.started_at:
            session.duration_seconds = int((session.ended_at - session.started_at).total_seconds())
        db.commit()
        ok(f"Session terminée (durée: {session.duration_seconds}s)")

        # 6. Extraction des souvenirs
        section("6. Extraction des souvenirs")
        from app.services.memory_extraction import MemoryExtractionService
        extractor = MemoryExtractionService(db)
        result = extractor.process_session(session.id)
        ok(f"Souvenirs extraits : {result['memories_extracted']}")
        if result.get('summary'):
            ok(f"Résumé : \"{result['summary'][:100]}...\"")

        # 7. Analyse cognitive
        section("7. Analyse cognitive")
        from app.models.cognitive_metric import CognitiveMetric
        metric = db.query(CognitiveMetric).filter(
            CognitiveMetric.session_id == session.id
        ).first()
        if metric:
            ok(f"Mots uniques : {metric.unique_words}")
            ok(f"Type/Token ratio : {metric.type_token_ratio:.4f}")
            ok(f"Longueur moyenne phrases : {metric.avg_sentence_length:.1f}")
            ok(f"Latence moyenne : {metric.avg_latency_ms:.0f}ms")
            ok(f"Réponses évasives : {metric.evasive_responses}")
        else:
            fail("Aucune métrique cognitive générée")

        # 8. Vérification des souvenirs en base
        section("8. Souvenirs en base")
        from app.models.memory import Memory
        memories = db.query(Memory).filter(Memory.senior_id == senior.id).all()
        for m in memories:
            summary = decrypt_text(m.summary_encrypted)
            themes = ", ".join(t.name for t in m.themes)
            ok(f"\"{m.title}\" [{themes}] — {summary[:60]}...")

        # Résumé
        print(f"\n{'='*50}")
        print(f"{GREEN}Pipeline complet validé !{NC}")
        print(f"  Session {session.id} : {session.duration_seconds}s")
        print(f"  {len(memories)} souvenir(s) extrait(s)")
        print(f"  Latence moyenne LLM : {(latency + latency2)/2:.0f}ms")
        print(f"{'='*50}\n")

    except Exception as e:
        fail(f"Erreur pipeline : {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    main()
