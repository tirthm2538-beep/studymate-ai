"use client";

import { useState, useMemo } from "react";
import { NCERT_BOOKS, NCERTBook, NCERTChapter } from "../data/ncertBooks";

interface NCERTLibraryProps {
  onStudyChapter?: (bookTitle: string, chapterTitle: string, chapterUrl: string) => void;
}

export default function NCERTLibrary({ onStudyChapter }: NCERTLibraryProps) {
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null);

  const classes = [12, 11, 10, 9, 8, 7, 6];
  const subjects = ["All", "Biology", "Physics", "Chemistry", "Mathematics", "Science"];

  const filteredBooks = useMemo(() => {
    return NCERT_BOOKS.filter((book) => {
      // Class filter
      if (selectedClass !== null && book.classNumber !== selectedClass) {
        return false;
      }
      // Subject filter
      if (selectedSubject !== null && selectedSubject !== "All" && book.subject !== selectedSubject) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = book.title.toLowerCase().includes(q);
        const matchesClass = book.className.toLowerCase().includes(q);
        const matchesSubject = book.subject.toLowerCase().includes(q);
        const matchesTopics = book.keyTopics.some((t) => t.toLowerCase().includes(q));
        const matchesChapters = book.chapters.some((c) => c.title.toLowerCase().includes(q));
        if (!matchesTitle && !matchesClass && !matchesSubject && !matchesTopics && !matchesChapters) {
          return false;
        }
      }
      return true;
    });
  }, [selectedClass, selectedSubject, searchQuery]);

  const toggleExpand = (bookId: string) => {
    setExpandedBookId((prev) => (prev === bookId ? null : bookId));
  };

  return (
    <div className="space-y-6">
      {/* Attribution & Legal Notice Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50/50 to-white border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start space-x-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-lg shrink-0 shadow-2xs">
            🇮🇳
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm text-slate-900 tracking-tight">
                Official NCERT Textbooks Library
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                Official Public PDFs
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Freely published by the Government of India (ncert.nic.in). Directly linked to official NCERT servers for one-click access and AI study synthesis.
            </p>
          </div>
        </div>

        <a
          href="https://ncert.nic.in/textbook.php"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-indigo-700 hover:text-indigo-900 font-semibold flex items-center space-x-1 shrink-0 bg-white px-3 py-1.5 rounded-lg border border-indigo-200 shadow-2xs hover:bg-indigo-50 transition-colors"
        >
          <span>ncert.nic.in portal</span>
          <span>&nearr;</span>
        </a>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <svg className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by book name, subject, or chapter (e.g. 'Genetics', 'Current Electricity', 'Calculus')..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-slate-800 placeholder:text-slate-400 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold px-1.5 py-0.5 rounded cursor-pointer"
            >
              &times;
            </button>
          )}
        </div>

        {/* Class Filter Pills */}
        <div>
          <span className="text-xs font-semibold text-slate-500 block mb-1.5">Select Class:</span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedClass(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedClass === null
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Classes
            </button>
            {classes.map((cls) => (
              <button
                key={cls}
                type="button"
                onClick={() => setSelectedClass(selectedClass === cls ? null : cls)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedClass === cls
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Class {cls}
              </button>
            ))}
          </div>
        </div>

        {/* Subject Filter Pills */}
        <div>
          <span className="text-xs font-semibold text-slate-500 block mb-1.5">Select Subject:</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {subjects.map((sub) => {
              const isSelected = (selectedSubject === null && sub === "All") || selectedSubject === sub;
              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSelectedSubject(sub === "All" ? null : sub)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {sub}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Books Count & Results Grid */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
        <span>
          Showing {filteredBooks.length} {filteredBooks.length === 1 ? "NCERT Textbook" : "NCERT Textbooks"}
        </span>
        {(selectedClass !== null || (selectedSubject !== null && selectedSubject !== "All") || searchQuery) && (
          <button
            type="button"
            onClick={() => {
              setSelectedClass(null);
              setSelectedSubject(null);
              setSearchQuery("");
            }}
            className="text-indigo-600 hover:underline cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>

      {filteredBooks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
          <div className="text-3xl">📚</div>
          <h4 className="font-bold text-slate-800 text-sm">No textbooks found matching your search</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query, selecting "All Classes", or clearing filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBooks.map((book) => {
            const isExpanded = expandedBookId === book.id;
            return (
              <div
                key={book.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                <div className="p-5 space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{book.icon}</span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold border border-indigo-200/60">
                        {book.className}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
                        {book.subject}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {book.chapters.length} Chapters
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                      {book.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {book.description}
                    </p>
                  </div>

                  {/* Key Topics Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {book.keyTopics.map((topic, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-[10px] font-medium bg-slate-50 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200/70"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                  <a
                    href={book.officialPortalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer"
                    title="Open complete textbook portal on NCERT website"
                  >
                    <span>Official Portal</span>
                    <span>&nearr;</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => toggleExpand(book.id)}
                    className="px-3 py-1.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1 shadow-2xs"
                  >
                    <span>{isExpanded ? "Hide Chapters ▲" : `Browse ${book.chapters.length} Chapters ▼`}</span>
                  </button>
                </div>

                {/* Expanded Chapter Drawer */}
                {isExpanded && (
                  <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2 max-h-80 overflow-y-auto animate-fadeIn">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200 text-xs font-semibold text-slate-500">
                      <span>Official NCERT Chapter PDFs:</span>
                      <span className="text-[10px] text-slate-400">Direct ncert.nic.in links</span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      {book.chapters.map((chap) => (
                        <div
                          key={chap.number}
                          className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 flex items-center justify-between gap-2 text-xs transition-colors group"
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                              {chap.number}
                            </span>
                            <span className="font-medium text-slate-800 truncate">
                              {chap.title}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1.5 shrink-0">
                            {onStudyChapter && (
                              <button
                                type="button"
                                onClick={() => onStudyChapter(book.title, chap.title, chap.pdfUrl)}
                                className="px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-semibold transition-colors cursor-pointer"
                                title="Open this chapter in StudyMate AI to generate flashcards or notes"
                              >
                                ⚡ Study with AI
                              </button>
                            )}

                            <a
                              href={chap.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 text-[11px] font-semibold transition-colors flex items-center space-x-0.5"
                              title="Open official NCERT PDF in new tab"
                            >
                              <span>Read PDF</span>
                              <span>&nearr;</span>
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
