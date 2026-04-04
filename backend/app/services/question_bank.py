"""
Biographical question bank with intelligent selection algorithm.
100+ questions organized by theme and depth level.
"""
from __future__ import annotations

import random
from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.core.encryption import decrypt_text
from app.models.memory import Memory
from app.models.transcription import Transcription


@dataclass
class Question:
    text: str
    theme: str
    depth: int  # 1=surface, 2=medium, 3=deep
    tags: list[str]


# ---------------------------------------------------------------------------
# Question Bank — 100+ questions réparties par thématique
# ---------------------------------------------------------------------------

QUESTIONS: list[Question] = [
    # === ENFANCE (15) ===
    Question("Ou avez-vous grandi ? Comment etait votre quartier ?", "Enfance", 1, ["lieu", "maison"]),
    Question("Quel est votre premier souvenir d'enfance ?", "Enfance", 1, ["premier_souvenir"]),
    Question("Comment s'appelait votre meilleur ami d'enfance ?", "Enfance", 1, ["amis"]),
    Question("A quoi aimiez-vous jouer quand vous etiez petit ?", "Enfance", 1, ["jeux"]),
    Question("Comment etait votre ecole ? Aviez-vous un maitre ou une maitresse que vous aimiez particulierement ?", "Enfance", 2, ["ecole"]),
    Question("Quel etait votre plat prefere quand vous etiez enfant ?", "Enfance", 1, ["nourriture"]),
    Question("Aviez-vous un animal de compagnie ?", "Enfance", 1, ["animaux"]),
    Question("Comment se passaient les dimanches dans votre famille quand vous etiez petit ?", "Enfance", 2, ["routine", "famille"]),
    Question("Y avait-il une betise d'enfance dont vous vous souvenez avec tendresse ?", "Enfance", 2, ["anecdote"]),
    Question("Comment etaient les etes de votre enfance ?", "Enfance", 2, ["vacances", "saisons"]),
    Question("Aviez-vous des freres et soeurs ? Comment etait votre relation ?", "Enfance", 2, ["fratrie"]),
    Question("Quel etait votre endroit prefere pour jouer ?", "Enfance", 1, ["lieu", "jeux"]),
    Question("Vous souvenez-vous d'un cadeau qui vous a particulierement marque ?", "Enfance", 2, ["cadeau", "emotion"]),
    Question("Comment etait la maison ou vous avez grandi ?", "Enfance", 2, ["maison"]),
    Question("Y a-t-il une odeur ou un son qui vous rappelle votre enfance ?", "Enfance", 3, ["sens", "emotion"]),

    # === FAMILLE (15) ===
    Question("Parlez-moi de vos parents. Comment etaient-ils ?", "Famille", 1, ["parents"]),
    Question("Comment avez-vous rencontre votre conjoint ?", "Famille", 1, ["amour", "rencontre"]),
    Question("Comment s'est passe votre mariage ?", "Famille", 2, ["mariage"]),
    Question("Quel est votre plus beau souvenir avec vos enfants ?", "Famille", 2, ["enfants"]),
    Question("Y a-t-il une tradition familiale qui vous tient a coeur ?", "Famille", 2, ["traditions"]),
    Question("Que faisait votre pere comme metier ?", "Famille", 1, ["parents", "travail"]),
    Question("Votre mere avait-elle une recette speciale ?", "Famille", 2, ["mere", "cuisine"]),
    Question("Avez-vous des petits-enfants ? Racontez-moi un moment special avec eux.", "Famille", 2, ["petits_enfants"]),
    Question("Comment celebriez-vous Noel en famille ?", "Famille", 2, ["fetes", "noel"]),
    Question("Y a-t-il un membre de votre famille qui vous a particulierement inspire ?", "Famille", 3, ["inspiration"]),
    Question("Comment communiquiez-vous avec votre famille quand vous etiez loin ?", "Famille", 2, ["communication"]),
    Question("Quel conseil vos parents vous ont-ils donne que vous n'avez jamais oublie ?", "Famille", 3, ["sagesse"]),
    Question("Y a-t-il une histoire de famille qu'on se racontait souvent ?", "Famille", 2, ["histoire_famille"]),
    Question("Comment avez-vous choisi les prenoms de vos enfants ?", "Famille", 2, ["enfants", "prenoms"]),
    Question("Quel est le plus grand bonheur que votre famille vous a apporte ?", "Famille", 3, ["emotion", "bonheur"]),

    # === TRAVAIL (15) ===
    Question("Quel a ete votre premier emploi ?", "Travail", 1, ["premier_emploi"]),
    Question("Quel metier avez-vous exerce le plus longtemps ?", "Travail", 1, ["carriere"]),
    Question("Aviez-vous un collegue avec qui vous vous entendiez particulierement bien ?", "Travail", 2, ["collegues"]),
    Question("Quelle a ete votre plus grande fierte professionnelle ?", "Travail", 2, ["fierte"]),
    Question("Comment se passait une journee typique de travail pour vous ?", "Travail", 2, ["routine"]),
    Question("Y a-t-il une anecdote amusante de votre vie professionnelle ?", "Travail", 2, ["anecdote"]),
    Question("Comment avez-vous choisi votre metier ?", "Travail", 2, ["choix"]),
    Question("Avez-vous eu un patron ou un mentor qui vous a marque ?", "Travail", 2, ["mentor"]),
    Question("Comment etait votre lieu de travail ?", "Travail", 1, ["lieu"]),
    Question("Avez-vous vecu un grand changement dans votre domaine professionnel ?", "Travail", 3, ["changement"]),
    Question("Combien gagniez-vous a vos debuts ? Les prix etaient-ils differents ?", "Travail", 2, ["economie"]),
    Question("Avez-vous fait des formations ou repris des etudes en cours de route ?", "Travail", 2, ["formation"]),
    Question("Comment avez-vous vecu votre depart a la retraite ?", "Travail", 3, ["retraite"]),
    Question("Quel conseil donneriez-vous a un jeune qui debute dans votre metier ?", "Travail", 3, ["sagesse"]),
    Question("Y a-t-il quelque chose que vous auriez aime faire differemment dans votre carriere ?", "Travail", 3, ["reflexion"]),

    # === VOYAGES (12) ===
    Question("Quel est le plus beau voyage que vous ayez fait ?", "Voyages", 1, ["voyage"]),
    Question("Etes-vous deja alle a l'etranger ? Ou ca ?", "Voyages", 1, ["etranger"]),
    Question("Ou passiez-vous vos vacances d'ete quand vous etiez jeune ?", "Voyages", 1, ["vacances"]),
    Question("Y a-t-il un paysage qui vous a coupe le souffle ?", "Voyages", 2, ["nature", "emotion"]),
    Question("Avez-vous fait un voyage en amoureux dont vous gardez un souvenir special ?", "Voyages", 2, ["amour", "voyage"]),
    Question("Comment voyageait-on a votre epoque ? Le train, la voiture ?", "Voyages", 2, ["transport"]),
    Question("Avez-vous goute des plats etrangers qui vous ont surpris ?", "Voyages", 2, ["cuisine", "decouverte"]),
    Question("Y a-t-il un endroit ou vous aimeriez retourner ?", "Voyages", 2, ["nostalgie"]),
    Question("Avez-vous vecu une aventure ou une mesaventure pendant un voyage ?", "Voyages", 2, ["anecdote"]),
    Question("Quel a ete votre premier grand voyage ?", "Voyages", 1, ["premier"]),
    Question("Aviez-vous une destination de vacances favorite en famille ?", "Voyages", 2, ["famille", "vacances"]),
    Question("Y a-t-il un lieu qui a change votre facon de voir le monde ?", "Voyages", 3, ["reflexion"]),

    # === PASSIONS (12) ===
    Question("Quelle est votre plus grande passion dans la vie ?", "Passions", 1, ["passion"]),
    Question("Aimez-vous la musique ? Quel est votre chanteur ou chanteuse prefere ?", "Passions", 1, ["musique"]),
    Question("Avez-vous pratique un sport ? Lequel ?", "Passions", 1, ["sport"]),
    Question("Aimez-vous lire ? Quel est le livre qui vous a le plus marque ?", "Passions", 2, ["lecture"]),
    Question("Avez-vous un hobby que vous pratiquez depuis longtemps ?", "Passions", 1, ["hobby"]),
    Question("Aimez-vous jardiner ? Qu'est-ce que vous cultivez ?", "Passions", 1, ["jardin"]),
    Question("Avez-vous deja peint, dessine ou fait de l'artisanat ?", "Passions", 2, ["art"]),
    Question("Y a-t-il un film ou une emission de television que vous adorez ?", "Passions", 1, ["cinema", "television"]),
    Question("Aimez-vous danser ? Quel genre de danse ?", "Passions", 2, ["danse"]),
    Question("Avez-vous collectionne quelque chose ?", "Passions", 2, ["collection"]),
    Question("Comment passez-vous vos journees maintenant ?", "Passions", 1, ["quotidien"]),
    Question("Qu'est-ce qui vous fait rire a coup sur ?", "Passions", 2, ["humour", "joie"]),

    # === CUISINE / RECETTES (10) ===
    Question("Quel est votre plat prefere ?", "Cuisine", 1, ["plat"]),
    Question("Y a-t-il une recette de famille que vous connaissez par coeur ?", "Cuisine", 2, ["recette_famille"]),
    Question("Qui vous a appris a cuisiner ?", "Cuisine", 1, ["apprentissage"]),
    Question("Quel est le plat que vous reussissez le mieux ?", "Cuisine", 2, ["specialite"]),
    Question("Y a-t-il un repas de fete dont vous gardez un souvenir special ?", "Cuisine", 2, ["fete", "repas"]),
    Question("Les gouts ont-ils change depuis votre jeunesse ?", "Cuisine", 2, ["evolution"]),
    Question("Avez-vous decouvert un plat etranger que vous avez adopte ?", "Cuisine", 2, ["decouverte"]),
    Question("Comment faisait-on les courses a votre epoque ?", "Cuisine", 2, ["courses", "quotidien"]),
    Question("Aviez-vous un potager ? Que faisiez-vous pousser ?", "Cuisine", 2, ["jardin", "potager"]),
    Question("Quel dessert vous rend le plus heureux ?", "Cuisine", 1, ["dessert"]),

    # === FETES / TRADITIONS (8) ===
    Question("Comment celebriez-vous le Nouvel An ?", "Fetes", 1, ["nouvel_an"]),
    Question("Aviez-vous des traditions le jour de votre anniversaire ?", "Fetes", 1, ["anniversaire"]),
    Question("Comment se passaient les fetes de village ou les kermesses ?", "Fetes", 2, ["fete_locale"]),
    Question("Y a-t-il une fete religieuse qui avait une importance speciale pour vous ?", "Fetes", 2, ["religion"]),
    Question("Quel est le plus beau cadeau que vous ayez recu ?", "Fetes", 2, ["cadeau"]),
    Question("Comment preparait-on la fete de Noel chez vous ?", "Fetes", 2, ["noel", "preparation"]),
    Question("Y avait-il un moment de l'annee que vous attendiez avec impatience ?", "Fetes", 2, ["attente"]),
    Question("Quel est votre plus beau souvenir de fete en famille ?", "Fetes", 3, ["emotion", "famille"]),

    # === HISTOIRE / EPOQUES (13) ===
    Question("Vous souvenez-vous d'un grand evenement historique que vous avez vecu ?", "Histoire", 1, ["evenement"]),
    Question("Comment avez-vous vecu l'arrivee de la television ?", "Histoire", 2, ["television", "technologie"]),
    Question("Vous souvenez-vous des premiers pas de l'homme sur la Lune ?", "Histoire", 2, ["lune", "1969"]),
    Question("Comment etait la vie quotidienne dans les annees 50 ou 60 ?", "Histoire", 2, ["quotidien", "epoque"]),
    Question("Avez-vous vecu Mai 68 ? Qu'en pensez-vous ?", "Histoire", 2, ["mai68", "politique"]),
    Question("Comment avez-vous vecu l'arrivee du telephone portable ?", "Histoire", 2, ["technologie"]),
    Question("La vie etait-elle plus simple avant selon vous ?", "Histoire", 3, ["reflexion", "nostalgie"]),
    Question("Y a-t-il eu un president ou un homme politique qui vous a marque ?", "Histoire", 2, ["politique"]),
    Question("Comment l'arrivee d'Internet a-t-elle change votre vie ?", "Histoire", 2, ["internet", "technologie"]),
    Question("Quels changements vous ont le plus surpris dans la societe ?", "Histoire", 3, ["societe", "changement"]),
    Question("Comment avez-vous vecu la construction de l'Europe ?", "Histoire", 2, ["europe"]),
    Question("Y avait-il des metiers courants a votre epoque qui ont disparu ?", "Histoire", 2, ["metiers", "evolution"]),
    Question("Quel conseil donneriez-vous aux jeunes generations ?", "Histoire", 3, ["sagesse", "transmission"]),
]

# Group by theme for quick access
QUESTIONS_BY_THEME: dict[str, list[Question]] = {}
for q in QUESTIONS:
    QUESTIONS_BY_THEME.setdefault(q.theme, []).append(q)

THEME_NAMES = list(QUESTIONS_BY_THEME.keys())


class QuestionSelector:
    """Intelligent question selection avoiding repetition and varying themes."""

    def __init__(self, db: Session):
        self.db = db

    def get_next_question(self, senior_id: int, preferred_theme: str | None = None) -> Question:
        """Select the best next question for this senior."""
        # Get themes already well covered
        covered_themes = self._get_covered_themes(senior_id)
        asked_tags = self._get_asked_tags(senior_id)

        # Prefer under-explored themes
        if preferred_theme and preferred_theme in QUESTIONS_BY_THEME:
            candidates = QUESTIONS_BY_THEME[preferred_theme]
        else:
            # Find least covered theme
            theme_scores = {t: covered_themes.get(t, 0) for t in THEME_NAMES}
            least_covered = sorted(theme_scores, key=theme_scores.get)
            candidates = QUESTIONS_BY_THEME[least_covered[0]]

        # Filter out questions with tags already covered
        fresh = [q for q in candidates if not set(q.tags) & asked_tags]
        if not fresh:
            fresh = candidates  # All tags covered — allow repeats from this theme

        # Prefer lower depth first, then medium, then deep
        fresh.sort(key=lambda q: q.depth)

        # Add some randomness within same depth level
        if len(fresh) > 3:
            same_depth = [q for q in fresh if q.depth == fresh[0].depth]
            return random.choice(same_depth)

        return fresh[0] if fresh else random.choice(QUESTIONS)

    def get_followup_question(self, user_text: str) -> str:
        """Generate a contextual follow-up question based on what the senior just said."""
        # Simple keyword matching for follow-ups
        text_lower = user_text.lower()
        followups = []

        if any(w in text_lower for w in ["mere", "maman", "maman"]):
            followups.append("Votre maman avait l'air d'etre quelqu'un de special. Que faisiez-vous ensemble ?")
        if any(w in text_lower for w in ["pere", "papa"]):
            followups.append("Votre pere semble avoir ete important pour vous. Qu'est-ce qu'il vous a transmis ?")
        if any(w in text_lower for w in ["ecole", "classe", "maitre"]):
            followups.append("L'ecole a l'air d'avoir ete un moment marquant. Avez-vous garde des amis de cette epoque ?")
        if any(w in text_lower for w in ["guerre", "soldat", "armee"]):
            followups.append("C'est un sujet fort. Si vous le souhaitez, pouvez-vous me raconter comment vous avez vecu cette periode ?")
        if any(w in text_lower for w in ["mariage", "mari", "femme", "epoux"]):
            followups.append("C'est beau. Quel est votre plus beau souvenir a deux ?")
        if any(w in text_lower for w in ["enfant", "fils", "fille", "bebe"]):
            followups.append("Les enfants nous apportent tellement. Y a-t-il un moment avec eux que vous cherissiez particulierement ?")
        if any(w in text_lower for w in ["musique", "chanson", "chant"]):
            followups.append("La musique, c'est magique. Pouvez-vous me fredonner ou me decrire cette chanson ?")
        if any(w in text_lower for w in ["voyage", "vacances", "mer", "montagne"]):
            followups.append("Ca avait l'air merveilleux. Avec qui etiez-vous lors de ce voyage ?")

        if followups:
            return random.choice(followups)

        return "C'est un tres beau souvenir. Pouvez-vous m'en dire un peu plus sur ce moment ?"

    def _get_covered_themes(self, senior_id: int) -> dict[str, int]:
        """Count memories per theme to find gaps."""
        memories = self.db.query(Memory).filter(Memory.senior_id == senior_id).all()
        theme_counts: dict[str, int] = {}
        for m in memories:
            for t in m.themes:
                theme_counts[t.name] = theme_counts.get(t.name, 0) + 1
        return theme_counts

    def _get_asked_tags(self, senior_id: int) -> set[str]:
        """Get tags of topics already discussed (from AI transcriptions)."""
        # We approximate by looking at keywords in AI questions
        transcriptions = (
            self.db.query(Transcription)
            .filter(Transcription.speaker == "ai")
            .join(
                Transcription.session
            )
            .limit(50)
            .all()
        )

        tags = set()
        for t in transcriptions:
            text = decrypt_text(t.content_encrypted).lower()
            for q in QUESTIONS:
                if any(word in text for word in q.text.lower().split()[:3]):
                    tags.update(q.tags)
        return tags
