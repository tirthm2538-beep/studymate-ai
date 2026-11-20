"use client";

import { useState, useRef, useEffect } from "react";
import MathText from "./components/MathText";

interface Flashcard {
  front: string;
  back: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer_index: number;
  explanation: string;
}

interface GenerateResponse {
  status: string;
  notes_length: number;
  difficulty?: string;
  format_matched?: boolean;
  important_topics?: string[];
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
}

interface HistoryItem {
  id: string;
  timestamp: number;
  title: string;
  notesLength: number;
  data: GenerateResponse;
}

const SAMPLE_NOTES = `Cellular Respiration and Photosynthesis:
Photosynthesis occurs in chloroplasts where plants absorb light energy via chlorophyll. 
Light reactions convert H2O and light into ATP and NADPH, releasing O2 as a byproduct. 
The Calvin cycle (light-independent reactions) uses ATP and NADPH to fix CO2 into glucose.
Cellular respiration takes place in the mitochondria to break down glucose into ATP. 
Its four main stages are Glycolysis (cytoplasm, anaerobic), Pyruvate oxidation, Krebs Cycle (citric acid cycle), and Oxidative Phosphorylation (electron transport chain, producing ~30-32 ATP).`;

const SAMPLE_MATH_NOTES = `Calculus and Algebra Study Notes:
1. Fundamental Theorem of Calculus: If f is continuous on [a, b] and F'(x) = f(x), then \\int_a^b f(x) dx = F(b) - F(a).
2. Derivative Power Rule: \\frac{d}{dx}[x^n] = n x^{n-1}. For example, \\frac{d}{dx}[x^3] = 3x^2.
3. Quadratic Formula: For any equation ax^2 + bx + c = 0, the solutions are x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}.
4. Euler's Identity: e^{i \\pi} + 1 = 0, connecting fundamental constants e, i, \\pi, 1, and 0.
5. Linear Algebra Matrix Determinant: For 2x2 matrix [[a, b], [c, d]], det(A) = ad - bc. The matrix is invertible if det(A) \\neq 0.`;

export default function StudyMateApp() {
  const [notesText, setNotesText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [data, setData] = useState<GenerateResponse | null>(null);

  // Active view tab
  const [activeTab, setActiveTab] = useState<"flashcards" | "quiz">("flashcards");

  // Difficulty level toggle state
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");

  // Flashcards state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Quiz state
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [quizFinished, setQuizFinished] = useState(false);

  // Local History state (browser-only, strictly client-side)
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Match Question Paper Format state
  const [samplePaperFile, setSamplePaperFile] = useState<File | null>(null);
  const [samplePaperText, setSamplePaperText] = useState("");
  const [showSamplePaperInput, setShowSamplePaperInput] = useState(false);
  const samplePaperInputRef = useRef<HTMLInputElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history from localStorage on initial render
  useEffect(() => {
    try {
      const raw = localStorage.getItem("studymate_local_history_v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      }
    } catch (e) {
      console.warn("Unable to load history from localStorage:", e);
    }
  }, []);

  // Save item to browser localStorage
  const saveHistoryRecord = (newItem: HistoryItem) => {
    setHistory((prev) => {
      const updated = [newItem, ...prev.filter((h) => h.id !== newItem.id)].slice(0, 25);
      try {
        localStorage.setItem("studymate_local_history_v1", JSON.stringify(updated));
      } catch (e) {
        console.warn("Failed to write history to localStorage:", e);
      }
      return updated;
    });
  };

  const deleteHistoryRecord = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setHistory((prev) => {
      const updated = prev.filter((h) => h.id !== id);
      try {
        localStorage.setItem("studymate_local_history_v1", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearAllHistory = () => {
    if (window.confirm("Clear all locally stored study sets? This action is irreversible.")) {
      setHistory([]);
      try {
        localStorage.removeItem("studymate_local_history_v1");
      } catch {}
    }
  };

  const openHistoryRecord = (item: HistoryItem) => {
    setData(item.data);
    setActiveTab("flashcards");
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setCurrentQuizIndex(0);
    setSelectedAnswers({});
    setQuizFinished(false);
    setShowHistoryModal(false);
    setErrorMessage(null);
  };

  // Reset flip when card index changes
  useEffect(() => {
    setIsFlipped(false);
  }, [currentCardIndex]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = [".pdf", ".txt"];
      const hasValidExt = validTypes.some((ext) => file.name.toLowerCase().endsWith(ext));

      if (!hasValidExt) {
        setErrorMessage("Please select a valid PDF (.pdf) or text (.txt) file.");
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        setErrorMessage("File exceeds 25MB limit.");
        return;
      }

      setSelectedFile(file);
      setErrorMessage(null);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle sample question paper selection
  const handleSamplePaperChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = [".pdf", ".txt"];
      const hasValidExt = validTypes.some((ext) => file.name.toLowerCase().endsWith(ext));

      if (!hasValidExt) {
        setErrorMessage("Sample paper must be a valid PDF (.pdf) or text (.txt) file.");
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        setErrorMessage("Sample paper exceeds 25MB limit.");
        return;
      }
      setSamplePaperFile(file);
      setErrorMessage(null);
    }
  };

  const removeSamplePaper = () => {
    setSamplePaperFile(null);
    if (samplePaperInputRef.current) {
      samplePaperInputRef.current.value = "";
    }
  };

  // Generate handler
  const handleGenerate = async () => {
    setErrorMessage(null);

    if (!notesText.trim() && !selectedFile) {
      setErrorMessage("Please enter your study notes or upload a PDF/TXT file.");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      if (notesText.trim()) {
        formData.append("text", notesText.trim());
      }
      if (selectedFile) {
        formData.append("file", selectedFile);
      }
      formData.append("difficulty", difficulty);
      if (samplePaperFile) {
        formData.append("sample_paper_file", samplePaperFile);
      }
      if (samplePaperText.trim()) {
        formData.append("sample_paper_text", samplePaperText.trim());
      }

      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const cleanBaseUrl = apiBaseUrl.replace(/\/+$/, "");

      const res = await fetch(`${cleanBaseUrl}/generate`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const detail = errorData?.detail || `Server error (${res.status})`;
        throw new Error(detail);
      }

      const responseData: GenerateResponse = await res.json();
      setData(responseData);

      // Save lightweight record to browser's localStorage (purely client-side)
      const snippet = notesText.trim()
        ? notesText.trim().replace(/\s+/g, " ").slice(0, 60) + (notesText.trim().length > 60 ? "..." : "")
        : (selectedFile ? selectedFile.name : "Study Notes Session");

      saveHistoryRecord({
        id: Date.now().toString(),
        timestamp: Date.now(),
        title: snippet,
        notesLength: responseData.notes_length,
        data: responseData,
      });

      setActiveTab("flashcards");
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setCurrentQuizIndex(0);
      setSelectedAnswers({});
      setQuizFinished(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred. Please verify backend connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Reset all to input new notes
  const handleReset = () => {
    setData(null);
    setNotesText("");
    setSelectedFile(null);
    setErrorMessage(null);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setCurrentQuizIndex(0);
    setSelectedAnswers({});
    setQuizFinished(false);
    setSamplePaperFile(null);
    setSamplePaperText("");
    if (samplePaperInputRef.current) {
      samplePaperInputRef.current.value = "";
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Flashcards navigation
  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  const nextCard = () => {
    if (data && currentCardIndex < data.flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  // Quiz navigation and answer selection
  const handleSelectOption = (optionIndex: number) => {
    if (selectedAnswers[currentQuizIndex] !== undefined) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuizIndex]: optionIndex,
    }));
  };

  const nextQuizQuestion = () => {
    if (!data) return;
    if (currentQuizIndex < data.quiz.length - 1) {
      setCurrentQuizIndex(currentQuizIndex + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const restartQuiz = () => {
    setCurrentQuizIndex(0);
    setSelectedAnswers({});
    setQuizFinished(false);
  };

  // Calculate quiz score
  const calculateScore = () => {
    if (!data) return 0;
    let score = 0;
    data.quiz.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correct_answer_index) {
        score++;
      }
    });
    return score;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 1. Header & Branding */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold text-xl shadow-sm">
              S
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">StudyMate AI</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200/60 uppercase tracking-wide">
                  Live
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Instant AI-powered flashcards & quizzes from your personal study notes
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setShowHistoryModal(true)}
              className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-indigo-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors bg-white hover:bg-indigo-50/50 cursor-pointer flex items-center space-x-1.5 shadow-xs"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>History</span>
              {history.length > 0 && (
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-0.5">
                  {history.length}
                </span>
              )}
            </button>

            {data && (
              <button
                onClick={handleReset}
                className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-indigo-600 px-3.5 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors bg-white hover:bg-indigo-50/50 cursor-pointer flex items-center space-x-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Generate New Set</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:px-6">
        {/* Error notification banner */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start justify-between shadow-xs">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-red-700 font-bold ml-4 cursor-pointer"
            >
              &times;
            </button>
          </div>
        )}

        {/* View 1: Notes Input & Upload Section */}
        {!data && (
          <div className="space-y-6">
            {/* Branding Hero Banner */}
            <div className="text-center max-w-2xl mx-auto pt-2 pb-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold mb-4">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                <span>Powered by Google Gemini</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Study smarter, not harder with <span className="text-indigo-600">StudyMate AI</span>
              </h1>
              <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
                Transform your lecture notes, summaries, or textbook PDFs into high-yield flashcards and practice quizzes in seconds.
              </p>
            </div>

            {/* Input Form Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
              {/* Text Area */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-slate-800">
                    Paste Study Notes
                  </label>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setNotesText(SAMPLE_NOTES)}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                    >
                      Load Biology Sample
                    </button>
                    <span className="text-slate-300 text-xs">•</span>
                    <button
                      type="button"
                      onClick={() => setNotesText(SAMPLE_MATH_NOTES)}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                    >
                      Load Math Sample
                    </button>
                  </div>
                </div>
                <textarea
                  rows={7}
                  disabled={isLoading}
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Paste your notes, lecture takeaways, or textbook excerpts here (e.g. Photosynthesis, Newton's Laws, Organic Chemistry reactions)..."
                  className="w-full px-4 py-3 text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm transition-all placeholder:text-slate-400 resize-y"
                />
              </div>

              {/* File Upload Section */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">
                  Or Upload Document (PDF or .txt)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt"
                  disabled={isLoading}
                  onChange={handleFileChange}
                  className="hidden"
                  id="note-file-upload"
                />

                {!selectedFile ? (
                  <label
                    htmlFor="note-file-upload"
                    className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-6 cursor-pointer bg-slate-50 hover:bg-indigo-50/30 transition-all text-center group"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center text-indigo-600 mb-2 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600">
                      Click to upload notes document
                    </span>
                    <span className="text-xs text-slate-500 mt-1">Supports PDF or TXT up to 25MB</span>
                  </label>
                ) : (
                  <div className="flex items-center justify-between p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl">
                    <div className="flex items-center space-x-3 truncate">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold uppercase shrink-0">
                        {selectedFile.name.endsWith(".pdf") ? "PDF" : "TXT"}
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-medium text-slate-800 truncate">{selectedFile.name}</p>
                        <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      disabled={isLoading}
                      className="text-xs text-red-600 hover:text-red-800 font-semibold px-2 py-1 rounded-md hover:bg-red-100 transition-colors ml-2 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Difficulty Level Selector */}
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-2">
                  Select Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => setDifficulty("Easy")}
                    className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                      difficulty === "Easy"
                        ? "bg-white text-emerald-700 shadow-xs border border-emerald-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Easy</span>
                  </button>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => setDifficulty("Medium")}
                    className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                      difficulty === "Medium"
                        ? "bg-white text-indigo-700 shadow-xs border border-indigo-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    <span>Medium</span>
                  </button>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => setDifficulty("Hard")}
                    className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                      difficulty === "Hard"
                        ? "bg-white text-purple-700 shadow-xs border border-purple-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    <span>Hard</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  {difficulty === "Easy" && "🟢 Foundational definitions, core terms & straightforward recall."}
                  {difficulty === "Medium" && "🔵 Balanced conceptual understanding, application & key mechanisms."}
                  {difficulty === "Hard" && "🟣 Deep analytical thinking, multi-step problem solving & advanced nuance."}
                </p>
              </div>

              {/* Match Exam Format Option (Collapsible / Toggle) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/60 transition-all">
                <button
                  type="button"
                  onClick={() => setShowSamplePaperInput(!showSamplePaperInput)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left text-xs sm:text-sm font-semibold text-slate-800 hover:bg-slate-100/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-base">🎯</span>
                    <span>Match Exam Question Style (Optional)</span>
                    {(samplePaperFile || samplePaperText.trim()) && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                        Active
                      </span>
                    )}
                  </div>
                  <span className="text-slate-400 text-xs">
                    {showSamplePaperInput ? "Hide ▲" : "Configure ▼"}
                  </span>
                </button>

                {showSamplePaperInput && (
                  <div className="p-4 pt-1 border-t border-slate-200/80 space-y-3 bg-white">
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Upload or paste a past paper or sample exam. Gemini will model question phrasing, tone, and structure to match your exam.
                    </p>

                    {/* File Upload for Sample Paper */}
                    <div>
                      <input
                        ref={samplePaperInputRef}
                        type="file"
                        accept=".pdf,.txt"
                        disabled={isLoading}
                        onChange={handleSamplePaperChange}
                        className="hidden"
                        id="sample-paper-upload"
                      />

                      {!samplePaperFile ? (
                        <label
                          htmlFor="sample-paper-upload"
                          className="flex items-center justify-center space-x-2 border border-dashed border-slate-300 hover:border-indigo-400 rounded-lg p-2.5 cursor-pointer bg-slate-50 hover:bg-indigo-50/20 text-xs text-slate-600 transition-colors"
                        >
                          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          <span>Upload Sample Paper (PDF or TXT up to 25MB)</span>
                        </label>
                      ) : (
                        <div className="flex items-center justify-between p-2.5 bg-indigo-50/60 border border-indigo-200 rounded-lg text-xs">
                          <span className="font-medium text-slate-800 truncate">
                            📄 {samplePaperFile.name} ({(samplePaperFile.size / 1024).toFixed(1)} KB)
                          </span>
                          <button
                            type="button"
                            onClick={removeSamplePaper}
                            className="text-red-600 hover:text-red-800 font-semibold ml-2 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Or paste sample questions */}
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                        Or paste sample questions directly:
                      </span>
                      <textarea
                        rows={3}
                        disabled={isLoading}
                        value={samplePaperText}
                        onChange={(e) => setSamplePaperText(e.target.value)}
                        placeholder="Paste 1-3 typical questions from your syllabus or past exams (e.g. '1. Which of the following statements is correct...?')..."
                        className="w-full px-3 py-2 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-y placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold shadow-md shadow-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 text-base cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Analyzing notes & generating study set...</span>
                    </>
                  ) : (
                    <span>Generate Flashcards & Quiz</span>
                  )}
                </button>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm mb-2">
                  🗂️
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">Interactive Flashcards</h3>
                <p className="text-xs text-slate-500 mt-1">Active recall cards covering key terms and core concepts.</p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm mb-2">
                  📝
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">Self-Paced Quizzes</h3>
                <p className="text-xs text-slate-500 mt-1">Multiple-choice questions with instant feedback & explanations.</p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm mb-2">
                  ⚡
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">Instant Processing</h3>
                <p className="text-xs text-slate-500 mt-1">Upload lecture slides, summaries, or syllabi up to 25MB.</p>
              </div>
            </div>

            {/* Past Generations (Local Browser History) */}
            {history.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-base font-bold text-slate-900">Past Generations</span>
                    <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full border border-indigo-200/60">
                      {history.length} saved
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={clearAllHistory}
                    className="text-xs text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    Clear History
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {history.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => openHistoryRecord(item)}
                      className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer group flex flex-col justify-between space-y-3 bg-slate-50/50"
                    >
                      <div className="space-y-1">
                        <div className="flex items-start justify-between">
                          <h4 className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 line-clamp-1 transition-colors">
                            {item.title}
                          </h4>
                          <button
                            type="button"
                            onClick={(e) => deleteHistoryRecord(item.id, e)}
                            className="text-slate-300 hover:text-red-500 ml-2 p-0.5 rounded transition-colors"
                            title="Delete this set"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-xs text-slate-400">
                          {new Date(item.timestamp).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                        <span className="font-medium text-indigo-700">
                          {item.data.flashcards.length} cards &bull; {item.data.quiz.length} questions
                        </span>
                        <span className="text-indigo-600 font-semibold group-hover:underline flex items-center space-x-1">
                          <span>Reopen</span>
                          <span>&rarr;</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100">
                  <span>🔒 Saved strictly in your browser (localStorage). No server storage or privacy tradeoff.</span>
                  {history.length > 4 && (
                    <button
                      type="button"
                      onClick={() => setShowHistoryModal(true)}
                      className="text-indigo-600 hover:underline font-semibold cursor-pointer"
                    >
                      View all {history.length} sets &rarr;
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* View 2: Study Materials (Flashcards & Quiz Tabs) */}
        {data && (
          <div className="space-y-6">
            {/* Tabs Header */}
            <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-6 pt-4 space-x-8 shadow-xs">
              <button
                onClick={() => setActiveTab("flashcards")}
                className={`pb-3.5 text-sm font-semibold transition-all cursor-pointer relative ${
                  activeTab === "flashcards"
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Flashcards ({data.flashcards.length})
              </button>
              <button
                onClick={() => setActiveTab("quiz")}
                className={`pb-3.5 text-sm font-semibold transition-all cursor-pointer relative ${
                  activeTab === "quiz"
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Quiz ({data.quiz.length} Questions)
              </button>
            </div>

            {/* Tab Content: Flashcards */}
            {activeTab === "flashcards" && (
              <div className="space-y-6">
                {/* Most Important Topics Highlight */}
                {data.important_topics && data.important_topics.length > 0 && (
                  <div className="bg-white border border-amber-200/90 rounded-2xl p-5 shadow-xs bg-gradient-to-br from-amber-50/50 via-white to-indigo-50/30">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-amber-500 text-base">⭐</span>
                        <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
                          Most Important Topics
                        </h3>
                        <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200">
                          {data.important_topics.length} Key Takeaways
                        </span>
                      </div>
                      {data.difficulty && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {data.difficulty} Mode
                        </span>
                      )}
                    </div>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {data.important_topics.map((topic, tIdx) => (
                        <li
                          key={tIdx}
                          className="flex items-start space-x-2 p-2.5 rounded-xl bg-white/90 border border-amber-100 shadow-2xs text-xs text-slate-800"
                        >
                          <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-900 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                            {tIdx + 1}
                          </span>
                          <div className="flex-1 leading-snug">
                            <MathText content={topic} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
                    <span>
                      Card {currentCardIndex + 1} of {data.flashcards.length}
                    </span>
                    <span>Click card or press flip to reveal answer</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${((currentCardIndex + 1) / data.flashcards.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Flip Card Container */}
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl shadow-sm min-h-[300px] p-8 flex flex-col justify-between items-center text-center cursor-pointer transition-all duration-200 select-none group"
                >
                  <div className="w-full flex justify-between items-center">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                        isFlipped
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                      }`}
                    >
                      {isFlipped ? "Answer / Back" : "Question / Front"}
                    </span>
                    <span className="text-xs text-slate-400 group-hover:text-indigo-600 transition-colors flex items-center space-x-1">
                      <svg className="w-3.5 h-3.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Click to flip</span>
                    </span>
                  </div>

                  <div className="my-auto py-6 px-4 max-w-xl">
                    <div className={`text-slate-900 leading-relaxed ${isFlipped ? "text-lg text-slate-800" : "text-xl sm:text-2xl font-semibold"}`}>
                      <MathText
                        content={
                          isFlipped
                            ? data.flashcards[currentCardIndex].back
                            : data.flashcards[currentCardIndex].front
                        }
                      />
                    </div>
                  </div>

                  <div className="text-xs text-slate-400">
                    Use Previous / Next buttons below to move across cards
                  </div>
                </div>

                {/* Card Navigation Controls */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={prevCard}
                    disabled={currentCardIndex === 0}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors cursor-pointer"
                  >
                    &larr; Previous
                  </button>

                  <button
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="px-5 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold text-sm hover:bg-indigo-100 transition-colors cursor-pointer"
                  >
                    {isFlipped ? "Show Question" : "Reveal Answer"}
                  </button>

                  <button
                    onClick={nextCard}
                    disabled={currentCardIndex === data.flashcards.length - 1}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors cursor-pointer"
                  >
                    Next &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* Tab Content: Quiz */}
            {activeTab === "quiz" && (
              <div className="space-y-6">
                {!quizFinished ? (
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
                    {/* Exam Style Match Badge */}
                    {data.format_matched && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200/90 rounded-xl text-xs text-emerald-900 flex items-center space-x-2.5 shadow-2xs">
                        <span className="text-base">🎯</span>
                        <div>
                          <span className="font-bold">Exam Question Style Matched:</span>{" "}
                          <span>Phrasing, structure, and distractors modeled after your reference question paper.</span>
                        </div>
                      </div>
                    )}

                    {/* 2. Progress Indicator on the Quiz */}
                    <div className="space-y-3 pb-2 border-b border-slate-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                            Question {currentQuizIndex + 1} of {data.quiz.length}
                          </span>
                          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                            ({Math.round(((currentQuizIndex + 1) / data.quiz.length) * 100)}% complete)
                          </span>
                        </div>
                        <span className="text-xs text-slate-600 font-semibold">
                          Current Score: {calculateScore()} / {Object.keys(selectedAnswers).length}
                        </span>
                      </div>

                      {/* Visual progress bar */}
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
                          style={{
                            width: `${((currentQuizIndex + 1) / data.quiz.length) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Question text */}
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                      <MathText content={data.quiz[currentQuizIndex].question} />
                    </h3>

                    {/* Options list */}
                    <div className="space-y-3">
                      {data.quiz[currentQuizIndex].options.map((option, optIdx) => {
                        const hasAnswered = selectedAnswers[currentQuizIndex] !== undefined;
                        const isSelected = selectedAnswers[currentQuizIndex] === optIdx;
                        const isCorrect = optIdx === data.quiz[currentQuizIndex].correct_answer_index;

                        let optionStyle = "border-slate-200 bg-slate-50 hover:bg-indigo-50/40 hover:border-indigo-300 text-slate-800";

                        if (hasAnswered) {
                          if (isCorrect) {
                            optionStyle = "border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold shadow-xs";
                          } else if (isSelected) {
                            optionStyle = "border-red-400 bg-red-50 text-red-900 font-semibold shadow-xs";
                          } else {
                            optionStyle = "border-slate-200 bg-slate-50/50 text-slate-400 opacity-70";
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            disabled={hasAnswered}
                            onClick={() => handleSelectOption(optIdx)}
                            className={`w-full p-4 rounded-xl border text-left text-sm sm:text-base transition-all flex items-start space-x-3 cursor-pointer ${optionStyle} ${
                              hasAnswered ? "cursor-default" : ""
                            }`}
                          >
                            <span className="w-6 h-6 rounded-md border border-current flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="flex-1">
                              <MathText content={option} />
                            </span>
                            {hasAnswered && isCorrect && (
                              <svg className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            {hasAnswered && isSelected && !isCorrect && (
                              <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanation Reveal */}
                    {selectedAnswers[currentQuizIndex] !== undefined && (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm space-y-1 animate-fadeIn">
                        <span className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                          Explanation:
                        </span>
                        <div className="text-slate-600 leading-relaxed">
                          <MathText content={data.quiz[currentQuizIndex].explanation} />
                        </div>
                      </div>
                    )}

                    {/* Next Question button */}
                    <div className="pt-2 flex justify-between items-center">
                      <button
                        onClick={restartQuiz}
                        className="text-xs font-medium text-slate-500 hover:text-slate-700 underline cursor-pointer"
                      >
                        Restart this quiz
                      </button>

                      <button
                        onClick={nextQuizQuestion}
                        disabled={selectedAnswers[currentQuizIndex] === undefined}
                        className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        {currentQuizIndex < data.quiz.length - 1 ? "Next Question →" : "Finish Quiz"}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* 3. Quiz Score Final Screen with Try Again & Generate New Set */
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center space-y-6">
                    <div className="w-20 h-20 rounded-2xl bg-indigo-50 border border-indigo-200 flex flex-col items-center justify-center mx-auto text-indigo-600 shadow-xs">
                      <span className="text-2xl font-black">
                        {calculateScore()}/{data.quiz.length}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                        Score
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-2xl font-extrabold text-slate-900">Quiz Completed!</h3>
                      <p className="text-slate-600 text-sm">
                        You scored <span className="font-bold text-slate-900">{calculateScore()}</span> out of{" "}
                        <span className="font-bold text-slate-900">{data.quiz.length}</span> (
                        {Math.round((calculateScore() / data.quiz.length) * 100)}%)
                      </p>
                      <p className="text-xs text-slate-400">
                        {calculateScore() === data.quiz.length
                          ? "🎉 Perfect score! You've mastered this material."
                          : calculateScore() >= data.quiz.length / 2
                          ? "👍 Solid effort! Review the flashcards or try again to aim for 100%."
                          : "📚 Keep reviewing your notes and give it another try!"}
                      </p>
                    </div>

                    {/* Action buttons: Try Again / Generate New Set / Review Flashcards */}
                    <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                      <button
                        onClick={restartQuiz}
                        className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition-colors cursor-pointer flex items-center space-x-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Try Again</span>
                      </button>

                      <button
                        onClick={handleReset}
                        className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-sm transition-colors cursor-pointer flex items-center space-x-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Generate New Set</span>
                      </button>

                      <button
                        onClick={() => setActiveTab("flashcards")}
                        className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm shadow-xs transition-colors cursor-pointer"
                      >
                        Review Flashcards
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-5xl mx-auto px-4 text-center text-xs text-slate-400">
          StudyMate AI &bull; Built with Next.js, FastAPI &amp; Google Gemini
        </div>
      </footer>

      {/* Local History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Study History</h3>
                  <p className="text-xs text-slate-500">
                    {history.length} {history.length === 1 ? "set" : "sets"} saved locally in your browser
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {history.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center text-xl">
                    📚
                  </div>
                  <h4 className="font-semibold text-slate-700 text-sm">No Study History Yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Generate flashcards and quizzes from your notes. Each session is saved right here in your browser for instant recall.
                  </p>
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => openHistoryRecord(item)}
                    className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 transition-all cursor-pointer flex items-center justify-between group bg-slate-50/30"
                  >
                    <div className="min-w-0 flex-1 pr-4 space-y-1">
                      <h4 className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 truncate transition-colors">
                        {item.title}
                      </h4>
                      <div className="flex items-center space-x-3 text-xs text-slate-500">
                        <span>
                          {new Date(item.timestamp).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span>&bull;</span>
                        <span className="font-medium text-indigo-700">
                          {item.data.flashcards.length} cards, {item.data.quiz.length} questions
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 group-hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200/60 transition-colors">
                        Reopen &rarr;
                      </span>
                      <button
                        type="button"
                        onClick={(e) => deleteHistoryRecord(item.id, e)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                🔒 Client-only storage: data is kept in browser localStorage.
              </span>
              <div className="flex items-center space-x-2">
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllHistory}
                    className="text-red-600 hover:text-red-700 font-semibold px-2 py-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
