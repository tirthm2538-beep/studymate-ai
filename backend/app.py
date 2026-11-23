from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form, status, Response
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Dict, Any
import io
import json
import os
import re
import pypdf
import pikepdf
from PIL import Image
import google.generativeai as genai
from dotenv import load_dotenv

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

# Load environment variables
load_dotenv()

app = FastAPI(
    title="StudyMate AI Backend",
    description="Backend API for StudyMate AI notes-to-study-materials engine"
)

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "X-Original-Size", "X-Compressed-Size", "X-Reduction-Percent"],
)

MAX_FILE_SIZE = 70 * 1024 * 1024  # 70 MB limit for notes and question papers
MAX_COMPRESS_FILE_SIZE = 150 * 1024 * 1024  # 150 MB limit for standalone compression tool
MAX_PROMPT_CHARS = 30000  # Threshold for chunked summarization
DEFAULT_MODEL = os.getenv("GEMINI_MODEL_NAME", "gemini-3.5-flash-lite")

STUDY_PROMPT_TEMPLATE = """You are an expert educational study assistant. Analyze the student's study notes below and generate structured study materials.

Target Difficulty Level: {difficulty}
Difficulty Calibration Guidelines:
- Easy: Focus on fundamental definitions, core terminology, straightforward identification, and direct recall. Keep questions accessible and intuitive.
- Medium: Focus on standard conceptual understanding, cause-and-effect relationships, key mechanisms, and moderate application. Balance recall with comprehension.
- Hard: Focus on advanced analytical thinking, edge cases, multi-step problem solving, deep conceptual nuances, and rigorous application of formulas.

Mathematical formatting instructions:
- Express mathematical equations, formulas, exponents, fractions, and special symbols in clean, readable notation.
- Use simple, clean notation (e.g., x^2, sqrt(x), dy/dx, (a + b)/c) or standard LaTeX enclosed in single dollar signs for inline math (e.g., $x^2 + y^2 = r^2$, $\\frac{{dy}}{{dx}} = 2x$) or double dollar signs for display equations (e.g., $$\\int_0^1 x^2 dx = \\frac{{1}}{{3}}$$).
- Never output broken unicode characters, corrupt glyphs, or unescaped messy notation.

You must generate:
1. important_topics: An array of exactly 3 to 5 most important core topics, high-yield themes, or key principles identified from the notes.
   Each topic item should be a concise, informative string explaining the key takeaway or why it is critical.

2. flashcards: Exactly 8 to 10 high-yield flashcard pairs covering key concepts, definitions, formulas, or facts calibrated to the {difficulty} level.
   Each flashcard object MUST contain:
   - "front": A clear, concise question, concept, or term.
   - "back": The concise explanation, definition, or answer.

3. quiz: Exactly 5 multiple-choice questions testing comprehension and application of the material at the {difficulty} level.
   Each quiz question object MUST contain:
   - "question": The question text.
   - "options": An array of exactly 4 choices (strings).
   - "correct_answer_index": An integer (0, 1, 2, or 3) pointing to the correct choice in "options".
   - "explanation": A brief explanation of why the correct option is right.

JSON output structure:
{{
  "important_topics": [
    "Topic 1: ...",
    "Topic 2: ...",
    "Topic 3: ..."
  ],
  "flashcards": [
    {{"front": "...", "back": "..."}}
  ],
  "quiz": [
    {{
      "question": "...",
      "options": ["...", "...", "...", "..."],
      "correct_answer_index": 0,
      "explanation": "..."
    }}
  ]
}}
{sample_paper_instruction}
Student's notes:
---
{notes}
---
"""

NOTES_PROMPT_TEMPLATE = """You are an expert academic educator and textbook revision author. Analyze the study notes or textbook chapter below and generate comprehensive, well-structured revision notes.

Target Difficulty Level: {difficulty}

Instructions:
1. Organize the material into clear, logical sections with informative headings and subheadings.
2. Under each subheading, provide high-yield, comprehensive bullet points capturing all essential mechanisms, processes, formulas, rules, and concepts. Do not omit critical details.
3. Highlight critical definitions: identify key technical terms and provide clear, precise definitions. Each definition item MUST contain "term" and "definition".
4. Conclude with a "quick_revision_summary": an array of 5 to 8 high-yield core takeaways, rules, or formulas for rapid last-minute revision.
5. Mathematical expressions: use clean readable notation or standard LaTeX ($...$ or $$...$$).
6. Output valid JSON only.

JSON schema:
{{
  "document_title": "Descriptive Title of this Material",
  "sections": [
    {{
      "heading": "Major Section Title",
      "subheadings": [
        {{
          "title": "Subsection Topic",
          "bullets": [
            "Comprehensive bullet point explanation..."
          ],
          "key_definitions": [
            {{
              "term": "Term Name",
              "definition": "Clear concise definition of the term."
            }}
          ]
        }}
      ]
    }}
  ],
  "quick_revision_summary": [
    "High-yield takeaway 1...",
    "High-yield takeaway 2..."
  ]
}}

Study Material:
---
{notes}
---
"""

SECTION_CHUNK_NOTES_TEMPLATE = """You are an expert academic educator. Analyze this section (Part {part} of {total_parts}) of study material and generate structured revision notes for this part.

Target Difficulty Level: {difficulty}

Instructions:
1. Organize into a logical section heading and subheadings.
2. Provide thorough, high-yield bullet-point summaries of concepts, mechanisms, steps, derivations, and testable facts.
3. Highlight critical definitions: identify key technical terms and provide clear definitions with "term" and "definition".
4. Mathematical expressions: use clean notation or LaTeX ($...$).
5. Output valid JSON only.

JSON schema:
{{
  "heading": "Section Heading for this Part",
  "subheadings": [
    {{
      "title": "Subsection Title",
      "bullets": [
        "Thorough bullet point explanation..."
      ],
      "key_definitions": [
        {{
          "term": "Term Name",
          "definition": "Clear concise definition of the term."
        }}
      ]
    }}
  ]
}}

Study Material Part {part}/{total_parts}:
---
{chunk}
---
"""

def build_markdown_notes(title: str, sections: List[Dict[str, Any]], summary: List[str], difficulty: str = "Medium") -> str:
    """Builds a complete, formatted Markdown string from structured notes."""
    lines = []
    lines.append(f"# {title}")
    lines.append(f"*StudyMate AI Comprehensive Revision Notes • {difficulty} Mode*")
    lines.append("")

    for s_idx, sec in enumerate(sections):
        heading = sec.get("heading", f"Section {s_idx + 1}")
        lines.append(f"## {heading}")
        lines.append("")
        for sub in sec.get("subheadings", []):
            stitle = sub.get("title", "")
            if stitle:
                lines.append(f"### {stitle}")
                lines.append("")
            for b in sub.get("bullets", []):
                lines.append(f"- {b}")
            lines.append("")
            for d in sub.get("key_definitions", []):
                term = d.get("term", "").strip()
                defn = d.get("definition", "").strip()
                if term and defn:
                    lines.append(f"> **📌 Key Definition — {term}**: {defn}")
                    lines.append("")

    if summary:
        lines.append("---")
        lines.append("## ⚡ Quick Revision Summary")
        lines.append("")
        for item in summary:
            lines.append(f"- {item}")
        lines.append("")

    return "\n".join(lines).strip()

def generate_notes_pdf_bytes(title: str, sections: List[Dict[str, Any]], summary: List[str], difficulty: str = "Medium") -> bytes:
    """Generates a styled, multi-page PDF document of revision notes using ReportLab."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'NotesDocTitle',
        parent=styles['Heading1'],
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#1e1b4b'),
        spaceAfter=4
    )
    sub_title_style = ParagraphStyle(
        'NotesDocSub',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#64748b'),
        spaceAfter=12
    )
    h1_style = ParagraphStyle(
        'NotesH1',
        parent=styles['Heading2'],
        fontSize=13,
        leading=17,
        textColor=colors.HexColor('#312e81'),
        spaceBefore=10,
        spaceAfter=5
    )
    h2_style = ParagraphStyle(
        'NotesH2',
        parent=styles['Heading3'],
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor('#4338ca'),
        spaceBefore=6,
        spaceAfter=3
    )
    bullet_style = ParagraphStyle(
        'NotesBullet',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#1e293b'),
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=2.5
    )
    def_text_style = ParagraphStyle(
        'NotesDefText',
        parent=styles['Normal'],
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#064e3b')
    )
    sum_title_style = ParagraphStyle(
        'NotesSumTitle',
        parent=styles['Heading2'],
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#92400e'),
        spaceBefore=8,
        spaceAfter=4
    )
    sum_bullet_style = ParagraphStyle(
        'NotesSumBullet',
        parent=styles['Normal'],
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor('#78350f'),
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=2.5
    )

    def xml_esc(s: str) -> str:
        return str(s).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

    story = []
    story.append(Paragraph(xml_esc(title), title_style))
    story.append(Paragraph(f"StudyMate AI Comprehensive Revision Notes &bull; {xml_esc(difficulty)} Difficulty", sub_title_style))
    story.append(HRFlowable(width='100%', thickness=1.5, color=colors.HexColor('#6366f1'), spaceAfter=10))

    for sec in sections:
        story.append(Paragraph(xml_esc(sec.get('heading', 'Section')), h1_style))
        for sub in sec.get('subheadings', []):
            stitle = sub.get('title', '')
            if stitle:
                story.append(Paragraph(xml_esc(stitle), h2_style))
            for b in sub.get('bullets', []):
                story.append(Paragraph(f"&bull; {xml_esc(b)}", bullet_style))

            defs = sub.get('key_definitions', [])
            if defs:
                story.append(Spacer(1, 3))
                for d in defs:
                    term = xml_esc(d.get('term', ''))
                    defn = xml_esc(d.get('definition', ''))
                    if term and defn:
                        t = Table(
                            [[Paragraph(f"<b>📌 Key Definition:</b> <u>{term}</u> &mdash; {defn}", def_text_style)]],
                            colWidths=['100%']
                        )
                        t.setStyle(TableStyle([
                            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#ecfdf5')),
                            ('BOX', (0,0), (-1,-1), 0.75, colors.HexColor('#a7f3d0')),
                            ('TOPPADDING', (0,0), (-1,-1), 4),
                            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
                            ('LEFTPADDING', (0,0), (-1,-1), 6),
                            ('RIGHTPADDING', (0,0), (-1,-1), 6),
                        ]))
                        story.append(t)
                        story.append(Spacer(1, 3))
        story.append(Spacer(1, 6))

    if summary:
        story.append(Spacer(1, 6))
        story.append(HRFlowable(width='100%', thickness=1, color=colors.HexColor('#f59e0b'), spaceAfter=8))
        story.append(Paragraph("⚡ Quick Revision Summary", sum_title_style))
        for item in summary:
            story.append(Paragraph(f"&bull; {xml_esc(item)}", sum_bullet_style))

    doc.build(story)
    return buf.getvalue()


def sanitize_json_string(s: str) -> str:
    """
    Sanitize JSON text from LLM so that LaTeX backslashes (like \\Delta, \\frac, \\sqrt)
    do not cause JSONDecodeError: Invalid \\escape.
    """
    res = []
    i = 0
    n = len(s)
    in_string = False

    while i < n:
        c = s[i]
        if c == '"' and (i == 0 or s[i - 1] != '\\'):
            in_string = not in_string
            res.append(c)
            i += 1
            continue

        if in_string and c == '\\':
            if i + 1 < n:
                next_c = s[i + 1]
                if next_c in '"\\/':
                    res.append(c)
                    res.append(next_c)
                    i += 2
                    continue
                elif next_c in 'bfnrt':
                    peek = s[i + 1 : i + 6]
                    if re.match(r'^(frac|beta|bar|bf|bullet|nabla|nu|ne|neq|times|tau|text|theta|to|rho|right)\b', peek):
                        res.append('\\\\')
                        i += 1
                        continue
                    else:
                        res.append(c)
                        res.append(next_c)
                        i += 2
                        continue
                elif next_c == 'u' and i + 5 < n and re.match(r'^[0-9a-fA-F]{4}$', s[i + 2 : i + 6]):
                    res.append(c)
                    res.append(next_c)
                    i += 2
                    continue
                else:
                    res.append('\\\\')
                    i += 1
                    continue
            else:
                res.append('\\\\')
                i += 1
                continue

        res.append(c)
        i += 1

    return "".join(res)

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract plain text from PDF bytes using pypdf, preserving page context and handling extraction errors."""
    try:
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        extracted_pages = []
        for i, page in enumerate(reader.pages):
            try:
                page_text = page.extract_text()
                if page_text and page_text.strip():
                    extracted_pages.append(f"--- Page {i + 1} ---\n{page_text.strip()}")
            except Exception:
                continue
        return "\n\n".join(extracted_pages).strip()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to read or parse PDF file: {str(e)}"
        )

def get_gemini_text_client():
    """Configure and return the Gemini GenerativeModel for general text/summaries."""
    load_dotenv(override=True)
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key or api_key == "your_key_here":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GEMINI_API_KEY is not configured. Please set a valid Gemini API key in backend/.env."
        )
    genai.configure(api_key=api_key, transport="rest")
    return genai.GenerativeModel(model_name=DEFAULT_MODEL)

def condense_long_notes(notes_text: str) -> str:
    """
    If notes text exceeds MAX_PROMPT_CHARS, intelligently chunk and summarize
    batches to extract key concepts without hitting token limits or timing out.
    """
    if len(notes_text) <= MAX_PROMPT_CHARS:
        return notes_text

    chunk_size = 25000
    chunks = [notes_text[i:i + chunk_size] for i in range(0, len(notes_text), chunk_size)]

    # Select up to 4 representative chunks across beginning, middle, and end
    if len(chunks) <= 4:
        selected_chunks = chunks
    else:
        indices = [0, len(chunks) // 3, (2 * len(chunks)) // 3, len(chunks) - 1]
        selected_chunks = [chunks[idx] for idx in sorted(set(indices))]

    summaries = []
    try:
        summary_model = get_gemini_text_client()
    except Exception:
        summary_model = None

    for idx, chunk in enumerate(selected_chunks):
        if summary_model:
            summary_prompt = (
                "You are an expert academic text condenser. Summarize this section of study material into "
                "comprehensive, high-yield bullet points capturing the core concepts, key definitions, "
                "formulas, mechanisms, and testable facts:\n\n"
                f"---\n{chunk}\n---\n\n"
                "Key Concepts and Study Takeaways:"
            )
            try:
                res = summary_model.generate_content(summary_prompt, request_options={"timeout": 35})
                if res and res.text:
                    summaries.append(f"### Section {idx + 1} Key Takeaways:\n{res.text.strip()}")
                    continue
            except Exception:
                pass
        # Fallback: keep an informative slice of the chunk
        summaries.append(f"### Section {idx + 1} Key Excerpt:\n{chunk[:4000]}")

    if summaries:
        return f"Consolidated Study Notes (Summarized across {len(selected_chunks)} sections of large document):\n\n" + "\n\n".join(summaries)

    # Proportional sampling fallback
    return (
        notes_text[:12000]
        + "\n\n[... middle sections omitted ...]\n\n"
        + notes_text[len(notes_text) // 2 - 4000 : len(notes_text) // 2 + 4000]
        + "\n\n[... continuation ...]\n\n"
        + notes_text[-10000:]
    )

def get_gemini_client():
    """Configure and return the Gemini GenerativeModel."""
    load_dotenv(override=True)
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key or api_key == "your_key_here":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GEMINI_API_KEY is not configured. Please set a valid Gemini API key in backend/.env."
        )
    genai.configure(api_key=api_key, transport="rest")
    return genai.GenerativeModel(
        model_name=DEFAULT_MODEL,
        generation_config={
            "response_mime_type": "application/json"
        }
    )

@app.get("/health")
def health():
    return {"status": "ok"}

def compress_pdf_bytes(file_bytes: bytes, quality: int = 50, max_dimension: int = 1200) -> tuple[bytes, int, int, float]:
    """
    Compresses PDF streams and re-encodes / downsamples high-resolution images using pikepdf and Pillow.
    Returns: (compressed_bytes, original_size, compressed_size, reduction_percent)
    """
    original_size = len(file_bytes)
    try:
        pdf = pikepdf.Pdf.open(io.BytesIO(file_bytes))
        for page in pdf.pages:
            if "/Resources" in page and "/XObject" in page.Resources:
                for name, obj in list(page.Resources.XObject.items()):
                    if isinstance(obj, pikepdf.Stream) and obj.get("/Subtype") == pikepdf.Name.Image:
                        try:
                            pdfimage = pikepdf.PdfImage(obj)
                            pil_im = pdfimage.as_pil_image()

                            # Downsample if image exceeds max dimension
                            if max(pil_im.size) > max_dimension:
                                pil_im.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)

                            # Handle RGBA / transparency for clean JPEG compression
                            if pil_im.mode in ("RGBA", "LA"):
                                bg = Image.new("RGB", pil_im.size, (255, 255, 255))
                                bg.paste(pil_im, mask=pil_im.split()[-1])
                                pil_im = bg
                            elif pil_im.mode != "RGB":
                                pil_im = pil_im.convert("RGB")

                            comp_buf = io.BytesIO()
                            pil_im.save(comp_buf, format="JPEG", quality=quality, optimize=True)
                            comp_img_bytes = comp_buf.getvalue()

                            # Only replace stream if the compressed image is smaller
                            raw_stream_len = len(obj.read_raw_bytes())
                            if len(comp_img_bytes) < raw_stream_len:
                                new_stream = pdf.make_stream(comp_img_bytes)
                                new_stream.Subtype = pikepdf.Name.Image
                                new_stream.Width = pil_im.width
                                new_stream.Height = pil_im.height
                                new_stream.ColorSpace = pikepdf.Name.DeviceRGB
                                new_stream.BitsPerComponent = 8
                                new_stream.Filter = pikepdf.Name.DCTDecode
                                page.Resources.XObject[name] = new_stream
                        except Exception:
                            continue

        out_buf = io.BytesIO()
        pdf.save(out_buf, compress_streams=True, object_stream_mode=pikepdf.ObjectStreamMode.generate)
        compressed_bytes = out_buf.getvalue()
    except Exception:
        # Fallback to original bytes safely if any unexpected parsing error occurs
        return file_bytes, original_size, original_size, 0.0

    if len(compressed_bytes) < original_size:
        compressed_size = len(compressed_bytes)
        reduction = round((1.0 - compressed_size / original_size) * 100, 1)
        return compressed_bytes, original_size, compressed_size, reduction

    return file_bytes, original_size, original_size, 0.0

@app.post("/compress-pdf")
async def compress_pdf_endpoint(
    file: UploadFile = File(...),
    quality: Optional[int] = Form(50),
    max_dimension: Optional[int] = Form(1200)
):
    """
    Accepts a PDF file (up to 150MB), compresses streams and downsamples images,
    and returns the compressed PDF with size and savings metadata headers.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF (.pdf) files can be compressed."
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_COMPRESS_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum compression limit of {MAX_COMPRESS_FILE_SIZE // (1024 * 1024)}MB."
        )

    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded PDF file is empty."
        )

    # Validate quality & dimension bounds
    clamped_quality = max(20, min(quality or 50, 90))
    clamped_dim = max(600, min(max_dimension or 1200, 2400))

    comp_bytes, orig_sz, comp_sz, reduction = compress_pdf_bytes(
        file_bytes, quality=clamped_quality, max_dimension=clamped_dim
    )

    base_name = os.path.splitext(os.path.basename(file.filename))[0]
    safe_filename = re.sub(r"[^\w\-_\.]", "_", base_name) + "_compressed.pdf"

    return Response(
        content=comp_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{safe_filename}"',
            "X-Original-Size": str(orig_sz),
            "X-Compressed-Size": str(comp_sz),
            "X-Reduction-Percent": str(reduction)
        }
    )

@app.post("/generate")
async def generate(
    request: Request,
    text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    difficulty: Optional[str] = Form("Medium"),
    sample_paper_file: Optional[UploadFile] = File(None),
    sample_paper_text: Optional[str] = Form(None)
):
    """
    Generate flashcards and quiz questions from provided student notes.
    Accepts:
    - multipart/form-data with 'text', 'file', 'difficulty', 'sample_paper_file', 'sample_paper_text'
    - application/json with {"text": "...", "difficulty": "...", "sample_paper_text": "..."}
    """
    content_type = request.headers.get("content-type", "")
    notes_text = ""
    reference_paper_text = ""

    # Check for application/json payload
    if "application/json" in content_type:
        try:
            body = await request.json()
            if isinstance(body, dict):
                notes_text = body.get("text", "") or ""
                if "difficulty" in body:
                    difficulty = body.get("difficulty")
                if "sample_paper_text" in body:
                    reference_paper_text = body.get("sample_paper_text", "") or ""
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid JSON payload in request body."
            )
    else:
        # Check uploaded notes file first
        if file is not None and file.filename:
            file_bytes = await file.read()
            if len(file_bytes) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File exceeds maximum allowed size of {MAX_FILE_SIZE // (1024 * 1024)}MB."
                )

            filename = file.filename.lower()
            if filename.endswith(".pdf"):
                notes_text = extract_text_from_pdf(file_bytes)
            elif filename.endswith(".txt"):
                try:
                    notes_text = file_bytes.decode("utf-8", errors="replace").strip()
                except Exception as e:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Unable to decode text file: {str(e)}"
                    )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Unsupported file format. Please upload a .pdf or .txt file."
                )

        # Check uploaded sample question paper file
        if sample_paper_file is not None and sample_paper_file.filename:
            sp_bytes = await sample_paper_file.read()
            if len(sp_bytes) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"Sample question paper exceeds maximum size of {MAX_FILE_SIZE // (1024 * 1024)}MB."
                )

            sp_name = sample_paper_file.filename.lower()
            if sp_name.endswith(".pdf"):
                reference_paper_text = extract_text_from_pdf(sp_bytes)
            elif sp_name.endswith(".txt"):
                try:
                    reference_paper_text = sp_bytes.decode("utf-8", errors="replace").strip()
                except Exception as e:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Unable to decode sample paper file: {str(e)}"
                    )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Sample question paper must be a .pdf or .txt file."
                )

        # Fallback to pasted sample paper text if not provided via file
        if not reference_paper_text and sample_paper_text:
            reference_paper_text = sample_paper_text.strip()

        # If no file or empty file text, fallback to pasted text form field
        if not notes_text and text:
            notes_text = text.strip()

    if not notes_text or not notes_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Notes content is empty. Please provide text or upload a valid PDF/TXT file."
        )

    # Normalize and validate difficulty level
    valid_difficulties = {"Easy", "Medium", "Hard"}
    selected_difficulty = "Medium"
    if difficulty:
        cap = str(difficulty).strip().capitalize()
        if cap in valid_difficulties:
            selected_difficulty = cap

    # Style & format matching instruction if sample paper was provided
    sample_paper_instruction = ""
    if reference_paper_text and reference_paper_text.strip():
        sample_paper_instruction = f"""
STYLE AND FORMAT MATCHING REQUIREMENT:
The student has provided a reference question paper below. You MUST format and frame the 5 quiz questions to closely match the style, question phrasing conventions, structure, and question phrasing of this reference paper:
- Adopt similar question phrasing (e.g. scenario prompts, Roman numeral statements, direct calculation requests, or specific question stems).
- Match the question sophistication, tone, and distractor options demonstrated in the reference paper.
- Test the concepts from the student's study notes, but frame the quiz questions in this exact exam style.

Reference Sample Question Paper:
---
{reference_paper_text[:15000].strip()}
---
"""

    # Initialize Gemini model
    model = get_gemini_client()

    # Intelligently condense long notes if document is large (e.g. 20+ pages)
    effective_notes = condense_long_notes(notes_text)

    prompt = (
        STUDY_PROMPT_TEMPLATE
        .replace("{difficulty}", selected_difficulty)
        .replace("{sample_paper_instruction}", sample_paper_instruction)
        .replace("{notes}", effective_notes.strip())
    )

    try:
        response = model.generate_content(prompt, request_options={"timeout": 60})
    except Exception as e:
        err_str = str(e)
        if "timed out" in err_str.lower() or "timeout" in err_str.lower():
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail=f"Gemini API request timed out after 60 seconds: {err_str}"
            )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Gemini API request failed: {err_str}"
        )

    if not response or not response.text:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Gemini API returned an empty response."
        )

    # Clean and parse JSON
    raw_output = response.text.strip()
    try:
        data = json.loads(raw_output)
    except json.JSONDecodeError:
        cleaned = raw_output
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError:
            try:
                sanitized = sanitize_json_string(cleaned)
                data = json.loads(sanitized)
            except json.JSONDecodeError as err:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Failed to parse Gemini output as JSON: {str(err)}"
                )

    # Validate output schema
    flashcards = data.get("flashcards")
    quiz = data.get("quiz")
    important_topics = data.get("important_topics", [])
    if not isinstance(important_topics, list):
        important_topics = []

    if not isinstance(flashcards, list) or not isinstance(quiz, list):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Gemini output does not contain expected 'flashcards' and 'quiz' lists."
        )

    return {
        "status": "success",
        "notes_length": len(notes_text),
        "difficulty": selected_difficulty,
        "format_matched": bool(reference_paper_text and reference_paper_text.strip()),
        "important_topics": important_topics,
        "flashcards": flashcards,
        "quiz": quiz
    }

@app.post("/generate-notes")
async def generate_notes(
    request: Request,
    text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    title: Optional[str] = Form(None),
    difficulty: Optional[str] = Form("Medium")
):
    """
    Generate comprehensive, structured revision notes from uploaded PDF/TXT or pasted notes.
    Handles long chapter-sized documents (e.g. 100 pages) via intelligent chunking.
    """
    content_type = request.headers.get("content-type", "")
    notes_text = ""
    doc_title = (title or "").strip()

    # Check for application/json payload
    if "application/json" in content_type:
        try:
            body = await request.json()
            if isinstance(body, dict):
                notes_text = body.get("text", "") or ""
                doc_title = (body.get("title", "") or doc_title).strip()
                if "difficulty" in body:
                    difficulty = body.get("difficulty")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid JSON payload in request body."
            )
    else:
        # Check uploaded file
        if file is not None and file.filename:
            file_bytes = await file.read()
            if len(file_bytes) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File exceeds maximum allowed size of {MAX_FILE_SIZE // (1024 * 1024)}MB."
                )

            filename = file.filename.lower()
            if filename.endswith(".pdf"):
                notes_text = extract_text_from_pdf(file_bytes)
                if not doc_title:
                    base = os.path.splitext(file.filename)[0]
                    doc_title = base.replace("_", " ").replace("-", " ").title()
            elif filename.endswith(".txt"):
                try:
                    notes_text = file_bytes.decode("utf-8", errors="replace").strip()
                    if not doc_title:
                        base = os.path.splitext(file.filename)[0]
                        doc_title = base.replace("_", " ").replace("-", " ").title()
                except Exception as e:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Unable to decode text file: {str(e)}"
                    )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Unsupported file format. Please upload a .pdf or .txt file."
                )

        if not notes_text and text:
            notes_text = text.strip()

    if not notes_text or not notes_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Notes content is empty. Please provide text or upload a valid PDF/TXT file."
        )

    # Normalize difficulty level
    valid_difficulties = {"Easy", "Medium", "Hard"}
    selected_difficulty = "Medium"
    if difficulty:
        cap = str(difficulty).strip().capitalize()
        if cap in valid_difficulties:
            selected_difficulty = cap

    model = get_gemini_client()

    CHUNK_THRESHOLD = 25000
    all_sections = []
    quick_summary = []
    final_title = doc_title or "Chapter Revision Notes"

    if len(notes_text) <= CHUNK_THRESHOLD:
        # Single pass generation
        prompt = (
            NOTES_PROMPT_TEMPLATE
            .replace("{difficulty}", selected_difficulty)
            .replace("{notes}", notes_text.strip())
        )
        try:
            resp = model.generate_content(prompt, request_options={"timeout": 60})
            raw_output = resp.text.strip()
            try:
                data = json.loads(raw_output)
            except Exception:
                cleaned = raw_output
                if cleaned.startswith("```json"):
                    cleaned = cleaned[7:]
                if cleaned.startswith("```"):
                    cleaned = cleaned[3:]
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3]
                cleaned = cleaned.strip()
                try:
                    data = json.loads(cleaned)
                except Exception:
                    sanitized = sanitize_json_string(cleaned)
                    data = json.loads(sanitized)

            if data.get("document_title"):
                final_title = data["document_title"]
            all_sections = data.get("sections", [])
            quick_summary = data.get("quick_revision_summary", [])
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Gemini API request failed during notes generation: {str(e)}"
            )
    else:
        # Multi-chunk processing for long chapters
        chunk_size = 22000
        chunks = []
        current_chunk = []
        current_len = 0

        pages = notes_text.split("--- Page ")
        if len(pages) > 1:
            for p in pages:
                if not p.strip():
                    continue
                p_text = f"--- Page {p}" if not p.startswith("--- Page ") else p
                if current_len + len(p_text) > chunk_size and current_chunk:
                    chunks.append("\n\n".join(current_chunk))
                    current_chunk = [p_text]
                    current_len = len(p_text)
                else:
                    current_chunk.append(p_text)
                    current_len += len(p_text)
            if current_chunk:
                chunks.append("\n\n".join(current_chunk))
        else:
            paras = notes_text.split("\n\n")
            for para in paras:
                if current_len + len(para) > chunk_size and current_chunk:
                    chunks.append("\n\n".join(current_chunk))
                    current_chunk = [para]
                    current_len = len(para)
                else:
                    current_chunk.append(para)
                    current_len += len(para)
            if current_chunk:
                chunks.append("\n\n".join(current_chunk))

        total_parts = len(chunks)
        # Process up to 8 chunks to preserve speed and avoid timeouts
        for c_idx, chunk in enumerate(chunks[:8]):
            chunk_prompt = (
                SECTION_CHUNK_NOTES_TEMPLATE
                .replace("{difficulty}", selected_difficulty)
                .replace("{part}", str(c_idx + 1))
                .replace("{total_parts}", str(total_parts))
                .replace("{chunk}", chunk)
            )
            try:
                c_resp = model.generate_content(chunk_prompt, request_options={"timeout": 60})
                raw_c = c_resp.text.strip()
                try:
                    c_data = json.loads(raw_c)
                except Exception:
                    cleaned_c = raw_c
                    if cleaned_c.startswith("```json"):
                        cleaned_c = cleaned_c[7:]
                    if cleaned_c.startswith("```"):
                        cleaned_c = cleaned_c[3:]
                    if cleaned_c.endswith("```"):
                        cleaned_c = cleaned_c[:-3]
                    cleaned_c = cleaned_c.strip()
                    try:
                        c_data = json.loads(cleaned_c)
                    except Exception:
                        sanitized_c = sanitize_json_string(cleaned_c)
                        c_data = json.loads(sanitized_c)

                if isinstance(c_data, dict):
                    if "sections" in c_data and isinstance(c_data["sections"], list):
                        all_sections.extend(c_data["sections"])
                    elif "heading" in c_data:
                        all_sections.append(c_data)
            except Exception:
                all_sections.append({
                    "heading": f"Section {c_idx + 1}",
                    "subheadings": [{
                        "title": f"Part {c_idx + 1} Takeaways",
                        "bullets": [chunk[:300].strip() + "..."],
                        "key_definitions": []
                    }]
                })

        # Synthesize Quick Revision Summary from generated sections
        overview_lines = []
        for s in all_sections:
            overview_lines.append(f"Section: {s.get('heading', '')}")
            for sub in s.get("subheadings", []):
                overview_lines.append(f" - Subsection: {sub.get('title', '')}")
                for d in sub.get("key_definitions", []):
                    overview_lines.append(f"   * Def: {d.get('term', '')} = {d.get('definition', '')}")

        synth_prompt = f"""You are an educational condenser. Based on these chapter sections and definitions, generate a Quick Revision Summary consisting of exactly 6 to 8 high-yield core takeaways, rules, or formulas for rapid exam revision.

Chapter Content Overview:
---
{chr(10).join(overview_lines[:100])}
---

JSON Schema:
{{
  "quick_revision_summary": [
    "High-yield takeaway 1...",
    "High-yield takeaway 2..."
  ]
}}
"""
        try:
            synth_resp = model.generate_content(synth_prompt, request_options={"timeout": 45})
            raw_s = synth_resp.text.strip()
            try:
                s_data = json.loads(raw_s)
            except Exception:
                cleaned_s = raw_s
                if cleaned_s.startswith("```json"):
                    cleaned_s = cleaned_s[7:]
                if cleaned_s.startswith("```"):
                    cleaned_s = cleaned_s[3:]
                if cleaned_s.endswith("```"):
                    cleaned_s = cleaned_s[:-3]
                cleaned_s = cleaned_s.strip()
                try:
                    s_data = json.loads(cleaned_s)
                except Exception:
                    sanitized_s = sanitize_json_string(cleaned_s)
                    s_data = json.loads(sanitized_s)
            quick_summary = s_data.get("quick_revision_summary", [])
        except Exception:
            quick_summary = [f"Core principle from {s.get('heading', 'section')}" for s in all_sections[:6]]

    # Flatten all key definitions
    all_defs = []
    for sec in all_sections:
        for sub in sec.get("subheadings", []):
            for d in sub.get("key_definitions", []):
                if d.get("term"):
                    all_defs.append(d)

    markdown_content = build_markdown_notes(
        final_title,
        all_sections,
        quick_summary,
        difficulty=selected_difficulty
    )

    return {
        "status": "success",
        "document_title": final_title,
        "notes_length": len(notes_text),
        "difficulty": selected_difficulty,
        "sections_count": len(all_sections),
        "sections": all_sections,
        "quick_revision_summary": quick_summary,
        "all_key_definitions": all_defs,
        "markdown_content": markdown_content
    }

@app.post("/export-notes-pdf")
async def export_notes_pdf(request: Request):
    """
    Accepts JSON payload with title, sections, quick_revision_summary, and difficulty,
    and returns a downloadable, styled PDF document.
    """
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON body."
        )

    title = data.get("title") or "StudyMate_Revision_Notes"
    sections = data.get("sections") or []
    summary = data.get("quick_revision_summary") or []
    difficulty = data.get("difficulty") or "Medium"

    pdf_bytes = generate_notes_pdf_bytes(title, sections, summary, difficulty=difficulty)
    safe_name = re.sub(r"[^\w\-_\.]", "_", title) + "_Revision_Notes.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{safe_name}"'
        }
    )
