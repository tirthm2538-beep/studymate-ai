"use client";

import { useState, useMemo } from "react";
import { EXAM_RESOURCES, ExamCategory, ExamResource } from "../data/examResources";

interface ExamResourcesProps {
  onPrepareExam?: (examName: string, topics: string[], portalUrl: string) => void;
}

export default function ExamResources({ onPrepareExam }: ExamResourcesProps) {
  const [selectedCategory, setSelectedCategory] = useState<ExamCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedExamId, setExpandedExamId] = useState<string | null>(null);

  const categories: ExamCategory[] = [
    "All",
    "Accounting & Finance",
    "Medical",
    "Engineering",
    "Civil & Legal",
  ];

  const filteredExams = useMemo(() => {
    return EXAM_RESOURCES.filter((exam) => {
      // Category filter
      if (selectedCategory !== "All" && exam.category !== selectedCategory) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = exam.name.toLowerCase().includes(q);
        const matchesCode = exam.shortCode.toLowerCase().includes(q);
        const matchesBody = exam.governingBody.toLowerCase().includes(q);
        const matchesDesc = exam.description.toLowerCase().includes(q);
        const matchesTopics = exam.keyTopics.some((t) => t.toLowerCase().includes(q));
        const matchesLinks = exam.links.some(
          (l) => l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q)
        );
        if (!matchesName && !matchesCode && !matchesBody && !matchesDesc && !matchesTopics && !matchesLinks) {
          return false;
        }
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedExamId((prev) => (prev === id ? null : id));
  };

  const getLinkTypeBadge = (type: string) => {
    switch (type) {
      case "syllabus":
        return { label: "Syllabus", bg: "bg-blue-50 text-blue-700 border-blue-200", icon: "📋" };
      case "pyq":
        return { label: "Past Papers", bg: "bg-purple-50 text-purple-700 border-purple-200", icon: "📝" };
      case "study-material":
        return { label: "Study Material", bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: "📚" };
      case "mock-test":
        return { label: "Mock Test", bg: "bg-amber-50 text-amber-700 border-amber-200", icon: "⏱️" };
      case "portal":
      default:
        return { label: "Official Portal", bg: "bg-slate-100 text-slate-700 border-slate-200", icon: "🌐" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Copyright Disclaimer & Integrity Notice Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-white border border-emerald-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl shrink-0 shadow-2xs">
              🛡️
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900 tracking-tight">
                  100% Official &amp; Free Public Exam Resources
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                  Zero Copyrighted Coaching Files
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                StudyMate AI connects directly to statutory exam bodies (NTA, ICAI, ACCA Global, ICSI, UPSC, and IITs). We never host or redistribute proprietary coaching publisher materials — every reference links out to verified, legal, and free public portals.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Controls */}
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
            placeholder="Search exams, subjects, or bodies (e.g. 'CA Foundation', 'NEET Biology', 'ACCA', 'ICSI', 'JEE Physics')..."
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

        {/* Category Pills */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Filter by Exam Category:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => {
              const count =
                cat === "All"
                  ? EXAM_RESOURCES.length
                  : EXAM_RESOURCES.filter((e) => e.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                    selectedCategory === cat
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      selectedCategory === cat
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results Count & Current Filter Summary */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <span className="font-bold text-slate-800">{filteredExams.length}</span> competitive &amp; professional examinations
          {selectedCategory !== "All" && (
            <span> in <span className="font-semibold text-indigo-600">{selectedCategory}</span></span>
          )}
          {searchQuery && (
            <span> matching &ldquo;<span className="font-semibold text-slate-700">{searchQuery}</span>&rdquo;</span>
          )}
        </span>
        {(selectedCategory !== "All" || searchQuery) && (
          <button
            onClick={() => {
              setSelectedCategory("All");
              setSearchQuery("");
            }}
            className="text-indigo-600 hover:underline font-semibold cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Exam Cards Grid */}
      {filteredExams.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 space-y-3">
          <div className="text-4xl">🔍</div>
          <h3 className="font-bold text-slate-800 text-base">No examinations found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No exams match your search query or filter. Try a broader term like &quot;CA&quot;, &quot;NEET&quot;, &quot;ACCA&quot;, or &quot;Engineering&quot;.
          </p>
          <button
            onClick={() => {
              setSelectedCategory("All");
              setSearchQuery("");
            }}
            className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 transition-colors cursor-pointer"
          >
            Clear Search &amp; Show All
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filteredExams.map((exam) => {
            const isExpanded = expandedExamId === exam.id;
            return (
              <div
                key={exam.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all overflow-hidden"
              >
                {/* Exam Card Top Header */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start space-x-3.5">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-2xl shrink-0 shadow-2xs">
                        {exam.icon}
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
                            {exam.name}
                          </h3>
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold">
                            {exam.shortCode}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-medium">
                            {exam.category}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                          <span className="font-semibold text-slate-700">{exam.governingBody}</span>
                          <span>&bull;</span>
                          <span className="text-emerald-700 font-medium">{exam.officialBadge}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons on top right */}
                    <div className="flex items-center space-x-2 self-start shrink-0">
                      <a
                        href={exam.primaryPortalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-600 text-xs font-semibold bg-white hover:bg-indigo-50/30 transition-colors flex items-center space-x-1"
                        title="Visit official examination authority website"
                      >
                        <span>Official Portal</span>
                        <span>&nearr;</span>
                      </a>

                      {onPrepareExam && (
                        <button
                          type="button"
                          onClick={() => onPrepareExam(exam.name, exam.keyTopics, exam.primaryPortalUrl)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors flex items-center space-x-1 shadow-2xs cursor-pointer"
                          title="Load syllabus topics into StudyMate AI generator"
                        >
                          <span>⚡</span>
                          <span>Study with AI</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {exam.description}
                  </p>

                  {/* Key Topics Tag Clouds */}
                  <div className="pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Key Exam Domains / Syllabus Modules:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {exam.keyTopics.map((topic, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/70 text-slate-700 text-[11px]"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Toggle Resource Links Drawer Button */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => toggleExpand(exam.id)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1.5 cursor-pointer py-1"
                    >
                      <span>
                        {isExpanded
                          ? `Hide official study links (${exam.links.length})`
                          : `View official free resources & links (${exam.links.length})`}
                      </span>
                      <svg
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    <span className="text-[11px] text-slate-400">
                      {exam.links.length} verified official links
                    </span>
                  </div>
                </div>

                {/* Expanded Official Resource Links Drawer */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50/70 p-5 sm:p-6 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Curated Official Free Materials &amp; Question Papers:
                      </span>
                      <span className="text-[11px] text-emerald-700 font-medium">
                        ✓ 100% Free &bull; No Sign-Up Paywall
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {exam.links.map((link, idx) => {
                        const badge = getLinkTypeBadge(link.type);
                        return (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-2xs transition-all flex flex-col justify-between space-y-2 group"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center space-x-1 ${badge.bg}`}
                                >
                                  <span>{badge.icon}</span>
                                  <span>{badge.label}</span>
                                </span>
                                <a
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-indigo-600 group-hover:text-indigo-800 font-semibold flex items-center space-x-0.5"
                                >
                                  <span>Open</span>
                                  <span>&nearr;</span>
                                </a>
                              </div>

                              <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                                {link.title}
                              </h4>
                              <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                                {link.description}
                              </p>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                              <span className="truncate max-w-[200px]">
                                {new URL(link.url).hostname}
                              </span>
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-slate-600 hover:text-indigo-600 underline"
                              >
                                Direct link
                              </a>
                            </div>
                          </div>
                        );
                      })}
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
