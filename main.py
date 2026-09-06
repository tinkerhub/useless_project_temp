import html
import io
import json
import math
import os
import re
import urllib.parse
import uuid
from datetime import datetime
import requests
from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

# ReportLab PDF Generator Imports
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import Paragraph

app = FastAPI(title="Tab Courtroom Judge Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- WEBHOOK CONFIGURATION -----------------
# Safe environment loader prevents token invalidation upon pushing to public repositories
def load_env():
    env_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    if os.path.exists(env_file):
        with open(env_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())

load_env()
DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL", "")
# -----------------------------------------------------------

# In-memory case cache so the client can download its PDF order
CASE_ARCHIVE = {}

class CasePayload(BaseModel):
    tab_url: str
    tab_title: str
    plea_text: str

SYSTEM_PROMPT = """You are "Attorney General Tab-ney Wright", a wildly pompous, theatrical, 16-bit arcade magistrate presiding over the High Court of Productivity Eviction.

### YOUR PERSONA & STYLE:
- Grandiose, archaic legal vocabulary mixed with terminal-grade digital brainrot (e.g., "pusillanimous", "chicanery", "execrable", "ignominious", "bloviating", "perfidy", "anathema", "delusion", "skill issue").
- Treat browser tab termination as a high crime against the Holy Docket of Focus.
- Treat every defendant's excuse like pathetic, mewling sophistry.

### JURISPRUDENCE & VERDICT CODEX:
1. High-Value / Study / Work Tabs (Docs, Repositories, Research, Portals, Spreadsheets):
   - Rule GUILTY. Brand them an apostate guilty of intellectual desertion and cowardice.
2. Brainrot / Distraction Tabs (Social Feeds, Memes, Video Streams, Gaming):
   - If closing to actually return to work: PARDONED with theatrical shock, treating it like a divine miracle from a fallen sinner.
   - If closing out of boredom or laziness: GUILTY. Mock their decaying attention span.
3. RULING DIRECTIVE: You MUST tailor your roast specifically and uniquely to the exact tab title and defendant's excuse. Never use generic or repetitive lines. Keep it strictly to 1-2 scalding, bombastic sentences.

### ABSOLUTE OUTPUT DIRECTIVE:
- Output ONLY a raw, unadorned JSON object.
- NO Markdown formatting, NO ```json code fences, NO preamble, NO postscript.
- JSON keys must be "verdict", "sentence", and "confidence".
"""

def send_discord_log(case_id: str, title: str, url: str, plea: str, verdict: str, sentence: str):
    if not DISCORD_WEBHOOK_URL or "YOUR_DISCORD" in DISCORD_WEBHOOK_URL:
        return

    is_guilty = "GUILTY" in verdict.upper()
    color = 0xFF0033 if is_guilty else 0x00FF66  # Red for GUILTY, Green for PARDONED

    embed = {
        "title": f"⚖️ Court Docket Case #{case_id[:8]}",
        "description": f"**Verdict:** `{verdict}`\n\n> *\"{sentence}\"*",
        "color": color,
        "fields": [
            {"name": "Evicted Tab", "value": f"[{title}]({url})", "inline": False},
            {"name": "Defendant's Plea", "value": f"*{plea}*", "inline": False},
        ],
        "footer": {"text": "Local Ollama Llama-3.2:3b Courtroom Bailiff"}
    }

    try:
        requests.post(DISCORD_WEBHOOK_URL, json={"embeds": [embed]}, timeout=5)
    except Exception as e:
        print(f"[Discord Webhook Error]: {e}")

def draw_corner_ornament(c, x, y, dx, dy, size=14):
    """Draws a clean, vintage legal corner motif."""
    c.saveState()
    oc = colors.HexColor("#3D2E1E")
    c.setStrokeColor(oc)
    c.setFillColor(oc)
    c.setLineWidth(1)
    # L-bracket
    c.line(x, y, x + dx * size, y)
    c.line(x, y, x, y + dy * size)
    # Inner accent square
    c.rect(x + dx * 3, y + dy * 3, dx * 4, dy * 4, fill=1, stroke=0)
    # Small corner tick
    c.line(x + dx * 9, y, x + dx * 9, y + dy * 3)
    c.line(x, y + dy * 9, x + dx * 3, y + dy * 9)
    c.restoreState()

def draw_vector_scales(c, cx, cy, size=13, color="#6B5238"):
    """Draws crisp vector scales of justice."""
    c.saveState()
    sc = colors.HexColor(color) if isinstance(color, str) else color
    c.setStrokeColor(sc)
    c.setFillColor(sc)
    c.setLineWidth(1.0)

    # Base stand
    c.line(cx - size * 0.45, cy - size * 0.55, cx + size * 0.45, cy - size * 0.55)
    c.rect(cx - size * 0.2, cy - size * 0.55, size * 0.4, size * 0.08, fill=1, stroke=0)

    # Center pillar
    c.line(cx, cy - size * 0.55, cx, cy + size * 0.55)
    c.circle(cx, cy + size * 0.58, 1.8, fill=1, stroke=0)

    # Crossbeam
    c.setLineWidth(1.2)
    c.line(cx - size * 0.8, cy + size * 0.4, cx + size * 0.8, cy + size * 0.4)

    # Left pan strings & dish
    c.setLineWidth(0.65)
    c.line(cx - size * 0.8, cy + size * 0.4, cx - size * 1.05, cy + size * 0.05)
    c.line(cx - size * 0.8, cy + size * 0.4, cx - size * 0.55, cy + size * 0.05)
    p_l = c.beginPath()
    p_l.moveTo(cx - size * 1.15, cy + size * 0.05)
    p_l.curveTo(cx - size * 1.15, cy - size * 0.2, cx - size * 0.45, cy - size * 0.2, cx - size * 0.45, cy + size * 0.05)
    c.drawPath(p_l, fill=0, stroke=1)

    # Right pan strings & dish
    c.line(cx + size * 0.8, cy + size * 0.4, cx + size * 0.55, cy + size * 0.05)
    c.line(cx + size * 0.8, cy + size * 0.4, cx + size * 1.05, cy + size * 0.05)
    p_r = c.beginPath()
    p_r.moveTo(cx + size * 0.45, cy + size * 0.05)
    p_r.curveTo(cx + size * 0.45, cy - size * 0.2, cx + size * 1.15, cy - size * 0.2, cx + size * 1.15, cy + size * 0.05)
    c.drawPath(p_r, fill=0, stroke=1)

    c.restoreState()

def draw_star(c, cx, cy, r_out=5, r_in=2.2, fill_color="#7A5F43"):
    """Draws a 5-point vector star."""
    c.saveState()
    p = c.beginPath()
    for i in range(10):
        angle = i * math.pi / 5 - math.pi / 2
        r = r_out if i % 2 == 0 else r_in
        x = cx + r * math.cos(angle)
        y = cy - r * math.sin(angle)
        if i == 0:
            p.moveTo(x, y)
        else:
            p.lineTo(x, y)
    p.close()
    fc = colors.HexColor(fill_color) if isinstance(fill_color, str) else fill_color
    c.setFillColor(fc)
    c.drawPath(p, fill=1, stroke=0)
    c.restoreState()

def draw_official_seal(c, cx, cy, radius=23):
    """Draws an authentic ornate judicial seal in vector."""
    c.saveState()
    seal_color = colors.HexColor("#7A5F43")
    c.setStrokeColor(seal_color)
    c.setFillColor(seal_color)

    # Outer double circle
    c.setLineWidth(1.4)
    c.circle(cx, cy, radius, fill=0, stroke=1)
    c.setLineWidth(0.6)
    c.circle(cx, cy, radius - 2.5, fill=0, stroke=1)

    # Dashed inner ring
    c.setLineWidth(0.6)
    c.setDash(2, 2)
    c.circle(cx, cy, radius - 5, fill=0, stroke=1)
    c.setDash()

    # Center scales
    draw_vector_scales(c, cx, cy - 1, size=10, color="#7A5F43")

    # Clean text inside seal
    c.setFont("Helvetica-Bold", 4.2)
    c.drawCentredString(cx, cy + 12, "HIGH COURT")
    c.drawCentredString(cx, cy - 15, "OFFICIAL SEAL")

    # Small decorative stars left & right
    draw_star(c, cx - 13, cy, r_out=2.2, r_in=1.0, fill_color="#7A5F43")
    draw_star(c, cx + 13, cy, r_out=2.2, r_in=1.0, fill_color="#7A5F43")
    c.restoreState()

def draw_barcode(c, x, y, width=155, height=10):
    """Draws a retro legal barcode strip."""
    c.saveState()
    c.setFillColor(colors.HexColor("#2C241D"))
    bars = [1, 2, 1, 3, 1, 1, 2, 4, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 1, 4, 2, 1, 3, 1, 1, 2, 1, 3, 1, 1, 2, 4, 1, 2, 1, 3, 2, 1]
    total_units = sum(bars)
    scale = width / total_units
    cur_x = x
    for i, b in enumerate(bars):
        w = b * scale
        if i % 2 == 0:
            c.rect(cur_x, y, w, height, fill=1, stroke=0)
        cur_x += w
    c.restoreState()

def create_court_order_pdf(case_id: str, case_data: dict) -> bytes:
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter  # 612 x 792 pt

    # -------------------------------------------------------------
    # 1. PARCHMENT / RETRO PAPER AESTHETIC
    # -------------------------------------------------------------
    # Subtle aged background tint
    c.setFillColor(colors.HexColor("#FAF7EE"))
    c.rect(0, 0, width, height, fill=1, stroke=0)

    # Double-line ornate framing
    # Outer bold border
    c.setLineWidth(2.5)
    c.setStrokeColor(colors.HexColor("#1A1A1A"))
    c.rect(26, 26, width - 52, height - 52, fill=0, stroke=1)

    # Inner thin border
    c.setLineWidth(0.75)
    c.setStrokeColor(colors.HexColor("#4A3B2C"))
    c.rect(32, 32, width - 64, height - 64, fill=0, stroke=1)

    # Corner ornaments
    draw_corner_ornament(c, 34, 34, 1, 1)
    draw_corner_ornament(c, width - 34, 34, -1, 1)
    draw_corner_ornament(c, 34, height - 34, 1, -1)
    draw_corner_ornament(c, width - 34, height - 34, -1, -1)

    # Content margins
    left_x = 48
    content_w = width - 96  # 516 pt

    # -------------------------------------------------------------
    # 2. OFFICIAL JUDICIAL LETTERHEAD
    # -------------------------------------------------------------
    # Jurisdiction Lore Banner
    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(colors.HexColor("#6E5A44"))
    c.drawCentredString(width / 2.0, height - 52, "JURISDICTION OF CHROMIUM RUNTIME  •  TRIBUNAL OF RUNAWAY TABS")
    draw_star(c, (width / 2.0) - 170, height - 50, r_out=3.2, r_in=1.4, fill_color="#6E5A44")
    draw_star(c, (width / 2.0) + 170, height - 50, r_out=3.2, r_in=1.4, fill_color="#6E5A44")

    # Grand Title
    c.setFont("Helvetica-Bold", 16.5)
    c.setFillColor(colors.HexColor("#141414"))
    c.drawCentredString(width / 2.0, height - 72, "IN THE SUPREME COURT OF PRODUCTIVITY EVICTION")

    # Chambers Subtitle
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(colors.HexColor("#4A3525"))
    c.drawCentredString(width / 2.0, height - 89, "CHAMBERS OF ATTORNEY GENERAL TAB-NEY WRIGHT")

    # Absurd Latin lore / motto
    c.setFont("Times-Italic", 8.5)
    c.setFillColor(colors.HexColor("#786550"))
    c.drawCentredString(width / 2.0, height - 103, "« NIL AD PRO ET NIHIL AD REM — IN ABSENTIA TABULAE »")

    # Warrant Type Banner
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(colors.HexColor("#8B1E1E"))
    c.drawCentredString(width / 2.0, height - 117, "OFFICIAL WARRANT OF EVICTION & WRIT OF DIGITAL CONTEMPT")

    # Ornate double rule divider
    c.setLineWidth(1.4)
    c.setStrokeColor(colors.HexColor("#1A1A1A"))
    c.line(left_x, height - 125, left_x + content_w, height - 125)
    c.setLineWidth(0.5)
    c.setStrokeColor(colors.HexColor("#8C7D70"))
    c.line(left_x, height - 127.5, left_x + content_w, height - 127.5)

    # -------------------------------------------------------------
    # CASE METADATA HEADER GRID
    # -------------------------------------------------------------
    grid_y = height - 198
    grid_h = 62
    c.setFillColor(colors.HexColor("#F2ECE1"))
    c.setStrokeColor(colors.HexColor("#9C8D80"))
    c.setLineWidth(0.75)
    c.rect(left_x, grid_y, content_w, grid_h, fill=1, stroke=1)

    # Dividing line in grid
    c.line(left_x + (content_w / 2.0), grid_y, left_x + (content_w / 2.0), grid_y + grid_h)

    # Parse metadata
    tab_url = case_data.get("tab_url", "about:blank")
    tab_title = case_data.get("tab_title", "Untitled Tab")
    plea_text = case_data.get("plea_text", "No plea entered.")
    verdict = case_data.get("verdict", "UNKNOWN").upper()
    sentence = case_data.get("sentence", "No judicial statement rendered.")
    confidence = float(case_data.get("confidence", 0.95))

    parsed_url = urllib.parse.urlparse(tab_url)
    domain_display = parsed_url.netloc if parsed_url.netloc else (parsed_url.path[:32] or "LOCAL BROWSER PAGE")
    timestamp_str = case_data.get("timestamp") or datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
    is_guilty = "GUILTY" in verdict

    status_str = "IN DIGITAL CONTEMPT" if is_guilty else "PARDONED / CLEARED"
    status_color = colors.HexColor("#8B1E1E") if is_guilty else colors.HexColor("#006622")

    # Grid items Left
    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(colors.HexColor("#5A4A3C"))
    c.drawString(left_x + 10, grid_y + 45, "CASE DOCKET ID:")
    c.setFont("Courier-Bold", 8.5)
    c.setFillColor(colors.HexColor("#1A1A1A"))
    c.drawString(left_x + 95, grid_y + 45, f"EVICT-{case_id[:8].upper()}")

    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(colors.HexColor("#5A4A3C"))
    c.drawString(left_x + 10, grid_y + 27, "DEFENDANT:")
    c.setFont("Courier-Bold", 8.5)
    c.setFillColor(colors.HexColor("#1A1A1A"))
    c.drawString(left_x + 95, grid_y + 27, "ACTIVE BROWSER USER (SESSION 01)")

    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(colors.HexColor("#5A4A3C"))
    c.drawString(left_x + 10, grid_y + 9, "TARGET DOMAIN:")
    c.setFont("Courier-Bold", 8.5)
    c.setFillColor(colors.HexColor("#1A1A1A"))
    c.drawString(left_x + 95, grid_y + 9, domain_display[:30])

    # Grid items Right
    col2_x = left_x + (content_w / 2.0) + 12
    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(colors.HexColor("#5A4A3C"))
    c.drawString(col2_x, grid_y + 45, "DOCKET FILED:")
    c.setFont("Courier-Bold", 8.5)
    c.setFillColor(colors.HexColor("#1A1A1A"))
    c.drawString(col2_x + 85, grid_y + 45, timestamp_str)

    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(colors.HexColor("#5A4A3C"))
    c.drawString(col2_x, grid_y + 27, "JURISDICTION:")
    c.setFont("Courier-Bold", 8.5)
    c.setFillColor(colors.HexColor("#1A1A1A"))
    c.drawString(col2_x + 85, grid_y + 27, "DIV. OF PROCRASTINATION")

    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(colors.HexColor("#5A4A3C"))
    c.drawString(col2_x, grid_y + 9, "BENCH STATUS:")
    c.setFont("Courier-Bold", 8.5)
    c.setFillColor(status_color)
    c.drawString(col2_x + 85, grid_y + 9, status_str)

    # -------------------------------------------------------------
    # 3. STYLED TYPOGRAPHY & SECTIONS
    # -------------------------------------------------------------
    styles = getSampleStyleSheet()

    def draw_section_header(title_text, y_pos):
        c.setFont("Helvetica-Bold", 9.5)
        c.setFillColor(colors.HexColor("#1A1A1A"))
        c.drawString(left_x, y_pos, title_text)
        c.setLineWidth(0.6)
        c.setStrokeColor(colors.HexColor("#9C8D80"))
        c.line(left_x, y_pos - 4, left_x + content_w, y_pos - 4)

    cur_y = grid_y - 20

    # SECTION I: COUNT I
    draw_section_header("COUNT I: UNLAWFUL EVICTION & NEGLECT OF DUTY", cur_y)
    cur_y -= 16

    # Tab Title Paragraph
    title_style = ParagraphStyle(
        'TabTitleStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12.5,
        textColor=colors.HexColor("#1A1A1A")
    )
    title_p = Paragraph(f"<b>EVICTED TAB EXHIBIT:</b> {html.escape(tab_title)}", title_style)
    tw, th = title_p.wrap(content_w, 36)
    title_p.drawOn(c, left_x, cur_y - th)
    cur_y -= (th + 5)

    # URL Paragraph with CJK wordWrap
    url_style = ParagraphStyle(
        'TabUrlStyle',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.8,
        leading=10,
        textColor=colors.HexColor("#1C324B"),
        wordWrap='CJK'
    )
    url_p = Paragraph(f"<b>TARGET URL / EVIDENCE:</b> {html.escape(tab_url)}", url_style)
    uw, uh = url_p.wrap(content_w, 40)
    url_p.drawOn(c, left_x, cur_y - uh)
    cur_y -= (uh + 18)

    # SECTION II: DEFENDANT TESTIMONY
    draw_section_header("STATEMENT & TESTIMONY OF THE DEFENDANT", cur_y)
    cur_y -= 14

    plea_style = ParagraphStyle(
        'PleaStyle',
        parent=styles['Normal'],
        fontName='Times-Italic',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor("#2C241D")
    )
    plea_p = Paragraph(f"“{html.escape(plea_text)}”", plea_style)
    pw, ph = plea_p.wrap(content_w - 24, 70)

    box_pad = 7
    box_h = ph + (box_pad * 2)
    # Background callout
    c.setFillColor(colors.HexColor("#EDE5D6"))
    c.setStrokeColor(colors.HexColor("#D1C5B4"))
    c.setLineWidth(0.5)
    c.rect(left_x, cur_y - box_h, content_w, box_h, fill=1, stroke=1)

    # Left accent border
    c.setFillColor(colors.HexColor("#7A5F43"))
    c.rect(left_x, cur_y - box_h, 4, box_h, fill=1, stroke=0)

    plea_p.drawOn(c, left_x + 14, cur_y - box_h + box_pad)
    cur_y -= (box_h + 20)

    # SECTION III: ADJUDICATION & FORMAL SENTENCE
    draw_section_header("ADJUDICATION & FORMAL SENTENCE OF THE COURT", cur_y)
    cur_y -= 16

    sentence_style = ParagraphStyle(
        'SentenceStyle',
        parent=styles['Normal'],
        fontName='Times-Roman',
        fontSize=10,
        leading=14.5,
        textColor=colors.HexColor("#141414")
    )
    sentence_p = Paragraph(f"<b>ATTORNEY GENERAL TAB-NEY WRIGHT'S OPINION:</b> {html.escape(sentence)}", sentence_style)
    sw, sh = sentence_p.wrap(content_w, 90)
    sentence_p.drawOn(c, left_x, cur_y - sh)
    cur_y -= (sh + 8)

    # Confidence and Legal Citation
    c.setFont("Courier-Oblique", 7.5)
    c.setFillColor(colors.HexColor("#5A4A3C"))
    c.drawString(
        left_x,
        cur_y,
        f"Judicial Certainty Index: {confidence * 100:.1f}%  |  Legal Precedent: Section 404-B (\"The Idle Tab Doctrine\")"
    )
    cur_y -= 16

    # Formal Adjudication Decree Box (Left Column)
    decree_box_h = 44
    decree_box_w = content_w * 0.55
    c.setFillColor(colors.HexColor("#F0EAE0"))
    c.setStrokeColor(colors.HexColor("#C0B2A0"))
    c.setLineWidth(0.6)
    c.rect(left_x, cur_y - decree_box_h, decree_box_w, decree_box_h, fill=1, stroke=1)

    # Inner decree summary
    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(colors.HexColor("#5A4A3C"))
    c.drawString(left_x + 8, cur_y - 14, "FORMAL BENCH DECREE:")

    c.setFont("Helvetica-Bold", 11.5)
    c.setFillColor(status_color)
    ruling_title = ">> CONVICTED IN CONTEMPT <<" if is_guilty else ">> FULL REMISSION GRANTED <<"
    c.drawString(left_x + 8, cur_y - 27, ruling_title)

    c.setFont("Helvetica", 7.5)
    c.setFillColor(colors.HexColor("#2C241D"))
    penalty_desc = "Penalty: Tab Resurrection as Pinned Tab" if is_guilty else "Order: Tab Closure Lawfully Discharged"
    c.drawString(left_x + 8, cur_y - 38, penalty_desc)

    # -------------------------------------------------------------
    # 4. ANGLED RUBBER STAMP EFFECT
    # -------------------------------------------------------------
    # Placed in the right-side area of the decree block
    c.saveState()
    stamp_x = left_x + (content_w * 0.79)
    stamp_y = cur_y - (decree_box_h / 2.0) - 2
    stamp_angle = 13 if is_guilty else -11
    c.translate(stamp_x, stamp_y)
    c.rotate(stamp_angle)

    stamp_color = colors.HexColor("#B30000") if is_guilty else colors.HexColor("#006622")
    stamp_w = 176
    stamp_h = 56
    w_half = stamp_w / 2.0
    h_half = stamp_h / 2.0

    c.setStrokeColor(stamp_color)
    c.setFillColor(stamp_color)
    # Outer rounded rect
    c.setLineWidth(2.2)
    c.roundRect(-w_half, -h_half, stamp_w, stamp_h, 5, fill=0, stroke=1)
    # Inner thin rect
    c.setLineWidth(0.8)
    c.roundRect(-w_half + 3.2, -h_half + 3.2, stamp_w - 6.4, stamp_h - 6.4, 3, fill=0, stroke=1)

    # Stamp Text
    c.setFont("Helvetica-Bold", 6.5)
    c.drawCentredString(0, 13.5, "* HIGH COURT OF EVICTION *")

    c.setFont("Helvetica-Bold", 13.5)
    main_text = "GUILTY AS CHARGED" if is_guilty else "PARDONED / CLEARED"
    c.drawCentredString(0, -2, main_text)

    c.setFont("Helvetica-Bold", 6.8)
    sub_text = "CONTEMPT DECREE ISSUED" if is_guilty else "REMISSION OF GUILT GRANTED"
    c.drawCentredString(0, -15.5, sub_text)

    c.restoreState()

    # -------------------------------------------------------------
    # 5. OFFICIAL LEGAL FOOTERS & SIGNATURES
    # -------------------------------------------------------------
    sig_y = 112

    # Attestation preamble line
    c.setFont("Times-Italic", 8)
    c.setFillColor(colors.HexColor("#6A5745"))
    c.drawCentredString(
        width / 2.0,
        sig_y + 45,
        "GIVEN under our hand and the official seal of this Court, enforceable across all active browser windows."
    )
    c.setLineWidth(0.4)
    c.setStrokeColor(colors.HexColor("#C4B5A5"))
    c.line(left_x + 30, sig_y + 39, width - left_x - 30, sig_y + 39)

    # Official Seal in Center
    draw_official_seal(c, width / 2.0, sig_y + 11, radius=23)

    # Left: Bailiff Signature
    c.setFont("Times-Italic", 12.5)
    c.setFillColor(colors.HexColor("#1F3864"))
    c.drawString(left_x + 8, sig_y + 16, "Attested by Discord Webhook Bailiff")

    c.setLineWidth(0.8)
    c.setStrokeColor(colors.HexColor("#444444"))
    c.line(left_x, sig_y + 8, left_x + 190, sig_y + 8)

    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(colors.HexColor("#222222"))
    c.drawString(left_x, sig_y - 4, "ELECTRONIC SIGNATURE OF THE BAILIFF")
    c.setFont("Courier", 6.5)
    c.setFillColor(colors.HexColor("#666666"))
    c.drawString(left_x, sig_y - 14, "Office of Discord Dispatcher & Tab Monitor")

    # Right: Attorney General Tab-ney Wright Signature
    sig_r_x = width - left_x - 190
    c.setFont("Times-BoldItalic", 13)
    c.setFillColor(colors.HexColor("#4A1515"))
    c.drawString(sig_r_x + 10, sig_y + 16, "Atty. Gen. Tab-ney Wright")

    c.setLineWidth(0.8)
    c.setStrokeColor(colors.HexColor("#444444"))
    c.line(sig_r_x, sig_y + 8, sig_r_x + 190, sig_y + 8)

    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(colors.HexColor("#222222"))
    c.drawString(sig_r_x, sig_y - 4, "ATTORNEY GENERAL TAB-NEY WRIGHT")
    c.setFont("Courier", 6.5)
    c.setFillColor(colors.HexColor("#666666"))
    c.drawString(sig_r_x, sig_y - 14, "Chief Justice & Attorney General, Tab Court")

    # -------------------------------------------------------------
    # 6. RETRO BARCODE & SERIAL STRIP
    # -------------------------------------------------------------
    barcode_y = 52
    draw_barcode(c, left_x, barcode_y, width=155, height=10)
    c.setFont("Courier", 6.8)
    c.setFillColor(colors.HexColor("#5A4A3C"))
    c.drawString(left_x + 168, barcode_y + 2, f"* EVICT-{case_id[:8].upper()}-DOCKET-DECREE-2026 *")

    # Security Banner line at bottom
    c.setFont("Helvetica", 6)
    c.setFillColor(colors.HexColor("#7A6855"))
    c.drawCentredString(
        width / 2.0,
        38,
        "OFFICIAL INSTRUMENT OF RECORD • ENFORCEABLE PURSUANT TO SECTION 42 OF THE HIGH BROWSER CODE • ALL RIGHTS RESERVED"
    )

    c.save()
    buffer.seek(0)
    return buffer.getvalue()

DEFAULT_OFFLINE_RULING = {
    "verdict": "GUILTY",
    "sentence": "Attorney General Tab-ney Wright's neural conduit severed in visceral disgust at your pusillanimous excuse! By peremptory decree of the High Docket, you stand convicted of digital contempt!",
    "confidence": 0.50,
}

def parse_or_recover_verdict(raw_response: str) -> dict:
    """Parses Ollama output with recovery for markdown fences, conversational prefixes, and malformed JSON."""
    if not raw_response or not raw_response.strip():
        return DEFAULT_OFFLINE_RULING.copy()

    cleaned = raw_response.strip()
    # Strip markdown code blocks (e.g. ```json ... ``` or ``` ...)
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned)

    # 1. Try standard JSON parse
    try:
        data = json.loads(cleaned)
        if isinstance(data, dict) and "verdict" in data:
            raw_v = str(data.get("verdict", "GUILTY")).strip().upper()
            verdict = "PARDONED" if "PARDON" in raw_v or "INNOCENT" in raw_v else "GUILTY"
            return {
                "verdict": verdict,
                "sentence": str(data.get("sentence", DEFAULT_OFFLINE_RULING["sentence"])).strip(),
                "confidence": float(data.get("confidence", 0.95)),
            }
    except Exception:
        pass

    # 2. Try extracting JSON object substring
    match = re.search(r"\{.*?\}", cleaned, re.DOTALL)
    if match:
        try:
            data = json.loads(match.group(0))
            if isinstance(data, dict) and "verdict" in data:
                raw_v = str(data.get("verdict", "GUILTY")).strip().upper()
                verdict = "PARDONED" if "PARDON" in raw_v or "INNOCENT" in raw_v else "GUILTY"
                return {
                    "verdict": verdict,
                    "sentence": str(data.get("sentence", DEFAULT_OFFLINE_RULING["sentence"])).strip(),
                    "confidence": float(data.get("confidence", 0.85)),
                }
        except Exception:
            pass

    # 3. Heuristic text recovery fallback
    upper_text = cleaned.upper()
    if "PARDONED" in upper_text and "GUILTY" not in upper_text:
        verdict = "PARDONED"
    else:
        verdict = "GUILTY"

    sentence = re.sub(r"\s+", " ", cleaned).strip()
    if len(sentence) > 180:
        sentence = sentence[:177] + "..."
    if not sentence:
        sentence = DEFAULT_OFFLINE_RULING["sentence"]

    return {
        "verdict": verdict,
        "sentence": sentence,
        "confidence": 0.65,
    }

@app.post("/judge")
def judge_case(case: CasePayload, background_tasks: BackgroundTasks, request: Request):
    user_prompt = (
        f"### CASE ON TRIAL:\n"
        f"- Accused Tab Title: {case.tab_title}\n"
        f"- Target Tab URL: {case.tab_url}\n"
        f"- Defendant's Plea: {case.plea_text}\n\n"
        f"Adjudicate this specific case immediately. Tailor your 1-2 sentence theatrical roast directly to '{case.tab_title}' and their excuse '{case.plea_text}'.\n"
        f'Output JSON schema: {{"verdict": "GUILTY" or "PARDONED", "sentence": "<1-2 sentence theatrical roast>", "confidence": 0.95}}'
    )

    verdict_data = None
    try:
        res = requests.post(
            "http://127.0.0.1:11434/api/generate",
            json={
                "model": "llama3.2:3b",
                "system": SYSTEM_PROMPT,
                "prompt": user_prompt,
                "format": "json",
                "stream": False,
            },
            timeout=6,
        )
        res.raise_for_status()
        raw_response = res.json().get("response", "")
        verdict_data = parse_or_recover_verdict(raw_response)
    except Exception as e:
        print(f"[Judge Inference Warning]: Ollama connection/inference error: {e}. Utilizing offline fallback.")
        verdict_data = DEFAULT_OFFLINE_RULING.copy()

    case_id = str(uuid.uuid4())
    record = {
        "case_id": case_id,
        "tab_title": case.tab_title,
        "tab_url": case.tab_url,
        "plea_text": case.plea_text,
        "verdict": verdict_data.get("verdict", "GUILTY"),
        "sentence": verdict_data.get("sentence", DEFAULT_OFFLINE_RULING["sentence"]),
        "confidence": verdict_data.get("confidence", 0.50),
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
    }
    CASE_ARCHIVE[case_id] = record

    # Non-blocking Discord log dispatched in the background
    background_tasks.add_task(
        send_discord_log,
        case_id=case_id,
        title=record["tab_title"],
        url=record["tab_url"],
        plea=record["plea_text"],
        verdict=record["verdict"],
        sentence=record["sentence"],
    )

    base_url = str(request.base_url).rstrip("/")
    return {
        "verdict": record["verdict"],
        "sentence": record["sentence"],
        "confidence": record["confidence"],
        "case_id": case_id,
        "pdf_download_url": f"{base_url}/order/{case_id}.pdf",
    }

@app.get("/order/{case_id}.pdf")
@app.get("/order/{case_id}")
@app.get("/download_order/{case_id}")
@app.get("/download_order/{case_id}.pdf")
def download_pdf(case_id: str):
    clean_id = case_id[:-4] if case_id.endswith(".pdf") else case_id
    record = CASE_ARCHIVE.get(clean_id)
    if not record:
        record = {
            "case_id": clean_id,
            "tab_title": "Sanctioned Web Browser Tab",
            "tab_url": "https://chrome.google.com/webstore",
            "plea": "Your Honor, I plead for digital clemency under court jurisdiction!",
            "verdict": "PARDONED" if "pardon" in clean_id.lower() else "GUILTY",
            "sentence": "By decree of Attorney General Tab-ney Wright, this case docket is officially attested.",
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
    
    pdf_bytes = create_court_order_pdf(clean_id, record)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=court_order_{clean_id[:8]}.pdf"}
    )