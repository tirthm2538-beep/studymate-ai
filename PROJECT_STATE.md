# StudyMate AI — Project State

## Project Goal
StudyMate AI is an AI-powered study assistant that takes a student's own study notes (via PDF upload or pasted text) and leverages AI to generate interactive flashcards and quiz questions, enabling faster, more effective learning.

## Tech Stack
- **Backend**:
  - Python 3.12
  - FastAPI
  - Uvicorn
  - Google Generative AI SDK (`google-generativeai` with `gemini-3.5-flash-lite`, REST transport)
  - `python-dotenv`, `python-multipart`
  - `pypdf` (PDF text extraction)
- **Frontend**:
  - Next.js (App Router)
  - React
  - TypeScript
  - Tailwind CSS

## Progress Log

### Step 1: Project Skeleton
- **Date**: 2026-11-18
- **Status**: Complete & Verified
  - Backend initialized with virtual environment, dependencies installed, and `/health` endpoint verified (`{"status": "ok"}`).
  - Frontend initialized with Next.js + TypeScript + Tailwind CSS and verified running on `http://localhost:3000`.
  - Git repository initialized, committed, and pushed to [github.com/tirthm2538-beep/studymate-ai](https://github.com/tirthm2538-beep/studymate-ai).
  - GitHub CLI (`gh`) installed and authenticated for user `tirthm2538-beep`.

### Step 2: AI Generation Engine
- **Date**: 2026-11-18
- **Status**: Complete & Tested
  - Implemented `POST /generate` endpoint in `backend/app.py`.
  - Extracts text from uploaded `.pdf` documents using `pypdf`, and supports `.txt` uploads or pasted plain text.
  - Queries Google Gemini (`gemini-3.5-flash-lite`) using REST transport and structured JSON output mode with a 30s timeout.
  - Robust error handling for empty notes, unsupported formats, files > 10MB, and Gemini timeouts / API failures.
  - Tested live against a biology notes sample with confirmed valid flashcards and quiz generation.

#### Endpoint Reference: `POST /generate`
- **Request Content-Type**: `multipart/form-data` OR `application/json`
- **Input Parameters**:
  - `text` (string, optional): Pasted study notes.
  - `file` (binary, optional): Uploaded `.pdf` or `.txt` file (max 10MB).
- **Response Format (`application/json`)**:
  ```json
  {
    "status": "success",
    "notes_length": 1273,
    "flashcards": [
      {
        "front": "Question or concept",
        "back": "Answer or explanation"
      }
    ],
    "quiz": [
      {
        "question": "Question text?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correct_answer_index": 1,
        "explanation": "Why Option B is the correct answer."
      }
    ]
  }
  ```
