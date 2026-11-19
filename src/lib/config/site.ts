/**
 * PakSeekers — Site Configuration & Marketing Content
 *
 * Centralized, structured content for the public marketing website.
 * Follows Phase 3 specifications: professional educational technology tone,
 * authentic data without fabricated statistics or fake testimonials.
 */

export interface TeamMember {
  name: string;
  role: string;
  bio: string;
  initials: string;
  avatarUrl?: string;
  specialization: string;
}

export interface SiteConfig {
  name: string;
  tagline: string;
  headline: string;
  subheadline: string;
  about: {
    overview: string;
    targetAudience: string;
    problemSolved: string;
    benefitStatement: string;
  };
  vision: {
    title: string;
    statement: string;
    pillars: { title: string; description: string }[];
  };
  mission: {
    title: string;
    statement: string;
    commitments: { title: string; description: string }[];
  };
  advantages: {
    id: string;
    title: string;
    description: string;
    badge: string;
  }[];
  features: {
    id: string;
    title: string;
    description: string;
    category: string;
  }[];
  contact: {
    supportEmail: string;
    inquiryEmail: string;
    officeLocation: string;
    availability: string;
    note: string;
  };
  team: TeamMember[];
  educationalObjectives: {
    title: string;
    description: string;
  }[];
  navigation: {
    label: string;
    href: string;
  }[];
}

export const SITE_CONFIG: SiteConfig = {
  name: "PakSeekers",
  tagline: "Pakistan's Premier Entrance Examination Preparation Platform",
  headline: "Prepare Smarter. Achieve Further.",
  subheadline:
    "Your journey towards university admission starts here. Practice smarter with organized tests, subject-wise preparation, and performance tracking.",
  about: {
    overview:
      "PakSeekers is a dedicated educational technology platform purpose-built for Pakistani students preparing for competitive undergraduate university entrance examinations.",
    targetAudience:
      "We serve intermediate (FSc Pre-Medical, FSc Pre-Engineering, ICS) and A-Level students aiming for admission to premier public and private institutions across Pakistan.",
    problemSolved:
      "Entrance examinations like MDCAT, ECAT, and NUST NET demand deep analytical reasoning rather than rote memorization. Traditional preparation is often scattered, expensive, or unorganized. PakSeekers organizes the entire syllabus into structured, digestible learning units.",
    benefitStatement:
      "Students benefit from standardized practice under realistic timed conditions, comprehensive answer rationales for every question, and diagnostic analytics that pinpoint exact weak topics before test day.",
  },
  vision: {
    title: "Our Vision",
    statement:
      "To democratize access to high-caliber entrance test preparation across all provinces of Pakistan, empowering every aspiring doctor, engineer, and computing specialist to realize their academic potential regardless of geographic or socioeconomic background.",
    pillars: [
      {
        title: "Merit-Based Opportunity",
        description:
          "Ensuring every deserving student has access to the highest-quality exam preparation resources.",
      },
      {
        title: "Conceptual Mastery",
        description:
          "Transforming intermediate knowledge into deep analytical test-taking competence.",
      },
      {
        title: "Educational Equity",
        description:
          "Bridging the resource divide between urban centers and remote academic communities.",
      },
    ],
  },
  mission: {
    title: "Our Mission",
    statement:
      "To provide an intuitive, curriculum-aligned, and technologically rigorous platform that equips students with syllabus-accurate MCQs, verified explanations, timed assessments, and actionable diagnostic feedback.",
    commitments: [
      {
        title: "Curriculum Fidelity",
        description:
          "Strict alignment with official examination bodies (PMDC, UET, NUST, FAST-NU, and NTS).",
      },
      {
        title: "Pedagogical Clarity",
        description:
          "Every question includes step-by-step reasoning explaining why the correct choice is right and where distractors mislead.",
      },
      {
        title: "Continuous Progress",
        description:
          "Data-driven tracking that flags weak areas and directs targeted revision.",
      },
    ],
  },
  advantages: [
    {
      id: "organized-prep",
      badge: "Syllabus Hierarchy",
      title: "Organized Preparation",
      description:
        "Every question is strictly mapped through our hierarchical taxonomy: Exam → Subject → Topic → MCQ. No random question dumping.",
    },
    {
      id: "accessible-learning",
      badge: "Open Access",
      title: "Accessible Learning Resources",
      description:
        "High-yield practice materials accessible anywhere, anytime on desktop, tablet, and mobile devices without expensive academy tuition.",
    },
    {
      id: "structured-practice",
      badge: "Realistic Testing",
      title: "Structured & Timed Practice",
      description:
        "Practice assessments simulate official examination durations and pacing targets to build mental stamina and eliminate exam-day anxiety.",
    },
    {
      id: "performance-improvement",
      badge: "Diagnostic Insight",
      title: "Performance-Based Improvement",
      description:
        "Automatic detection of weak topics (< 60% accuracy) gives you clear revision roadmaps instead of blind re-reading of textbooks.",
    },
    {
      id: "student-focused",
      badge: "Zero Distractions",
      title: "Student-Focused Experience",
      description:
        "A clean, responsive interface designed exclusively for studying. No intrusive popups, advertisements, or irrelevant content.",
    },
  ],
  features: [
    {
      id: "exam-catalog",
      category: "Examinations",
      title: "Standardized Exam Catalog",
      description:
        "Tailored syllabi for Pakistan's leading entrance tests: MDCAT (Medical), ECAT (Engineering), and NUST NET (Computing & Engineering).",
    },
    {
      id: "subject-practice",
      category: "Curriculum",
      title: "Subject-Wise Modules",
      description:
        "Focused study tracks covering Biology, Chemistry, Physics, Mathematics, and English with clear topic distribution.",
    },
    {
      id: "topic-mcqs",
      category: "Question Bank",
      title: "Topic-Based Question Banks",
      description:
        "Curated multiple-choice questions graduated across easy, medium, and hard difficulty levels.",
    },
    {
      id: "timed-tests",
      category: "Assessments",
      title: "Timed Practice Tests",
      description:
        "Real-time countdown timer sessions that reproduce test-day pacing, pressure, and auto-submission conditions.",
    },
    {
      id: "pedagogical-explanations",
      category: "Learning",
      title: "Pedagogical Explanations",
      description:
        "Detailed step-by-step rationales revealed after completion so you understand the core concepts behind every question.",
    },
    {
      id: "progress-tracking",
      category: "Analytics",
      title: "Attempt History & Progress Tracking",
      description:
        "Persistent dashboard analytics displaying tests attempted, accuracy percentages, best scores, and targeted revision alerts.",
    },
  ],
  contact: {
    supportEmail: "support@pakseekers.com",
    inquiryEmail: "mudassirhassanreall@gmail.com",
    officeLocation: "Pakistan",
    availability: "Monday – Saturday, 9:00 AM to 6:00 PM PKT",
    note: "For institutional partnerships, question verification inquiries, or student support, reach out directly via email.",
  },
  team: [
    {
      name: "Syed Mudassir Hassan",
      role: "Founder & Lead Software Architect",
      initials: "MH",
      specialization: "Full-Stack Architecture & Educational Systems",
      bio: "Software engineer and system architect leading the engineering design, database infrastructure, and product vision for the PakSeekers platform.",
    },
  ],
  educationalObjectives: [
    {
      title: "Eliminate Rote Memorization",
      description:
        "Transition student preparation from passive textbook regurgitation into active, concept-driven critical reasoning aligned with modern entrance exam standards.",
    },
    {
      title: "Promote Socioeconomic Equity",
      description:
        "Provide open, academy-caliber entrance test preparation materials to students across all provinces of Pakistan without burdensome tuition charges.",
    },
    {
      title: "Develop Standardized Testing Stamina",
      description:
        "Build mental endurance, pacing discipline, and exam-day confidence through full-length countdown simulations reproducing official exam pressure.",
    },
    {
      title: "Actionable Diagnostic Analytics",
      description:
        "Replace ambiguous feedback with question-level diagnostic data and automatic weak-area detection (< 60% accuracy) to direct targeted revision.",
    },
  ],
  navigation: [
    { label: "Home", href: "/" },
    { label: "About Us", href: "/about" },
    { label: "Explore", href: "/explore" },
  ],
};
