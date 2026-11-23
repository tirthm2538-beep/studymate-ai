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
  - `pikepdf` & `Pillow` (PDF stream & high-resolution image compression)
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

### Step 5: Large PDF Uploads & Intelligent Chunking
- **Date**: 2026-11-20
- **Status**: Complete & Verified
  - Increased file upload size limit from 10MB to 25MB across backend validation, FastAPI file handler, and frontend client controls.
  - Upgraded PDF text extraction with page context preservation and fault-tolerant per-page extraction.
  - Implemented intelligent chunked batch summarization for documents exceeding 30,000 characters (e.g. 20+ to 100+ pages), distilling key concepts across the beginning, middle, and end without exceeding token or timeout limits.
  - Increased Gemini API request timeout to 60s for handling complex documents.
  - Tested and verified with genuine 25-page academic PDF documents (both standard and 120,000+ character dense documents), producing valid flashcards and practice quizzes.

### Step 6: Math Symbol Rendering (KaTeX + Plain Notation)
- **Date**: 2026-11-20
- **Status**: Complete & Tested
  - Enhanced Gemini prompt with explicit mathematical rules to generate clean, readable expressions (exponents, fractions, roots, differentials) and standard LaTeX with delimiters, preventing corrupted unicode glyphs.
  - Resolved Python template string brace conflicts for mathematical LaTeX notation.
  - Integrated KaTeX and KaTeX CSS into Next.js frontend with modular `MathText` parser component supporting inline math, block math, and raw LaTeX notation.
  - Upgraded Flashcards, Quiz questions, options, and explanations to render math symbols with typographic clarity.
  - Added "Load Math Sample" button (calculus and linear algebra) to test math formulas in one click.
  - Tested live against complex algebra and calculus notes with confirmed valid symbol rendering and zero corrupted glyphs.

### Step 7: Client-Side Local History
- **Date**: 2026-11-20
- **Status**: Complete & Tested
  - Implemented automatic local history persistence in browser `localStorage` after each successful generation (timestamp, notes snippet title, notes length, and generated flashcards & quiz).
  - Added top header "History" button with dynamic count badge and a dedicated modal browser for viewing, reopening, or deleting past generations.
  - Added prominent "Past Generations" card on the home screen for one-click reopening of previous study sets.
  - Zero backend/server storage footprint: 100% private and client-side with no account or privacy tradeoffs.
  - Verified storage, reopening, single-item deletion, and clear-all operations.

### Step 8: Difficulty Level Selector & Most Important Topics
- **Date**: 2026-11-20
- **Status**: Complete & Tested
  - Added Difficulty Level Selector (Easy / Medium / Hard) 3-way toggle button group before generation.
  - Calibrated Gemini generation prompt to dynamically adapt question complexity and recall depth according to selected difficulty.
  - Extracted 3 to 5 "Most Important Topics" from study material, displayed as a highlighted executive summary card directly alongside flashcards with KaTeX math rendering and difficulty badge.
  - Verified across Easy and Hard test sets with verified topic extraction and calibrated question nuances.

### Step 9: "Match This Format" Exam Paper Emulation
- **Date**: 2026-11-20
- **Status**: Complete & Tested
  - Added optional "Match Exam Question Style" section in frontend with support for uploading reference papers (PDF / TXT up to 25MB) or pasting sample exam questions.
  - Updated backend endpoint to extract reference paper text and provide specialized style-matching guidance to Gemini.
  - Formulates quiz questions with authentic phrasing patterns, assertions (e.g. Roman numerals I, II, III), structure, and distractors matching the reference paper while testing concepts from the student's study notes.
  - Added prominent "Exam Format Matched" indicator on the Quiz tab.
  - Tested with a multi-assertion reference exam paper with 5/5 questions matching the reference paper style.

### Step 10: 70MB PDF Upload Limit & Built-In PDF Compression
- **Date**: 2026-11-23
- **Status**: Complete & Tested
  - Raised maximum PDF and TXT file upload size limit from 25MB to 70MB across backend validation and frontend client controls.
  - Added built-in PDF Compression engine powered by `pikepdf` and `Pillow`, supporting stream optimization, unreferenced object pruning, and intelligent high-resolution image downsampling & JPEG recompression.
  - Implemented `POST /compress-pdf` endpoint accepting files up to 150MB, returning optimized PDF streams and savings metadata headers (`X-Original-Size`, `X-Compressed-Size`, `X-Reduction-Percent`).
  - Added optional "⚡ Compress PDF" action right in the document upload card so users can compress large files before generation, auto-selecting the compressed version for StudyMate and providing an instant download option.
  - Added a dedicated standalone "PDF Compressor Tool" modal accessible from the top navigation bar to shrink files up to 150MB without leaving the site.
  - Verified with real multi-page heavy-image test PDF achieving over 91% file size reduction.

### Step 11: PDF-to-Notes Feature (Structured Revision Notes Engine)
- **Date**: 2026-11-23
- **Status**: Complete & Tested
  - Added a dedicated "Revision Notes" mode alongside "Flashcards & Quiz" on the input screen.
  - Implemented `POST /generate-notes` endpoint in `backend/app.py` capable of processing single excerpts or long chapter-sized documents (e.g. 100 pages) via intelligent paragraph and page-boundary chunking.
  - Generates comprehensive revision notes organized by major headings and subheadings, comprehensive bullet points, highlighted key definition callout blocks (`{"term": "...", "definition": "..."}`), and a high-yield "Quick Revision Summary" at the end.
  - Integrated `POST /export-notes-pdf` endpoint utilizing ReportLab to generate publication-grade, styled revision notes PDF documents with margins, callout tables, and clean typography.
  - Built interactive revision notes UI with section jump pills, one-click "Copy as Text" (clipboard copy), "Download as PDF", and a seamless "Turn into Flashcards" bridge.
  - Added browser localStorage history persistence for revision notes sessions.
  - Verified with comprehensive biological and organic chemistry test suites.

### Step 12: Official NCERT Textbooks Library (Classes 6-12)
- **Date**: 2026-11-23
- **Status**: Complete & Tested
  - Added dedicated "Study Resources" section accessible via top-level navigation toggle between "⚡ AI Study Generator" and "📚 Study Resources".
  - Created structured dataset (`frontend/src/app/data/ncertBooks.ts`) mapping 21 official NCERT textbooks across Classes 6 through 12 in Biology, Physics, Chemistry, Mathematics, and General Science.
  - Sourced 222+ individual chapter PDFs directly from official Government of India public links (`ncert.nic.in/textbook/pdf/...`) and textbook portals (`ncert.nic.in/textbook.php?...`), adhering strictly to legal redistribution and authentic official source requirements.
  - Implemented interactive `NCERTLibrary` component with search filtering (title, subject, key topics, chapter titles), Class filter chips (Classes 6 to 12), and Subject filter chips.
  - Integrated "⚡ Study with AI" action on every chapter that loads chapter context directly into the AI study generator with prefilled prompt instructions and smoothly transitions to generation mode.
  - Verified 100% of URLs point to official `ncert.nic.in` domains; verified clean production Next.js build.

### Step 13: Curated Official Reference Resources for Competitive & Professional Exams
- **Date**: 2026-11-23
- **Status**: Complete & Tested
  - Created structured reference dataset (`frontend/src/app/data/examResources.ts`) covering premier competitive and professional examinations:
    - **CA (Chartered Accountancy)**: ICAI official BoS Knowledge Portal, Foundation/Intermediate/Final study modules, Revision Test Papers (RTPs), Mock Test Papers (MTPs), and question papers with suggested answers.
    - **ACCA (Global Chartered Certified Accountant)**: ACCA Global official student support hub, Applied Knowledge & Skills study guides, Strategic Professional modules, free CBE Practice Platform, and Technical Articles.
    - **CS (Company Secretary)**: ICSI official study material hub, CSEET reading material, Executive & Professional programme textbooks, and official Guideline Answers.
    - **JEE (Main & Advanced)**: NTA JEE Main portal, JEE Advanced archive, official syllabi, and National Test Abhyas mock tests.
    - **NEET (UG)**: NTA NEET official portal, National Medical Commission (NMC) statutory syllabus, past master question papers, and official mock tests.
    - **UPSC Civil Services (CSE)**: UPSC official portal, Prelims & Mains examination syllabi, and multi-year question paper archive.
    - **GATE & CLAT**: IIT GATE syllabus & question papers archive, NPTEL preparation portal, and Consortium of NLUs syllabus and model questions.
  - Sourced 49 verified links directly to statutory governing and examination bodies (zero hosted copyrighted coaching material, mitigating all copyright and redistribution risks).
  - Built interactive `ExamResources` component with category filters ("All", "Accounting & Finance", "Medical", "Engineering", "Civil & Legal"), live search, expandable resource drawers, direct link pills, and copyright integrity notices.
  - Added "⚡ Study with AI" action allowing students to import exam domains directly into StudyMate AI for high-yield flashcard, quiz, or revision note generation.
  - Linked both NCERT Books Library and Competitive Exam Resources under a cohesive "Study Resources" hub sub-navigation.

---

#### Endpoint Reference: `POST /generate-notes`
- **Request Content-Type**: `multipart/form-data` OR `application/json`
- **Input Parameters**:
  - `file` (binary, optional): PDF or TXT chapter document (max 70MB).
  - `text` (string, optional): Pasted study notes or chapter text.
  - `title` (string, optional): Custom title for document.
  - `difficulty` (string, optional): "Easy", "Medium", or "Hard" (default: "Medium").
- **Response Format (`application/json`)**:
  ```json
  {
    "status": "success",
    "document_title": "Chapter 5: Cell Membrane Transport",
    "notes_length": 1845,
    "difficulty": "Medium",
    "sections_count": 3,
    "sections": [
      {
        "heading": "Section 1: Membrane Architecture",
        "subheadings": [
          {
            "title": "Fluid Mosaic Model",
            "bullets": ["Bilayers are amphipathic...", "Integral proteins drift laterally..."],
            "key_definitions": [
              {
                "term": "Fluid Mosaic Model",
                "definition": "Structural model describing the plasma membrane..."
              }
            ]
          }
        ]
      }
    ],
    "quick_revision_summary": [
      "Core takeaway 1...",
      "Core takeaway 2..."
    ],
    "all_key_definitions": [
      {"term": "...", "definition": "..."}
    ],
    "markdown_content": "# Full Markdown formatted document..."
  }
  ```

#### Endpoint Reference: `POST /export-notes-pdf`
- **Request Content-Type**: `application/json`
- **Input Parameters**:
  - `title` (string): Title of document.
  - `sections` (array): Structured sections with headings, subheadings, bullets, and key definitions.
  - `quick_revision_summary` (array): Array of summary takeaways.
  - `difficulty` (string, optional): Difficulty level.
- **Response Format**: Binary `application/pdf` with `Content-Disposition: attachment; filename="<title>_Revision_Notes.pdf"`

#### Endpoint Reference: `POST /compress-pdf`
- **Request Content-Type**: `multipart/form-data`
- **Input Parameters**:
  - `file` (binary, required): PDF document (up to 150MB).
  - `quality` (int, optional, default: 50): Target JPEG image quality (20-90).
  - `max_dimension` (int, optional, default: 1200): Maximum pixel width/height for downsampled figures.
- **Response Format**: Binary `application/pdf` with response headers:
  - `Content-Disposition`: `attachment; filename="<original_name>_compressed.pdf"`
  - `X-Original-Size`: Original byte size.
  - `X-Compressed-Size`: Compressed byte size.
  - `X-Reduction-Percent`: Calculated percentage saved.

#### Endpoint Reference: `POST /generate`
- **Request Content-Type**: `multipart/form-data` OR `application/json`
- **Input Parameters**:
  - `text` (string, optional): Pasted study notes.
  - `file` (binary, optional): Uploaded `.pdf` or `.txt` file (max 70MB).
  - `difficulty` (string, optional): "Easy", "Medium", or "Hard" (default: "Medium").
  - `sample_paper_file` (binary, optional): Uploaded sample question paper (.pdf or .txt, max 70MB).
  - `sample_paper_text` (string, optional): Pasted sample question paper text.
- **Response Format (`application/json`)**:
  ```json
  {
    "status": "success",
    "notes_length": 1273,
    "difficulty": "Medium",
    "format_matched": true,
    "important_topics": [
      "Topic 1: Core principle...",
      "Topic 2: Key formula...",
      "Topic 3: Primary mechanism..."
    ],
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
