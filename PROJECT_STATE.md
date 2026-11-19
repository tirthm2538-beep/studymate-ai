# StudyMate AI — Project State

## Project Status: COMPLETE ✅
**One-line summary**: StudyMate AI is a full-stack, AI-powered study assistant that transforms raw lecture notes or uploaded PDFs into interactive flashcards and self-paced multiple-choice practice quizzes using Google Gemini.

### 🌐 Live Production Deployments
- **Live Frontend**: [https://studymate-ai-sepia-tau.vercel.app](https://studymate-ai-sepia-tau.vercel.app)
- **Live Backend API**: [https://studymate-ai-licm.onrender.com](https://studymate-ai-licm.onrender.com)
- **Interactive API Docs (Swagger)**: [https://studymate-ai-licm.onrender.com/docs](https://studymate-ai-licm.onrender.com/docs)
- **GitHub Repository**: [https://github.com/tirthm2538-beep/studymate-ai](https://github.com/tirthm2538-beep/studymate-ai)

---

## Tech Stack
- **Backend**:
  - Python 3.12
  - FastAPI + Uvicorn
  - Google Generative AI SDK (`google-generativeai` with `gemini-3.5-flash-lite`, REST transport)
  - `python-dotenv`, `python-multipart`
  - `pypdf` (PDF text extraction)
  - Hosted on **Render** (Free Tier Web Service)
- **Frontend**:
  - Next.js 16 (App Router)
  - React 19
  - TypeScript
  - Tailwind CSS
  - Hosted on **Vercel** (Free Tier)

---

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

### Step 3: Demo UI Polish & Visual Progress
- **Date**: 2026-11-19
- **Status**: Complete & Tested
  - **Header & Branding**: Modernized top bar with "StudyMate AI" branding, live status badge, and clear tagline: *"Instant AI-powered flashcards & quizzes from your personal study notes"*.
  - **Hero & Sample Data**: Added quick-start "Load Biology Sample" action and feature highlights for faster onboarding.
  - **Quiz Progress Indicator**: Added prominent visual progress bar and question tracker (`Question X of Y (Z% complete)`), score counters, and instant answer feedback with explanations.
  - **Post-Quiz Actions**: Added "Try Again" (restarts current quiz) and "Generate New Set" (returns to note input) action buttons so students can restart without page refreshes.
  - **Dynamic Backend URL**: Configured `process.env.NEXT_PUBLIC_API_URL` with seamless local fallback to `http://127.0.0.1:8000`.
  - **App Screenshots**: Automated headless capture of working app views into `images/`:
    - `images/home.png`: Landing and note input screen.
    - `images/flashcards.png`: Interactive flashcard flip view.
    - `images/quiz.png`: Active quiz question with feedback and explanation.
    - `images/quiz_score.png`: Final score summary with Try Again & Generate New Set buttons.
  - **Documentation**: Comprehensive root `README.md` authored with badges, architecture overview, local setup, and Render + Vercel deployment walkthrough.
  - **Render Configuration**: Added `render.yaml` blueprint with Python 3.12 runtime and environment variable sync.

### Step 4: Live Deployment & Verification
- **Date**: 2026-11-19
- **Status**: Complete & Verified Live End-to-End
  - **Backend Live on Render**: [https://studymate-ai-licm.onrender.com](https://studymate-ai-licm.onrender.com) (`/health` returned `{"status": "ok"}`).
  - **Frontend Live on Vercel**: [https://studymate-ai-sepia-tau.vercel.app](https://studymate-ai-sepia-tau.vercel.app) (HTTP 200 OK).
  - Production environment variable `NEXT_PUBLIC_API_URL` connected to live Render backend.
  - Full study notes analysis, flashcards generation, and quiz completion confirmed functional in production.

---

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
