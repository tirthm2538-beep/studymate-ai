from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form, status
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Dict, Any
import io
import json
import os
import re
import pypdf
import google.generativeai as genai
from dotenv import load_dotenv

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
)

MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB limit
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
