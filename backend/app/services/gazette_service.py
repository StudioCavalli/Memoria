"""
Gazette Generator: weekly PDF compilation of memories, sent by email to family.
"""
from __future__ import annotations

import io
from datetime import date, datetime, timedelta, timezone

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    Flowable,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.encryption import decrypt_text
from app.models.gazette import Gazette
from app.models.memory import Memory
from app.models.senior import Senior
from app.models.session import Session as ConvSession


# Custom colors for the gazette
WARM_BROWN = colors.HexColor("#8B6F47")
CREAM = colors.HexColor("#FFF8F0")
SOFT_ORANGE = colors.HexColor("#E8A87C")
DUSTY_ROSE = colors.HexColor("#D4A5A5")
FOREST_GREEN = colors.HexColor("#7FB069")


class GazetteGeneratorService:
    def __init__(self, db: Session):
        self.db = db

    def generate_for_all_seniors(self) -> list[Gazette]:
        """Weekly job: generate gazettes for all active seniors."""
        seniors = self.db.query(Senior).all()
        gazettes = []
        for senior in seniors:
            gazette = self.generate_for_senior(senior.id)
            if gazette:
                gazettes.append(gazette)
        return gazettes

    def generate_for_senior(self, senior_id: int) -> Gazette | None:
        """Generate a weekly gazette PDF for one senior."""
        today = date.today()
        week_start = today - timedelta(days=today.weekday() + 7)  # Last Monday
        week_end = week_start + timedelta(days=6)  # Last Sunday

        # Get memories from last week
        memories = (
            self.db.query(Memory)
            .filter(
                Memory.senior_id == senior_id,
                Memory.created_at >= datetime.combine(week_start, datetime.min.time()).replace(tzinfo=timezone.utc),
                Memory.created_at <= datetime.combine(week_end, datetime.max.time()).replace(tzinfo=timezone.utc),
            )
            .order_by(Memory.created_at)
            .all()
        )

        if not memories:
            return None

        senior = self.db.query(Senior).filter(Senior.id == senior_id).first()
        if not senior:
            return None

        # Get session count
        sessions = (
            self.db.query(ConvSession)
            .filter(
                ConvSession.senior_id == senior_id,
                ConvSession.started_at >= datetime.combine(week_start, datetime.min.time()).replace(tzinfo=timezone.utc),
                ConvSession.status == "completed",
            )
            .all()
        )

        # Generate narrative text with LLM
        narrative = self._generate_narrative(senior, memories)

        # Build PDF
        title = f"La Gazette de {senior.first_name} — Semaine du {week_start.strftime('%d %B')}"
        pdf_bytes = self._build_pdf(title, senior, memories, sessions, narrative, week_start, week_end)

        # Store PDF
        pdf_url = self._store_pdf(senior_id, week_start, pdf_bytes)

        # Save gazette record
        gazette = Gazette(
            senior_id=senior_id,
            title=title,
            pdf_url=pdf_url,
            week_start=week_start,
            week_end=week_end,
        )
        self.db.add(gazette)
        self.db.commit()
        self.db.refresh(gazette)

        # Send email
        self._send_gazette_email(senior, gazette, pdf_bytes)

        return gazette

    def _generate_narrative(self, senior: Senior, memories: list[Memory]) -> str:
        """Use LLM to write a warm narrative from the week's memories."""
        if not settings.anthropic_api_key:
            return self._fallback_narrative(senior, memories)

        import anthropic

        memory_texts = []
        for m in memories:
            summary = decrypt_text(m.summary_encrypted)
            memory_texts.append(f"- {m.title} ({m.period or ''}): {summary}")

        prompt = f"""Ecris un court texte narratif chaleureux (3-5 paragraphes) compilant les souvenirs
de la semaine de {senior.first_name}. Ecris a la troisieme personne, avec un ton bienveillant
comme dans un journal intime familial. Ne commence pas par "Cette semaine".

Souvenirs de la semaine :
{chr(10).join(memory_texts)}
"""

        client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=800,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text

    def _fallback_narrative(self, senior: Senior, memories: list[Memory]) -> str:
        summaries = [decrypt_text(m.summary_encrypted) for m in memories[:5]]
        return " ".join(summaries)

    def _build_pdf(
        self,
        title: str,
        senior: Senior,
        memories: list[Memory],
        sessions: list,
        narrative: str,
        week_start: date,
        week_end: date,
    ) -> bytes:
        """Build a warm, elegant PDF gazette."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            topMargin=2 * cm,
            bottomMargin=2 * cm,
            leftMargin=2.5 * cm,
            rightMargin=2.5 * cm,
        )

        styles = getSampleStyleSheet()

        # Custom styles
        title_style = ParagraphStyle(
            "GazetteTitle",
            parent=styles["Title"],
            fontSize=24,
            textColor=WARM_BROWN,
            spaceAfter=6 * mm,
            alignment=1,  # center
        )
        subtitle_style = ParagraphStyle(
            "GazetteSubtitle",
            parent=styles["Normal"],
            fontSize=12,
            textColor=SOFT_ORANGE,
            alignment=1,
            spaceAfter=10 * mm,
        )
        heading_style = ParagraphStyle(
            "GazetteHeading",
            parent=styles["Heading2"],
            fontSize=16,
            textColor=WARM_BROWN,
            spaceBefore=8 * mm,
            spaceAfter=4 * mm,
        )
        body_style = ParagraphStyle(
            "GazetteBody",
            parent=styles["Normal"],
            fontSize=11,
            leading=16,
            textColor=colors.HexColor("#333333"),
            spaceAfter=4 * mm,
        )
        memory_title_style = ParagraphStyle(
            "MemoryTitle",
            parent=styles["Normal"],
            fontSize=12,
            textColor=FOREST_GREEN,
            fontName="Helvetica-Bold",
            spaceBefore=4 * mm,
        )
        memory_body_style = ParagraphStyle(
            "MemoryBody",
            parent=styles["Normal"],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#555555"),
            leftIndent=10 * mm,
            spaceAfter=3 * mm,
        )
        footer_style = ParagraphStyle(
            "Footer",
            parent=styles["Normal"],
            fontSize=9,
            textColor=colors.HexColor("#999999"),
            alignment=1,
            spaceBefore=15 * mm,
        )

        elements = []

        # Header
        elements.append(Paragraph(title, title_style))
        elements.append(Paragraph(
            f"Du {week_start.strftime('%d/%m/%Y')} au {week_end.strftime('%d/%m/%Y')} "
            f"— {len(sessions)} session(s) — {len(memories)} souvenir(s)",
            subtitle_style,
        ))
        elements.append(Spacer(1, 5 * mm))

        # Narrative
        elements.append(Paragraph("Le recit de la semaine", heading_style))
        for para in narrative.split("\n"):
            if para.strip():
                elements.append(Paragraph(para.strip(), body_style))

        # Individual memories
        elements.append(Paragraph("Les souvenirs en detail", heading_style))
        for m in memories:
            themes_str = ", ".join(t.name for t in m.themes) if m.themes else ""
            period_str = f" ({m.period})" if m.period else ""
            elements.append(Paragraph(
                f"{m.title}{period_str}",
                memory_title_style,
            ))
            summary = decrypt_text(m.summary_encrypted)
            elements.append(Paragraph(summary, memory_body_style))
            if themes_str:
                elements.append(Paragraph(
                    f"<i>Themes : {themes_str}</i>",
                    ParagraphStyle("ThemeTags", parent=memory_body_style, fontSize=9, textColor=DUSTY_ROSE),
                ))

        # Footer
        elements.append(Paragraph(
            "Genere avec amour par Memoria — Systeme d'IA Biographique",
            footer_style,
        ))

        doc.build(elements)
        return buffer.getvalue()

    def _store_pdf(self, senior_id: int, week_start: date, pdf_bytes: bytes) -> str:
        """Store PDF to S3/MinIO and return the URL."""
        from app.services.storage_service import StorageService

        storage = StorageService()
        key = f"gazettes/{senior_id}/{week_start.isoformat()}.pdf"
        url = storage.upload(key, pdf_bytes, content_type="application/pdf")
        return url

    def _send_gazette_email(self, senior: Senior, gazette: Gazette, pdf_bytes: bytes):
        """Send the gazette PDF by email to all family members."""
        import asyncio
        from app.services.notification_service import notification_manager

        subject = gazette.title
        body = f"""
        <h2>{gazette.title}</h2>
        <p>Decouvrez les souvenirs partages par {senior.first_name} cette semaine.</p>
        <p>La Gazette est en piece jointe de cet email.</p>
        <p>Avec tendresse,<br>L'equipe Memoria</p>
        """

        try:
            loop = asyncio.get_event_loop()
            loop.run_until_complete(
                notification_manager.send_email_alert(senior.id, subject, body)
            )
        except RuntimeError:
            asyncio.run(
                notification_manager.send_email_alert(senior.id, subject, body)
            )

        # Mark as sent
        gazette.email_sent = True
        self.db.commit()
