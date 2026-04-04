"""Tests for the biographical question bank."""

from app.services.question_bank import QUESTIONS, QUESTIONS_BY_THEME, THEME_NAMES, QuestionSelector


def test_question_bank_has_100_plus():
    assert len(QUESTIONS) >= 100


def test_all_themes_have_questions():
    for theme in THEME_NAMES:
        assert len(QUESTIONS_BY_THEME[theme]) > 0


def test_themes_list():
    expected = ["Enfance", "Famille", "Travail", "Voyages", "Passions", "Cuisine", "Fetes", "Histoire"]
    for t in expected:
        assert t in THEME_NAMES


def test_get_next_question(db):
    selector = QuestionSelector(db)
    q = selector.get_next_question(senior_id=1)
    assert q.text
    assert q.theme in THEME_NAMES


def test_get_followup_question(db):
    selector = QuestionSelector(db)
    followup = selector.get_followup_question("Ma mere faisait de la couture")
    assert len(followup) > 0


def test_get_next_with_preferred_theme(db):
    selector = QuestionSelector(db)
    q = selector.get_next_question(senior_id=1, preferred_theme="Voyages")
    assert q.theme == "Voyages"
