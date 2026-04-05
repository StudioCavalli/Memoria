"""
Dossier de candidature CCI Nice — Espace Rencontre Silver Eco
Mise en forme design Memoria (warm cream/brown palette)
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether, Flowable
)

W, H = A4

# ── Couleurs Memoria (WCAG AA) ──
CREAM = colors.HexColor("#FFF8F0")
WHITE = colors.HexColor("#FFFFFF")
BROWN = colors.HexColor("#7D6340")         # AA-safe text on cream
BROWN_DARK = colors.HexColor("#6B5235")
BROWN_LIGHT = colors.HexColor("#8B6F47")   # decorative
ORANGE = colors.HexColor("#E8A87C")        # decorative/bg
ORANGE_TEXT = colors.HexColor("#9A6429")    # AA-safe orange text
ROSE = colors.HexColor("#D4A5A5")
GREEN = colors.HexColor("#4A7A35")         # AA-safe green text
TEXT_DARK = colors.HexColor("#3D2C1E")
TEXT_MUTED = colors.HexColor("#7A6555")
CREAM_DARK = colors.HexColor("#F5EDE2")


def draw_logo(canvas, x, y, size=28):
    """Draw the Memoria logo (orb + book) at given position."""
    s = size / 48.0
    canvas.saveState()
    canvas.translate(x, y)
    canvas.setStrokeColor(BROWN)
    canvas.setLineWidth(1.5 * s)
    canvas.setFillColor(CREAM)
    canvas.circle(24 * s, 24 * s, 23 * s, fill=1, stroke=1)
    canvas.setFillColor(colors.HexColor("#E8C4A0"))
    canvas.setStrokeColor(colors.transparent)
    canvas.circle(24 * s, 24 * s, 17 * s, fill=1, stroke=0)
    canvas.setStrokeColor(BROWN)
    canvas.setLineWidth(2 * s)
    p = canvas.beginPath()
    p.moveTo(16 * s, (48 - 30) * s)
    p.curveTo(16 * s, (48 - 22) * s, 20 * s, (48 - 18) * s, 24 * s, (48 - 16) * s)
    p.curveTo(28 * s, (48 - 18) * s, 32 * s, (48 - 22) * s, 32 * s, (48 - 30) * s)
    canvas.drawPath(p, fill=0, stroke=1)
    canvas.setLineWidth(1.5 * s)
    canvas.line(24 * s, (48 - 16) * s, 24 * s, (48 - 30) * s)
    canvas.setFillColor(ORANGE)
    canvas.circle(20 * s, (48 - 14) * s, 1.5 * s, fill=1, stroke=0)
    canvas.circle(28 * s, (48 - 13) * s, 1.0 * s, fill=1, stroke=0)
    canvas.circle(24 * s, (48 - 11) * s, 1.2 * s, fill=1, stroke=0)
    canvas.restoreState()


# ── Flowable pour séparateur ──
class ColoredLine(Flowable):
    def __init__(self, width, color=ORANGE, thickness=2):
        Flowable.__init__(self)
        self.width = width
        self.color = color
        self.thickness = thickness

    def wrap(self, aw, ah):
        return (self.width, self.thickness + 4)

    def draw(self):
        self.canv.setStrokeColor(self.color)
        self.canv.setLineWidth(self.thickness)
        self.canv.line(0, 2, self.width, 2)


class SectionBanner(Flowable):
    """Bandeau de section avec fond brun"""
    def __init__(self, text, width):
        Flowable.__init__(self)
        self.text = text
        self.w = width

    def wrap(self, aw, ah):
        return (self.w, 32)

    def draw(self):
        self.canv.setFillColor(BROWN)
        self.canv.roundRect(0, 0, self.w, 28, 6, fill=1, stroke=0)
        self.canv.setFont("Helvetica-Bold", 11)
        self.canv.setFillColor(WHITE)
        self.canv.drawString(14, 8, self.text)


# ── Styles ──
def S():
    styles = {}

    styles['title'] = ParagraphStyle('title', fontName='Helvetica-Bold', fontSize=28,
        textColor=BROWN, alignment=TA_CENTER, leading=34, spaceAfter=4)

    styles['subtitle'] = ParagraphStyle('subtitle', fontName='Helvetica', fontSize=13,
        textColor=TEXT_MUTED, alignment=TA_CENTER, leading=18, spaceAfter=4)

    styles['section'] = ParagraphStyle('section', fontName='Helvetica-Bold', fontSize=12,
        textColor=BROWN, leading=16, spaceBefore=14, spaceAfter=4,
        textTransform='uppercase')

    styles['question'] = ParagraphStyle('question', fontName='Helvetica-Bold', fontSize=9.5,
        textColor=BROWN_DARK, leading=13, spaceBefore=6, spaceAfter=2)

    styles['body'] = ParagraphStyle('body', fontName='Helvetica', fontSize=8.5,
        textColor=TEXT_DARK, leading=12, spaceAfter=2, alignment=TA_JUSTIFY)

    styles['body_bold'] = ParagraphStyle('body_bold', fontName='Helvetica-Bold', fontSize=8.5,
        textColor=TEXT_DARK, leading=12, spaceAfter=1)

    styles['bullet'] = ParagraphStyle('bullet', fontName='Helvetica', fontSize=8.5,
        textColor=TEXT_DARK, leading=11.5, spaceAfter=1, leftIndent=14,
        bulletIndent=0, alignment=TA_JUSTIFY)

    styles['small'] = ParagraphStyle('small', fontName='Helvetica', fontSize=8.5,
        textColor=TEXT_MUTED, leading=12, spaceAfter=2)

    styles['label'] = ParagraphStyle('label', fontName='Helvetica-Bold', fontSize=9,
        textColor=BROWN, leading=12, spaceAfter=1)

    styles['value'] = ParagraphStyle('value', fontName='Helvetica', fontSize=9.5,
        textColor=TEXT_DARK, leading=13, spaceAfter=2)

    styles['footer'] = ParagraphStyle('footer', fontName='Helvetica', fontSize=7.5,
        textColor=BROWN_LIGHT, alignment=TA_CENTER, leading=10)

    styles['sub_heading'] = ParagraphStyle('sub_heading', fontName='Helvetica-Bold', fontSize=8.5,
        textColor=ORANGE, leading=11, spaceBefore=4, spaceAfter=1)

    return styles

ST = S()


# ── Page backgrounds ──
def cover_bg(canvas, doc):
    # Fond crème
    canvas.setFillColor(CREAM)
    canvas.rect(0, 0, W, H, fill=1, stroke=0)
    # Bande brune en haut
    canvas.setFillColor(BROWN)
    canvas.rect(0, H - 8, W, 8, fill=1, stroke=0)
    # Bande orange en bas
    canvas.setFillColor(ORANGE)
    canvas.rect(0, 0, W, 4, fill=1, stroke=0)
    # Logo centered at top
    draw_logo(canvas, W / 2 - 22, H - 80, size=44)

def page_bg(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(CREAM)
    canvas.rect(0, 0, W, H, fill=1, stroke=0)
    # Ligne brune en haut
    canvas.setFillColor(BROWN)
    canvas.rect(0, H - 4, W, 4, fill=1, stroke=0)
    # Ligne orange en bas
    canvas.setFillColor(ORANGE)
    canvas.rect(0, 0, W, 3, fill=1, stroke=0)
    # Footer with logo
    draw_logo(canvas, doc.leftMargin, 6, size=18)
    canvas.setFont("Helvetica-Bold", 7)
    canvas.setFillColor(BROWN)
    canvas.drawString(doc.leftMargin + 24, 14, "Memoria — Foxcase")
    canvas.drawRightString(W - doc.rightMargin, 14, f"Page {doc.page}")
    # Center: website link
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(BROWN)
    canvas.drawCentredString(W / 2, 14, "memoria-dusky.vercel.app")
    canvas.restoreState()


def build():
    doc = SimpleDocTemplate(
        "Dossier-candidature-Memoria-CCI.pdf",
        pagesize=A4,
        topMargin=28 * mm,
        bottomMargin=22 * mm,
        leftMargin=22 * mm,
        rightMargin=22 * mm,
    )

    usable = W - 44 * mm
    story = []

    # ════════════════════════════════════════════
    # PAGE DE GARDE
    # ════════════════════════════════════════════
    story.append(Spacer(1, 60))
    story.append(Paragraph("Dossier de candidature", ST['subtitle']))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Memoria", ST['title']))
    story.append(ColoredLine(80, ORANGE, 3))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Espace Rencontre Silver Eco", ParagraphStyle('es',
        fontName='Helvetica-Bold', fontSize=14, textColor=BROWN_DARK,
        alignment=TA_CENTER, leading=18)))
    story.append(Paragraph("02 juin 2026", ST['subtitle']))
    story.append(Spacer(1, 30))

    # Encadré description
    desc_data = [[Paragraph(
        "<b>Memoria</b> est un système d'IA biographique et préventif pour les seniors de 80 ans et plus. "
        "Un compagnon vocal bienveillant qui recueille les souvenirs de vie de nos aînés, "
        "les transmet à la famille sous forme de Gazette hebdomadaire, "
        "et surveille les premiers signes de déclin cognitif grâce à l'analyse du langage naturel.",
        ParagraphStyle('desc', fontName='Helvetica', fontSize=10, textColor=TEXT_DARK,
                       leading=15, alignment=TA_CENTER))]]
    desc = Table(desc_data, colWidths=[usable - 40])
    desc.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), WHITE),
        ('ROUNDEDCORNERS', [10, 10, 10, 10]),
        ('TOPPADDING', (0, 0), (-1, -1), 16),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 16),
        ('LEFTPADDING', (0, 0), (-1, -1), 20),
        ('RIGHTPADDING', (0, 0), (-1, -1), 20),
    ]))
    story.append(desc)
    story.append(Spacer(1, 30))

    # Tags
    tags = Table(
        [[Paragraph("<b>Intelligence Artificielle</b>", ParagraphStyle('t', fontName='Helvetica-Bold', fontSize=8, textColor=BROWN_DARK, alignment=TA_CENTER)),
          Paragraph("<b>Silver Économie</b>", ParagraphStyle('t', fontName='Helvetica-Bold', fontSize=8, textColor=BROWN_DARK, alignment=TA_CENTER)),
          Paragraph("<b>Santé Préventive</b>", ParagraphStyle('t', fontName='Helvetica-Bold', fontSize=8, textColor=BROWN_DARK, alignment=TA_CENTER))]],
        colWidths=[120, 110, 110],
        rowHeights=[24],
    )
    tags.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), colors.HexColor("#FDE8D0")),
        ('BACKGROUND', (1, 0), (1, 0), colors.HexColor("#D9F0CE")),
        ('BACKGROUND', (2, 0), (2, 0), colors.HexColor("#E8DDD0")),
        ('ROUNDEDCORNERS', [12, 12, 12, 12]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(tags)
    story.append(Spacer(1, 40))

    story.append(Paragraph("Le dossier déposé ne doit pas dépasser 3 pages (hors documents annexes).", ST['small']))
    story.append(Spacer(1, 30))

    # Website link
    story.append(Paragraph(
        '<b><font color="#8B6F47">https://memoria-dusky.vercel.app</font></b>',
        ParagraphStyle('web', fontName='Helvetica-Bold', fontSize=10, textColor=BROWN,
                       alignment=TA_CENTER, leading=14)))
    story.append(Spacer(1, 16))

    # Contact bas de page couverture
    contact_cover = Table([
        [Paragraph("<b>Christopher Cavalli</b>", ParagraphStyle('cc', fontName='Helvetica-Bold', fontSize=9, textColor=BROWN, alignment=TA_CENTER)),
         Paragraph("christopher.cavalli@hotmail.com", ParagraphStyle('cc2', fontName='Helvetica', fontSize=9, textColor=TEXT_MUTED, alignment=TA_CENTER)),
         Paragraph("+33 6 10 44 98 18", ParagraphStyle('cc3', fontName='Helvetica', fontSize=9, textColor=TEXT_MUTED, alignment=TA_CENTER))],
    ], colWidths=[usable / 3] * 3)
    contact_cover.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LINEABOVE', (0, 0), (-1, 0), 1, ORANGE),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(contact_cover)
    story.append(PageBreak())

    # ════════════════════════════════════════════
    # PAGE 1 — VOTRE ACTIVITÉ
    # ════════════════════════════════════════════
    story.append(SectionBanner("VOTRE ACTIVITÉ", usable))
    story.append(Spacer(1, 8))

    # Champs d'identité en tableau
    info_data = [
        [Paragraph("<b>Raison sociale :</b>", ST['label']),
         Paragraph("Christopher Cavalli", ST['value'])],
        [Paragraph("<b>Nom commercial :</b>", ST['label']),
         Paragraph("Foxcase / Memoria", ST['value'])],
        [Paragraph("<b>Cible :</b>", ST['label']),
         Paragraph("B2C (familles de seniors) / B2B (EHPAD, résidences) / B2G (collectivités, ARS)", ST['value'])],
    ]
    info = Table(info_data, colWidths=[90, usable - 100])
    info.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(info)
    story.append(Spacer(1, 4))

    story.append(Paragraph("<b>Description de votre activité :</b>", ST['label']))
    story.append(Paragraph(
        "Memoria est un système d'IA biographique et préventif destiné aux seniors de 80 ans et plus, à domicile ou en établissement. "
        "Le dispositif se compose d'une tablette en mode kiosque (un seul bouton « Parler à Memoria »), d'un moteur d'intelligence artificielle conversationnelle "
        "et d'un dashboard web pour les proches. L'IA pose des questions ouvertes et bienveillantes pour recueillir les souvenirs de vie du senior, "
        "les transcrit, les résume et les classe automatiquement par thème. Chaque semaine, une Gazette PDF narrative est envoyée à la famille. "
        "En parallèle, le module Sentinelle analyse la richesse sémantique et les temps de réponse du senior pour détecter les premiers signes de déclin cognitif "
        "et alerter les proches en cas de chute brutale des indicateurs.",
        ST['body']))

    story.append(Paragraph("<b>Références :</b>", ST['label']))
    story.append(Paragraph("• <b>SchoolSide</b> — Extranet scolaire innovant et assisté par IA, présenté chez Station F", ST['bullet']))
    story.append(Paragraph("• <b>Clayr</b> — Site communautaire entièrement propulsé par IA et gamifié", ST['bullet']))
    story.append(Spacer(1, 4))

    # ── Question 1 : Solution à montrer ──
    story.append(Paragraph("Avez-vous une solution / produit à montrer et faire expérimenter le jour J ? Si oui, merci de détailler", ST['question']))
    story.append(ColoredLine(usable, CREAM_DARK, 1))

    story.append(Paragraph(
        "<b>Oui, absolument.</b> Memoria est un produit fonctionnel, développé et opérationnel, prêt à être expérimenté en conditions réelles le jour de la présentation.",
        ST['body']))

    story.append(Paragraph(
        "<b>Le Totem Memoria</b> — Une tablette intégrée dans un boîtier en bois minimaliste que le jury pourra toucher et manipuler. "
        "L'application est en mode kiosque : un seul bouton « Parler à Memoria ». Le jury pourra lancer une conversation vocale en direct avec l'IA, "
        "lui raconter un souvenir et constater la fluidité du dialogue (réponse en moins de 1,5 seconde). "
        "Interface pensée pour les 80+ : police 28pt minimum, contrastes élevés (WCAG AAA), retour haptique, animation d'écoute en temps réel.",
        ST['body']))

    story.append(Paragraph(
        "<b>Le Dashboard Famille</b> — Sur un écran séparé, consultation en direct des souvenirs extraits et classés par thème, "
        "des alertes Sentinelle, des graphiques d'évolution cognitive (30 jours) et de la Gazette PDF hebdomadaire.",
        ST['body']))

    story.append(Paragraph(
        "<b>Démonstration en 3 temps :</b> (1) le jury parle au Totem, l'IA écoute et répond ; "
        "(2) le souvenir apparaît instantanément dans le dashboard, transcrit et classé ; "
        "(3) présentation du module Sentinelle avec données de démonstration sur 30 jours.",
        ST['body']))

    story.append(Paragraph(
        "<b>Stack technique opérationnelle :</b> Backend Python/FastAPI (16 endpoints API), pipeline vocal en streaming via WebSocket (STT → LLM → TTS), "
        "base PostgreSQL avec chiffrement AES-256, app React Native tablette, dashboard React web. "
        "109 fichiers, 43 issues livrées, documentation API complète.",
        ST['body']))

    # ── Question 2 : Concurrents ──
    story.append(Paragraph("En quoi vous distinguez-vous de vos concurrents ?", ST['question']))
    story.append(ColoredLine(usable, CREAM_DARK, 1))

    story.append(Paragraph(
        "<b>Memoria est le seul produit qui combine biographie IA et détection cognitive préventive dans un même dispositif.</b>",
        ST['body']))

    story.append(Paragraph(
        "Les <b>robots compagnons</b> (Cutii, ElliQ) luttent contre l'isolement mais ne recueillent aucun souvenir et n'ont aucune dimension santé. "
        "Les <b>plateformes de biographie</b> (Entoureo, Famileo) collectent des récits mais nécessitent un intervenant humain et n'intègrent aucun suivi cognitif. "
        "Les <b>outils de suivi cognitif</b> (BrainTest) imposent des tests formels stressants, ponctuels et déconnectés du quotidien.",
        ST['body']))

    story.append(Paragraph(
        "Notre différenciation repose sur <b>trois piliers</b> : (1) l'analyse cognitive est invisible — elle se fait pendant que le senior raconte sa vie, sans stress ; "
        "(2) le senior est acteur et narrateur, pas patient — chaque session produit un souvenir valorisant ; "
        "(3) la famille est informée en temps réel, avec jusqu'à 6 mois d'avance sur un diagnostic clinique formel.",
        ST['body']))
    story.append(PageBreak())

    # ════════════════════════════════════════════
    # PAGE 2 — OBJECTIFS
    # ════════════════════════════════════════════
    story.append(SectionBanner("VOS OBJECTIFS ET BESOINS", usable))
    story.append(Spacer(1, 6))

    story.append(Paragraph("Quels sont vos objectifs à court, moyen et long terme ?", ST['question']))
    story.append(ColoredLine(usable, CREAM_DARK, 1))

    story.append(Paragraph("<font color='#E8A87C'><b>COURT TERME — 0 à 6 mois (juin à décembre 2026)</b></font>", ST['sub_heading']))
    story.append(Paragraph(
        "Pilote avec 20 seniors dans la métropole Nice Côte d'Azur (10 à domicile, 10 en établissement). "
        "Partenariat clinique avec le CHU de Nice pour valider la corrélation entre nos indicateurs et les tests standards (MMS, test de l'horloge). "
        "Recrutement d'un développeur full-stack et d'un chargé de déploiement terrain. "
        "Itérations produit : accents régionaux, voix très âgées, support photos dans la Gazette.",
        ST['body']))

    story.append(Paragraph("<font color='#E8A87C'><b>MOYEN TERME — 6 à 18 mois (2027)</b></font>", ST['sub_heading']))
    story.append(Paragraph(
        "500 abonnés actifs (B2C + B2B) sur la région Sud (Alpes-Maritimes, Var, Bouches-du-Rhône). "
        "Partenariats avec CCAS, CARSAT Sud-Est, AG2R pour la prise en charge financière. "
        "Équipe de 6-8 personnes basée à Nice. "
        "Lancement de <b>Memoria Pro</b> pour les professionnels de santé (rapports cognitifs, intégration DMP). "
        "Publication scientifique en co-rédaction avec notre partenaire clinique.",
        ST['body']))

    story.append(Paragraph("<font color='#E8A87C'><b>LONG TERME — 18 à 36 mois (2028-2029)</b></font>", ST['sub_heading']))
    story.append(Paragraph(
        "Expansion nationale (5 000 seniors équipés). Internationalisation Italie/Espagne. "
        "Nouveaux produits : <b>Memoria Héritage</b> (livre biographique imprimé), <b>Memoria Lien</b> (podcast familial privé), "
        "<b>API Sentinelle</b> (brique technologique pour éditeurs santé). "
        "Équipe de 15-20 personnes avec pôle R&D IA. "
        "Positionnement de Nice comme hub IA × Silver Économie.",
        ST['body']))

    story.append(Spacer(1, 6))
    story.append(Paragraph("Quels sont vos besoins ?", ST['question']))
    story.append(ColoredLine(usable, CREAM_DARK, 1))

    story.append(Paragraph(
        "Nous sommes une équipe de techniciens — développeurs et chef de projet. Le produit fonctionne. "
        "Pour le transformer en entreprise viable, nous avons besoin d'aide sur tout ce qui n'est pas du code.",
        ST['body']))

    story.append(Paragraph(
        "<b>1. Financement :</b> 40 000 – 60 000 € sur 12 mois (infra cloud ~1 500 €/mois, 20 tablettes + Totem, fonctionnement). Pas de salaire versé."
        " <b>2. Apprentis (besoin critique) :</b> 2-3 apprentis rentrée 2026 — commercial/business dev pour EHPAD/mutuelles/CCAS ; "
        "communication/marketing digital ; designer UX (optionnel). Aide CCI pour écoles et dispositifs d'embauche."
        " <b>3. Structuration :</b> choix statut juridique, expert-comptable, dispositifs fiscaux (JEI, CIR/CII)."
        " <b>4. Réseautage :</b> accès EHPAD/résidences du territoire, collectivités (CCAS, ARS PACA, Département 06), mutuelles (CARSAT, AG2R), French Tech Côte d'Azur."
        " <b>5. Mentorat :</b> mentor Silver Économie ou commercial B2B/B2G santé.",
        ST['body']))

    story.append(Spacer(1, 8))
    story.append(SectionBanner("VOTRE CONTACT", usable))
    story.append(Spacer(1, 6))

    contact_data = [
        [Paragraph("<b>Nom :</b> Christopher Cavalli", ST['value']),
         Paragraph("<b>Email :</b> christopher.cavalli@hotmail.com", ST['value']),
         Paragraph("<b>Tél :</b> +33 6 10 44 98 18", ST['value'])],
    ]
    ct = Table(contact_data, colWidths=[usable / 3] * 3)
    ct.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BACKGROUND', (0, 0), (-1, -1), WHITE),
        ('ROUNDEDCORNERS', [8, 8, 8, 8]),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(ct)

    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "<b>Documents complémentaires :</b> Extrait KBIS — Pitch deck PDF — Site web : memoria-dusky.vercel.app",
        ST['body']))

    story.append(Spacer(1, 12))

    deadline = Table([[Paragraph(
        "Dossier à retourner avant le <b>27 avril 2026</b> à <b><font color='#8B6F47'>clara.achache@cote-azur.cci.fr</font></b>",
        ParagraphStyle('dl', fontName='Helvetica', fontSize=9, textColor=TEXT_DARK,
                       leading=13, alignment=TA_CENTER))]], colWidths=[usable - 40])
    deadline.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), WHITE),
        ('ROUNDEDCORNERS', [8, 8, 8, 8]),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('LEFTPADDING', (0, 0), (-1, -1), 16),
        ('RIGHTPADDING', (0, 0), (-1, -1), 16),
        ('BOX', (0, 0), (-1, -1), 1, ORANGE),
    ]))
    story.append(deadline)

    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "<b>Contact CCI :</b> Clara ACHACHE — clara.achache@cote-azur.cci.fr — 06 20 61 24 14",
        ST['small']))

    # ── Build ──
    doc.build(story, onFirstPage=cover_bg, onLaterPages=page_bg)
    print("✓ Dossier généré : Dossier-candidature-Memoria-CCI.pdf")


if __name__ == "__main__":
    build()
