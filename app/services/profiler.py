"""
Faculty Competency Profiling & Evaluation Engine.

Analyzes faculty questionnaire responses (Part 5: Core, Functional, Leadership Competencies)
to compute objective proficiency indices, identify competency gaps, assign a standard
competency level (Developing, Proficient, Advanced), and generate human-readable,
user-friendly justifications explaining the assigned level.
"""
from __future__ import annotations

from typing import Any
from app.ml.schema import CORE, FUNCTIONAL, LEADERSHIP

# ── Human-readable competency titles ──────────────────────────────────────────
COMPETENCY_TITLES: dict[str, str] = {
    # Core
    "delivering_service_excellence": "Delivering Service Excellence",
    "interpersonal_relationship": "Interpersonal Relationships",
    "professionalism": "Professionalism & Ethics",
    "achievement_orientation": "Achievement Orientation",
    # Functional
    "consultancy_advising": "Consultancy & Technical Advising",
    "critical_thinking_problem_solving": "Critical Thinking & Problem Solving",
    "effective_teaching_classroom_management": "Effective Teaching & Classroom Management",
    "innovative_instructional_material_development": "Innovative Instructional Material Development",
    "computer_literacy_digital_technologies": "Computer Literacy & Digital Technologies",
    "research_competency": "Research Competency & Methodologies",
    "publication_writing": "Research & Publication Writing",
    "quality_assurance_management": "Quality Assurance & Accreditation",
    "technology_transfer_innovation": "Technology Transfer & Innovation",
    "outcomes_based_education": "Outcomes-Based Education (OBE)",
    # Leadership
    "strategic_thinking": "Strategic Thinking & Planning",
    "leading_change": "Leading Change & Transformation",
    "building_collaborative_relationships": "Building Collaborative Relationships",
    "coaching_mentoring": "Coaching & Mentoring",
    "managing_performance": "Managing Performance & Accountability",
}


def evaluate_faculty_profile(record: dict[str, Any]) -> dict[str, Any]:
    """
    Evaluates a faculty questionnaire record and returns a structured Competency Profile.

    Output format:
    {
        "overall_level": "Proficient",  # "Developing" | "Proficient" | "Advanced"
        "level_title": "Proficient / Capable",
        "overall_index": 3.75,          # 1.00 to 5.00
        "average_proficiency": 3.85,
        "average_importance": 4.10,
        "total_gaps_count": 4,          # count of competencies where importance > proficiency
        "domains": {
            "core": {"index": 4.0, "level": "Proficient", "count": 4, "gaps": 0},
            "functional": {"index": 3.5, "level": "Proficient", "count": 10, "gaps": 3},
            "leadership": {"index": 3.8, "level": "Proficient", "count": 5, "gaps": 1},
        },
        "strengths": [
            {"key": "professionalism", "title": "Professionalism & Ethics", "proficiency": 5, "importance": 5}
        ],
        "growth_areas": [
            {
                "key": "publication_writing",
                "title": "Research & Publication Writing",
                "proficiency": 2,
                "importance": 5,
                "gap": 3,
                "reason": "Rated 5 (High Importance) but currently at 2 (Developing Proficiency)"
            }
        ],
        "explanation": {
            "headline": "Proficient with High Potential for Research Growth",
            "summary": "...",
            "target_training_focus": "Specialized & Applied Workshops"
        }
    }
    """
    raw_comp = record.get("competency", {})
    if not isinstance(raw_comp, dict):
        raw_comp = {}

    domain_definitions = {
        "core": CORE,
        "functional": FUNCTIONAL,
        "leadership": LEADERSHIP,
    }

    all_items: list[dict[str, Any]] = []
    domain_results: dict[str, dict[str, Any]] = {}

    for domain_name, comp_keys in domain_definitions.items():
        domain_profs = []
        domain_imps = []
        domain_gaps = []

        for key in comp_keys:
            val = raw_comp.get(key, {})
            if isinstance(val, dict):
                p = float(val.get("proficiency", 3))
                imp = float(val.get("importance", 3))
            elif isinstance(val, (int, float)):
                p = float(val)
                imp = 3.0
            else:
                p = 3.0
                imp = 3.0

            # Clamp between 1.0 and 5.0
            p = max(1.0, min(5.0, p))
            imp = max(1.0, min(5.0, imp))
            gap = max(0.0, imp - p)

            item = {
                "key": key,
                "title": COMPETENCY_TITLES.get(key, key.replace("_", " ").title()),
                "domain": domain_name,
                "proficiency": p,
                "importance": imp,
                "gap": gap,
            }
            all_items.append(item)
            domain_profs.append(p)
            domain_imps.append(imp)
            domain_gaps.append(gap)

        avg_p = sum(domain_profs) / len(domain_profs) if domain_profs else 3.0
        avg_gap = sum(domain_gaps) / len(domain_gaps) if domain_gaps else 0.0
        domain_index = round(avg_p, 2)
        domain_level = _classify_level(domain_index)

        domain_results[domain_name] = {
            "index": domain_index,
            "level": domain_level,
            "count": len(comp_keys),
            "gaps_count": sum(1 for g in domain_gaps if g > 0),
        }

    # ── Overall Calculations ──────────────────────────────────────────────────
    all_profs = [it["proficiency"] for it in all_items]
    all_imps = [it["importance"] for it in all_items]
    all_gaps = [it["gap"] for it in all_items]

    overall_prof = sum(all_profs) / len(all_profs) if all_profs else 3.0
    overall_imp = sum(all_imps) / len(all_imps) if all_imps else 3.0
    overall_gap = sum(all_gaps) / len(all_gaps) if all_gaps else 0.0

    # Weighted index considers proficiency minus a gentle penalty for unaddressed high-importance gaps
    overall_index = round(overall_prof, 2)
    overall_level = _classify_level(overall_index)

    # ── Identify Top Strengths & Critical Growth Areas ─────────────────────────
    # Strengths: highest proficiency, sorted descending
    sorted_by_prof = sorted(all_items, key=lambda x: (x["proficiency"], -x["gap"]), reverse=True)
    strengths = [
        {
            "key": x["key"],
            "title": x["title"],
            "domain": x["domain"],
            "proficiency": int(x["proficiency"]),
            "importance": int(x["importance"]),
        }
        for x in sorted_by_prof if x["proficiency"] >= 4.0
    ][:4]

    # If no items >= 4.0, take top 3 highest anyway
    if not strengths and sorted_by_prof:
        strengths = [
            {
                "key": x["key"],
                "title": x["title"],
                "domain": x["domain"],
                "proficiency": int(x["proficiency"]),
                "importance": int(x["importance"]),
            }
            for x in sorted_by_prof[:3]
        ]

    # Growth areas: items with highest gap (importance > proficiency)
    items_with_gap = [x for x in all_items if x["gap"] > 0]
    sorted_by_gap = sorted(items_with_gap, key=lambda x: (x["gap"], x["importance"]), reverse=True)
    growth_areas = [
        {
            "key": x["key"],
            "title": x["title"],
            "domain": x["domain"],
            "proficiency": int(x["proficiency"]),
            "importance": int(x["importance"]),
            "gap": round(x["gap"], 1),
            "reason": f"Rated as high importance ({int(x['importance'])}/5) while current self-assessed proficiency is {int(x['proficiency'])}/5.",
        }
        for x in sorted_by_gap[:5]
    ]

    # ── Synthesize Human-Friendly Justification ("Why this level?") ───────────
    explanation = _generate_explanation(
        level=overall_level,
        index=overall_index,
        strengths=strengths,
        growth_areas=growth_areas,
        domain_results=domain_results,
    )

    return {
        "overall_level": overall_level,
        "level_tier": _level_tier(overall_level),
        "level_title": _level_title(overall_level),
        "overall_index": overall_index,
        "average_proficiency": round(overall_prof, 2),
        "average_importance": round(overall_imp, 2),
        "total_gaps_count": len(items_with_gap),
        "domains": domain_results,
        "strengths": strengths,
        "growth_areas": growth_areas,
        "explanation": explanation,
    }


def _classify_level(score: float) -> str:
    """Classifies numerical average into standard 3-tier competency level."""
    if score < 3.0:
        return "Developing"
    elif score < 4.25:
        return "Proficient"
    else:
        return "Advanced"


def _level_tier(level: str) -> str:
    """Returns user-facing short tier descriptor (Low, Mid, High)."""
    if level == "Developing":
        return "Low"
    elif level == "Proficient":
        return "Mid"
    return "High"


def _level_title(level: str) -> str:
    if level == "Developing":
        return "Low / Developing"
    elif level == "Proficient":
        return "Mid / Proficient"
    return "High / Advanced"


def _generate_explanation(
    level: str,
    index: float,
    strengths: list[dict],
    growth_areas: list[dict],
    domain_results: dict,
) -> dict[str, str]:
    """Builds user-friendly diagnostic text and training recommendation orientation."""
    strength_names = [s["title"] for s in strengths[:2]]
    strength_str = ", ".join(strength_names) if strength_names else "consistent dedication across core duties"

    gap_names = [g["title"] for g in growth_areas[:2]]
    gap_str = ", ".join(gap_names) if gap_names else "specific specialized continuous improvement modules"

    if level == "Developing":
        headline = "Developing Foundation — Immediate Training Support Recommended"
        summary = (
            f"Your overall self-assessed competency index is {index:.2f}/5.00. "
            f"While demonstrating positive baseline skills in {strength_str}, "
            f"there are marked development opportunities in {gap_str}. "
            "Prioritizing foundational workshops will rapidly strengthen day-to-day instructional effectiveness."
        )
        focus = "Foundational & Core Competency Enhancement (Workshops, Hands-on Mentoring)"

    elif level == "Proficient":
        headline = "Proficient & Competent — Ready for Specialized Upskilling"
        summary = (
            f"Your overall self-assessed competency index is {index:.2f}/5.00, reflecting strong operational competence. "
            f"You demonstrate notable expertise in {strength_str}. "
            f"To advance towards exemplary standing, focused interventions are recommended in {gap_str}."
        )
        focus = "Intermediate to Specialized Skills (Applied Pedagogy, Technology Integration, Publication)"

    else:  # Advanced
        headline = "Advanced & Exemplary — Leadership & Innovation Trajectory"
        summary = (
            f"Your overall self-assessed competency index is {index:.2f}/5.00, demonstrating high mastery across academic domains. "
            f"You stand out strongly in {strength_str}. "
            "You are well-positioned for leadership, mentorship, and high-level institutional innovation."
        )
        focus = "Advanced Masterclasses, Train-the-Trainer, Research Commercialization & Institutional Leadership"

    return {
        "headline": headline,
        "summary": summary,
        "target_training_focus": focus,
    }

