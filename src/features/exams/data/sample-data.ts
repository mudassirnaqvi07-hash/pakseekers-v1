/**
 * Sample Academic Content — PakSeekers Phase 2.
 *
 * Authentic Pakistani entrance examination content (MDCAT).
 * Covers Biology, Chemistry, and Physics with granular topics,
 * structured question banks, and referenced tests.
 */

import type { Exam, Subject, Topic, Question, Test } from "@/types";

// ---------------------------------------------------------------------------
// 1. Exams
// ---------------------------------------------------------------------------

export const SAMPLE_EXAMS: Exam[] = [
  {
    id: "mdcat",
    code: "MDCAT",
    title: "Medical & Dental College Admission Test",
    description:
      "National standardized entrance examination conducted under PMDC regulations for admission into public and private sector medical and dental colleges across Pakistan.",
    totalSubjects: 3,
    status: "active",
    createdAt: "2026-01-15T00:00:00Z",
    updatedAt: "2026-02-01T00:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// 2. Subjects
// ---------------------------------------------------------------------------

export const SAMPLE_SUBJECTS: Subject[] = [
  {
    id: "biology",
    examId: "mdcat",
    title: "Biology",
    description:
      "Core biological sciences covering cell biology, human physiology, genetics, biotechnology, and diversity of life.",
    icon: "Dna",
    totalTopics: 2,
    status: "active",
  },
  {
    id: "chemistry",
    examId: "mdcat",
    title: "Chemistry",
    description:
      "Physical chemistry principles, inorganic classification, and organic functional groups with emphasis on reaction pathways.",
    icon: "FlaskConical",
    totalTopics: 2,
    status: "active",
  },
  {
    id: "physics",
    examId: "mdcat",
    title: "Physics",
    description:
      "Mechanics, thermodynamic concepts, electrostatics, current circuits, electromagnetism, and modern atomic physics.",
    icon: "Zap",
    totalTopics: 2,
    status: "active",
  },
];

// ---------------------------------------------------------------------------
// 3. Topics
// ---------------------------------------------------------------------------

export const SAMPLE_TOPICS: Topic[] = [
  // Biology
  {
    id: "cell-biology",
    subjectId: "biology",
    examId: "mdcat",
    title: "Cell Biology & Ultrastructure",
    description:
      "Prokaryotic vs. eukaryotic cell architecture, organelle functions, membrane transport mechanisms, and cellular energetics.",
    questionCount: 3,
    status: "active",
  },
  {
    id: "genetics",
    subjectId: "biology",
    examId: "mdcat",
    title: "Genetics & Molecular Inheritance",
    description:
      "Mendelian inheritance laws, chromosome mapping, DNA replication fidelity, transcription, translation, and genetic mutations.",
    questionCount: 3,
    status: "active",
  },

  // Chemistry
  {
    id: "organic-chemistry",
    subjectId: "chemistry",
    examId: "mdcat",
    title: "Organic Chemistry & Reactions",
    description:
      "Electrophilic aromatic substitution, nucleophilic addition in carbonyls, Markovnikov addition, and isomerism.",
    questionCount: 3,
    status: "active",
  },
  {
    id: "atomic-structure",
    subjectId: "chemistry",
    examId: "mdcat",
    title: "Atomic Structure & Chemical Bonding",
    description:
      "Quantum numbers, orbital hybridization (sp, sp2, sp3), VSEPR geometries, and dipole moment trends.",
    questionCount: 3,
    status: "active",
  },

  // Physics
  {
    id: "mechanics",
    subjectId: "physics",
    examId: "mdcat",
    title: "Mechanics, Work & Energy",
    description:
      "Newtonian dynamics, linear momentum conservation, impulse, work-energy theorem, and uniform circular motion.",
    questionCount: 3,
    status: "active",
  },
  {
    id: "electricity",
    subjectId: "physics",
    examId: "mdcat",
    title: "Current Electricity & Circuits",
    description:
      "Ohm's law, resistivity temperature coefficients, Kirchhoff's current and voltage laws, and parallel/series resistance networks.",
    questionCount: 3,
    status: "active",
  },
];

// ---------------------------------------------------------------------------
// 4. Question Bank (Reusable, Independent Questions)
// ---------------------------------------------------------------------------

export const SAMPLE_QUESTIONS: Question[] = [
  // ---------------- Biology: Cell Biology ----------------
  {
    id: "q-bio-001",
    examId: "mdcat",
    subjectId: "biology",
    topicId: "cell-biology",
    questionText:
      "Which organelle possesses its own circular DNA, 70S ribosomes, and performs oxidative phosphorylation to generate ATP?",
    options: [
      { id: "opt-1", label: "A", text: "Golgi apparatus" },
      { id: "opt-2", label: "B", text: "Mitochondrion" },
      { id: "opt-3", label: "C", text: "Endoplasmic reticulum" },
      { id: "opt-4", label: "D", text: "Lysosome" },
    ],
    correctAnswer: "opt-2",
    explanation:
      "Mitochondria are semi-autonomous double-membraned organelles containing their own circular mitochondrial DNA (mtDNA) and prokaryotic-like 70S ribosomes. The inner mitochondrial membrane houses the electron transport chain where oxidative phosphorylation generates ATP.",
    difficulty: "easy",
    status: "published",
    createdAt: "2026-02-10T10:00:00Z",
  },
  {
    id: "q-bio-002",
    examId: "mdcat",
    subjectId: "biology",
    topicId: "cell-biology",
    questionText:
      "According to the Fluid Mosaic Model proposed by Singer and Nicolson, the cell membrane is primarily composed of:",
    options: [
      { id: "opt-1", label: "A", text: "A continuous protein sheet interspersed with carbohydrate globules" },
      { id: "opt-2", label: "B", text: "A phospholipid bilayer with globular proteins floating within or across it" },
      { id: "opt-3", label: "C", text: "Cellulose microfibrils cross-linked with pectin polysaccharides" },
      { id: "opt-4", label: "D", text: "Rigid cholesterol plates surrounding aqueous glycoprotein channels" },
    ],
    correctAnswer: "opt-2",
    explanation:
      "The Fluid Mosaic Model describes the plasma membrane as a dynamic phospholipid bilayer (fluid matrix) in which amphipathic integral and peripheral proteins are embedded in a mosaic arrangement.",
    difficulty: "medium",
    status: "published",
    createdAt: "2026-02-10T10:05:00Z",
  },
  {
    id: "q-bio-003",
    examId: "mdcat",
    subjectId: "biology",
    topicId: "cell-biology",
    questionText:
      "Which active transport mechanism directly hydrolyzes ATP to move ions across an electrochemical gradient in animal cell membranes?",
    options: [
      { id: "opt-1", label: "A", text: "Facilitated diffusion through aquaporins" },
      { id: "opt-2", label: "B", text: "Sodium-Potassium ATPase (Na+/K+ pump)" },
      { id: "opt-3", label: "C", text: "Glucose symport via SGLT-1" },
      { id: "opt-4", label: "D", text: "Voltage-gated potassium leak channels" },
    ],
    correctAnswer: "opt-2",
    explanation:
      "The Na+/K+ ATPase is a primary active transport pump that consumes one ATP molecule to export 3 Na+ ions and import 2 K+ ions against their concentration gradients, maintaining resting membrane potential.",
    difficulty: "hard",
    status: "published",
    createdAt: "2026-02-10T10:10:00Z",
  },

  // ---------------- Biology: Genetics ----------------
  {
    id: "q-bio-004",
    examId: "mdcat",
    subjectId: "biology",
    topicId: "genetics",
    questionText:
      "In a monohybrid cross between two heterozygous garden pea plants (Tt x Tt), what is the expected phenotypic ratio among the F2 offspring for stem height?",
    options: [
      { id: "opt-1", label: "A", text: "1 Tall : 2 Intermediate : 1 Dwarf" },
      { id: "opt-2", label: "B", text: "3 Tall : 1 Dwarf" },
      { id: "opt-3", label: "C", text: "9 Tall : 3 Dwarf : 3 Intermediate : 1 Giant" },
      { id: "opt-4", label: "D", text: "1 Tall : 1 Dwarf" },
    ],
    correctAnswer: "opt-2",
    explanation:
      "According to Mendel's Law of Segregation, the genotypic ratio is 1 TT : 2 Tt : 1 tt. Because the tall allele (T) exhibits complete dominance over the dwarf allele (t), both TT and Tt appear tall, producing a phenotypic ratio of 3 Tall : 1 Dwarf.",
    difficulty: "easy",
    status: "published",
    createdAt: "2026-02-10T10:15:00Z",
  },
  {
    id: "q-bio-005",
    examId: "mdcat",
    subjectId: "biology",
    topicId: "genetics",
    questionText:
      "Which enzyme is responsible for unwinding the double helix at the replication fork during bacterial DNA replication?",
    options: [
      { id: "opt-1", label: "A", text: "DNA Polymerase III" },
      { id: "opt-2", label: "B", text: "DNA Ligase" },
      { id: "opt-3", label: "C", text: "DNA Helicase" },
      { id: "opt-4", label: "D", text: "Primase" },
    ],
    correctAnswer: "opt-3",
    explanation:
      "DNA Helicase disrupts the hydrogen bonds between complementary base pairs, unwinding the parental DNA duplex and creating the replication fork for polymerase activity.",
    difficulty: "medium",
    status: "published",
    createdAt: "2026-02-10T10:20:00Z",
  },
  {
    id: "q-bio-006",
    examId: "mdcat",
    subjectId: "biology",
    topicId: "genetics",
    questionText:
      "If a coding mRNA codon is 5'-AUG-3', what is the corresponding anticodon sequence on the initiator tRNA?",
    options: [
      { id: "opt-1", label: "A", text: "5'-CAU-3'" },
      { id: "opt-2", label: "B", text: "3'-UAC-5'" },
      { id: "opt-3", label: "C", text: "5'-UAC-3'" },
      { id: "opt-4", label: "D", text: "3'-AUG-5'" },
    ],
    correctAnswer: "opt-2",
    explanation:
      "Antiparallel base-pairing requires complementary matching: 5'-A pairs with 3'-U, 5'-U pairs with 3'-A, and 5'-G pairs with 3'-C. Therefore, the anticodon on the tRNA is 3'-UAC-5' (or 5'-CAU-3' when read 5' to 3').",
    difficulty: "hard",
    status: "published",
    createdAt: "2026-02-10T10:25:00Z",
  },

  // ---------------- Chemistry: Organic Chemistry ----------------
  {
    id: "q-chem-001",
    examId: "mdcat",
    subjectId: "chemistry",
    topicId: "organic-chemistry",
    questionText:
      "Benzene predominantly undergoes which type of reaction due to its delocalized resonance-stabilized pi-electron cloud?",
    options: [
      { id: "opt-1", label: "A", text: "Electrophilic addition" },
      { id: "opt-2", label: "B", text: "Electrophilic substitution" },
      { id: "opt-3", label: "C", text: "Nucleophilic addition" },
      { id: "opt-4", label: "D", text: "Free-radical elimination" },
    ],
    correctAnswer: "opt-2",
    explanation:
      "Benzene exhibits resonance energy of ~150.5 kJ/mol (aromatic stability). Addition reactions would disrupt the aromatic sextet, so electrophilic substitution (where a hydrogen atom is replaced while preserving aromaticity) is favored.",
    difficulty: "easy",
    status: "published",
    createdAt: "2026-02-10T11:00:00Z",
  },
  {
    id: "q-chem-002",
    examId: "mdcat",
    subjectId: "chemistry",
    topicId: "organic-chemistry",
    questionText:
      "According to Markovnikov's rule, the addition of HBr to propene (CH3-CH=CH2) predominantly yields:",
    options: [
      { id: "opt-1", label: "A", text: "1-Bromopropane" },
      { id: "opt-2", label: "B", text: "2-Bromopropane" },
      { id: "opt-3", label: "C", text: "1,2-Dibromopropane" },
      { id: "opt-4", label: "D", text: "Cyclopropane" },
    ],
    correctAnswer: "opt-2",
    explanation:
      "Markovnikov's rule states that the electrophilic hydrogen adds to the alkene carbon with the greater number of hydrogen atoms, forming a more stable secondary carbocation intermediate (CH3-CH+-CH3), which then bonds with Br- to give 2-bromopropane.",
    difficulty: "medium",
    status: "published",
    createdAt: "2026-02-10T11:05:00Z",
  },
  {
    id: "q-chem-003",
    examId: "mdcat",
    subjectId: "chemistry",
    topicId: "organic-chemistry",
    questionText:
      "In the Lucas test, an unknown alcohol reacts instantly with Lucas reagent (anhydrous ZnCl2 in concentrated HCl) at room temperature. The alcohol is most likely:",
    options: [
      { id: "opt-1", label: "A", text: "Primary alcohol" },
      { id: "opt-2", label: "B", text: "Secondary alcohol" },
      { id: "opt-3", label: "C", text: "Tertiary alcohol" },
      { id: "opt-4", label: "D", text: "Phenol" },
    ],
    correctAnswer: "opt-3",
    explanation:
      "Tertiary alcohols undergo rapid SN1 substitution to form insoluble alkyl chlorides, creating immediate turbidity/cloudiness. Secondary alcohols require 5–10 minutes, and primary alcohols do not react appreciably at room temperature without heating.",
    difficulty: "hard",
    status: "published",
    createdAt: "2026-02-10T11:10:00Z",
  },

  // ---------------- Chemistry: Atomic Structure ----------------
  {
    id: "q-chem-004",
    examId: "mdcat",
    subjectId: "chemistry",
    topicId: "atomic-structure",
    questionText:
      "What is the maximum number of electrons that can be accommodated in a subshell having azimuthal quantum number l = 2?",
    options: [
      { id: "opt-1", label: "A", text: "2 electrons" },
      { id: "opt-2", label: "B", text: "6 electrons" },
      { id: "opt-3", label: "C", text: "10 electrons" },
      { id: "opt-4", label: "D", text: "14 electrons" },
    ],
    correctAnswer: "opt-3",
    explanation:
      "The azimuthal quantum number l = 2 corresponds to the d subshell. The number of orbitals is given by (2l + 1) = 2(2) + 1 = 5. Since each orbital accommodates at most 2 electrons with opposite spins, the maximum capacity is 5 x 2 = 10 electrons.",
    difficulty: "easy",
    status: "published",
    createdAt: "2026-02-10T11:15:00Z",
  },
  {
    id: "q-chem-005",
    examId: "mdcat",
    subjectId: "chemistry",
    topicId: "atomic-structure",
    questionText:
      "Which of the following molecules has a zero net dipole moment despite containing polar covalent bonds?",
    options: [
      { id: "opt-1", label: "A", text: "H2O" },
      { id: "opt-2", label: "B", text: "NH3" },
      { id: "opt-3", label: "C", text: "CCl4" },
      { id: "opt-4", label: "D", text: "SO2" },
    ],
    correctAnswer: "opt-3",
    explanation:
      "Carbon tetrachloride (CCl4) has a symmetrical tetrahedral geometry (sp3 hybridized). The individual C-Cl bond dipoles cancel out vectorially, resulting in a net dipole moment of zero (non-polar molecule).",
    difficulty: "medium",
    status: "published",
    createdAt: "2026-02-10T11:20:00Z",
  },
  {
    id: "q-chem-006",
    examId: "mdcat",
    subjectId: "chemistry",
    topicId: "atomic-structure",
    questionText:
      "What is the orbital hybridization of the central sulfur atom in sulfur hexafluoride (SF6)?",
    options: [
      { id: "opt-1", label: "A", text: "sp3d" },
      { id: "opt-2", label: "B", text: "sp3d2" },
      { id: "opt-3", label: "C", text: "dsp2" },
      { id: "opt-4", label: "D", text: "sp3" },
    ],
    correctAnswer: "opt-2",
    explanation:
      "Sulfur in SF6 forms 6 bond pairs with 6 fluorine atoms and possesses 0 lone pairs. Steric number = 6 corresponds to sp3d2 hybridization, forming an octahedral molecular geometry with 90° bond angles.",
    difficulty: "hard",
    status: "published",
    createdAt: "2026-02-10T11:25:00Z",
  },

  // ---------------- Physics: Mechanics ----------------
  {
    id: "q-phy-001",
    examId: "mdcat",
    subjectId: "physics",
    topicId: "mechanics",
    questionText:
      "A body of mass 2 kg moving with an initial velocity of 10 m/s is brought to rest in 5 seconds by a constant retarding force. The magnitude of this force is:",
    options: [
      { id: "opt-1", label: "A", text: "2 N" },
      { id: "opt-2", label: "B", text: "4 N" },
      { id: "opt-3", label: "C", text: "10 N" },
      { id: "opt-4", label: "D", text: "20 N" },
    ],
    correctAnswer: "opt-2",
    explanation:
      "Acceleration a = (vf - vi) / t = (0 - 10) / 5 = -2 m/s². By Newton's second law, Force F = m * a = 2 kg * 2 m/s² = 4 N (magnitude).",
    difficulty: "easy",
    status: "published",
    createdAt: "2026-02-10T12:00:00Z",
  },
  {
    id: "q-phy-002",
    examId: "mdcat",
    subjectId: "physics",
    topicId: "mechanics",
    questionText:
      "At what angle of projection with the horizontal is the maximum height attained by a projectile equal to one-fourth of its horizontal range?",
    options: [
      { id: "opt-1", label: "A", text: "30°" },
      { id: "opt-2", label: "B", text: "45°" },
      { id: "opt-3", label: "C", text: "60°" },
      { id: "opt-4", label: "D", text: "90°" },
    ],
    correctAnswer: "opt-2",
    explanation:
      "The relationship between maximum height H and range R is given by tan(θ) = 4H / R. When H = R / 4, we have tan(θ) = 4(R / 4) / R = 1. Therefore, θ = arctan(1) = 45°.",
    difficulty: "medium",
    status: "published",
    createdAt: "2026-02-10T12:05:00Z",
  },
  {
    id: "q-phy-003",
    examId: "mdcat",
    subjectId: "physics",
    topicId: "mechanics",
    questionText:
      "If the linear momentum of a particle is increased by 50%, what is the percentage increase in its kinetic energy?",
    options: [
      { id: "opt-1", label: "A", text: "50%" },
      { id: "opt-2", label: "B", text: "100%" },
      { id: "opt-3", label: "C", text: "125%" },
      { id: "opt-4", label: "D", text: "225%" },
    ],
    correctAnswer: "opt-3",
    explanation:
      "Kinetic energy KE = p² / (2m). If new momentum p' = 1.5p, then new kinetic energy KE' = (1.5p)² / (2m) = 2.25 * KE. The increase is (2.25 - 1) * 100% = 125%.",
    difficulty: "hard",
    status: "published",
    createdAt: "2026-02-10T12:10:00Z",
  },

  // ---------------- Physics: Electricity ----------------
  {
    id: "q-phy-004",
    examId: "mdcat",
    subjectId: "physics",
    topicId: "electricity",
    questionText:
      "Two resistors of 6 ohms and 3 ohms are connected in parallel across a 12V battery of negligible internal resistance. The equivalent resistance of the circuit is:",
    options: [
      { id: "opt-1", label: "A", text: "9 ohms" },
      { id: "opt-2", label: "B", text: "2 ohms" },
      { id: "opt-3", label: "C", text: "4.5 ohms" },
      { id: "opt-4", label: "D", text: "18 ohms" },
    ],
    correctAnswer: "opt-2",
    explanation:
      "For two resistors in parallel: Req = (R1 * R2) / (R1 + R2) = (6 * 3) / (6 + 3) = 18 / 9 = 2 ohms.",
    difficulty: "easy",
    status: "published",
    createdAt: "2026-02-10T12:15:00Z",
  },
  {
    id: "q-phy-005",
    examId: "mdcat",
    subjectId: "physics",
    topicId: "electricity",
    questionText:
      "Kirchhoff's First Rule (Junction Rule), which states that the sum of currents entering a junction equals the sum leaving it, is a consequence of:",
    options: [
      { id: "opt-1", label: "A", text: "Law of conservation of energy" },
      { id: "opt-2", label: "B", text: "Law of conservation of electric charge" },
      { id: "opt-3", label: "C", text: "Law of conservation of linear momentum" },
      { id: "opt-4", label: "D", text: "Faraday's law of electromagnetic induction" },
    ],
    correctAnswer: "opt-2",
    explanation:
      "Kirchhoff's Junction Rule expresses conservation of electric charge: charge cannot accumulate indefinitely at a junction point, so current in must equal current out. (Kirchhoff's Loop Rule, by contrast, is based on conservation of energy).",
    difficulty: "medium",
    status: "published",
    createdAt: "2026-02-10T12:20:00Z",
  },
  {
    id: "q-phy-006",
    examId: "mdcat",
    subjectId: "physics",
    topicId: "electricity",
    questionText:
      "A uniform copper wire of resistance R is stretched uniformly such that its length is doubled while its volume remains constant. Its new electrical resistance will be:",
    options: [
      { id: "opt-1", label: "A", text: "2R" },
      { id: "opt-2", label: "B", text: "4R" },
      { id: "opt-3", label: "C", text: "R / 2" },
      { id: "opt-4", label: "D", text: "R / 4" },
    ],
    correctAnswer: "opt-2",
    explanation:
      "Resistance R = ρ * (L / A). Since volume V = A * L is constant, doubling the length (L' = 2L) halves the cross-sectional area (A' = A / 2). New resistance R' = ρ * (2L) / (A / 2) = 4 * (ρL / A) = 4R.",
    difficulty: "hard",
    status: "published",
    createdAt: "2026-02-10T12:25:00Z",
  },
];

// ---------------------------------------------------------------------------
// 5. Pre-configured Tests (Referencing Reusable Questions)
// ---------------------------------------------------------------------------

export const SAMPLE_TESTS: Test[] = [
  {
    id: "test-bio-cell",
    title: "Cell Biology Practice Quiz",
    description: "Assess fundamental understanding of cell organelles, membrane models, and transport.",
    examId: "mdcat",
    subjectId: "biology",
    topicId: "cell-biology",
    questionIds: ["q-bio-001", "q-bio-002", "q-bio-003"],
    durationMinutes: 5,
    questionCount: 3,
    difficulty: "medium",
    status: "published",
    createdAt: "2026-02-15T00:00:00Z",
    updatedAt: "2026-02-15T00:00:00Z",
  },
  {
    id: "test-bio-gen",
    title: "Genetics & Inheritance Test",
    description: "Evaluate your comprehension of Mendelian ratios, replication enzymes, and codon translation.",
    examId: "mdcat",
    subjectId: "biology",
    topicId: "genetics",
    questionIds: ["q-bio-004", "q-bio-005", "q-bio-006"],
    durationMinutes: 5,
    questionCount: 3,
    difficulty: "medium",
    status: "published",
    createdAt: "2026-02-15T00:00:00Z",
    updatedAt: "2026-02-15T00:00:00Z",
  },
  {
    id: "test-chem-org",
    title: "Organic Reaction Mechanisms",
    description: "Challenge yourself with benzene substitution, Markovnikov addition, and alcohol identification.",
    examId: "mdcat",
    subjectId: "chemistry",
    topicId: "organic-chemistry",
    questionIds: ["q-chem-001", "q-chem-002", "q-chem-003"],
    durationMinutes: 5,
    questionCount: 3,
    difficulty: "hard",
    status: "published",
    createdAt: "2026-02-15T00:00:00Z",
    updatedAt: "2026-02-15T00:00:00Z",
  },
  {
    id: "test-chem-atom",
    title: "Atomic Structure & Bonding Check",
    description: "Quantum numbers, subshell electron capacities, dipole moments, and SF6 hybridization.",
    examId: "mdcat",
    subjectId: "chemistry",
    topicId: "atomic-structure",
    questionIds: ["q-chem-004", "q-chem-005", "q-chem-006"],
    durationMinutes: 5,
    questionCount: 3,
    difficulty: "medium",
    status: "published",
    createdAt: "2026-02-15T00:00:00Z",
    updatedAt: "2026-02-15T00:00:00Z",
  },
  {
    id: "test-phy-mech",
    title: "Mechanics & Motion Mastery",
    description: "Newtonian retarding force, projectile angle relations, and momentum-energy percentage shifts.",
    examId: "mdcat",
    subjectId: "physics",
    topicId: "mechanics",
    questionIds: ["q-phy-001", "q-phy-002", "q-phy-003"],
    durationMinutes: 5,
    questionCount: 3,
    difficulty: "medium",
    status: "published",
    createdAt: "2026-02-15T00:00:00Z",
    updatedAt: "2026-02-15T00:00:00Z",
  },
  {
    id: "test-phy-elec",
    title: "Current Electricity & Circuits Quiz",
    description: "Parallel resistors, Kirchhoff's charge law, and wire elongation resistivity calculations.",
    examId: "mdcat",
    subjectId: "physics",
    topicId: "electricity",
    questionIds: ["q-phy-004", "q-phy-005", "q-phy-006"],
    durationMinutes: 5,
    questionCount: 3,
    difficulty: "hard",
    status: "published",
    createdAt: "2026-02-15T00:00:00Z",
    updatedAt: "2026-02-15T00:00:00Z",
  },
];
