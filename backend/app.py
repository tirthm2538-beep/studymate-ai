from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Form, status
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Dict, Any
import io
import json
import os
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

Mathematical formatting instructions:
- Express mathematical equations, formulas, exponents, fractions, and special symbols in clean, readable notation.
- Use simple, clean notation (e.g., x^2, sqrt(x), dy/dx, (a + b)/c) or standard LaTeX enclosed in single dollar signs for inline math (e.g., $x^2 + y^2 = r^2$, $\\frac{{dy}}{{dx}} = 2x$) or double dollar signs for display equations (e.g., $$\\int_0^1 x^2 dx = \\frac{{1}}{{3}}$$).
- Never output broken unicode characters, corrupt glyphs, or unescaped messy notation.

You must generate:
1. flashcards: Exactly 8 to 10 high-yield flashcard pairs covering key concepts, definitions, formulas, or facts.
   Each flashcard object MUST contain:
   - "front": A clear, concise question, concept, or term.
   - "back": The concise explanation, definition, or answer.

2. quiz: Exactly 5 multiple-choice questions testing comprehension and application of the material.
   Each quiz question object MUST contain:
   - "question": The question text.
   - "options": An array of exactly 4 choices (strings).
   - "correct_answer_index": An integer (0, 1, 2, or 3) pointing to the correct choice in "options".
   - "explanation": A brief explanation of why the correct option is right.

JSON output structure:
{{
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

Student's notes:
---
{notes}
---
"""

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
    file: Optional[UploadFile] = File(None)
):
    """
    Generate flashcards and quiz questions from provided student notes.
    Accepts:
    - multipart/form-data with 'text' (pasted string) or 'file' (.pdf or .txt)
    - application/json with {"text": "..."}
    """
    content_type = request.headers.get("content-type", "")
    notes_text = ""

    # Check for application/json payload
    if "application/json" in content_type:
        try:
            body = await request.json()
            if isinstance(body, dict):
                notes_text = body.get("text", "") or ""
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid JSON payload in request body."
            )
    else:
        # Check uploaded file first
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

        # If no file or empty file text, fallback to pasted text form field
        if not notes_text and text:
            notes_text = text.strip()

    if not notes_text or not notes_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Notes content is empty. Please provide text or upload a valid PDF/TXT file."
        )

    # Initialize Gemini model
    model = get_gemini_client()

    # Intelligently condense long notes if document is large (e.g. 20+ pages)
    effective_notes = condense_long_notes(notes_text)

    prompt = STUDY_PROMPT_TEMPLATE.replace("{notes}", effective_notes.strip())

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
        # Fallback if markdown code blocks were included
        cleaned = raw_output
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        try:
            data = json.loads(cleaned.strip())
        except json.JSONDecodeError as err:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to parse Gemini output as JSON: {str(err)}"
            )

    # Validate output schema
    flashcards = data.get("flashcards")
    quiz = data.get("quiz")

    if not isinstance(flashcards, list) or not isinstance(quiz, list):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Gemini output does not contain expected 'flashcards' and 'quiz' lists."
        )

    return {
        "status": "success",
        "notes_length": len(notes_text),
        "flashcards": flashcards,
        "quiz": quiz
    }
