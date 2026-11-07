'use client';

import React, { useState, useEffect } from 'react';
import {
  Save,
  ArrowRight,
  ArrowLeft,
  Building,
  Lock,
  Award,
  BookOpen,
  Briefcase,
  Sliders,
  Sparkles,
  Compass,
  AlertTriangle,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface QuestionnairePartFormProps {
  partNumber: number;
  label: string;
  initialData?: any;
  onSavePart: (partNumber: number, data: any) => Promise<void>;
  onNextPart?: () => void;
  onPrevPart?: () => void;
}

// ── Rating Scale Dictionaries for Dynamic Labels ─────────────────────────────

const PROFICIENCY_LABELS: Record<number, { text: string; desc: string }> = {
  1: { text: '1 — No Knowledge', desc: 'No prior background or practical experience' },
  2: { text: '2 — Basic', desc: 'Fundamental understanding with guided execution' },
  3: { text: '3 — Intermediate', desc: 'Independent working ability in routine tasks' },
  4: { text: '4 — Advanced', desc: 'Highly skilled; can troubleshoot and guide others' },
  5: { text: '5 — Expert', desc: 'Mastery; recognized institutional authority / innovator' },
};

const IMPORTANCE_LABELS: Record<number, { text: string; desc: string }> = {
  1: { text: '1 — Not Important', desc: 'Irrelevant to current academic responsibilities' },
  2: { text: '2 — Slightly Important', desc: 'Minor relevance; rarely utilized in daily duties' },
  3: { text: '3 — Moderately Important', desc: 'Helpful for regular faculty functions' },
  4: { text: '4 — Very Important', desc: 'Substantial impact on instructional/research quality' },
  5: { text: '5 — Extremely Important', desc: 'Critical core competency essential to role' },
};

const EMERGING_NEED_LABELS: Record<number, string> = {
  1: '1 — No Need',
  2: '2 — Low Need',
  3: '3 — Moderate Need',
  4: '4 — High Need',
  5: '5 — Very High Need',
};

const BARRIER_LABELS: Record<number, string> = {
  1: '1 — Not a Barrier',
  2: '2 — Slight Barrier',
  3: '3 — Moderate Barrier',
  4: '4 — Serious Barrier',
  5: '5 — Major Barrier',
};

// ── Competencies Grouped by Official Domains ────────────────────────────────

const COMPETENCY_DOMAINS = [
  {
    domain: 'core',
    label: 'Core Competencies',
    description: 'Foundational institutional values and professional behaviors across all faculty ranks.',
    items: [
      {
        key: 'delivering_service_excellence',
        label: 'Delivering Service Excellence',
        desc: 'Committed to superior learner satisfaction, quality teaching service, and institutional integrity.',
      },
      {
        key: 'interpersonal_relationship',
        label: 'Interpersonal Relationship',
        desc: 'Constructive collegial collaboration, student empathy, and team cohesion.',
      },
      {
        key: 'professionalism',
        label: 'Professionalism & Ethics',
        desc: 'Adherence to the Code of Ethics for Professional Teachers, academic accountability, and work ethics.',
      },
      {
        key: 'achievement_orientation',
        label: 'Achievement Orientation',
        desc: 'Continuous pursuit of high-performance standards, goals, and academic outcomes.',
      },
    ],
  },
  {
    domain: 'functional',
    label: 'Functional Competencies',
    description: 'Instructional, research, technological, and quality assurance competencies.',
    items: [
      {
        key: 'consultancy_advising',
        label: 'Consultancy and Advising',
        desc: 'Student academic advisory, thesis direction, and external community technical assistance.',
      },
      {
        key: 'critical_thinking_problem_solving',
        label: 'Critical Thinking and Problem Solving',
        desc: 'Analytical rigor, curriculum problem diagnosis, and evidence-based academic decisions.',
      },
      {
        key: 'effective_teaching_classroom_management',
        label: 'Effective Teaching and Classroom Management',
        desc: 'Modern pedagogical delivery, dynamic class engagement, and structured learning environments.',
      },
      {
        key: 'innovative_instructional_material_development',
        label: 'Innovative Instructional Material Development',
        desc: 'Authoring modules, multimedia courseware, interactive syllabi, and contextualized learning tools.',
      },
      {
        key: 'computer_literacy_digital_technologies',
        label: 'Computer Literacy and Digital Technologies',
        desc: 'Productivity software, web platforms, and digital collaboration software in higher education.',
      },
      {
        key: 'research_competency',
        label: 'Research Competency',
        desc: 'Formulating rigorous research designs, grant writing, data gathering, and statistical analysis.',
      },
      {
        key: 'publication_writing',
        label: 'Publication Writing',
        desc: 'Drafting peer-reviewed manuscripts, indexing requirements (Scopus/WoS), and academic dissemination.',
      },
      {
        key: 'quality_assurance_management',
        label: 'Quality Assurance Management',
        desc: 'CHED compliance, AACCUP accreditation instruments, syllabus alignment, and program auditing.',
      },
      {
        key: 'technology_transfer_innovation',
        label: 'Technology Transfer and Innovation',
        desc: 'Intellectual property patents, utility models, commercialization, and community extension adoption.',
      },
      {
        key: 'outcomes_based_education',
        label: 'Outcomes-Based Education (OBE)',
        desc: 'Constructive alignment of intended learning outcomes (ILOs), assessments, and rubric evaluation.',
      },
    ],
  },
  {
    domain: 'leadership',
    label: 'Leadership Competencies',
    description: 'Strategic planning, change leadership, and faculty mentorship.',
    items: [
      {
        key: 'strategic_thinking',
        label: 'Strategic Thinking',
        desc: 'Aligning department initiatives with QSU strategic vision, development plans, and accreditation targets.',
      },
      {
        key: 'leading_change',
        label: 'Leading Change',
        desc: 'Fostering adaptability, facilitating academic transformation, and championing curriculum modernization.',
      },
      {
        key: 'building_collaborative_relationships',
        label: 'Building Collaborative Relationships',
        desc: 'Forging partnerships with industries, academic consortia, government agencies, and alumni networks.',
      },
      {
        key: 'coaching_mentoring',
        label: 'Coaching and Mentoring',
        desc: 'Nurturing junior faculty, pedagogical peer coaching, and scholarly guidance.',
      },
      {
        key: 'managing_performance',
        label: 'Managing Performance',
        desc: 'Objective IPCR target setting, faculty evaluation, constructive feedback, and productivity monitoring.',
      },
    ],
  },
];

// ── Emerging Training Needs Items (9 items) ──────────────────────────────────

const EMERGING_NEEDS_ITEMS = [
  {
    key: 'artificial_intelligence',
    label: 'Artificial Intelligence',
    desc: 'Generative AI in syllabus design, personalized learning, and ethical AI in academia.',
  },
  {
    key: 'machine_learning',
    label: 'Machine Learning',
    desc: 'Supervised/unsupervised models, predictive analytics in educational data, and algorithm development.',
  },
  {
    key: 'data_analytics',
    label: 'Data Analytics',
    desc: 'Academic performance dashboards, data visualization with Power BI/Python, and institutional insights.',
  },
  {
    key: 'cybersecurity',
    label: 'Cybersecurity',
    desc: 'Data privacy protection (RA 10173), digital hygiene, securing research repositories, and threat mitigation.',
  },
  {
    key: 'cloud_computing',
    label: 'Cloud Computing',
    desc: 'Cloud-based academic architectures, Google Workspace/AWS/Azure services, and remote virtual labs.',
  },
  {
    key: 'learning_management_systems',
    label: 'Learning Management Systems',
    desc: 'Moodle, Google Classroom, Canvas advanced administration, automated grading, and interactive SCORM.',
  },
  {
    key: 'educational_technology',
    label: 'Educational Technology',
    desc: 'Blended instruction software, AR/VR immersive tools, digital whiteboard engagement, and gamified learning.',
  },
  {
    key: 'statistical_software',
    label: 'Statistical Software',
    desc: 'Advanced SPSS, R, Python, and JASP for quantitative academic research and hypothesis testing.',
  },
  {
    key: 'research_methods',
    label: 'Research Methods',
    desc: 'Mixed-method methodologies, qualitative thematic analysis (NVivo), grant proposal writing, and publishing.',
  },
];

// ── Training History Areas (7 items) ─────────────────────────────────────────

const TRAINING_AREAS_ITEMS = [
  'Instruction',
  'Research',
  'Extension',
  'Quality Assurance',
  'Information Technology',
  'Leadership',
  'Outcomes-Based Education',
];

// ── Modalities, Schedules, Durations ─────────────────────────────────────────

const MODALITY_OPTIONS = [
  'Face-to-Face Seminar',
  'Webinar',
  'Blended Learning',
  'Coaching',
  'Mentoring',
  'Benchmarking',
  'Project Immersion',
  'Formal Schooling',
  'Self-Paced Online Course',
];

const SCHEDULE_OPTIONS = [
  'Semester Break',
  'Summer',
  'Saturdays',
  'Fridays',
  'Anytime',
];

const DURATION_OPTIONS = [
  'Half-day',
  'One day',
  'Two days',
  'Three days',
  'One week',
];

// ── Barriers to Training (7 items) ──────────────────────────────────────────

const BARRIER_ITEMS = [
  { key: 'heavy_teaching_workload', label: 'Heavy teaching workload', desc: 'High teaching units, preparation, exam grading' },
  { key: 'administrative_responsibilities', label: 'Administrative responsibilities', desc: 'Committee tasks, documentation, institutional duties' },
  { key: 'lack_of_budget', label: 'Lack of budget', desc: 'Registration fees, travel funding, institutional financial support' },
  { key: 'time_constraints', label: 'Time constraints', desc: 'Conflicting departmental deadlines and operational obligations' },
  { key: 'travel_distance', label: 'Travel distance', desc: 'Physical commute to regional training centers or main venues' },
  { key: 'family_responsibilities', label: 'Family responsibilities', desc: 'Personal, parental, or domestic commitments during training schedules' },
  { key: 'internet_connectivity', label: 'Internet connectivity', desc: 'Unstable campus or home connection during virtual sessions' },
];

export default function QuestionnairePartForm({
  partNumber,
  label,
  initialData,
  onSavePart,
  onNextPart,
  onPrevPart,
}: QuestionnairePartFormProps) {
  const [formData, setFormData] = useState<any>(initialData || {});
  const [saving, setSaving] = useState(false);
  const [activeCompetencyDomain, setActiveCompetencyDomain] = useState<string>('all');
  const { showToast } = useToast();

  useEffect(() => {
    setFormData(initialData || getDefaultData(partNumber));
  }, [partNumber, initialData]);

  function getDefaultData(part: number) {
    switch (part) {
      case 1:
        return {
          department: 'BSIT',
          age: 35,
          sex: 'Female',
          employment_status: 'Permanent',
        };
      case 2:
        return {
          highest_educational_attainment: "Master's Degree",
          field_of_specialization: 'Information Technology',
        };
      case 3:
        return {
          academic_rank: 'Assistant Professor',
          years_teaching: '5–10 years',
          administrative_designation: 'None',
          trainings_last_3_years: '3–5',
        };
      case 4:
        return {
          training_areas: ['Instruction', 'Information Technology'],
          training_modalities_attended: ['Webinar', 'Face-to-Face Seminar'],
        };
      case 5: {
        const initialCompetency: Record<string, { proficiency: number; importance: number }> = {};
        for (const dom of COMPETENCY_DOMAINS) {
          for (const item of dom.items) {
            initialCompetency[item.key] = { proficiency: 3, importance: 4 };
          }
        }
        return { competency: initialCompetency };
      }
      case 6: {
        const initialNeeds: Record<string, number> = {};
        for (const item of EMERGING_NEEDS_ITEMS) {
          initialNeeds[item.key] = 4;
        }
        return { emerging_training_needs: initialNeeds };
      }
      case 7:
        return {
          preferred_learning_modality: ['Blended Learning', 'Webinar'],
          preferred_schedule: ['Saturdays', 'Semester Break'],
          preferred_duration: ['Two days'],
        };
      case 8: {
        const initialBarriers: Record<string, number> = {};
        for (const item of BARRIER_ITEMS) {
          initialBarriers[item.key] = 3;
        }
        return { barriers: initialBarriers };
      }
      default:
        return {};
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSavePart(partNumber, formData);
      showToast('success', `Part ${partNumber} Saved`, `${label} responses recorded successfully.`);
      if (onNextPart) onNextPart();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to save part data.';
      showToast('error', 'Save Failed', msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-6"
    >
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-light-border dark:border-dark-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-brand-gold bg-brand-gold/10 px-2.5 py-0.5 rounded border border-brand-gold/20">
              Part {partNumber} of 8
            </span>
            {partNumber in { 1: 1, 2: 1, 3: 1, 5: 1, 6: 1 } ? (
              <span className="text-xs font-semibold text-brand-green bg-brand-green/10 px-2.5 py-0.5 rounded-full border border-brand-green/20">
                Required for Recommendation
              </span>
            ) : (
              <span className="text-xs font-medium text-light-text/60 dark:text-dark-muted bg-light-muted-surface dark:bg-dark-bg px-2.5 py-0.5 rounded-full border border-light-border dark:border-dark-border">
                Optional Enrichment
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-light-text dark:text-white mt-1.5 flex items-center gap-2">
            <span>{label}</span>
          </h2>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
          PART 1: Personal Profile
      ──────────────────────────────────────────────────────────────────────── */}
      {partNumber === 1 && (
        <div className="space-y-5">
          <p className="text-xs text-light-text dark:text-dark-muted">
            Please verify your demographic details. Department appointment is pre-configured by the institution.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-light-text dark:text-dark-text">
                Department / Program
              </label>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-xs">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-brand-gold shrink-0" />
                  <span className="font-bold font-mono text-light-text dark:text-white">
                    {formData.department || 'BSIT'}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] text-light-text dark:text-dark-muted font-mono bg-white dark:bg-dark-card px-2 py-0.5 rounded border border-light-border dark:border-dark-border">
                  <Lock className="w-3 h-3 text-emerald-500" />
                  <span>Pre-assigned</span>
                </span>
              </div>
              <p className="text-[11px] text-light-text/70 dark:text-dark-muted">
                Based on your current institutional faculty appointment.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-light-text dark:text-dark-text mb-1">
                Age
              </label>
              <input
                type="number"
                min={18}
                max={80}
                value={formData.age || 35}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 35 })}
                className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-light-text dark:text-white focus:border-brand-green focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-light-text dark:text-dark-text mb-1">
                Sex
              </label>
              <select
                value={formData.sex || 'Female'}
                onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-light-text dark:text-white focus:border-brand-green focus:outline-none"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-light-text dark:text-dark-text mb-1">
                Employment Status
              </label>
              <select
                value={formData.employment_status || 'Permanent'}
                onChange={(e) => setFormData({ ...formData, employment_status: e.target.value })}
                className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-light-text dark:text-white focus:border-brand-green focus:outline-none"
              >
                <option value="Permanent">Permanent</option>
                <option value="Contract of Service">Contract of Service (COS)</option>
                <option value="Part-time">Part-time</option>
                <option value="Temporary">Temporary</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          PART 2: Educational Background
      ──────────────────────────────────────────────────────────────────────── */}
      {partNumber === 2 && (
        <div className="space-y-5">
          <p className="text-xs text-light-text dark:text-dark-muted">
            Provide your academic degree attainment and specialization field.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-light-text dark:text-dark-text mb-1">
                Highest Educational Attainment
              </label>
              <select
                value={formData.highest_educational_attainment || "Master's Degree"}
                onChange={(e) =>
                  setFormData({ ...formData, highest_educational_attainment: e.target.value })
                }
                className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-light-text dark:text-white focus:border-brand-green focus:outline-none"
              >
                <option value="Bachelor's Degree">Bachelor's Degree</option>
                <option value="Master's Degree">Master's Degree</option>
                <option value="Doctorate Degree">Doctorate Degree</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-light-text dark:text-dark-text mb-1">
                Field of Specialization
              </label>
              <input
                type="text"
                value={formData.field_of_specialization || 'Information Technology'}
                onChange={(e) =>
                  setFormData({ ...formData, field_of_specialization: e.target.value })
                }
                placeholder="e.g. Computer Science, Hospitality, Mathematics"
                className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-light-text dark:text-white focus:border-brand-green focus:outline-none"
                required
              />
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          PART 3: Professional Background
      ──────────────────────────────────────────────────────────────────────── */}
      {partNumber === 3 && (
        <div className="space-y-5">
          <p className="text-xs text-light-text dark:text-dark-muted">
            Specify your faculty rank, teaching experience, and training volume in the last three years.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-light-text dark:text-dark-text mb-1">
                Academic Rank
              </label>
              <select
                value={formData.academic_rank || 'Assistant Professor'}
                onChange={(e) => setFormData({ ...formData, academic_rank: e.target.value })}
                className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-light-text dark:text-white focus:border-brand-green focus:outline-none"
              >
                <option value="Instructor I">Instructor I</option>
                <option value="Instructor II">Instructor II</option>
                <option value="Instructor III">Instructor III</option>
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Professor">Professor</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-light-text dark:text-dark-text mb-1">
                Years in Teaching
              </label>
              <select
                value={formData.years_teaching || '5–10 years'}
                onChange={(e) => setFormData({ ...formData, years_teaching: e.target.value })}
                className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-light-text dark:text-white focus:border-brand-green focus:outline-none"
              >
                <option value="Below 5 years">Below 5 years</option>
                <option value="5–10 years">5–10 years</option>
                <option value="11–15 years">11–15 years</option>
                <option value="16–20 years">16–20 years</option>
                <option value="More than 20 years">More than 20 years</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-light-text dark:text-dark-text mb-1">
                Current Administrative Designation (if any)
              </label>
              <input
                type="text"
                value={formData.administrative_designation || 'None'}
                onChange={(e) =>
                  setFormData({ ...formData, administrative_designation: e.target.value })
                }
                placeholder="e.g. None, Department Chair, Program Head"
                className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-light-text dark:text-white focus:border-brand-green focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-light-text dark:text-dark-text mb-1">
                Trainings Attended in the Last 3 Years
              </label>
              <select
                value={formData.trainings_last_3_years || '3–5'}
                onChange={(e) =>
                  setFormData({ ...formData, trainings_last_3_years: e.target.value })
                }
                className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-light-text dark:text-white focus:border-brand-green focus:outline-none"
              >
                <option value="None">None</option>
                <option value="1–2">1–2</option>
                <option value="3–5">3–5</option>
                <option value="More than 5">More than 5</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          PART 4: Training History (Areas & Modalities Attended)
      ──────────────────────────────────────────────────────────────────────── */}
      {partNumber === 4 && (
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-brand-green" />
              <h3 className="text-sm font-semibold text-light-text dark:text-white">
                1. Areas of Training Previously Attended
              </h3>
            </div>
            <p className="text-xs text-light-text dark:text-dark-muted mb-3">
              Check all academic and professional domains in which you have completed development programs:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {TRAINING_AREAS_ITEMS.map((area) => {
                const currentAreas = formData.training_areas || [];
                const isChecked = currentAreas.includes(area);
                return (
                  <label
                    key={area}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isChecked
                        ? 'border-brand-green bg-brand-green/10 text-light-text dark:text-white font-medium shadow-sm'
                        : 'border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text hover:border-brand-green/40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const updated = e.target.checked
                          ? [...currentAreas, area]
                          : currentAreas.filter((a: string) => a !== area);
                        setFormData({ ...formData, training_areas: updated });
                      }}
                      className="rounded border-light-border dark:border-dark-border text-brand-green focus:ring-brand-green w-4 h-4"
                    />
                    <span>{area}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-light-border dark:border-dark-border">
            <div className="flex items-center gap-2 mb-2">
              <Compass className="w-4 h-4 text-brand-gold" />
              <h3 className="text-sm font-semibold text-light-text dark:text-white">
                2. Training Modalities Previously Experienced
              </h3>
            </div>
            <p className="text-xs text-light-text dark:text-dark-muted mb-3">
              Check modalities you have attended in the past:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {MODALITY_OPTIONS.map((mod) => {
                const currentMods = formData.training_modalities_attended || [];
                const isChecked = currentMods.includes(mod);
                return (
                  <label
                    key={mod}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      isChecked
                        ? 'border-brand-gold bg-brand-gold/10 text-light-text dark:text-white font-medium'
                        : 'border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text hover:border-brand-gold/40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const updated = e.target.checked
                          ? [...currentMods, mod]
                          : currentMods.filter((m: string) => m !== mod);
                        setFormData({ ...formData, training_modalities_attended: updated });
                      }}
                      className="rounded border-light-border dark:border-dark-border text-brand-gold focus:ring-brand-gold w-4 h-4"
                    />
                    <span className="truncate">{mod}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          PART 5: Competency Assessment (19 Competencies, 2 Scales each)
      ──────────────────────────────────────────────────────────────────────── */}
      {partNumber === 5 && (
        <div className="space-y-6">
          <div>
            <p className="text-xs text-light-text dark:text-dark-muted leading-relaxed">
              For each competency, rate both your <strong>Current Proficiency</strong> (1: No Knowledge to 5: Expert)
              and its <strong>Perceived Importance to your Job</strong> (1: Not Important to 5: Extremely Important).
            </p>
          </div>

          {/* Domain Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-light-border dark:border-dark-border pb-3">
            <span className="text-xs text-light-text dark:text-dark-muted font-medium mr-1">Filter Domain:</span>
            {[
              { id: 'all', label: 'All (19)' },
              { id: 'core', label: 'Core (4)' },
              { id: 'functional', label: 'Functional (10)' },
              { id: 'leadership', label: 'Leadership (5)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCompetencyDomain(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeCompetencyDomain === tab.id
                    ? 'bg-brand-green text-white shadow-sm'
                    : 'bg-light-muted-surface dark:bg-dark-bg text-light-text dark:text-dark-muted hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Competency Cards by Domain */}
          <div className="space-y-6">
            {COMPETENCY_DOMAINS.filter(
              (dom) => activeCompetencyDomain === 'all' || activeCompetencyDomain === dom.domain
            ).map((dom) => (
              <div key={dom.domain} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-brand-gold" />
                    <h3 className="text-sm font-bold text-light-text dark:text-white uppercase tracking-wider text-[11px]">
                      {dom.label}
                    </h3>
                  </div>
                  <span className="text-[11px] text-light-text/60 dark:text-dark-muted font-mono">
                    {dom.items.length} items
                  </span>
                </div>
                <p className="text-[11px] text-light-text/70 dark:text-dark-muted">
                  {dom.description}
                </p>

                <div className="space-y-3.5">
                  {dom.items.map((item) => {
                    const compData = formData.competency?.[item.key] || {
                      proficiency: 3,
                      importance: 4,
                    };
                    const gap = Math.max(0, compData.importance - compData.proficiency);

                    return (
                      <div
                        key={item.key}
                        className="p-4 sm:p-5 rounded-2xl border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg/60 space-y-4 hover:border-brand-green/30 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-bold text-light-text dark:text-white">
                              {item.label}
                            </h4>
                            <p className="text-xs text-light-text/70 dark:text-dark-muted mt-0.5">
                              {item.desc}
                            </p>
                          </div>
                          {gap > 0 && (
                            <span className="inline-flex items-center gap-1 self-start shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 font-mono">
                              Gap: +{gap}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                          {/* Proficiency Slider */}
                          <div className="space-y-1.5 p-3 rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-light-text dark:text-dark-text flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-brand-green" />
                                Current Proficiency:
                              </span>
                              <span className="font-bold text-brand-green font-mono text-xs">
                                {PROFICIENCY_LABELS[compData.proficiency]?.text || `${compData.proficiency}/5`}
                              </span>
                            </div>
                            <input
                              type="range"
                              min={1}
                              max={5}
                              value={compData.proficiency}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setFormData({
                                  ...formData,
                                  competency: {
                                    ...formData.competency,
                                    [item.key]: { ...compData, proficiency: val },
                                  },
                                });
                              }}
                              className="w-full accent-brand-green cursor-pointer"
                            />
                            <p className="text-[10px] text-light-text/60 dark:text-dark-muted italic">
                              {PROFICIENCY_LABELS[compData.proficiency]?.desc}
                            </p>
                          </div>

                          {/* Importance Slider */}
                          <div className="space-y-1.5 p-3 rounded-xl bg-white dark:bg-dark-card border border-light-border dark:border-dark-border">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-light-text dark:text-dark-text flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-brand-gold" />
                                Importance to Job:
                              </span>
                              <span className="font-bold text-brand-gold font-mono text-xs">
                                {IMPORTANCE_LABELS[compData.importance]?.text || `${compData.importance}/5`}
                              </span>
                            </div>
                            <input
                              type="range"
                              min={1}
                              max={5}
                              value={compData.importance}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setFormData({
                                  ...formData,
                                  competency: {
                                    ...formData.competency,
                                    [item.key]: { ...compData, importance: val },
                                  },
                                });
                              }}
                              className="w-full accent-brand-gold cursor-pointer"
                            />
                            <p className="text-[10px] text-light-text/60 dark:text-dark-muted italic">
                              {IMPORTANCE_LABELS[compData.importance]?.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          PART 6: Emerging Training Needs (9 items)
      ──────────────────────────────────────────────────────────────────────── */}
      {partNumber === 6 && (
        <div className="space-y-4">
          <p className="text-xs text-light-text dark:text-dark-muted">
            Rate your individual urgency for professional development in each emerging technology area
            (1: No Need, 2: Low Need, 3: Moderate Need, 4: High Need, 5: Very High Need):
          </p>

          <div className="space-y-3">
            {EMERGING_NEEDS_ITEMS.map((item) => {
              const val = formData.emerging_training_needs?.[item.key] || 4;
              return (
                <div
                  key={item.key}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg/60 gap-4 hover:border-brand-green/30 transition-all"
                >
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-semibold text-light-text dark:text-white">
                      {item.label}
                    </h4>
                    <p className="text-[11px] text-light-text/70 dark:text-dark-muted">
                      {item.desc}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={val}
                      onChange={(e) => {
                        const newVal = parseInt(e.target.value);
                        setFormData({
                          ...formData,
                          emerging_training_needs: {
                            ...formData.emerging_training_needs,
                            [item.key]: newVal,
                          },
                        });
                      }}
                      className="w-28 sm:w-36 accent-brand-green cursor-pointer"
                    />
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-brand-green/10 text-brand-green border border-brand-green/20 min-w-[125px] text-center">
                      {EMERGING_NEED_LABELS[val]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          PART 7: Preferred Learning Modality & Training Availability
      ──────────────────────────────────────────────────────────────────────── */}
      {partNumber === 7 && (
        <div className="space-y-6">
          {/* A. Modality */}
          <div>
            <h3 className="text-sm font-bold text-light-text dark:text-white mb-1">
              A. Preferred Learning Modalities
            </h3>
            <p className="text-xs text-light-text dark:text-dark-muted mb-3">
              Check all training delivery modalities you prefer:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {MODALITY_OPTIONS.map((mod) => {
                const current = formData.preferred_learning_modality || [];
                const checked = current.includes(mod);
                return (
                  <label
                    key={mod}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      checked
                        ? 'border-brand-green bg-brand-green/10 text-light-text dark:text-white font-medium'
                        : 'border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text hover:border-brand-green/40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const updated = e.target.checked
                          ? [...current, mod]
                          : current.filter((m: string) => m !== mod);
                        setFormData({ ...formData, preferred_learning_modality: updated });
                      }}
                      className="rounded border-light-border dark:border-dark-border text-brand-green focus:ring-brand-green w-4 h-4"
                    />
                    <span>{mod}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* B. Schedule */}
          <div className="pt-4 border-t border-light-border dark:border-dark-border">
            <h3 className="text-sm font-bold text-light-text dark:text-white mb-1">
              B. Preferred Training Schedule
            </h3>
            <p className="text-xs text-light-text dark:text-dark-muted mb-3">
              Select your convenient training times:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {SCHEDULE_OPTIONS.map((sched) => {
                const current = formData.preferred_schedule || [];
                const checked = current.includes(sched);
                return (
                  <label
                    key={sched}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      checked
                        ? 'border-brand-gold bg-brand-gold/10 text-light-text dark:text-white font-medium'
                        : 'border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text hover:border-brand-gold/40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const updated = e.target.checked
                          ? [...current, sched]
                          : current.filter((s: string) => s !== sched);
                        setFormData({ ...formData, preferred_schedule: updated });
                      }}
                      className="rounded border-light-border dark:border-dark-border text-brand-gold focus:ring-brand-gold w-4 h-4"
                    />
                    <span>{sched}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* C. Duration */}
          <div className="pt-4 border-t border-light-border dark:border-dark-border">
            <h3 className="text-sm font-bold text-light-text dark:text-white mb-1">
              C. Preferred Duration
            </h3>
            <p className="text-xs text-light-text dark:text-dark-muted mb-3">
              Select ideal duration for program completion:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {DURATION_OPTIONS.map((dur) => {
                const current = formData.preferred_duration || [];
                const checked = current.includes(dur);
                return (
                  <label
                    key={dur}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      checked
                        ? 'border-brand-green bg-brand-green/10 text-light-text dark:text-white font-medium'
                        : 'border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text hover:border-brand-green/40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const updated = e.target.checked
                          ? [...current, dur]
                          : current.filter((d: string) => d !== dur);
                        setFormData({ ...formData, preferred_duration: updated });
                      }}
                      className="rounded border-light-border dark:border-dark-border text-brand-green focus:ring-brand-green w-4 h-4"
                    />
                    <span>{dur}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          PART 8: Barriers to Training Participation (7 items)
      ──────────────────────────────────────────────────────────────────────── */}
      {partNumber === 8 && (
        <div className="space-y-4">
          <p className="text-xs text-light-text dark:text-dark-muted">
            Rate the extent to which each operational factor hinders your participation in professional development:
          </p>

          <div className="space-y-3">
            {BARRIER_ITEMS.map((item) => {
              const val = formData.barriers?.[item.key] || 3;
              return (
                <div
                  key={item.key}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg/60 gap-4 hover:border-amber-500/30 transition-all"
                >
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-semibold text-light-text dark:text-white">
                      {item.label}
                    </h4>
                    <p className="text-[11px] text-light-text/70 dark:text-dark-muted">
                      {item.desc}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={val}
                      onChange={(e) => {
                        const newVal = parseInt(e.target.value);
                        setFormData({
                          ...formData,
                          barriers: {
                            ...formData.barriers,
                            [item.key]: newVal,
                          },
                        });
                      }}
                      className="w-28 sm:w-36 accent-brand-gold cursor-pointer"
                    />
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 min-w-[130px] text-center">
                      {BARRIER_LABELS[val]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Form Action Controls */}
      <div className="flex items-center justify-between pt-6 border-t border-light-border dark:border-dark-border">
        {onPrevPart && partNumber > 1 ? (
          <button
            type="button"
            onClick={onPrevPart}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text hover:text-white hover:border-brand-green text-xs font-semibold transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous Part</span>
          </button>
        ) : (
          <div />
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-green hover:bg-brand-green-dark text-white text-xs font-bold shadow-lg transition-all disabled:opacity-50"
        >
          {saving ? (
            <span>Saving responses...</span>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save & Continue</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
