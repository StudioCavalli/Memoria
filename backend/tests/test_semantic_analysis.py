"""Tests for semantic analysis service: NLP metrics, evasive detection, regex fallback."""


from app.core.encryption import encrypt_text
from app.models.session import Session as ConvSession
from app.models.transcription import Transcription
from app.services.semantic_analysis import (
    EVASIVE_PATTERNS,
    SemanticAnalysisService,
)


def _create_session_with_transcriptions(db, senior_id, texts, latencies=None):
    """Helper to create a session with senior transcriptions."""
    session = ConvSession(senior_id=senior_id, status="completed")
    db.add(session)
    db.flush()

    for i, text in enumerate(texts):
        t = Transcription(
            session_id=session.id,
            speaker="senior",
            content_encrypted=encrypt_text(text),
            sequence_order=i + 1,
            latency_ms=latencies[i] if latencies else 1500.0,
        )
        db.add(t)
    db.commit()
    return session


def test_analyze_session_basic(client, senior_id, db):
    """Basic analysis produces non-zero metrics for real text."""
    texts = [
        "Je me souviens de mon enfance a Nice, pres de la mer Mediterranee.",
        "Ma mere Marie preparait des gateaux delicieux chaque dimanche matin.",
        "Nous allions jouer dans le jardin avec mon frere Jacques et ma soeur Anne.",
    ]
    session = _create_session_with_transcriptions(db, senior_id, texts)

    service = SemanticAnalysisService()
    # Force regex fallback for reproducibility
    service._nlp = False

    metric = service.analyze_session(session.id, senior_id, db)

    assert metric.unique_words > 0
    assert metric.type_token_ratio > 0
    assert metric.avg_sentence_length > 0
    assert metric.senior_id == senior_id
    assert metric.session_id == session.id


def test_analyze_session_unique_words(client, senior_id, db):
    """Unique words count excludes stop words and short words."""
    texts = [
        "Le chat noir dort sur le canape rouge. Le chat noir mange aussi.",
    ]
    session = _create_session_with_transcriptions(db, senior_id, texts)

    service = SemanticAnalysisService()
    service._nlp = False

    metric = service.analyze_session(session.id, senior_id, db)

    # "chat", "noir", "dort", "canape", "rouge", "mange" — some may or may not be stop words
    assert metric.unique_words > 0
    # TTR should be < 1 since "chat" and "noir" repeat
    assert metric.type_token_ratio < 1.0


def test_analyze_session_type_token_ratio(client, senior_id, db):
    """TTR is higher for text with more unique vocabulary."""
    # Rich vocabulary
    rich_texts = [
        "Le magnifique chateau medieval surplombait la vallee verdoyante.",
        "Les cloches resonaient dans le village pittoresque au crepuscule.",
    ]
    session_rich = _create_session_with_transcriptions(db, senior_id, rich_texts)

    # Repetitive vocabulary
    poor_texts = [
        "Le chat dort. Le chat mange. Le chat joue. Le chat dort encore.",
    ]
    session_poor = _create_session_with_transcriptions(db, senior_id, poor_texts)

    service = SemanticAnalysisService()
    service._nlp = False

    metric_rich = service.analyze_session(session_rich.id, senior_id, db)
    metric_poor = service.analyze_session(session_poor.id, senior_id, db)

    assert metric_rich.type_token_ratio > metric_poor.type_token_ratio


def test_analyze_session_avg_sentence_length(client, senior_id, db):
    """Average sentence length is calculated from sentence boundaries."""
    texts = [
        "Le soleil brille. La mer est calme. Les enfants jouent.",
    ]
    session = _create_session_with_transcriptions(db, senior_id, texts)

    service = SemanticAnalysisService()
    service._nlp = False

    metric = service.analyze_session(session.id, senior_id, db)

    # 3 sentences, should have a reasonable average
    assert metric.avg_sentence_length > 0
    assert metric.avg_sentence_length < 20


def test_evasive_response_detection(client, senior_id, db):
    """Evasive patterns are detected in senior responses."""
    texts = [
        "Je ne sais pas, c'est difficile a dire.",
        "Bof, je me souviens plus de cette epoque.",
        "Je ne me rappelle pas bien, peut-etre que c'etait en ete.",
    ]
    session = _create_session_with_transcriptions(db, senior_id, texts)

    service = SemanticAnalysisService()
    service._nlp = False

    metric = service.analyze_session(session.id, senior_id, db)

    # All 3 texts contain evasive patterns
    assert metric.evasive_responses >= 3


def test_no_evasive_responses(client, senior_id, db):
    """Non-evasive text produces zero evasive count."""
    texts = [
        "Je me souviens parfaitement de cette journee magnifique.",
        "Mon pere travaillait dans une boulangerie au centre ville.",
    ]
    session = _create_session_with_transcriptions(db, senior_id, texts)

    service = SemanticAnalysisService()
    service._nlp = False

    metric = service.analyze_session(session.id, senior_id, db)

    assert metric.evasive_responses == 0


def test_empty_session(client, senior_id, db):
    """Empty session (no transcriptions) produces zero metrics."""
    session = ConvSession(senior_id=senior_id, status="completed")
    db.add(session)
    db.commit()

    service = SemanticAnalysisService()
    metric = service.analyze_session(session.id, senior_id, db)

    assert metric.unique_words == 0
    assert metric.type_token_ratio == 0.0
    assert metric.avg_sentence_length == 0.0
    assert metric.evasive_responses == 0


def test_latency_calculations(client, senior_id, db):
    """Latency stats are computed from transcription latency_ms values."""
    texts = ["Premier message.", "Deuxieme message.", "Troisieme message."]
    latencies = [1500.0, 3000.0, 12000.0]
    session = _create_session_with_transcriptions(db, senior_id, texts, latencies=latencies)

    service = SemanticAnalysisService()
    service._nlp = False

    metric = service.analyze_session(session.id, senior_id, db)

    assert metric.avg_latency_ms > 0
    assert metric.max_latency_ms == 12000.0
    # 12000ms > 10000ms threshold
    assert metric.silence_count == 1


def test_regex_fallback_named_entities(client, senior_id, db):
    """Regex fallback detects capitalized words as named entities."""
    texts = [
        "Nous habitions a Nice avec Pierre et Marie dans le quartier Saint-Jean.",
    ]
    session = _create_session_with_transcriptions(db, senior_id, texts)

    service = SemanticAnalysisService()
    service._nlp = False

    metric = service.analyze_session(session.id, senior_id, db)

    # Capitalized words after position 0 in a sentence: Nice, Pierre, Marie, Saint-Jean
    assert metric.named_entities_count > 0


def test_regex_analyze_with_regex_method():
    """Direct test of _analyze_with_regex method."""
    service = SemanticAnalysisService()

    result = service._analyze_with_regex(
        "Mon grand-pere Albert cultivait des tomates dans son jardin a Marseille. "
        "Il aimait aussi la peche en mer."
    )

    assert result["unique_words"] > 0
    assert 0 < result["type_token_ratio"] <= 1.0
    assert result["avg_sentence_length"] > 0
    assert result["named_entities"] >= 0


def test_only_senior_transcriptions_analyzed(client, senior_id, db):
    """Only senior speaker transcriptions are used, not AI responses."""
    session = ConvSession(senior_id=senior_id, status="completed")
    db.add(session)
    db.flush()

    # Senior says something simple
    db.add(Transcription(
        session_id=session.id, speaker="senior",
        content_encrypted=encrypt_text("Bonjour, je suis fatigue."),
        sequence_order=1, latency_ms=1000.0,
    ))
    # AI responds with rich text (should be ignored)
    db.add(Transcription(
        session_id=session.id, speaker="ai",
        content_encrypted=encrypt_text(
            "Je comprends parfaitement votre sentiment. Voulez-vous me parler "
            "de vos magnifiques souvenirs d'enfance a Nice, de votre famille, "
            "de vos voyages extraordinaires en Italie et en Espagne ?"
        ),
        sequence_order=2,
    ))
    db.commit()

    service = SemanticAnalysisService()
    service._nlp = False

    metric = service.analyze_session(session.id, senior_id, db)

    # Should only analyze the senior's short text
    assert metric.unique_words < 10


def test_evasive_patterns_constant():
    """Verify evasive patterns list contains expected French phrases."""
    assert "je sais pas" in EVASIVE_PATTERNS
    assert "je ne sais pas" in EVASIVE_PATTERNS
    assert "je me souviens pas" in EVASIVE_PATTERNS
    assert "bof" in EVASIVE_PATTERNS
    assert "peut-etre" in EVASIVE_PATTERNS
