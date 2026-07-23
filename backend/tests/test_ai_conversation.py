"""Tests for AI conversation service: LLM calls, fallback, system prompt, memory context."""

from unittest.mock import MagicMock, patch

from app.core.encryption import encrypt_text
from app.models.memory import Memory
from app.models.session import Session as ConvSession
from app.models.transcription import Transcription
from app.services.ai_conversation import SYSTEM_PROMPT, AIConversationService


def _create_session_with_history(db, senior_id, messages):
    """Create a session with transcription history."""
    session = ConvSession(senior_id=senior_id, status="active")
    db.add(session)
    db.flush()

    for i, (speaker, text) in enumerate(messages):
        t = Transcription(
            session_id=session.id,
            speaker=speaker,
            content_encrypted=encrypt_text(text),
            sequence_order=i + 1,
        )
        db.add(t)
    db.commit()
    return session


def test_fallback_response_no_api_keys(client, senior_id, db):
    """Without API keys, the service returns the fallback response."""
    session = ConvSession(senior_id=senior_id, status="active")
    db.add(session)
    db.commit()

    service = AIConversationService()

    with patch("app.services.ai_conversation.settings") as mock_settings:
        mock_settings.anthropic_api_key = ""
        mock_settings.openai_api_key = ""

        response = service.get_response(session.id, "Bonjour", db)

    assert "interessant" in response.lower()
    assert len(response) > 20


def test_fallback_response_text():
    """Fallback text is a valid French response."""
    service = AIConversationService()
    response = service._fallback_response()

    assert "interessant" in response
    assert "davantage" in response
    assert len(response) > 50


def test_call_anthropic_with_mock(client, senior_id, db):
    """Anthropic API is called when API key is set."""
    session = _create_session_with_history(db, senior_id, [
        ("senior", "Je me souviens de Nice."),
        ("ai", "Racontez-moi davantage."),
    ])

    mock_response = MagicMock()
    mock_response.content = [MagicMock(text="Quel beau souvenir ! Comment etait la vie a Nice ?")]

    with patch("app.services.ai_conversation.settings") as mock_settings:
        mock_settings.anthropic_api_key = "fake-anthropic-key"
        mock_settings.openai_api_key = ""

        with patch("anthropic.Anthropic") as mock_anthropic_cls:
            mock_client = MagicMock()
            mock_client.messages.create.return_value = mock_response
            mock_anthropic_cls.return_value = mock_client

            service = AIConversationService()
            response = service.get_response(session.id, "La mer etait magnifique.", db)

    assert "beau souvenir" in response
    mock_client.messages.create.assert_called_once()


def test_call_anthropic_includes_system_prompt(client, senior_id, db):
    """The Anthropic call includes the system prompt."""
    session = ConvSession(senior_id=senior_id, status="active")
    db.add(session)
    db.commit()

    mock_response = MagicMock()
    mock_response.content = [MagicMock(text="Reponse test")]

    with patch("app.services.ai_conversation.settings") as mock_settings:
        mock_settings.anthropic_api_key = "fake-key"
        mock_settings.openai_api_key = ""

        with patch("anthropic.Anthropic") as mock_anthropic_cls:
            mock_client = MagicMock()
            mock_client.messages.create.return_value = mock_response
            mock_anthropic_cls.return_value = mock_client

            service = AIConversationService()
            service.get_response(session.id, "Test", db)

    call_kwargs = mock_client.messages.create.call_args
    assert call_kwargs.kwargs["system"] == SYSTEM_PROMPT


def test_get_response_injects_memory_context(client, senior_id, db):
    """End-to-end: with existing memories, get_response sends the memory-enriched
    system prompt to the LLM (this whole path was dead code before it was wired)."""
    session = ConvSession(senior_id=senior_id, status="active")
    db.add(session)
    db.add(Memory(
        senior_id=senior_id,
        title="Le mariage a Nice en 1962",
        summary_encrypted=encrypt_text("Resume"),
        period="Annees 60",
    ))
    db.commit()

    mock_response = MagicMock()
    mock_response.content = [MagicMock(text="Reponse test")]

    with patch("app.services.ai_conversation.settings") as mock_settings:
        mock_settings.anthropic_api_key = "fake-key"
        mock_settings.openai_api_key = ""
        mock_settings.anthropic_model = "claude-sonnet-5"

        with patch("anthropic.Anthropic") as mock_anthropic_cls:
            mock_client = MagicMock()
            mock_client.messages.create.return_value = mock_response
            mock_anthropic_cls.return_value = mock_client

            service = AIConversationService()
            service.get_response(session.id, "Test", db)

    system_sent = mock_client.messages.create.call_args.kwargs["system"]
    assert "Memoria" in system_sent                      # base prompt still present
    assert "Souvenirs deja collectes" in system_sent     # memory context injected
    assert "Le mariage a Nice en 1962" in system_sent    # the actual collected memory


def test_call_openai_when_no_anthropic(client, senior_id, db):
    """OpenAI is used as fallback when Anthropic key is empty."""
    session = ConvSession(senior_id=senior_id, status="active")
    db.add(session)
    db.commit()

    with patch("app.services.ai_conversation.settings") as mock_settings:
        mock_settings.anthropic_api_key = ""
        mock_settings.openai_api_key = "fake-openai-key"

        with patch("httpx.post") as mock_post:
            mock_post.return_value = MagicMock(
                json=lambda: {
                    "choices": [{"message": {"content": "Reponse OpenAI"}}]
                }
            )

            service = AIConversationService()
            response = service.get_response(session.id, "Bonjour", db)

    assert response == "Reponse OpenAI"
    mock_post.assert_called_once()


def test_build_messages_includes_history(client, senior_id, db):
    """_build_messages returns conversation history plus the new message."""
    session = _create_session_with_history(db, senior_id, [
        ("senior", "Premier message du senior."),
        ("ai", "Reponse de l'IA."),
    ])

    service = AIConversationService()
    messages = service._build_messages(session.id, "Nouveau message", db)

    assert len(messages) == 3
    assert messages[0]["role"] == "user"
    assert messages[0]["content"] == "Premier message du senior."
    assert messages[1]["role"] == "assistant"
    assert messages[1]["content"] == "Reponse de l'IA."
    assert messages[2]["role"] == "user"
    assert messages[2]["content"] == "Nouveau message"


def test_build_messages_empty_history(client, senior_id, db):
    """With no prior history, only the new message is returned."""
    session = ConvSession(senior_id=senior_id, status="active")
    db.add(session)
    db.commit()

    service = AIConversationService()
    messages = service._build_messages(session.id, "Bonjour", db)

    assert len(messages) == 1
    assert messages[0]["role"] == "user"
    assert messages[0]["content"] == "Bonjour"


def test_build_memory_context_with_memories(client, senior_id, db):
    """Memory context includes titles and periods from existing memories."""
    for i in range(3):
        mem = Memory(
            senior_id=senior_id,
            title=f"Souvenir {i}",
            summary_encrypted=encrypt_text(f"Resume du souvenir {i}"),
            period="Enfance" if i < 2 else "Annees 60",
        )
        db.add(mem)
    db.commit()

    service = AIConversationService()
    context = service._build_memory_context(senior_id, db)

    assert "Souvenirs deja collectes" in context
    assert "Souvenir 0" in context
    assert "Enfance" in context
    assert "Annees 60" in context


def test_build_memory_context_empty(client, senior_id, db):
    """Empty memory context when no memories exist."""
    service = AIConversationService()
    context = service._build_memory_context(senior_id, db)

    assert context == ""


def test_get_system_prompt_without_context(db):
    """System prompt without memory context is the base prompt."""
    service = AIConversationService()
    prompt = service._get_system_prompt()

    assert prompt == SYSTEM_PROMPT
    assert "biographe" in prompt.lower()
    assert "vouvoiement" in prompt.lower()


def test_get_system_prompt_with_memory_context(client, senior_id, db):
    """System prompt includes memory context when senior_id and db are provided."""
    mem = Memory(
        senior_id=senior_id,
        title="Les vacances en Bretagne",
        summary_encrypted=encrypt_text("Vacances familiales."),
        period="Annees 70",
    )
    db.add(mem)
    db.commit()

    service = AIConversationService()
    prompt = service._get_system_prompt(senior_id=senior_id, db=db)

    assert "biographe" in prompt.lower()
    assert "Les vacances en Bretagne" in prompt
    assert "Annees 70" in prompt


def test_system_prompt_content():
    """System prompt contains expected instructions in French."""
    assert "Memoria" in SYSTEM_PROMPT
    assert "biographe" in SYSTEM_PROMPT
    assert "vouvoiement" in SYSTEM_PROMPT
    assert "questions ouvertes" in SYSTEM_PROMPT
    assert "2-3 phrases" in SYSTEM_PROMPT


def test_message_via_api_endpoint(client, senior_id):
    """Integration: sending a message via the API uses fallback response."""
    session = client.post("/api/sessions/start", json={"senior_id": senior_id}).json()

    response = client.post(f"/api/sessions/{session['id']}/message", json={
        "text": "Je me souviens de la plage a Cannes.",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["user_text"] == "Je me souviens de la plage a Cannes."
    # Fallback response since no API keys in test env
    assert "interessant" in data["ai_response"].lower()
    assert data["latency_ms"] > 0


def test_build_messages_decrypts_content(client, senior_id, db):
    """Transcriptions are decrypted when building messages."""
    session = ConvSession(senior_id=senior_id, status="active")
    db.add(session)
    db.flush()

    encrypted = encrypt_text("Texte chiffre important")
    t = Transcription(
        session_id=session.id,
        speaker="senior",
        content_encrypted=encrypted,
        sequence_order=1,
    )
    db.add(t)
    db.commit()

    service = AIConversationService()
    messages = service._build_messages(session.id, "Suite", db)

    assert messages[0]["content"] == "Texte chiffre important"
    assert messages[0]["content"] != encrypted
