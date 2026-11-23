export type ExamCategory =
  | "All"
  | "Accounting & Finance"
  | "Medical"
  | "Engineering"
  | "Civil & Legal";

export interface ExamResourceLink {
  title: string;
  url: string;
  type: "syllabus" | "pyq" | "study-material" | "mock-test" | "portal";
  description: string;
  isPdf?: boolean;
}

export interface ExamResource {
  id: string;
  name: string;
  shortCode: string;
  category: ExamCategory;
  governingBody: string;
  officialBadge: string;
  icon: string;
  accentColor: "indigo" | "emerald" | "amber" | "blue" | "rose" | "purple";
  description: string;
  primaryPortalUrl: string;
  keyTopics: string[];
  links: ExamResourceLink[];
}

export const EXAM_RESOURCES: ExamResource[] = [
  // ================= CA (CHARTERED ACCOUNTANCY - ICAI) =================
  {
    id: "ca-icai",
    name: "CA (Chartered Accountancy)",
    shortCode: "CA",
    category: "Accounting & Finance",
    governingBody: "The Institute of Chartered Accountants of India (ICAI)",
    officialBadge: "Statutory Professional Body (Act of Parliament)",
    icon: "📊",
    accentColor: "indigo",
    description: "Official, 100% free study modules, Revision Test Papers (RTPs), Mock Test Papers (MTPs), and past papers with suggested answers directly from ICAI's Board of Studies (BoS).",
    primaryPortalUrl: "https://www.icai.org/post/bos-knowledge-portal",
    keyTopics: [
      "Accounting & Corporate Laws",
      "Cost & Management Accounting",
      "Direct & Indirect Taxation (GST)",
      "Auditing and Ethics",
      "Financial Management & Strategic Management",
      "Advanced Auditing & Financial Reporting",
    ],
    links: [
      {
        title: "ICAI BoS Knowledge Portal (Main Hub)",
        url: "https://www.icai.org/post/bos-knowledge-portal",
        type: "portal",
        description: "Central repository of all official study materials for Foundation, Intermediate, and Final under the New Scheme of Education and Training.",
      },
      {
        title: "CA Foundation Official Study Material",
        url: "https://www.icai.org/post/foundation-course-new-scheme",
        type: "study-material",
        description: "Official ICAI modules for Accounting, Business Laws, Quantitative Aptitude, and Business Economics.",
      },
      {
        title: "CA Intermediate Official Study Modules",
        url: "https://www.icai.org/post/intermediate-course-new-scheme",
        type: "study-material",
        description: "Comprehensive ICAI modules across Group 1 & Group 2 (Advanced Accounting, Law, Tax, Costing, Audit, FM-SM).",
      },
      {
        title: "CA Final Official Study Modules",
        url: "https://www.icai.org/post/final-course-new-scheme",
        type: "study-material",
        description: "Official ICAI textbooks for Financial Reporting, Advanced Financial Management, Advanced Auditing, and Direct/Indirect Tax.",
      },
      {
        title: "Official Revision Test Papers (RTPs)",
        url: "https://www.icai.org/post/revision-test-papers-new-scheme",
        type: "study-material",
        description: "Official term-by-term RTPs featuring legislative updates, recent amendments, and high-probability case questions.",
      },
      {
        title: "Official Mock Test Papers (MTPs) & Suggested Answers",
        url: "https://www.icai.org/post/mock-test-papers-new-scheme",
        type: "mock-test",
        description: "Series 1 & 2 mock exam papers and evaluator keys published by the ICAI examination division.",
      },
      {
        title: "Previous Years Question Papers & Suggested Answers",
        url: "https://www.icai.org/post/question-papers-and-suggested-answers",
        type: "pyq",
        description: "Certified exam papers with model marking criteria and suggested answers from ICAI examiners.",
      },
    ],
  },

  // ================= ACCA (ASSOCIATION OF CHARTERED CERTIFIED ACCOUNTANTS) =================
  {
    id: "acca-global",
    name: "ACCA (Global Chartered Certified Accountant)",
    shortCode: "ACCA",
    category: "Accounting & Finance",
    governingBody: "Association of Chartered Certified Accountants (ACCA Global)",
    officialBadge: "Global Professional Body (Royal Charter)",
    icon: "🌐",
    accentColor: "blue",
    description: "Official free student exam support resources from ACCA Global, including official syllabi, specimen exams, CBE Practice Platform, examiner reports, and technical articles.",
    primaryPortalUrl: "https://www.accaglobal.com/gb/en/student/exam-support-resources.html",
    keyTopics: [
      "Financial Accounting (FA) & Management Accounting (MA)",
      "Corporate and Business Law (LW)",
      "Performance Management (PM) & Taxation (TX)",
      "Financial Reporting (FR) & Audit and Assurance (AA)",
      "Financial Management (FM)",
      "Strategic Business Leader (SBL) & Strategic Business Reporting (SBR)",
    ],
    links: [
      {
        title: "ACCA Student Exam Support Hub",
        url: "https://www.accaglobal.com/gb/en/student/exam-support-resources.html",
        type: "portal",
        description: "Official central launchpad for all Applied Knowledge, Applied Skills, and Strategic Professional level study resources.",
      },
      {
        title: "Applied Knowledge & Skills Study Guides",
        url: "https://www.accaglobal.com/gb/en/student/exam-support-resources/fundamentals-exams-study-resources.html",
        type: "study-material",
        description: "Official syllabus, study guides, exam format guides, and examiner approaches for papers BT, MA, FA, LW, PM, TX, FR, AA, and FM.",
      },
      {
        title: "Strategic Professional Study Resources",
        url: "https://www.accaglobal.com/gb/en/student/exam-support-resources/professional-exams-study-resources.html",
        type: "study-material",
        description: "Official guides, specimen exams, and syllabus documents for SBL, SBR, and Advanced Options (AFM, APM, ATX, AAA).",
      },
      {
        title: "ACCA Practice Platform (Official Free CBE Exams)",
        url: "https://www.accaglobal.com/gb/en/student/exam-support-resources/practice-platform.html",
        type: "mock-test",
        description: "Official free browser-based CBE (Computer Based Exam) environment replicating the live test software with full mock exams and auto-marking.",
      },
      {
        title: "Student Accountant Technical Articles",
        url: "https://www.accaglobal.com/gb/en/student/sa.html",
        type: "study-material",
        description: "In-depth technical articles written by ACCA examining teams covering complex syllabus topics, standard accounting changes, and exam technique.",
      },
      {
        title: "Examiner Reports & Read The Mind of The Marker",
        url: "https://www.accaglobal.com/gb/en/student/exam-support-resources.html",
        type: "pyq",
        description: "Constructive feedback from lead examiners detailing where candidates scored marks and common pitfalls in recent sittings.",
      },
    ],
  },

  // ================= CS (COMPANY SECRETARY - ICSI) =================
  {
    id: "cs-icsi",
    name: "CS (Company Secretary)",
    shortCode: "CS",
    category: "Accounting & Finance",
    governingBody: "The Institute of Company Secretaries of India (ICSI)",
    officialBadge: "Statutory Professional Body (Act of Parliament)",
    icon: "⚖️",
    accentColor: "purple",
    description: "Official, free study modules, CSEET reading materials, guideline answers, and mock question papers published by the Institute of Company Secretaries of India.",
    primaryPortalUrl: "https://www.icsi.edu/home/",
    keyTopics: [
      "Company Law & Practice",
      "Securities Laws & Capital Markets",
      "Corporate Restructuring, Valuation & Insolvency",
      "Economic, Commercial & Intellectual Property Laws",
      "Corporate Governance & Ethics",
      "Tax Laws & Corporate Compliance Management",
    ],
    links: [
      {
        title: "ICSI Official Study Material Hub",
        url: "https://www.icsi.edu/student/study-material/",
        type: "portal",
        description: "Official repository of curriculum books and reading references for CSEET, Executive Programme, and Professional Programme.",
      },
      {
        title: "CSEET Official Reference Reading Material",
        url: "https://www.icsi.edu/student/cseet/reference-reading-material/",
        type: "study-material",
        description: "Official free textbook PDFs for Business Communication, Legal Aptitude & Logical Reasoning, Economic & Business Environment, and Current Affairs.",
      },
      {
        title: "CS Executive Programme Official Study Material",
        url: "https://www.icsi.edu/student/executive-programme/study-material/",
        type: "study-material",
        description: "Official ICSI modules for Jurisprudence, Company Law, Setting up of Business, Securities Laws, and Economic Laws.",
      },
      {
        title: "CS Professional Programme Official Study Material",
        url: "https://www.icsi.edu/student/professional-programme/study-material/",
        type: "study-material",
        description: "Official ICSI modules for Governance, Risk Management, Corporate Restructuring, Resolution of Corporate Disputes, and Banking/Insolvency electives.",
      },
      {
        title: "Official Guideline Answers to Past Examinations",
        url: "https://www.icsi.edu/academic-portal/guideline-answers/",
        type: "pyq",
        description: "Model solutions with statutory provisions and case law citations compiled by ICSI examiners.",
      },
      {
        title: "ICSI Academic Portal & Model Question Papers",
        url: "https://www.icsi.edu/academic-portal/",
        type: "mock-test",
        description: "Official mock question papers, academic guidelines, case digests, and student bulletins.",
      },
    ],
  },

  // ================= JEE (MAIN & ADVANCED) =================
  {
    id: "jee-main-advanced",
    name: "JEE (Main & Advanced)",
    shortCode: "JEE",
    category: "Engineering",
    governingBody: "National Testing Agency (NTA) & IIT Joint Admission Board",
    officialBadge: "Official National Engineering Entrance",
    icon: "📐",
    accentColor: "emerald",
    description: "Official free syllabi, past question papers, answer keys, and National Test Abhyas mock tests directly from the National Testing Agency (NTA) and IIT conducting portals.",
    primaryPortalUrl: "https://jeemain.nta.nic.in",
    keyTopics: [
      "Physics: Mechanics, Electromagnetism, Optics, Thermodynamics, Modern Physics",
      "Chemistry: Physical Chemistry, Inorganic Coordination, Organic Reaction Mechanisms",
      "Mathematics: Calculus, Coordinate Geometry, Vectors & 3D, Algebra, Probability",
    ],
    links: [
      {
        title: "NTA JEE (Main) Official Portal",
        url: "https://jeemain.nta.nic.in",
        type: "portal",
        description: "Official examination portal for information bulletins, session notifications, and candidate registration.",
      },
      {
        title: "JEE (Advanced) Official Examination Portal",
        url: "https://jeeadv.ac.in",
        type: "portal",
        description: "Maintained by the organising IIT; contains comprehensive JEE Advanced eligibility, syllabi, and score reports.",
      },
      {
        title: "Official JEE (Main) Information Bulletin & Syllabus",
        url: "https://jeemain.nta.nic.in/information-bulletin/",
        type: "syllabus",
        description: "Official subject-by-subject syllabus and topic breakdown prescribed by the National Testing Agency.",
      },
      {
        title: "JEE (Advanced) Official Syllabus & Past Question Papers",
        url: "https://jeeadv.ac.in/archive.html",
        type: "pyq",
        description: "Official archive of past question papers (Paper 1 & Paper 2) and final answer keys released by IITs.",
      },
      {
        title: "NTA Downloads: Previous Years JEE Question Papers",
        url: "https://nta.ac.in/Downloads",
        type: "pyq",
        description: "Official repository of question papers for all shift sessions conducted across recent years.",
      },
      {
        title: "National Test Abhyas (NTA Official Free Mock Tests)",
        url: "https://www.nta.ac.in/Quiz",
        type: "mock-test",
        description: "Free high-quality full-length mock tests and chapter quizzes developed by NTA subject experts for JEE preparation.",
      },
    ],
  },

  // ================= NEET (UG) =================
  {
    id: "neet-ug",
    name: "NEET (UG) Medical Entrance",
    shortCode: "NEET",
    category: "Medical",
    governingBody: "National Testing Agency (NTA) & National Medical Commission (NMC)",
    officialBadge: "Official National Medical Entrance",
    icon: "🩺",
    accentColor: "rose",
    description: "Official NEET (UG) curricula, candidate information bulletins, previous years' question papers, and official mock tests from NTA and the National Medical Commission (NMC).",
    primaryPortalUrl: "https://exams.nta.ac.in/NEET/",
    keyTopics: [
      "Biology: Diversity in Living World, Cell Structure & Function, Human & Plant Physiology, Genetics, Biotechnology, Ecology",
      "Physics: Kinematics, Laws of Motion, Work Energy Power, Current Electricity, Optics, Modern Physics",
      "Chemistry: Basic Concepts, Chemical Bonding, Thermodynamics, Organic Principles & Mechanisms, Coordination Compounds",
    ],
    links: [
      {
        title: "NTA NEET (UG) Official Portal",
        url: "https://exams.nta.ac.in/NEET/",
        type: "portal",
        description: "Primary government portal for NEET (UG) bulletins, application schedules, and official notices.",
      },
      {
        title: "National Medical Commission (NMC) Official NEET Syllabus",
        url: "https://www.nmc.org.in/information-desk/for-students-to-study-in-india/national-eligibility-cum-entrance-test-neet-ug/",
        type: "syllabus",
        description: "The official statutory syllabus notification prescribed by the Undergraduate Medical Education Board (UGMEB) of NMC.",
      },
      {
        title: "NEET Information Bulletin & Chapter Specification",
        url: "https://exams.nta.ac.in/NEET/",
        type: "syllabus",
        description: "Comprehensive breakdown of marking scheme (+4/-1), question distribution (Section A & B), and language options.",
      },
      {
        title: "NTA Official Question Paper Archive (NEET UG)",
        url: "https://nta.ac.in/Downloads",
        type: "pyq",
        description: "Official master question booklets across test codes and language mediums with official answer keys.",
      },
      {
        title: "NTA Free Practice Mock Tests (Abhyas)",
        url: "https://www.nta.ac.in/Quiz",
        type: "mock-test",
        description: "Official mock tests covering 180 questions across Physics, Chemistry, Botany, and Zoology.",
      },
    ],
  },

  // ================= UPSC CIVIL SERVICES =================
  {
    id: "upsc-cse",
    name: "UPSC Civil Services (CSE)",
    shortCode: "UPSC",
    category: "Civil & Legal",
    governingBody: "Union Public Service Commission (UPSC)",
    officialBadge: "Constitutional Body (Article 315)",
    icon: "🏛️",
    accentColor: "amber",
    description: "Official notifications, comprehensive Prelims and Mains examination syllabi, and official question papers from the Union Public Service Commission.",
    primaryPortalUrl: "https://upsc.gov.in",
    keyTopics: [
      "General Studies I: Indian Heritage & Culture, History & Geography of the World, Society",
      "General Studies II: Governance, Constitution, Polity, Social Justice & International Relations",
      "General Studies III: Technology, Economic Development, Biodiversity, Environment, Security & Disaster Management",
      "General Studies IV: Ethics, Integrity and Aptitude",
      "CSAT (GS Paper II Prelims): Comprehension, Interpersonal Skills, Logical Reasoning",
    ],
    links: [
      {
        title: "UPSC Official Portal",
        url: "https://upsc.gov.in",
        type: "portal",
        description: "Official constitutional body portal for civil services examination calendars, notifications, and candidate guidance.",
      },
      {
        title: "Official UPSC Civil Services Syllabus",
        url: "https://upsc.gov.in/examinations/examination-syllabus",
        type: "syllabus",
        description: "Comprehensive statutory syllabus for Prelims (Paper I & II), Mains (GS I to IV, Essay), and Optional Subjects.",
      },
      {
        title: "Official Previous Years Question Papers (Prelims & Mains)",
        url: "https://upsc.gov.in/examinations/previous-question-papers",
        type: "pyq",
        description: "Searchable database of authentic UPSC question papers across all examination stages dating back over a decade.",
      },
      {
        title: "Official UPSC Answer Keys (Prelims)",
        url: "https://upsc.gov.in/examinations/answer-keys",
        type: "pyq",
        description: "Official answer keys for Civil Services Preliminary GS and CSAT papers published after exam cycle completion.",
      },
    ],
  },

  // ================= GATE (GRADUATE APTITUDE TEST IN ENGINEERING) =================
  {
    id: "gate-engineering",
    name: "GATE (Engineering & Sciences)",
    shortCode: "GATE",
    category: "Engineering",
    governingBody: "National Coordination Board — GATE / IISc & IITs",
    officialBadge: "Official Postgraduate Engineering Entrance",
    icon: "⚙️",
    accentColor: "emerald",
    description: "Official syllabi, master question papers, and answer keys for all 30 engineering and scientific disciplines from the organizing Indian Institute of Technology.",
    primaryPortalUrl: "https://gate2025.iitr.ac.in/",
    keyTopics: [
      "Engineering Mathematics: Linear Algebra, Calculus, Differential Equations, Probability & Statistics",
      "Branch Core: Computer Science (CS/IT), Electronics (EC), Electrical (EE), Mechanical (ME), Civil (CE), Chemical (CH)",
      "General Aptitude: Verbal Ability, Numerical Ability, Reasoning",
    ],
    links: [
      {
        title: "Official GATE Portal (Organizing IIT)",
        url: "https://gate2025.iitr.ac.in/",
        type: "portal",
        description: "Primary official portal maintained by the organizing IIT with test schedule, candidate guidelines, and results.",
      },
      {
        title: "Official GATE Syllabus by Discipline (All Papers)",
        url: "https://gate2025.iitr.ac.in/gate-syllabus.html",
        type: "syllabus",
        description: "Official downloadable syllabi for CS, EC, EE, ME, CE, IN, Data Science & AI (DA), and all other test papers.",
      },
      {
        title: "Official Past Question Papers & Final Keys (Archive)",
        url: "https://gate2025.iitr.ac.in/download-question-papers.html",
        type: "pyq",
        description: "Official master question booklets and validated answer keys across all test sessions.",
      },
      {
        title: "NPTEL GATE Preparation Portal (MHRD / IIT Initiative)",
        url: "https://gate.nptel.ac.in/",
        type: "study-material",
        description: "Free video lectures, syllabus-mapped video solutions, and practice quizzes developed by IIT professors.",
      },
    ],
  },

  // ================= CLAT (COMMON LAW ADMISSION TEST) =================
  {
    id: "clat-law",
    name: "CLAT (Common Law Admission Test)",
    shortCode: "CLAT",
    category: "Civil & Legal",
    governingBody: "Consortium of National Law Universities",
    officialBadge: "Official National Law Entrance",
    icon: "📖",
    accentColor: "purple",
    description: "Official examination guidelines, passage-based syllabus specifications, sample questions, and past question papers directly from the Consortium of NLUs.",
    primaryPortalUrl: "https://consortiumofnlus.ac.in/",
    keyTopics: [
      "English Language: Reading Comprehension, Inferences & Vocabulary",
      "Current Affairs & General Knowledge: Contemporary National & International Events",
      "Legal Reasoning: Principles, Propositions, Legal Facts & Applications",
      "Logical Reasoning: Arguments, Premises, Inferences & Syllogisms",
      "Quantitative Techniques: Charts, Graphs, Elementary Mathematical Ratios",
    ],
    links: [
      {
        title: "Consortium of National Law Universities Portal",
        url: "https://consortiumofnlus.ac.in/",
        type: "portal",
        description: "Official central portal for CLAT UG and PG admissions across 24 participating National Law Universities.",
      },
      {
        title: "Official CLAT UG & PG Syllabus and Exam Pattern",
        url: "https://consortiumofnlus.ac.in/clat-2025/syllabus.html",
        type: "syllabus",
        description: "Detailed description of passage-based comprehension format, section weightage, and negative marking rules.",
      },
      {
        title: "Official Sample Questions & Preparation Guides",
        url: "https://consortiumofnlus.ac.in/",
        type: "study-material",
        description: "Official model questions demonstrating how legal principles should be interpreted from context passages.",
      },
    ],
  },
];
