#!/usr/bin/env python3
"""
Seed script for CCI demo – populates the database with 30 days of realistic
data for senior Jeanne Martin, as seen by family member Marie Dupont.

Usage:
    source .venv/bin/activate
    set -a && source ../.env && set +a
    PYTHONPATH=. python3 scripts/seed_demo.py
"""
from __future__ import annotations

import json
import random
import sys
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import text as sa_text

from app.core.database import SessionLocal
from app.core.encryption import encrypt_text
from app.core.security import hash_password
from app.models import (
    Alert,
    CognitiveMetric,
    FamilyMember,
    Gazette,
    Memory,
    Senior,
    Session,
    Theme,
    Transcription,
    User,
    memory_themes,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
NOW = datetime.now(timezone.utc)
TODAY = NOW.date()
DAY_ZERO = TODAY - timedelta(days=30)  # 30 days ago


def dt(d: date, hour: int = 10, minute: int = 0) -> datetime:
    """Build a timezone-aware datetime from a date + time."""
    return datetime(d.year, d.month, d.day, hour, minute, tzinfo=timezone.utc)


def p(msg: str) -> None:
    """Print progress."""
    print(f"  -> {msg}")


# ---------------------------------------------------------------------------
# Conversation data – 18 sessions with diverse biographical themes
# Each entry: (theme_key, summary, period, people, places, exchanges)
#   exchanges = list of (speaker, text) tuples
# ---------------------------------------------------------------------------
SESSIONS_DATA = [
    # 0 – Childhood in Nice
    {
        "theme_keys": ["Enfance"],
        "memory_title": "Mon enfance dans le Vieux-Nice",
        "memory_summary": "Jeanne raconte son enfance dans les ruelles du Vieux-Nice pendant les annees 1940, les jeux avec les voisins et l'odeur du pain frais de la boulangerie Rossi.",
        "period": "Annees 1940",
        "people": ["Maman", "Papa", "Luigi Rossi"],
        "places": ["Vieux-Nice", "Cours Saleya"],
        "exchanges": [
            ("ai", "Bonjour Jeanne, comment allez-vous aujourd'hui ? J'aimerais que vous me parliez de votre enfance a Nice."),
            ("senior", "Oh, mon enfance a Nice... C'etait un autre monde. On habitait dans le Vieux-Nice, rue Droite, un petit appartement au troisieme etage. Je me souviens des escaliers qui n'en finissaient plus."),
            ("ai", "La rue Droite, c'est au coeur du vieux quartier. Qu'est-ce qui vous revient en premier quand vous pensez a cette epoque ?"),
            ("senior", "L'odeur du pain. Il y avait la boulangerie Rossi en bas de chez nous. Monsieur Rossi, un Italien adorable, il commencait a quatre heures du matin. On se reveillait avec cette odeur merveilleuse. Maman m'envoyait chercher le pain avant l'ecole."),
            ("ai", "C'est un souvenir tres sensoriel. Et vos jeux d'enfant, a quoi jouiez-vous dans les ruelles ?"),
            ("senior", "On jouait a la marelle sur le Cours Saleya, entre les etals du marche. Les marchands nous grondaient mais sans mechancete. On courait partout pieds nus l'ete. C'etait la liberte totale pour les enfants, pas comme maintenant."),
            ("ai", "C'est une epoque ou les enfants vivaient dehors. Est-ce que vous aviez des amis proches ?"),
            ("senior", "Ma meilleure amie c'etait Francoise, la fille du poissonnier. On etait inseparables. On se racontait des histoires le soir sur les marches de l'eglise. Je me demande ce qu'elle est devenue..."),
        ],
    },
    # 1 – School years
    {
        "theme_keys": ["Enfance", "Vie quotidienne"],
        "memory_title": "L'ecole communale de Nice",
        "memory_summary": "Jeanne se souvient de son institutrice Mademoiselle Blanc qui lui a transmis l'amour de la lecture et de l'ecriture, a l'ecole communale du quartier.",
        "period": "Annees 1950",
        "people": ["Mademoiselle Blanc", "Francoise"],
        "places": ["Nice", "Ecole communale"],
        "exchanges": [
            ("ai", "Jeanne, la derniere fois vous m'avez parle de votre enfance a Nice. Et l'ecole, comment c'etait ?"),
            ("senior", "L'ecole communale, rue de la Prefecture ! J'adorais y aller. Mademoiselle Blanc etait notre institutrice. Une femme severe mais juste, toujours en blouse grise. Elle m'a appris a aimer les livres."),
            ("ai", "Elle a eu une grande influence sur vous, on dirait. Qu'est-ce qu'elle vous faisait lire ?"),
            ("senior", "Les fables de La Fontaine, d'abord. Puis Victor Hugo. J'ai decouvert Les Miserables a dix ans, un peu tot peut-etre, mais ca m'a bouleversee. C'est grace a elle que je suis devenue institutrice moi aussi, des annees plus tard."),
            ("ai", "C'est beau ce passage de relais. Vous etiez bonne eleve ?"),
            ("senior", "Premiere de la classe en francais et en histoire. Pas terrible en calcul par contre ! Francoise etait meilleure que moi pour les chiffres. On s'entraidait. Elle m'expliquait les fractions et moi je l'aidais pour les redactions."),
        ],
    },
    # 2 – Meeting Pierre
    {
        "theme_keys": ["Famille"],
        "memory_title": "La rencontre avec Pierre au bal de Nice",
        "memory_summary": "Jeanne raconte comment elle a rencontre Pierre Martin au bal du 14 juillet 1959 a Nice. Un coup de foudre immediat, il l'a invitee a danser un slow.",
        "period": "Annees 1950",
        "people": ["Pierre Martin"],
        "places": ["Nice", "Place Massena"],
        "exchanges": [
            ("ai", "Jeanne, aujourd'hui j'aimerais que vous me racontiez une rencontre importante dans votre vie."),
            ("senior", "Pierre. Mon Pierre. Je l'ai rencontre au bal du 14 juillet 1959. J'avais dix-neuf ans. C'etait sur la place Massena, il y avait un orchestre et des guirlandes partout."),
            ("ai", "Racontez-moi ce moment. Qu'est-ce qui vous a frappe chez lui ?"),
            ("senior", "Il etait grand, brun, avec des yeux verts magnifiques. Il portait une chemise blanche impeccable. Il est venu vers moi et m'a dit : 'Mademoiselle, me feriez-vous l'honneur de cette danse ?' Tres galant, un peu timide."),
            ("ai", "Un vrai coup de foudre alors ?"),
            ("senior", "Completement. On a danse toute la soiree. Il etait ingenieur, il venait d'arriver a Nice pour le travail. A la fin de la soiree il m'a raccompagnee chez mes parents et il m'a demande s'il pouvait me revoir. Mon coeur battait si fort..."),
            ("ai", "Et vos parents, ils ont pense quoi de ce jeune homme ?"),
            ("senior", "Papa etait mefiant au debut, comme tous les peres. Mais Pierre l'a conquis en parlant mecanique avec lui. Papa avait un vieux Solex que Pierre a repare le dimanche suivant. Apres ca, il etait le bienvenu a la maison !"),
        ],
    },
    # 3 – Wedding
    {
        "theme_keys": ["Famille", "Fetes"],
        "memory_title": "Notre mariage a l'eglise Saint-Jacques",
        "memory_summary": "Jeanne se souvient de son mariage avec Pierre en juin 1961 a l'eglise Saint-Jacques de Nice. Sa robe en dentelle, le repas au restaurant Le Negresco, et la valse d'ouverture.",
        "period": "Annees 1960",
        "people": ["Pierre Martin", "Maman", "Papa", "Tante Louise"],
        "places": ["Nice", "Eglise Saint-Jacques", "Le Negresco"],
        "exchanges": [
            ("ai", "Jeanne, vous m'avez raconte votre rencontre avec Pierre. Parlez-moi de votre mariage."),
            ("senior", "Le plus beau jour de ma vie. Le 17 juin 1961. Il faisait un soleil magnifique, comme si le ciel etait de notre cote. L'eglise Saint-Jacques etait pleine de fleurs blanches."),
            ("ai", "Vous vous souvenez de votre robe ?"),
            ("senior", "Oh oui ! Maman l'avait faite elle-meme, en dentelle de Calais. Elle avait travaille dessus pendant trois mois en secret. Quand je l'ai vue pour la premiere fois, j'ai pleure de joie. C'etait la plus belle robe du monde."),
            ("ai", "Et la reception, c'etait ou ?"),
            ("senior", "Au Negresco, rien que ca ! Le pere de Pierre connaissait le directeur. On etait soixante convives. Tante Louise a chante 'La Vie en Rose' et tout le monde pleurait. Pierre et moi on a ouvert le bal avec une valse viennoise."),
            ("ai", "Un mariage de conte de fees. Pierre etait emu aussi ?"),
            ("senior", "Il tremblait en me passant l'alliance ! Le pretre a du l'aider. On en a ri pendant des annees. C'etait un homme qui ne montrait pas ses emotions facilement, mais ce jour-la, il avait les yeux rouges. Mon Pierre..."),
        ],
    },
    # 4 – Teaching career
    {
        "theme_keys": ["Travail"],
        "memory_title": "Trente ans d'enseignement a l'ecole Pasteur",
        "memory_summary": "Jeanne parle de sa carriere d'institutrice a l'ecole Pasteur de Nice. Trente ans a enseigner le francais et l'histoire aux enfants du quartier, avec passion et devouement.",
        "period": "Annees 1960",
        "people": ["Mademoiselle Blanc", "Directeur Moreau"],
        "places": ["Nice", "Ecole Pasteur"],
        "exchanges": [
            ("ai", "Jeanne, parlons de votre metier. Vous avez ete institutrice, c'est bien ca ?"),
            ("senior", "Oui, pendant trente ans ! A l'ecole Pasteur, dans le quartier de la Liberation a Nice. J'ai commence en 1963, j'avais vingt-trois ans et une peur terrible le premier jour."),
            ("ai", "Le premier jour de classe, ca devait etre impressionnant. Racontez-moi."),
            ("senior", "Trente-deux gamins de CE2 qui me regardaient avec de grands yeux. J'avais prepare ma lecon pendant des heures mais j'ai tout oublie en entrant. Alors j'ai fait comme Mademoiselle Blanc : j'ai ouvert un livre et j'ai commence a lire une histoire. Les enfants etaient captives."),
            ("ai", "Vous avez reproduit ce qui vous avait touchee enfant. Qu'est-ce que vous aimiez le plus dans ce metier ?"),
            ("senior", "Le moment ou un enfant comprend. Ce petit eclat dans les yeux, quand la lumiere s'allume. J'ai eu des centaines d'eleves et chaque fois c'etait magique. Certains sont revenus me voir des annees plus tard pour me remercier. Ca, c'est la plus belle recompense."),
            ("ai", "Trente ans, c'est une sacree carriere. Vous avez pris votre retraite quand ?"),
            ("senior", "En 1993. Le directeur Moreau a organise une fete surprise. Tous les anciens eleves etaient la. J'ai recu un album photo avec des messages de centaines d'enfants que j'avais eus en classe. Je le garde precieusement."),
        ],
    },
    # 5 – Trip to Italy
    {
        "theme_keys": ["Voyages"],
        "memory_title": "Le voyage en Italie, ete 1965",
        "memory_summary": "Jeanne et Pierre ont fait leur premier grand voyage en Italie en 1965 : Rome, Florence, Venise. La decouverte du Colisee et des glaces italiennes reste un souvenir inoubliable.",
        "period": "Annees 1960",
        "people": ["Pierre Martin"],
        "places": ["Rome", "Florence", "Venise", "Italie"],
        "exchanges": [
            ("ai", "Jeanne, est-ce que vous avez voyage avec Pierre ? Ou etes-vous alles ?"),
            ("senior", "Notre plus beau voyage, c'etait l'Italie en 1965. Trois semaines en Fiat 500 ! Pierre conduisait comme un fou dans les cols. On a fait Rome, Florence et Venise."),
            ("ai", "Trois semaines en Italie, quel programme ! Qu'est-ce qui vous a le plus marquee ?"),
            ("senior", "Rome. Quand j'ai vu le Colisee pour la premiere fois, je suis restee bouche bee. Moi qui enseignais l'histoire, c'etait comme toucher le passe. Pierre se moquait parce que je pleurais devant des vieilles pierres, comme il disait."),
            ("ai", "Et Florence ? Venise ?"),
            ("senior", "Florence, c'etait les musees. Le David de Michel-Ange, je ne m'attendais pas a ce qu'il soit aussi grand ! Et Venise... On a pris une gondole au coucher du soleil. Pierre m'a chante 'O Sole Mio' completement faux, le gondolier riait aux eclats."),
            ("ai", "Et la cuisine italienne ?"),
            ("senior", "Les glaces ! On en mangeait trois par jour. A Florence, il y avait un glacier pres du Ponte Vecchio. Pistache et stracciatella, mon melange prefere. Pierre prenait toujours citron. On n'a jamais retrouve des glaces aussi bonnes en France."),
        ],
    },
    # 6 – Cooking and grandma's recipes
    {
        "theme_keys": ["Cuisine"],
        "memory_title": "La pissaladiere de Grand-mere Rosa",
        "memory_summary": "Jeanne partage la recette de pissaladiere de sa grand-mere Rosa, un plat traditionnel nicois qu'elle prepare encore aujourd'hui avec les memes gestes transmis de generation en generation.",
        "period": "Annees 1950",
        "people": ["Grand-mere Rosa", "Maman"],
        "places": ["Nice", "Cuisine familiale"],
        "exchanges": [
            ("ai", "Jeanne, parlons cuisine ! Est-ce que vous aimez cuisiner ?"),
            ("senior", "La cuisine, c'est toute ma vie ! Ma grand-mere Rosa m'a tout appris. Elle etait italienne, de Ligurie, et elle cuisinait comme une reine. Sa specialite c'etait la pissaladiere."),
            ("ai", "La pissaladiere, c'est le plat typique de Nice. Comment la faisait votre grand-mere ?"),
            ("senior", "D'abord les oignons. Des kilos d'oignons doux, coupes fins, a faire fondre pendant au moins une heure a feu tres doux. C'est le secret : la patience. Grand-mere disait que les oignons doivent devenir comme de la confiture."),
            ("ai", "Et la pate ?"),
            ("senior", "Une pate a pain toute simple, avec de l'huile d'olive de chez nous. Ensuite on etale les oignons, les olives noires de Nice et les anchois en croix. Au four bien chaud, vingt minutes, pas plus. L'odeur envahissait tout l'immeuble et les voisins venaient frapper a la porte."),
            ("ai", "Vous la faites encore aujourd'hui ?"),
            ("senior", "Bien sur ! Tous les dimanches ou presque. Mes petits-enfants l'adorent. Quand Lucas vient me voir, la premiere chose qu'il dit c'est : 'Mamie, tu as fait ta pissaladiere ?' Ca me fait tellement plaisir de transmettre ca."),
        ],
    },
    # 7 – Christmas traditions
    {
        "theme_keys": ["Fetes", "Famille"],
        "memory_title": "Les Noels en famille a Nice",
        "memory_summary": "Jeanne decrit les traditions de Noel dans sa famille : les treize desserts provencaux, la messe de minuit a Saint-Jacques, et la joie de reunir toute la famille autour de la table.",
        "period": "Vie adulte",
        "people": ["Pierre Martin", "Sophie", "Marc", "Lucas", "Emma"],
        "places": ["Nice", "Eglise Saint-Jacques"],
        "exchanges": [
            ("ai", "Jeanne, Noel approche. Comment fetez-vous Noel habituellement ?"),
            ("senior", "Noel c'est sacre chez nous ! La tradition provencale, les treize desserts. Je commence les preparations une semaine avant. La pompe a l'huile, les nougats, les fruits secs, les dattes, les calissons..."),
            ("ai", "Les treize desserts, c'est toute une tradition ! Et le repas de Noel lui-meme ?"),
            ("senior", "On fait le gros souper le 24 au soir, avant la messe de minuit. Du poisson, pas de viande. De la morue, des legumes, de la soupe au pistou. Et apres la messe a Saint-Jacques, on rentre et la on ouvre les treize desserts. Pierre adorait les nougats."),
            ("ai", "Et maintenant, vous continuez cette tradition ?"),
            ("senior", "Sophie, ma fille, vient avec toute sa famille. Marc est a Lyon, il ne peut pas toujours venir, ca me rend triste. Mais quand Lucas et Emma sont la, mes petits-enfants, la maison revit. Lucas met la creche, Emma decore le sapin. C'est le plus beau moment de l'annee."),
            ("ai", "C'est magnifique que ces traditions perdurent. Quel est votre plus beau souvenir de Noel ?"),
            ("senior", "Le Noel 1985, quand Sophie nous a annonce qu'elle etait enceinte de Lucas. Pierre a pleure de joie. On allait etre grands-parents ! Il a ouvert sa meilleure bouteille de champagne. Ce Noel-la, je ne l'oublierai jamais."),
        ],
    },
    # 8 – Children and grandchildren
    {
        "theme_keys": ["Famille"],
        "memory_title": "Sophie et Marc, mes deux tresors",
        "memory_summary": "Jeanne parle de ses deux enfants : Sophie nee en 1963, devenue medecin a Nice, et Marc ne en 1966, ingenieur a Lyon. Et de ses petits-enfants Lucas et Emma.",
        "period": "Annees 1960",
        "people": ["Pierre Martin", "Sophie", "Marc", "Lucas", "Emma"],
        "places": ["Nice", "Lyon"],
        "exchanges": [
            ("ai", "Jeanne, parlez-moi de vos enfants. Combien en avez-vous ?"),
            ("senior", "Deux. Sophie, l'ainee, nee en 1963. Et Marc, en 1966. Sophie c'est mon portrait tout crache, tetu et passionnee. Marc c'est Pierre en miniature, calme et reflechi."),
            ("ai", "Qu'est-ce qu'ils font dans la vie ?"),
            ("senior", "Sophie est medecin generaliste ici a Nice. Elle a repris le cabinet du vieux docteur Blanchard. Je suis tellement fiere d'elle. Marc est ingenieur a Lyon, dans l'aeronautique. Il conçoit des pieces d'avion, comme son pere."),
            ("ai", "Et vos petits-enfants ?"),
            ("senior", "Lucas a vingt ans, il est en fac de lettres. Ca me fait plaisir, un litteraire dans la famille ! Et Emma a dix-sept ans, elle veut etre veterinaire. Elle est folle des animaux, elle ramene des chats errants a la maison, ca rend sa mere folle."),
            ("ai", "Vous les voyez souvent ?"),
            ("senior", "Sophie passe tous les mercredis. Lucas vient le week-end quand il n'a pas trop de travail. Marc, c'est plus complique avec Lyon, mais il appelle tous les dimanches sans faute. Emma m'envoie des photos de ses chats sur le telephone, elle m'a appris a utiliser le machin, la..."),
            ("ai", "Ils comptent beaucoup pour vous."),
            ("senior", "C'est toute ma vie. Depuis que Pierre n'est plus la, c'est eux qui me donnent la force de continuer. Surtout Sophie, elle veille sur moi comme une maman poule. Parfois c'est un peu trop, je lui dis que je suis vieille mais pas impotente !"),
        ],
    },
    # 9 – Mai 68
    {
        "theme_keys": ["Histoire"],
        "memory_title": "Mai 68 vu de Nice",
        "memory_summary": "Jeanne se souvient de Mai 68 vecu depuis Nice : les manifestations sur la Promenade des Anglais, les debats entre collegues a l'ecole, et Pierre qui voulait monter a Paris.",
        "period": "Annees 1960",
        "people": ["Pierre Martin", "Collegues instituteurs"],
        "places": ["Nice", "Promenade des Anglais"],
        "exchanges": [
            ("ai", "Jeanne, vous avez vecu des evenements historiques importants. Parlez-moi de Mai 68."),
            ("senior", "Mai 68, quelle pagaille ! Moi j'avais vingt-huit ans, j'enseignais a Pasteur. L'ecole a ferme pendant trois semaines. A Nice c'etait moins violent qu'a Paris, mais il y avait des manifestations sur la Promenade des Anglais."),
            ("ai", "Comment avez-vous vecu cette periode ?"),
            ("senior", "J'etais partagee. En tant qu'institutrice, je comprenais les revendications pour l'education. Mais j'avais peur aussi. Pierre voulait monter a Paris pour soutenir les etudiants. Je lui ai dit : 'Tu as une femme et une fille de cinq ans, tu restes ici !'"),
            ("ai", "Et a l'ecole, entre collegues, comment c'etait ?"),
            ("senior", "Des debats interminables ! On refaisait le monde dans la salle des profs. Certains etaient revolutionnaires, d'autres conservateurs. Moi je disais : il faut changer les choses, mais pas tout casser. Au final, certaines reformes ont ete positives pour l'education."),
            ("ai", "Avec le recul, qu'est-ce que ca a change pour vous ?"),
            ("senior", "Ca a ouvert les esprits. Apres 68, j'ai change ma facon d'enseigner. Moins autoritaire, plus d'ecoute. Les enfants avaient le droit de poser des questions, de debattre. Mademoiselle Blanc n'aurait pas approuve, mais les temps changeaient."),
        ],
    },
    # 10 – Garden and daily life
    {
        "theme_keys": ["Vie quotidienne"],
        "memory_title": "Mon jardin, mon petit paradis",
        "memory_summary": "Jeanne decrit son jardin a Nice ou elle cultive rosiers, lavande et tomates. Un rituel quotidien qui la maintient active et connectee a la nature.",
        "period": "Vie adulte",
        "people": ["Pierre Martin", "Voisine Madeleine"],
        "places": ["Nice", "Mon jardin"],
        "exchanges": [
            ("ai", "Jeanne, comment se passe une journee typique pour vous ?"),
            ("senior", "Je me leve a sept heures, toujours. Un cafe, deux tartines de confiture. Et apres, direction le jardin. Mon jardin, c'est mon petit paradis. Pierre et moi on l'a amenage ensemble quand on a achete la maison en 1970."),
            ("ai", "Qu'est-ce que vous cultivez dans votre jardin ?"),
            ("senior", "Des rosiers, c'est ma passion. J'en ai douze varietes differentes. Pierre Ronsard, Meilland, Iceberg... Et puis de la lavande, du romarin, du thym. Un potager aussi : tomates, courgettes, basilic. Tout pour la cuisine nicoise."),
            ("ai", "Ca doit demander beaucoup d'entretien. C'est un plaisir ou une contrainte ?"),
            ("senior", "Un pur bonheur ! Le matin, avec la rosee, c'est magique. Ma voisine Madeleine vient souvent prendre le cafe dans le jardin. On papote pendant des heures. Elle me donne des boutures, je lui donne des tomates. Le troc entre voisines, comme au bon vieux temps."),
            ("ai", "Le jardinage vous garde en forme aussi."),
            ("senior", "Mon docteur dit que c'est le meilleur exercice pour moi. Se baisser, porter, marcher. Et puis c'est bon pour la tete aussi. Quand je suis dans mon jardin, j'oublie tout. C'est comme une meditation."),
        ],
    },
    # 11 – Music and dancing
    {
        "theme_keys": ["Passions"],
        "memory_title": "La musique et les bals du samedi soir",
        "memory_summary": "Jeanne parle de sa passion pour la musique, les bals du samedi soir avec Pierre, l'accordeon de son pere et ses chansons preferees d'Edith Piaf et Charles Trenet.",
        "period": "Annees 1950",
        "people": ["Pierre Martin", "Papa", "Edith Piaf"],
        "places": ["Nice", "Salle des fetes"],
        "exchanges": [
            ("ai", "Jeanne, est-ce que la musique a une place importante dans votre vie ?"),
            ("senior", "La musique, c'est essentiel ! Papa jouait de l'accordeon. Le dimanche, il sortait son instrument et tout le quartier venait ecouter. Il jouait des musettes, des tangos. Je dansais dans ses pieds quand j'etais petite."),
            ("ai", "Quels sont vos artistes preferes ?"),
            ("senior", "Piaf, evidemment. 'La Vie en Rose', ca me donne encore des frissons. Et Charles Trenet, 'La Mer', 'Y'a d'la joie'. Quand j'entends Trenet, je suis de nouveau a Nice au soleil. Et puis Brassens, pour la poesie."),
            ("ai", "Et la danse ? Vous dansiez avec Pierre ?"),
            ("senior", "Tous les samedis soir ! La salle des fetes du quartier. On dansait le tango, la valse, le rock aussi dans les annees 60. Pierre dansait merveilleusement bien pour un ingenieur ! On a gagne un concours de tango en 1972."),
            ("ai", "Un concours de tango ! Racontez-moi ca."),
            ("senior", "C'etait au Palais de la Mediterranee. On s'etait entraines pendant des semaines. Pierre avait achete un costume neuf. On a danse sur 'Por una cabeza' de Gardel. Le jury nous a donne le premier prix : un weekend a Paris ! C'etait l'un de nos plus beaux souvenirs."),
        ],
    },
    # 12 – Pierre's passing
    {
        "theme_keys": ["Famille"],
        "memory_title": "L'adieu a Pierre",
        "memory_summary": "Jeanne evoque avec emotion le deces de Pierre en 2018 apres 57 ans de mariage. Les derniers moments a l'hopital et comment elle a appris a vivre sans lui.",
        "period": "Annees 2010",
        "people": ["Pierre Martin", "Sophie", "Marc"],
        "places": ["Nice", "Hopital Pasteur"],
        "exchanges": [
            ("ai", "Jeanne, vous parlez souvent de Pierre. Est-ce que vous aimeriez me raconter..."),
            ("senior", "Pierre est parti en 2018. Cinquante-sept ans de mariage. Un cancer du poumon, en six mois c'etait fini. Il n'avait jamais fume, c'est injuste."),
            ("ai", "Je suis desolee. C'est un sujet difficile, on peut en parler autant ou aussi peu que vous le souhaitez."),
            ("senior", "Non, ca fait du bien d'en parler. Les derniers jours, a l'hopital Pasteur, je ne le quittais pas. Sophie venait le soir pour que je puisse dormir un peu. Il m'a serree la main et il m'a dit : 'Ma Jeannette, tu as ete le bonheur de ma vie.' C'est la derniere chose qu'il m'a dite."),
            ("ai", "Quels mots magnifiques. Comment avez-vous traverse cette epreuve ?"),
            ("senior", "Les premiers mois etaient terribles. La maison vide, le silence. Plus personne pour raler sur mes rosiers qui debordent. Marc est venu de Lyon pendant deux semaines. Et puis petit a petit, on apprend a vivre avec l'absence. Le jardin m'a sauvee. Et mes enfants, mes petits-enfants."),
        ],
    },
    # 13 – Adolescence
    {
        "theme_keys": ["Adolescence"],
        "memory_title": "Mes annees lycee a Nice",
        "memory_summary": "Jeanne se souvient de ses annees au lycee Massena de Nice dans les annees 1950, la decouverte de la litterature, les premieres sorties et le baccalaureat.",
        "period": "Annees 1950",
        "people": ["Francoise", "Professeur Durand"],
        "places": ["Nice", "Lycee Massena"],
        "exchanges": [
            ("ai", "Jeanne, apres l'ecole primaire, parlez-moi de vos annees au lycee."),
            ("senior", "Le lycee Massena ! Un batiment imposant, j'etais impressionnee le premier jour. J'ai decouvert la philosophie, la litterature, le latin. Le professeur Durand nous faisait lire Camus et Sartre."),
            ("ai", "C'etait l'epoque des grands auteurs existentialistes. Qu'est-ce qui vous plaisait ?"),
            ("senior", "Camus surtout. 'L'Etranger' m'a fascine. Un auteur du sud comme nous, qui parlait du soleil et de la mer. Francoise et moi on allait a la bibliotheque devorer tous ses livres. On refaisait le monde dans les cafes, comme de vraies intellectuelles !"),
            ("ai", "Et le baccalaureat, ca s'est bien passe ?"),
            ("senior", "Recu avec mention bien ! Papa m'a offert un stylo plume, un Waterman. Je l'ai encore. C'etait la premiere de la famille a avoir le bac. Maman pleurait de fierte."),
            ("ai", "Et apres le bac, qu'avez-vous fait ?"),
            ("senior", "L'ecole normale d'institutrices. Deux ans de formation. C'etait dur mais passionnant. On apprenait la pedagogie, la psychologie de l'enfant. J'ai fait mon premier stage dans une ecole de campagne pres de Grasse. Les enfants sentaient la lavande !"),
        ],
    },
    # 14 – Passions and hobbies
    {
        "theme_keys": ["Passions", "Vie quotidienne"],
        "memory_title": "La lecture, compagne de toute une vie",
        "memory_summary": "Jeanne parle de sa passion pour la lecture : de La Fontaine a Modiano, en passant par les polars de Fred Vargas. Elle lit un livre par semaine depuis soixante ans.",
        "period": "Vie adulte",
        "people": ["Mademoiselle Blanc"],
        "places": ["Nice", "Bibliotheque municipale"],
        "exchanges": [
            ("ai", "Jeanne, a part le jardin, quelles sont vos passions ?"),
            ("senior", "La lecture, avant tout. Un livre par semaine depuis que j'ai quinze ans. Ma table de nuit croule sous les bouquins. Pierre disait que j'allais finir ensevelie sous les livres !"),
            ("ai", "Quel genre de livres aimez-vous ?"),
            ("senior", "Un peu de tout. Les classiques francais, bien sur : Zola, Flaubert, Maupassant. Mais aussi les contemporains. J'adore Patrick Modiano, sa facon d'ecrire la memoire, le passe qui revient. Et les polars de Fred Vargas, ca me passionne."),
            ("ai", "Et votre livre prefere de tous les temps ?"),
            ("senior", "Belle du Seigneur d'Albert Cohen. L'histoire d'amour la plus belle jamais ecrite. Je l'ai lu cinq fois. Chaque fois je decouvre quelque chose de nouveau. Pierre me disait : 'Encore ce pave ?' Mais il l'a lu aussi finalement, et il a adore."),
            ("ai", "Vous allez encore a la bibliotheque ?"),
            ("senior", "Tous les mardis ! La bibliotheque municipale. La bibliothecaire me connait par coeur. Elle me met des livres de cote. C'est une sortie que je ne manquerais pour rien au monde."),
        ],
    },
    # 15 – Travel to Corsica
    {
        "theme_keys": ["Voyages", "Famille"],
        "memory_title": "Les etes en Corse",
        "memory_summary": "Jeanne raconte les vacances d'ete en Corse avec Pierre et les enfants dans les annees 1970-80. Le camping a Porto-Vecchio, les baignades et les randonnees.",
        "period": "Annees 1970",
        "people": ["Pierre Martin", "Sophie", "Marc"],
        "places": ["Corse", "Porto-Vecchio", "Bavella"],
        "exchanges": [
            ("ai", "Jeanne, avez-vous voyage en famille avec vos enfants ?"),
            ("senior", "La Corse ! Nos vacances preferees pendant quinze ans. On prenait le ferry de Nice a Bastia, c'etait toute une aventure. Les enfants adoraient le bateau."),
            ("ai", "Ou alliez-vous en Corse ?"),
            ("senior", "Camping a Porto-Vecchio. Un petit camping familial pres de la plage de Palombaggia. L'eau turquoise, le sable blanc. Sophie et Marc passaient la journee dans l'eau, Pierre et moi sous le parasol avec nos livres."),
            ("ai", "Et a part la plage ?"),
            ("senior", "Les randonnees dans les aiguilles de Bavella. Pierre etait un grand marcheur. Marc le suivait partout. Sophie et moi on preferait les promenades tranquilles dans les villages. Sartene, Bonifacio... Les couchers de soleil depuis les falaises de Bonifacio, il n'y a rien de plus beau."),
            ("ai", "Quinze ans de vacances au meme endroit, ca cree des souvenirs."),
            ("senior", "Le patron du camping, Monsieur Ferracci, nous gardait toujours le meme emplacement, sous le grand pin. Les enfants retrouvaient leurs copains de vacances. C'etait comme une deuxieme famille. J'aimerais y retourner un jour, mais sans Pierre, ce ne serait plus pareil."),
        ],
    },
    # 16 – Historical events / Landing
    {
        "theme_keys": ["Histoire", "Enfance"],
        "memory_title": "Le Debarquement de Provence, aout 1944",
        "memory_summary": "Jeanne, qui avait quatre ans en 1944, garde des souvenirs fragmentaires du Debarquement de Provence : le bruit des avions, la cave ou la famille se cachait, et la joie de la Liberation.",
        "period": "Annees 1940",
        "people": ["Maman", "Papa"],
        "places": ["Nice", "Cave de l'immeuble"],
        "exchanges": [
            ("ai", "Jeanne, vous etes nee en 1940. Vous avez des souvenirs de la guerre ?"),
            ("senior", "J'etais toute petite, mais certaines choses restent. Le bruit des avions, surtout. En aout 44, le Debarquement de Provence. Papa nous a descendues dans la cave de l'immeuble, maman et moi. Je me souviens de l'obscurite et du bruit."),
            ("ai", "Des souvenirs d'enfant, mais tres forts. Et la Liberation ?"),
            ("senior", "La je me souviens mieux. Les soldats americains dans les rues de Nice. Ils distribuaient du chocolat et du chewing-gum. Je n'avais jamais goute de chocolat ! Un soldat m'a soulevee et mise sur ses epaules. Maman pleurait de joie."),
            ("ai", "Ce sont des images puissantes pour une petite fille de quatre ans."),
            ("senior", "Apres ca, la vie a repris. Papa est revenu du maquis ou il se cachait. On ne savait pas s'il etait vivant ou mort pendant des mois. Le jour ou il est rentre, maman s'est evanouie. Moi j'ai couru dans ses bras. Il sentait le tabac et la terre."),
            ("ai", "Votre pere etait dans la Resistance ?"),
            ("senior", "Il n'en parlait jamais. Ce n'est qu'apres sa mort qu'on a trouve sa carte de resistant. Il avait aide des familles juives a passer en Italie par la montagne. Un homme discret et courageux, mon papa."),
        ],
    },
    # 17 – Daily routine and aging
    {
        "theme_keys": ["Vie quotidienne"],
        "memory_title": "Ma vie aujourd'hui a quatre-vingt-six ans",
        "memory_summary": "Jeanne decrit sa vie quotidienne actuelle : le jardin le matin, le marche le mardi, la lecture l'apres-midi, les visites de Sophie et les appels de Marc.",
        "period": "Annees 2020",
        "people": ["Sophie", "Marc", "Lucas", "Madeleine"],
        "places": ["Nice", "Marche du cours Saleya"],
        "exchanges": [
            ("ai", "Jeanne, racontez-moi une journee typique pour vous maintenant."),
            ("senior", "Je me leve tot, sept heures maximum. Le cafe d'abord, sacre rituel. Ensuite le jardin jusqu'a dix heures, tant qu'il ne fait pas trop chaud. Apres je fais un peu de menage, j'ecoute France Inter."),
            ("ai", "Et l'apres-midi ?"),
            ("senior", "La lecture, toujours. Mon fauteuil pres de la fenetre, un bon livre, un the. Madeleine passe souvent vers quinze heures. Le mardi c'est marche, cours Saleya, comme quand j'etais petite. Les odeurs n'ont pas change."),
            ("ai", "Vous etes bien entouree."),
            ("senior", "Sophie vient le mercredi et le samedi. Lucas passe quand il peut, il est gentil ce petit. Et puis il y a vous maintenant, Memoria. Ca me fait du bien de raconter tout ca. Des fois j'ai l'impression que ces souvenirs vont disparaitre si je ne les dis pas a quelqu'un."),
            ("ai", "C'est exactement pour ca que nous sommes la. Vos souvenirs sont precieux et meritent d'etre preserves."),
            ("senior", "Vous savez, vieillir c'est etrange. Le corps ralentit mais la tete est pleine d'images. Quatre-vingt-six ans de vie, ca fait beaucoup de souvenirs. Je suis contente de pouvoir les partager."),
        ],
    },
]

# ---------------------------------------------------------------------------
# Extra memories (not directly tied to a session but extracted over time)
# ---------------------------------------------------------------------------
EXTRA_MEMORIES = [
    {
        "title": "Le velo rouge de mes huit ans",
        "summary": "Pour ses huit ans, le pere de Jeanne lui a offert un petit velo rouge. Elle a appris a rouler sur la Promenade des Anglais avec Francoise.",
        "period": "Annees 1940",
        "people": ["Papa", "Francoise"],
        "places": ["Nice", "Promenade des Anglais"],
        "theme_keys": ["Enfance"],
    },
    {
        "title": "Pierre et la 2CV bleue",
        "summary": "Pierre possedait une Citroen 2CV bleue surnommee 'Titine'. Ils ont fait des milliers de kilometres ensemble avant de passer a la Fiat 500.",
        "period": "Annees 1960",
        "people": ["Pierre Martin"],
        "places": ["Nice"],
        "theme_keys": ["Famille", "Voyages"],
    },
    {
        "title": "La retraite de Pierre",
        "summary": "Pierre a pris sa retraite en 1998. Ils ont fete ca avec un voyage en Grece, leur dernier grand voyage ensemble.",
        "period": "Annees 1990",
        "people": ["Pierre Martin"],
        "places": ["Grece", "Athenes"],
        "theme_keys": ["Voyages", "Famille"],
    },
    {
        "title": "La confiture de figues",
        "summary": "Chaque septembre, Jeanne prepare de la confiture de figues avec les fruits du figuier plante par Pierre. Elle en distribue des pots a tout le voisinage.",
        "period": "Vie adulte",
        "people": ["Pierre Martin", "Madeleine"],
        "places": ["Nice"],
        "theme_keys": ["Cuisine", "Vie quotidienne"],
    },
    {
        "title": "Le premier jour d'ecole de Sophie",
        "summary": "Sophie a fait sa rentree en 1969 a l'ecole ou enseignait Jeanne. C'etait etrange d'etre a la fois maman et maitresse.",
        "period": "Annees 1960",
        "people": ["Sophie"],
        "places": ["Nice", "Ecole Pasteur"],
        "theme_keys": ["Famille", "Travail"],
    },
    {
        "title": "Noel 2019, le premier sans Pierre",
        "summary": "Le premier Noel sans Pierre a ete difficile. Sophie a convaincu Jeanne de maintenir les traditions. Les treize desserts ont eu un gout amer mais la presence des petits-enfants a rechauffee l'atmosphere.",
        "period": "Annees 2010",
        "people": ["Sophie", "Marc", "Lucas", "Emma"],
        "places": ["Nice"],
        "theme_keys": ["Fetes", "Famille"],
    },
    {
        "title": "Le rosier Pierre Ronsard",
        "summary": "Le rosier prefere de Jeanne est un Pierre Ronsard plante l'annee de la naissance de Lucas. Chaque printemps, ses roses rose pale embaument le jardin.",
        "period": "Annees 1980",
        "people": ["Pierre Martin", "Lucas"],
        "places": ["Nice", "Mon jardin"],
        "theme_keys": ["Passions", "Vie quotidienne"],
    },
    {
        "title": "Le concert de Brassens a Nice",
        "summary": "En 1972, Pierre et Jeanne ont assiste a un concert de Georges Brassens au Theatre de Verdure a Nice. Une soiree magique qui a confirme leur amour pour le chanteur.",
        "period": "Annees 1970",
        "people": ["Pierre Martin"],
        "places": ["Nice", "Theatre de Verdure"],
        "theme_keys": ["Passions"],
    },
    {
        "title": "Les cours du soir de Pierre",
        "summary": "Quand Pierre a commence a l'usine aeronautique, il prenait des cours du soir pour devenir ingenieur. Jeanne corrigeait ses devoirs. Il a obtenu son diplome en 1965.",
        "period": "Annees 1960",
        "people": ["Pierre Martin"],
        "places": ["Nice"],
        "theme_keys": ["Travail", "Famille"],
    },
    {
        "title": "La tempete de 1999",
        "summary": "La tempete de decembre 1999 a abattu le vieux figuier du jardin. Pierre et Jeanne ont pleure. Au printemps suivant, ils en ont plante un nouveau.",
        "period": "Annees 1990",
        "people": ["Pierre Martin"],
        "places": ["Nice", "Mon jardin"],
        "theme_keys": ["Vie quotidienne", "Histoire"],
    },
    {
        "title": "Marc et le rugby",
        "summary": "Marc a joue au rugby a Nice pendant son adolescence. Pierre ne manquait jamais un match. Jeanne fermait les yeux quand son fils etait plaque.",
        "period": "Annees 1980",
        "people": ["Marc", "Pierre Martin"],
        "places": ["Nice"],
        "theme_keys": ["Famille", "Passions"],
    },
    {
        "title": "La fete des voisins",
        "summary": "Chaque annee, Jeanne organise la fete des voisins dans son jardin. Sa pissaladiere est l'attraction principale. Madeleine apporte son limoncello maison.",
        "period": "Vie adulte",
        "people": ["Madeleine"],
        "places": ["Nice"],
        "theme_keys": ["Fetes", "Vie quotidienne"],
    },
]

# ---------------------------------------------------------------------------
# Main seed logic
# ---------------------------------------------------------------------------
def main() -> None:
    print("=" * 60)
    print("  MEMORIA – Demo data seed script")
    print("=" * 60)

    db = SessionLocal()
    try:
        # ------------------------------------------------------------------
        # 1. User: Marie Dupont
        # ------------------------------------------------------------------
        print("\n[1/8] User: Marie Dupont")
        user = db.query(User).filter(User.email == "demo@memoria.fr").first()
        if user:
            p("User already exists – updating password")
            user.hashed_password = hash_password("Memoria2026!")
            user.first_name = "Marie"
            user.last_name = "Dupont"
            user.is_active = True
            user.gdpr_consent = True
            user.gdpr_consent_date = NOW
        else:
            p("Creating new user")
            user = User(
                email="demo@memoria.fr",
                hashed_password=hash_password("Memoria2026!"),
                first_name="Marie",
                last_name="Dupont",
                is_active=True,
                gdpr_consent=True,
                gdpr_consent_date=NOW,
            )
            db.add(user)
        db.flush()
        p(f"User id={user.id}")

        # ------------------------------------------------------------------
        # 2. Senior: Jeanne Martin
        # ------------------------------------------------------------------
        print("\n[2/8] Senior: Jeanne Martin")
        senior = db.query(Senior).filter(
            Senior.first_name == "Jeanne", Senior.last_name == "Martin"
        ).first()

        schedule = json.dumps({"times": ["10:00", "15:00"], "days": [0, 1, 2, 3, 4, 5]})

        if senior:
            p("Senior already exists – updating")
            senior.birth_date = date(1940, 3, 15)
            senior.birth_place = "Nice"
            senior.session_schedule = schedule
        else:
            p("Creating new senior")
            senior = Senior(
                first_name="Jeanne",
                last_name="Martin",
                birth_date=date(1940, 3, 15),
                birth_place="Nice",
                session_schedule=schedule,
            )
            db.add(senior)
        db.flush()
        p(f"Senior id={senior.id}")

        # FamilyMember link
        fm = db.query(FamilyMember).filter(
            FamilyMember.user_id == user.id,
            FamilyMember.senior_id == senior.id,
        ).first()
        if not fm:
            p("Creating family member link")
            fm = FamilyMember(
                user_id=user.id,
                senior_id=senior.id,
                role="family",
                notify_email=True,
                notify_push=True,
            )
            db.add(fm)
            db.flush()
        else:
            p("Family member link already exists")

        # ------------------------------------------------------------------
        # 3. Load themes from DB
        # ------------------------------------------------------------------
        print("\n[3/8] Loading themes")
        themes_db = {t.name: t for t in db.query(Theme).all()}
        if not themes_db:
            p("WARNING: No themes found in DB – creating default themes")
            default_themes = [
                ("Enfance", "Souvenirs d'enfance", "child"),
                ("Adolescence", "Annees d'adolescence", "school"),
                ("Famille", "Famille et proches", "family"),
                ("Travail", "Vie professionnelle", "work"),
                ("Voyages", "Voyages et decouvertes", "travel"),
                ("Passions", "Hobbies et passions", "hobby"),
                ("Cuisine", "Cuisine et recettes", "food"),
                ("Fetes", "Fetes et celebrations", "celebration"),
                ("Histoire", "Evenements historiques", "history"),
                ("Vie quotidienne", "Vie de tous les jours", "daily"),
            ]
            for name, desc, icon in default_themes:
                t = Theme(name=name, description=desc, icon=icon)
                db.add(t)
            db.flush()
            themes_db = {t.name: t for t in db.query(Theme).all()}
        p(f"Loaded {len(themes_db)} themes: {', '.join(sorted(themes_db.keys()))}")

        # ------------------------------------------------------------------
        # Clean existing demo data for idempotency
        # ------------------------------------------------------------------
        print("\n[3b] Cleaning existing demo data for senior")
        # Delete in dependency order
        existing_sessions = db.query(Session).filter(Session.senior_id == senior.id).all()
        session_ids = [s.id for s in existing_sessions]
        if session_ids:
            db.query(Transcription).filter(Transcription.session_id.in_(session_ids)).delete(synchronize_session=False)
            db.query(CognitiveMetric).filter(CognitiveMetric.session_id.in_(session_ids)).delete(synchronize_session=False)
        db.execute(memory_themes.delete().where(
            memory_themes.c.memory_id.in_(
                db.query(Memory.id).filter(Memory.senior_id == senior.id)
            )
        ))
        db.query(Memory).filter(Memory.senior_id == senior.id).delete(synchronize_session=False)
        db.query(Session).filter(Session.senior_id == senior.id).delete(synchronize_session=False)
        db.query(Alert).filter(Alert.senior_id == senior.id).delete(synchronize_session=False)
        db.query(Gazette).filter(Gazette.senior_id == senior.id).delete(synchronize_session=False)
        db.flush()
        p("Cleaned previous demo data")

        # ------------------------------------------------------------------
        # 4. Sessions + Transcriptions + Cognitive Metrics
        # ------------------------------------------------------------------
        print("\n[4/8] Creating sessions, transcriptions & cognitive metrics")
        num_sessions = len(SESSIONS_DATA)  # 18 sessions

        # Spread sessions over 30 days (roughly every 1-2 days)
        session_days = sorted(random.sample(range(0, 30), num_sessions))

        created_sessions = []  # (session_obj, session_data, day_offset)

        for i, (day_offset, sdata) in enumerate(zip(session_days, SESSIONS_DATA)):
            session_date = DAY_ZERO + timedelta(days=day_offset)
            hour = random.choice([10, 15])  # Match the schedule
            start_dt = dt(session_date, hour, random.randint(0, 5))

            num_exchanges = len(sdata["exchanges"])
            duration_sec = random.randint(600, 1200)  # 10-20 min
            end_dt = start_dt + timedelta(seconds=duration_sec)

            session_summary = encrypt_text(
                f"Session sur le theme: {', '.join(sdata['theme_keys'])}. "
                f"{sdata['memory_summary'][:100]}..."
            )

            sess = Session(
                senior_id=senior.id,
                status="completed",
                duration_seconds=duration_sec,
                summary=session_summary,
                started_at=start_dt,
                ended_at=end_dt,
            )
            db.add(sess)
            db.flush()

            # Transcriptions
            for seq, (speaker, text) in enumerate(sdata["exchanges"]):
                latency = None
                if speaker == "senior":
                    # Senior response latency
                    latency = random.uniform(1200, 2800)
                tr = Transcription(
                    session_id=sess.id,
                    speaker=speaker,
                    content_encrypted=encrypt_text(text),
                    sequence_order=seq,
                    latency_ms=latency,
                    timestamp=start_dt + timedelta(seconds=seq * (duration_sec // num_exchanges)),
                )
                db.add(tr)

            # Cognitive metrics – first half healthy, second half slight improvement
            is_first_half = day_offset < 15

            if is_first_half:
                unique_words = random.randint(100, 130)
                ttr = round(random.uniform(0.65, 0.75), 3)
                avg_latency = round(random.uniform(1500, 2200), 1)
                max_latency = round(avg_latency + random.uniform(500, 1500), 1)
                silence_count = random.randint(0, 2)
                evasive = random.randint(0, 1)
                avg_sent_len = round(random.uniform(10, 16), 1)
                named_entities = random.randint(4, 8)
            else:
                # Slight improvement
                unique_words = random.randint(115, 145)
                ttr = round(random.uniform(0.70, 0.80), 3)
                avg_latency = round(random.uniform(1300, 1900), 1)
                max_latency = round(avg_latency + random.uniform(400, 1200), 1)
                silence_count = random.randint(0, 1)
                evasive = 0
                avg_sent_len = round(random.uniform(12, 18), 1)
                named_entities = random.randint(5, 10)

            cm = CognitiveMetric(
                senior_id=senior.id,
                session_id=sess.id,
                unique_words=unique_words,
                type_token_ratio=ttr,
                avg_sentence_length=avg_sent_len,
                named_entities_count=named_entities,
                avg_latency_ms=avg_latency,
                max_latency_ms=max_latency,
                silence_count=silence_count,
                evasive_responses=evasive,
                recorded_at=end_dt,
            )
            db.add(cm)

            created_sessions.append((sess, sdata, day_offset))
            p(f"Session {i+1}/{num_sessions}: day {day_offset}, {num_exchanges} exchanges, {duration_sec}s")

        db.flush()

        # ------------------------------------------------------------------
        # 5. Memories – from sessions + extras
        # ------------------------------------------------------------------
        print("\n[5/8] Creating memories")
        memory_count = 0

        # Memories from sessions
        for sess, sdata, day_offset in created_sessions:
            mem = Memory(
                senior_id=senior.id,
                session_id=sess.id,
                title=sdata["memory_title"],
                summary_encrypted=encrypt_text(sdata["memory_summary"]),
                period=sdata["period"],
                people=json.dumps(sdata["people"]),
                places=json.dumps(sdata["places"]),
                created_at=sess.ended_at + timedelta(minutes=5),
            )
            db.add(mem)
            db.flush()

            # Link to themes
            for tk in sdata["theme_keys"]:
                if tk in themes_db:
                    db.execute(memory_themes.insert().values(
                        memory_id=mem.id, theme_id=themes_db[tk].id
                    ))
            memory_count += 1

        # Extra memories (not tied to a session)
        for edata in EXTRA_MEMORIES:
            # Assign to a random existing session for variety (or None)
            linked_session = random.choice(created_sessions)[0] if random.random() < 0.5 else None

            mem = Memory(
                senior_id=senior.id,
                session_id=linked_session.id if linked_session else None,
                title=edata["title"],
                summary_encrypted=encrypt_text(edata["summary"]),
                period=edata["period"],
                people=json.dumps(edata["people"]),
                places=json.dumps(edata["places"]),
                created_at=dt(
                    DAY_ZERO + timedelta(days=random.randint(0, 29)),
                    random.randint(10, 17),
                ),
            )
            db.add(mem)
            db.flush()

            for tk in edata["theme_keys"]:
                if tk in themes_db:
                    db.execute(memory_themes.insert().values(
                        memory_id=mem.id, theme_id=themes_db[tk].id
                    ))
            memory_count += 1

        p(f"Created {memory_count} memories total")

        # ------------------------------------------------------------------
        # 6. Alerts
        # ------------------------------------------------------------------
        print("\n[6/8] Creating alerts")

        alerts_data = [
            {
                "type": "inactivity",
                "severity": "low",
                "message": "Jeanne n'a pas eu de session depuis 4 jours. Pensez a verifier qu'elle va bien.",
                "details": json.dumps({"last_session_days_ago": 4, "threshold_days": 3}),
                "is_read": True,
                "created_at": NOW - timedelta(days=14),
            },
            {
                "type": "vigilance",
                "severity": "low",
                "message": "Legere augmentation de la latence de reponse detectee lors de la derniere session. Rien d'alarmant pour le moment.",
                "details": json.dumps({"avg_latency_ms": 2150, "previous_avg": 1800, "change_pct": 19.4}),
                "is_read": True,
                "created_at": NOW - timedelta(days=7),
            },
            {
                "type": "vigilance",
                "severity": "medium",
                "message": "Jeanne a donne 2 reponses evasives lors de la session d'aujourd'hui sur le theme de la famille. Cela peut indiquer un sujet sensible ou de la fatigue.",
                "details": json.dumps({"evasive_responses": 2, "session_theme": "Famille", "recommendation": "Observer lors des prochaines sessions"}),
                "is_read": False,
                "created_at": NOW - timedelta(days=2),
            },
        ]

        for adata in alerts_data:
            alert = Alert(
                senior_id=senior.id,
                type=adata["type"],
                severity=adata["severity"],
                message=adata["message"],
                details=adata["details"],
                is_read=adata["is_read"],
                created_at=adata["created_at"],
            )
            db.add(alert)
        db.flush()
        p(f"Created {len(alerts_data)} alerts")

        # ------------------------------------------------------------------
        # 7. Gazettes
        # ------------------------------------------------------------------
        print("\n[7/8] Creating gazettes")

        gazette_data = []
        # 3 gazettes for the last 3 completed weeks
        for week_ago in range(3, 0, -1):
            ws = TODAY - timedelta(days=TODAY.weekday() + 7 * week_ago)  # Monday
            we = ws + timedelta(days=6)  # Sunday
            week_num = ws.isocalendar()[1]
            gazette_data.append({
                "title": f"La Gazette de Jeanne – Semaine {week_num}",
                "pdf_url": f"/gazettes/jeanne-martin/semaine-{week_num}-{ws.year}.pdf",
                "week_start": ws,
                "week_end": we,
                "email_sent": week_ago > 1,  # Most recent one not yet sent
                "created_at": dt(we + timedelta(days=1), 8, 0),  # Generated Monday morning
            })

        for gdata in gazette_data:
            gaz = Gazette(
                senior_id=senior.id,
                title=gdata["title"],
                pdf_url=gdata["pdf_url"],
                week_start=gdata["week_start"],
                week_end=gdata["week_end"],
                email_sent=gdata["email_sent"],
                created_at=gdata["created_at"],
            )
            db.add(gaz)
        db.flush()
        p(f"Created {len(gazette_data)} gazettes")

        # ------------------------------------------------------------------
        # 8. Commit
        # ------------------------------------------------------------------
        print("\n[8/8] Committing to database")
        db.commit()
        p("Done!")

        # ------------------------------------------------------------------
        # Summary
        # ------------------------------------------------------------------
        print("\n" + "=" * 60)
        print("  SEED COMPLETE")
        print("=" * 60)
        print(f"  User:          Marie Dupont (demo@memoria.fr)")
        print(f"  Senior:        Jeanne Martin (id={senior.id})")
        print(f"  Sessions:      {num_sessions}")
        print(f"  Memories:      {memory_count}")
        print(f"  Alerts:        {len(alerts_data)}")
        print(f"  Gazettes:      {len(gazette_data)}")
        print(f"  Themes used:   {len(themes_db)}")
        print(f"  Date range:    {DAY_ZERO} -> {TODAY}")
        print("=" * 60)
        print("\n  Login: demo@memoria.fr / Memoria2026!")
        print()

    except Exception as e:
        db.rollback()
        print(f"\n  ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
