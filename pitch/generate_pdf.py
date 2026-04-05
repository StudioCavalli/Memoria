"""
MEMORIA Pitch Deck PDF Generator
Design: Warm cream/brown palette matching the product UI
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Flowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.graphics.shapes import Drawing, Rect, Circle, Line, String, Polygon
from reportlab.graphics import renderPDF

W, H = landscape(A4)

# ── Colors ──
CREAM = colors.HexColor("#FFF8F0")
WHITE = colors.HexColor("#FFFFFF")
BROWN = colors.HexColor("#8B6F47")
BROWN_DARK = colors.HexColor("#6B5235")
BROWN_LIGHT = colors.HexColor("#A8956F")
ORANGE = colors.HexColor("#E8A87C")
ROSE = colors.HexColor("#D4A5A5")
GREEN = colors.HexColor("#7FB069")
TEXT_DARK = colors.HexColor("#3D2C1E")
TEXT_MUTED = colors.HexColor("#7A6555")
GREEN_BG = colors.HexColor("#F0F7EC")
ORANGE_BG = colors.HexColor("#FDE8D0")
ROSE_BG = colors.HexColor("#F5E0E0")
BROWN_BG = colors.HexColor("#E8DDD0")
SHADOW_COLOR = colors.HexColor("#E0D6C8")


# ── Styles ──
def make_styles():
    s = {}
    s['title'] = ParagraphStyle('title', fontName='Helvetica-Bold', fontSize=32,
                                 textColor=BROWN, alignment=TA_CENTER, leading=38, spaceAfter=8)
    s['h1'] = ParagraphStyle('h1', fontName='Helvetica-Bold', fontSize=28,
                              textColor=BROWN, leading=34, spaceAfter=12)
    s['h1c'] = ParagraphStyle('h1c', fontName='Helvetica-Bold', fontSize=28,
                               textColor=BROWN, leading=34, spaceAfter=12, alignment=TA_CENTER)
    s['h2'] = ParagraphStyle('h2', fontName='Helvetica-Bold', fontSize=20,
                              textColor=BROWN_DARK, leading=26, spaceAfter=8)
    s['h2c'] = ParagraphStyle('h2c', fontName='Helvetica-Bold', fontSize=20,
                               textColor=BROWN_DARK, leading=26, spaceAfter=8, alignment=TA_CENTER)
    s['h3'] = ParagraphStyle('h3', fontName='Helvetica-Bold', fontSize=15,
                              textColor=BROWN, leading=20, spaceAfter=6)
    s['body'] = ParagraphStyle('body', fontName='Helvetica', fontSize=13,
                                textColor=TEXT_DARK, leading=19, spaceAfter=6)
    s['bodyc'] = ParagraphStyle('bodyc', fontName='Helvetica', fontSize=13,
                                 textColor=TEXT_DARK, leading=19, spaceAfter=6, alignment=TA_CENTER)
    s['small'] = ParagraphStyle('small', fontName='Helvetica', fontSize=11,
                                 textColor=TEXT_MUTED, leading=15, spaceAfter=4)
    s['smallc'] = ParagraphStyle('smallc', fontName='Helvetica', fontSize=11,
                                  textColor=TEXT_MUTED, leading=15, spaceAfter=4, alignment=TA_CENTER)
    s['subtitle'] = ParagraphStyle('subtitle', fontName='Helvetica', fontSize=17,
                                    textColor=TEXT_MUTED, alignment=TA_CENTER, leading=22, spaceAfter=16)
    s['tag'] = ParagraphStyle('tag', fontName='Helvetica-Bold', fontSize=10,
                               textColor=BROWN, alignment=TA_CENTER, leading=14)
    s['big'] = ParagraphStyle('big', fontName='Helvetica-Bold', fontSize=42,
                               textColor=BROWN, alignment=TA_CENTER, leading=48)
    s['bigg'] = ParagraphStyle('bigg', fontName='Helvetica-Bold', fontSize=42,
                                textColor=GREEN, alignment=TA_CENTER, leading=48)
    s['bigo'] = ParagraphStyle('bigo', fontName='Helvetica-Bold', fontSize=42,
                                textColor=ORANGE, alignment=TA_CENTER, leading=48)
    s['bigr'] = ParagraphStyle('bigr', fontName='Helvetica-Bold', fontSize=42,
                                textColor=ROSE, alignment=TA_CENTER, leading=48)
    s['label'] = ParagraphStyle('label', fontName='Helvetica-Bold', fontSize=9,
                                 textColor=TEXT_MUTED, alignment=TA_CENTER, leading=12,
                                 spaceAfter=4)
    s['bullet'] = ParagraphStyle('bullet', fontName='Helvetica', fontSize=12,
                                  textColor=TEXT_DARK, leading=18, spaceAfter=4,
                                  leftIndent=16, bulletIndent=0, bulletFontSize=12,
                                  bulletColor=ORANGE)
    s['white_title'] = ParagraphStyle('wt', fontName='Helvetica-Bold', fontSize=36,
                                       textColor=WHITE, alignment=TA_CENTER, leading=42)
    s['white_sub'] = ParagraphStyle('ws', fontName='Helvetica', fontSize=17,
                                     textColor=colors.HexColor("#E8DDD0"), alignment=TA_CENTER, leading=24)
    s['white_body'] = ParagraphStyle('wb', fontName='Helvetica', fontSize=13,
                                      textColor=WHITE, alignment=TA_CENTER, leading=19)
    s['quote'] = ParagraphStyle('quote', fontName='Helvetica-Oblique', fontSize=16,
                                 textColor=BROWN, alignment=TA_CENTER, leading=24, spaceAfter=8)
    s['price'] = ParagraphStyle('price', fontName='Helvetica-Bold', fontSize=32,
                                 textColor=GREEN, alignment=TA_CENTER, leading=38)
    return s

ST = make_styles()


# ── Custom Flowables ──
class ColoredBackground(Flowable):
    """Full page background color"""
    def __init__(self, color, width=W, height=H):
        Flowable.__init__(self)
        self.color = color
        self.w = width
        self.h = height

    def draw(self):
        self.canv.setFillColor(self.color)
        self.canv.rect(-80, -self.h + 100, self.w + 100, self.h + 100, fill=1, stroke=0)


class DividerLine(Flowable):
    def __init__(self, width=80, color=ORANGE, centered=True):
        Flowable.__init__(self)
        self.line_width = width
        self.color = color
        self.centered = centered
    def draw(self):
        self.canv.setStrokeColor(self.color)
        self.canv.setFillColor(self.color)
        x = 0
        self.canv.roundRect(x, 0, self.line_width, 4, 2, fill=1, stroke=0)
    def wrap(self, aw, ah):
        return (self.line_width, 8)


class StatBox(Flowable):
    """Number + label stat card with shadow"""
    def __init__(self, number, label, color=BROWN, w=200, h=90):
        Flowable.__init__(self)
        self.number = number
        self.label = label
        self.color = color
        self.w = w
        self.h = h

    def wrap(self, aw, ah):
        return (self.w, self.h + 4)

    def draw(self):
        # Shadow (drawn first, offset down-right)
        self.canv.setFillColor(SHADOW_COLOR)
        self.canv.roundRect(3, -3, self.w, self.h, 10, fill=1, stroke=0)
        # Main card
        self.canv.setFillColor(WHITE)
        self.canv.roundRect(0, 0, self.w, self.h, 10, fill=1, stroke=0)
        # Number
        self.canv.setFont("Helvetica-Bold", 36)
        self.canv.setFillColor(self.color)
        self.canv.drawCentredString(self.w / 2, self.h - 48, self.number)
        # Label
        self.canv.setFont("Helvetica-Bold", 8)
        self.canv.setFillColor(TEXT_MUTED)
        # Wrap long labels
        words = self.label.upper().split()
        line = ""
        y = 18
        for word in words:
            if len(line + " " + word) > 30:
                self.canv.drawCentredString(self.w / 2, y, line.strip())
                y -= 11
                line = word
            else:
                line += " " + word
        self.canv.drawCentredString(self.w / 2, y, line.strip())


def page_bg(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(CREAM)
    canvas.rect(0, 0, W, H, fill=1, stroke=0)
    # Slide number
    canvas.setFont("Helvetica", 9)
    canvas.setFillColor(BROWN_LIGHT)
    canvas.drawRightString(W - 30, 20, f"{doc.page}")
    canvas.restoreState()


def page_bg_dark(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(BROWN_DARK)
    canvas.rect(0, 0, W, H, fill=1, stroke=0)
    canvas.restoreState()


# ── Build document ──
def build():
    doc = SimpleDocTemplate(
        "MEMORIA_Pitch_CCI_Nice.pdf",
        pagesize=landscape(A4),
        topMargin=40, bottomMargin=40,
        leftMargin=60, rightMargin=60,
    )

    story = []
    usable_w = W - 120  # margins

    # ════════════════════ SLIDE 1: COVER ════════════════════
    story.append(Spacer(1, 50))
    story.append(Paragraph("Candidature AMI \u2014 CCI Nice C\u00f4te d\u2019Azur", ST['smallc']))
    story.append(Spacer(1, 20))
    story.append(Paragraph("Memoria", ST['title']))
    story.append(DividerLine(80))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "L\u2019IA qui recueille les souvenirs de nos a\u00een\u00e9s<br/>et veille sur leur sant\u00e9 cognitive",
        ST['subtitle']
    ))
    story.append(Spacer(1, 24))
    tags = Table(
        [[Paragraph("Intelligence Artificielle", ST['tag']),
          Paragraph("Silver \u00c9conomie", ST['tag']),
          Paragraph("Sant\u00e9 Pr\u00e9ventive", ST['tag'])]],
        colWidths=[180, 150, 150],
        rowHeights=[28],
    )
    tags.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), ORANGE_BG),
        ('BACKGROUND', (1, 0), (1, 0), GREEN_BG),
        ('BACKGROUND', (2, 0), (2, 0), BROWN_BG),
        ('ROUNDEDCORNERS', [14, 14, 14, 14]),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
    ]))
    story.append(tags)
    story.append(Spacer(1, 40))
    story.append(Paragraph("Foxcase \u2014 Nice, 2026", ST['smallc']))
    story.append(PageBreak())

    # ════════════════════ SLIDE 2: LE CONSTAT ════════════════════
    story.append(Spacer(1, 16))
    story.append(Paragraph("LE CONSTAT", ST['smallc']))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "Chaque jour, des histoires<br/>disparaissent <font color='#E8A87C'>\u00e0 jamais</font>",
        ST['h1c']
    ))
    story.append(DividerLine(80))
    story.append(Spacer(1, 20))

    stats_data = [
        [StatBox("2,2M", "Seniors 80+ isol\u00e9s en France", BROWN, 210, 85),
         StatBox("1,2M", "Personnes avec troubles cognitifs", ROSE, 210, 85),
         StatBox("300K", "Nouveaux cas chaque ann\u00e9e", GREEN, 210, 85)],
    ]
    stats = Table(stats_data, colWidths=[220, 220, 220])
    stats.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ]))
    story.append(stats)
    story.append(Spacer(1, 20))
    story.append(Paragraph(
        "<b>Le paradoxe :</b> nos grands-parents sont les derniers t\u00e9moins d\u2019une \u00e9poque, "
        "mais personne ne prend le temps de recueillir leurs histoires. "
        "Quand ils disparaissent, c\u2019est une biblioth\u00e8que qui br\u00fble.",
        ST['bodyc']
    ))
    story.append(PageBreak())

    # ════════════════════ SLIDE 3: LA SOLUTION ════════════════════
    story.append(Spacer(1, 16))
    story.append(Paragraph("LA SOLUTION", ST['smallc']))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "Memoria, le biographe IA<br/>qui prend soin de nos a\u00een\u00e9s",
        ST['h1c']
    ))
    story.append(DividerLine(80))
    story.append(Spacer(1, 16))

    sol_data = [
        [Paragraph("<font color='#E8A87C'><b>&#x2776;</b></font> <b>Un compagnon vocal bienveillant</b> qui converse avec le senior pour recueillir ses souvenirs de vie", ST['body']),
         Paragraph("<font color='#7FB069'><b>&#x2777;</b></font> <b>Un journal de vie automatique</b> qui organise, enrichit et transmet les r\u00e9cits aux proches", ST['body']),
         Paragraph("<font color='#D4A5A5'><b>&#x2778;</b></font> <b>Une sentinelle cognitive</b> qui d\u00e9tecte les premiers signes de d\u00e9clin et alerte la famille", ST['body'])],
    ]
    sol = Table(sol_data, colWidths=[usable_w / 3] * 3)
    sol.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BACKGROUND', (0, 0), (0, 0), WHITE),
        ('BACKGROUND', (1, 0), (1, 0), WHITE),
        ('BACKGROUND', (2, 0), (2, 0), WHITE),
        ('ROUNDEDCORNERS', [10, 10, 10, 10]),
        ('TOPPADDING', (0, 0), (-1, -1), 16),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 16),
        ('LEFTPADDING', (0, 0), (-1, -1), 14),
        ('RIGHTPADDING', (0, 0), (-1, -1), 14),
    ]))
    story.append(sol)
    story.append(Spacer(1, 16))
    story.append(Paragraph(
        "<b><font color='#7FB069'>2 missions en 1 :</font></b> "
        "Pr\u00e9server la m\u00e9moire familiale <b>ET</b> pr\u00e9venir les troubles cognitifs",
        ST['bodyc']
    ))
    story.append(Spacer(1, 12))
    story.append(Paragraph(
        "Latence de r\u00e9ponse <b>&lt; 1,5 seconde</b> \u2014 Pour un senior, une IA lente est une IA cass\u00e9e.",
        ST['bodyc']
    ))
    story.append(PageBreak())

    # ════════════════════ SLIDE 4: COMMENT \u00c7A MARCHE ════════════════════
    story.append(Spacer(1, 16))
    story.append(Paragraph("COMMENT \u00c7A MARCHE", ST['smallc']))
    story.append(Spacer(1, 8))
    story.append(Paragraph("3 \u00e9tapes, <font color='#E8A87C'>z\u00e9ro friction</font>", ST['h1c']))
    story.append(DividerLine(80))
    story.append(Spacer(1, 16))

    steps = [
        ["<b><font color='#8B6F47' size='18'>1</font></b>",
         "<b>Le senior parle</b><br/>Un seul bouton sur la tablette. Memoria pose des questions ouvertes et bienveillantes. Le senior raconte, \u00e0 son rythme. Aucun menu, aucune complexit\u00e9."],
        ["<b><font color='#8B6F47' size='18'>2</font></b>",
         "<b>L\u2019IA pr\u00e9serve</b><br/>Chaque r\u00e9cit est transcrit, r\u00e9sum\u00e9 et class\u00e9 par th\u00e8me (Enfance, Famille, Travail, Voyages\u2026). 100+ questions biographiques intelligentes."],
        ["<b><font color='#8B6F47' size='18'>3</font></b>",
         "<b>La famille re\u00e7oit</b><br/>Chaque semaine, une <b>Gazette PDF</b> avec les souvenirs. Un dashboard avec alertes cognitives. Des souvenirs pr\u00e9serv\u00e9s pour toujours."],
    ]
    for step in steps:
        t = Table([[Paragraph(step[0], ST['bodyc']), Paragraph(step[1], ST['body'])]],
                  colWidths=[50, usable_w - 60])
        t.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BACKGROUND', (0, 0), (-1, -1), WHITE),
            ('ROUNDEDCORNERS', [10, 10, 10, 10]),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('LEFTPADDING', (0, 0), (-1, -1), 14),
            ('RIGHTPADDING', (0, 0), (-1, -1), 14),
        ]))
        story.append(t)
        story.append(Spacer(1, 8))
    story.append(PageBreak())

    # ════════════════════ SLIDE 5: SENTINELLE ════════════════════
    story.append(Spacer(1, 16))
    story.append(Paragraph("INNOVATION SANT\u00c9", ST['smallc']))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "Le Module Sentinelle :<br/>d\u00e9tecter avant qu\u2019il ne soit <font color='#D4A5A5'>trop tard</font>",
        ST['h1c']
    ))
    story.append(DividerLine(80))
    story.append(Spacer(1, 16))

    sentinel_items = [
        ("<b>Richesse s\u00e9mantique</b>", "Nombre de mots uniques, complexit\u00e9 des phrases, diversit\u00e9 du vocabulaire \u2014 mesur\u00e9es \u00e0 chaque session."),
        ("<b>Temps de r\u00e9ponse</b>", "Latence entre la question et la r\u00e9ponse. Une augmentation progressive peut signaler un trouble cognitif."),
        ("<b>Alertes intelligentes</b>", "Chute de &gt;20% du vocabulaire ou +30% de latence sur 7 jours = alerte Vigilance envoy\u00e9e aux proches."),
        ("<b>Score de vitalit\u00e9</b>", "Un score synth\u00e9tique 0-100 r\u00e9sume l\u2019\u00e9tat cognitif. Graphiques d\u2019\u00e9volution sur 30 jours dans le dashboard."),
    ]
    for title, desc in sentinel_items:
        t = Table([[Paragraph(f"<font color='#E8A87C'>&#x25CF;</font> {title}", ST['body']),
                    Paragraph(desc, ST['small'])]],
                  colWidths=[200, usable_w - 210])
        t.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BACKGROUND', (0, 0), (-1, -1), WHITE),
            ('ROUNDEDCORNERS', [8, 8, 8, 8]),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ]))
        story.append(t)
        story.append(Spacer(1, 6))
    story.append(PageBreak())

    # ════════════════════ SLIDE 6: TECHNOLOGIE ════════════════════
    story.append(Spacer(1, 16))
    story.append(Paragraph("TECHNOLOGIE", ST['smallc']))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Architecture pens\u00e9e pour la <font color='#E8A87C'>fiabilit\u00e9</font>", ST['h1c']))
    story.append(DividerLine(80))
    story.append(Spacer(1, 16))

    tech_items = [
        [Paragraph("<b>LLM Claude / GPT-4o</b><br/><font size='10'>Conversations empathiques et extraction de souvenirs</font>", ST['body']),
         Paragraph("<b>Whisper / Azure STT</b><br/><font size='10'>Reconnaissance vocale optimis\u00e9e pour les voix \u00e2g\u00e9es</font>", ST['body'])],
        [Paragraph("<b>ElevenLabs / Azure TTS</b><br/><font size='10'>Voix naturelle et chaleureuse, non robotique</font>", ST['body']),
         Paragraph("<b>Analyse NLP (spaCy)</b><br/><font size='10'>M\u00e9triques cognitives pour d\u00e9tection de d\u00e9clin</font>", ST['body'])],
    ]
    tech = Table(tech_items, colWidths=[usable_w / 2] * 2)
    tech.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BACKGROUND', (0, 0), (-1, -1), WHITE),
        ('ROUNDEDCORNERS', [10, 10, 10, 10]),
        ('TOPPADDING', (0, 0), (-1, -1), 14),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 14),
        ('LEFTPADDING', (0, 0), (-1, -1), 14),
        ('RIGHTPADDING', (0, 0), (-1, -1), 14),
        ('GRID', (0, 0), (-1, -1), 1, CREAM),
    ]))
    story.append(tech)
    story.append(Spacer(1, 16))

    sec_items = [
        "<b>Chiffrement AES-256</b> de toutes les transcriptions en base de donn\u00e9es",
        "Conformit\u00e9 <b>RGPD</b> compl\u00e8te : export, suppression, consentement",
        "H\u00e9bergement <b>HDS</b> (H\u00e9bergeur de Donn\u00e9es de Sant\u00e9) pr\u00e9vu",
        "Authentification <b>JWT</b> + tokens s\u00e9curis\u00e9s + rate limiting",
    ]
    for item in sec_items:
        story.append(Paragraph(f"<font color='#7FB069'>&#x2713;</font>  {item}", ST['body']))
    story.append(PageBreak())

    # ════════════════════ SLIDE 7: MARCH\u00c9 ════════════════════
    story.append(Spacer(1, 16))
    story.append(Paragraph("LE MARCH\u00c9", ST['smallc']))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        "La Silver \u00c9conomie :<br/>un march\u00e9 de <font color='#7FB069'>130 milliards</font> en France",
        ST['h1c']
    ))
    story.append(DividerLine(80))
    story.append(Spacer(1, 20))

    market_stats = [
        [StatBox("130 Mds", "March\u00e9 Silver \u00c9conomie France", GREEN, 210, 85),
         StatBox("4,8M", "Personnes de 80+ ans en France", BROWN, 210, 85),
         StatBox("+50%", "Croissance des 80+ d\u2019ici 2040", ORANGE, 210, 85)],
    ]
    ms = Table(market_stats, colWidths=[220, 220, 220])
    ms.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('ALIGN', (0, 0), (-1, -1), 'CENTER')]))
    story.append(ms)
    story.append(Spacer(1, 20))

    targets = Table([
        [Paragraph("<b>B2C</b> Familles avec un a\u00een\u00e9 \u00e0 domicile", ST['bodyc']),
         Paragraph("<b>B2B</b> EHPAD, r\u00e9sidences seniors, mutuelles", ST['bodyc']),
         Paragraph("<b>B2G</b> D\u00e9partements, ARS, CCAS", ST['bodyc'])],
    ], colWidths=[usable_w / 3] * 3)
    targets.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BACKGROUND', (0, 0), (-1, -1), WHITE),
        ('ROUNDEDCORNERS', [10, 10, 10, 10]),
        ('TOPPADDING', (0, 0), (-1, -1), 14),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 14),
    ]))
    story.append(targets)
    story.append(Spacer(1, 12))
    story.append(Paragraph(
        "<b>Avantage concurrentiel :</b> aucun concurrent ne combine biographie IA et d\u00e9tection cognitive. "
        "Les solutions existantes font l\u2019un ou l\u2019autre, jamais les deux.",
        ST['bodyc']
    ))
    story.append(PageBreak())

    # ════════════════════ SLIDE 8: MOD\u00c8LE \u00c9CONOMIQUE ════════════════════
    story.append(Spacer(1, 16))
    story.append(Paragraph("MOD\u00c8LE \u00c9CONOMIQUE", ST['smallc']))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Un abonnement accessible, un impact <font color='#E8A87C'>mesurable</font>", ST['h1c']))
    story.append(DividerLine(80))
    story.append(Spacer(1, 16))

    pricing = Table([
        [Paragraph("<b><font color='#E8A87C'>FAMILLE</font></b><br/><br/>"
                   "<font size='28' color='#7FB069'><b>29,90</b></font><font size='12' color='#7A6555'> /mois</font><br/>"
                   "<font size='10' color='#7A6555'>par senior</font><br/><br/>"
                   "<font size='10'>&#x2022; Tablette pr\u00e9-configur\u00e9e<br/>"
                   "&#x2022; Sessions illimit\u00e9es<br/>"
                   "&#x2022; Dashboard famille<br/>"
                   "&#x2022; Gazette hebdomadaire<br/>"
                   "&#x2022; Alertes Sentinelle</font>", ST['bodyc']),
         Paragraph("<b><font color='#7FB069'>EHPAD / R\u00c9SIDENCE</font></b><br/><br/>"
                   "<font size='28' color='#7FB069'><b>19,90</b></font><font size='12' color='#7A6555'> /mois</font><br/>"
                   "<font size='10' color='#7A6555'>par r\u00e9sident (min. 10)</font><br/><br/>"
                   "<font size='10'>&#x2022; D\u00e9ploiement multi-r\u00e9sidents<br/>"
                   "&#x2022; Dashboard \u00e9quipe soignante<br/>"
                   "&#x2022; Rapports cognitifs m\u00e9decin<br/>"
                   "&#x2022; Int\u00e9gration dossier patient<br/>"
                   "&#x2022; Support et formation</font>", ST['bodyc']),
         Paragraph("<b><font color='#E8A87C'>PROJECTIONS 18 MOIS</font></b><br/><br/>"
                   "<font size='28' color='#8B6F47'><b>500</b></font><br/>"
                   "<font size='10' color='#7A6555'>abonn\u00e9s</font><br/><br/>"
                   "<font size='28' color='#8B6F47'><b>180K</b></font><br/>"
                   "<font size='10' color='#7A6555'>ARR</font><br/><br/>"
                   "<font size='28' color='#8B6F47'><b>85%</b></font><br/>"
                   "<font size='10' color='#7A6555'>marge brute</font>", ST['bodyc']),
        ],
    ], colWidths=[usable_w / 3] * 3)
    pricing.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BACKGROUND', (0, 0), (-1, -1), WHITE),
        ('ROUNDEDCORNERS', [10, 10, 10, 10]),
        ('TOPPADDING', (0, 0), (-1, -1), 20),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 20),
        ('LEFTPADDING', (0, 0), (-1, -1), 16),
        ('RIGHTPADDING', (0, 0), (-1, -1), 16),
        ('LINEAFTER', (0, 0), (1, -1), 1, CREAM),
    ]))
    story.append(pricing)
    story.append(PageBreak())

    # ════════════════════ SLIDE 9: ROADMAP ════════════════════
    story.append(Spacer(1, 16))
    story.append(Paragraph("ROADMAP", ST['smallc']))
    story.append(Spacer(1, 8))
    story.append(Paragraph("8 semaines jusqu\u2019\u00e0 la <font color='#E8A87C'>d\u00e9mo</font>", ST['h1c']))
    story.append(DividerLine(80))
    story.append(Spacer(1, 20))

    weeks = [
        ("S1-2", "Infrastructure\n& Moteur IA", "#7FB069"),
        ("S3-4", "Logique Narrative\n& Sentinelle", "#7FB069"),
        ("S5", "Interfaces\nSenior & Famille", "#E8A87C"),
        ("S6", "Design\n& Bo\u00eetier", "#8B6F47"),
        ("S7", "Tests\nSeniors Nice", "#8B6F47"),
        ("S8", "D\u00e9mo\nSalon 2 juin", "#8B6F47"),
    ]
    week_cells = []
    for label, desc, color in weeks:
        week_cells.append(Paragraph(
            f"<font color='{color}' size='16'><b>{label}</b></font><br/>"
            f"<font size='9' color='#7A6555'>{desc}</font>",
            ST['bodyc']
        ))

    road = Table([week_cells], colWidths=[usable_w / 6] * 6)
    road.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BACKGROUND', (0, 0), (-1, -1), WHITE),
        ('ROUNDEDCORNERS', [10, 10, 10, 10]),
        ('TOPPADDING', (0, 0), (-1, -1), 16),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 16),
        ('GRID', (0, 0), (-1, -1), 1, CREAM),
    ]))
    story.append(road)
    story.append(Spacer(1, 20))
    story.append(Paragraph(
        "<font color='#7FB069'><b>4 milestones d\u00e9j\u00e0 livr\u00e9s</b></font> \u2014 "
        "109 fichiers, 65 fichiers Python, 21 composants React, 43 issues ferm\u00e9es. "
        "Le produit <b>existe d\u00e9j\u00e0</b>.",
        ST['bodyc']
    ))
    story.append(PageBreak())

    # ════════════════════ SLIDE 10: IMPACT ════════════════════
    story.append(Spacer(1, 40))
    story.append(Paragraph("IMPACT", ST['smallc']))
    story.append(Spacer(1, 12))
    story.append(Paragraph(
        "Chaque souvenir pr\u00e9serv\u00e9 est un cadeau<br/>pour les g\u00e9n\u00e9rations futures",
        ST['h2c']
    ))
    story.append(DividerLine(80))
    story.append(Spacer(1, 24))
    story.append(Paragraph(
        "<i>\u00abMamie m\u2019a racont\u00e9 comment elle a rencontr\u00e9 papy "
        "\u00e0 un bal en 1958 \u00e0 Nice. Je n\u2019aurais jamais connu cette histoire "
        "sans Memoria. Maintenant, mes enfants la connaissent aussi.\u00bb</i>",
        ST['quote']
    ))
    story.append(Spacer(1, 8))
    story.append(Paragraph("\u2014 Sc\u00e9nario utilisateur type", ST['smallc']))
    story.append(Spacer(1, 28))

    impact_stats = [
        [StatBox("+40%", "Bien-\u00eatre senior (\u00e9tudes r\u00e9miniscence)", GREEN, 200, 85),
         StatBox("6 mois", "D\u00e9tection pr\u00e9coce avant diagnostic", BROWN, 200, 85),
         StatBox("Pour\ntoujours", "Souvenirs pr\u00e9serv\u00e9s pour les g\u00e9n\u00e9rations", ORANGE, 200, 85)],
    ]
    ist = Table(impact_stats, colWidths=[210, 210, 210])
    ist.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP'), ('ALIGN', (0, 0), (-1, -1), 'CENTER')]))
    story.append(ist)
    story.append(PageBreak())

    # ════════════════════ SLIDE 11: DEMANDE ════════════════════
    story.append(Spacer(1, 16))
    story.append(Paragraph("NOTRE DEMANDE", ST['smallc']))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Ce que nous recherchons aupr\u00e8s de la CCI", ST['h1c']))
    story.append(DividerLine(80))
    story.append(Spacer(1, 16))

    asks = [
        ("<b>Financement</b>", "Phase de test et d\u00e9ploiement pilote dans la r\u00e9gion ni\u00e7oise"),
        ("<b>Accompagnement</b>", "Acc\u00e8s aux EHPAD et r\u00e9sidences seniors partenaires de la CCI"),
        ("<b>R\u00e9seau sant\u00e9</b>", "Professionnels de sant\u00e9 pour valider le module Sentinelle"),
        ("<b>Visibilit\u00e9</b>", "Mise en relation avec les d\u00e9cideurs de la Silver \u00c9conomie"),
    ]
    for title, desc in asks:
        t = Table([[Paragraph(f"<font color='#E8A87C'>&#x25B6;</font> {title}", ST['body']),
                    Paragraph(desc, ST['body'])]],
                  colWidths=[220, usable_w - 230])
        t.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BACKGROUND', (0, 0), (-1, -1), WHITE),
            ('ROUNDEDCORNERS', [10, 10, 10, 10]),
            ('TOPPADDING', (0, 0), (-1, -1), 14),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 14),
            ('LEFTPADDING', (0, 0), (-1, -1), 16),
            ('RIGHTPADDING', (0, 0), (-1, -1), 16),
        ]))
        story.append(t)
        story.append(Spacer(1, 8))
    story.append(PageBreak())

    # ════════════════════ SLIDE 12: CTA ════════════════════
    story.append(Spacer(1, 100))
    story.append(Paragraph("Memoria", ST['title']))
    story.append(DividerLine(80))
    story.append(Spacer(1, 16))
    story.append(Paragraph(
        "Donnons une voix \u00e0 ceux qui ont tant \u00e0 raconter.<br/>Avant qu\u2019il ne soit trop tard.",
        ST['h2c']
    ))
    story.append(Spacer(1, 40))
    story.append(Paragraph("<b>Demander une d\u00e9mo</b>  |  christopher.cavalli@hotmail.com", ST['bodyc']))
    story.append(Spacer(1, 20))
    story.append(Paragraph("Foxcase \u2014 Nice C\u00f4te d\u2019Azur \u2014 2026", ST['smallc']))

    # ── Build ──
    doc.build(story, onFirstPage=page_bg, onLaterPages=page_bg)
    print("PDF g\u00e9n\u00e9r\u00e9 : MEMORIA_Pitch_CCI_Nice.pdf")


if __name__ == "__main__":
    build()
