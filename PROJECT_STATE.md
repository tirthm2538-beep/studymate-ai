# StudyMate AI — Project State

## Project Goal
StudyMate AI is an AI-powered study assistant that takes a student's own study notes (via PDF upload or pasted text) and leverages AI to generate interactive flashcards and quiz questions, enabling faster, more effective learning.

## Tech Stack
- **Backend**:
  - Python 3.12
  - FastAPI
  - Uvicorn
  - Google Generative AI SDK (`google-generativeai`)
  - `python-dotenv`, `python-multipart`
- **Frontend**:
  - Next.js (App Router)
  - React
  - TypeScript
  - Tailwind CSS

## Progress Log
- **Date**: 2026-11-18
- **Status**: Step 1 complete: skeleton created and verified
  - Backend initialized with virtual environment, dependencies installed, and `/health` endpoint verified (`{"status": "ok"}`).
  - Frontend initialized with Next.js + TypeScript + Tailwind CSS and verified running on `http://localhost:3000`.
