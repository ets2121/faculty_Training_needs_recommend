"""
Faculty Competency Profiling & Evaluation Engine.

Analyzes faculty questionnaire responses:
- Part 1: Personal Profile (Career Stage)
- Part 2: Educational Background (Academic Credential Tier)
- Part 3: Professional Background (Academic Rank & Experience Tier)
- Part 5: Competency Assessment (Core, Functional, Leadership Proficiency)
- Part 6: Emerging Training Needs (Urgency / Demand Tier)

Computes objective indices, maps transparent tier levels (Low, Mid, High),
and generates concise, readable explanations without information overload.
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


def evaluate_part_levels(record: dict[str, Any]) -> list[dict[str, Any]]:
    """
    Evaluates individual questionnaire required parts (1, 2, 3, 5, 6)
    and produces clear, concise micro-level ratings with user-friendly 'Why' explanations.
    """
    part_evals = []

    # ── Part 1: Personal Profile (Career Stage & Demographics) ────────────────
    age = record.get("age")
    emp_status = str(record.get("employment_status", "")).strip().lower()
    years = str(record.get("years_teaching", "")).strip().lower()

    if age is not None:
        try:
            age_int = int(age)
            # Combine age + actual years teaching to avoid penalizing older new entrants or young fast-track faculty
            if "below 5" in years or "less" in years or "cos" in emp_status or "contractual" in emp_status:
                p1_tier = "Low"
                p1_level = "Early Career / Onboarding"
                p1_desc = f"Teaching tenure ({years or 'under 5 yrs'}) with {emp_status.title() or 'Entry'} status, focusing on instructional baseline foundation."
            elif "more than 20" in years or "16-20" in years or age_int >= 50:
                p1_tier = "High"
                p1_level = "Senior Career Phase"
                p1_desc = f"Extensive teaching experience ({years or '15+ yrs'}) with mature academic tenure."
            else:
                p1_tier = "Mid"
                p1_level = "Mid-Career Established"
                p1_desc = f"Established academic career ({years or '5-15 yrs'}), progressing in pedagogical and departmental service."
        except Exception:
            p1_tier = "Mid"
            p1_level = "Mid-Career"
            p1_desc = "Standard academic career stage."
    else:
        p1_tier = "Mid"
        p1_level = "In Progress"
        p1_desc = "Personal profile submitted."

    part_evals.append({
        "part_number": 1,
        "title": "Personal Profile",
        "dimension": "Career Stage",
        "level_tier": p1_tier,
        "level_label": p1_level,
        "why": p1_desc,
    })

    # ── Part 2: Educational Background (Academic Qualification Tier) ──────────
    degree = str(record.get("highest_educational_attainment", "")).strip().lower()
    spec = str(record.get("field_of_specialization", "General")).strip()
    if any(k in degree for k in ["doc", "phd", "edd"]):
        p2_tier = "High"
        p2_level = "Doctorate Level (Terminal)"
        p2_desc = f"Holds terminal Doctorate in {spec}, meeting highest accreditation benchmark."
    elif any(k in degree for k in ["mast", "ms", "ma", "mba"]):
        p2_tier = "Mid"
        p2_level = "Master's Degree Level"
        p2_desc = f"Master's degree holder in {spec}, compliant with standard CHED faculty requirements."
    else:
        p2_tier = "Low"
        p2_level = "Bachelor's Degree Level"
        p2_desc = f"Baccalaureate qualification in {spec}; prioritized for postgraduate vertical articulation."

    part_evals.append({
        "part_number": 2,
        "title": "Educational Background",
        "dimension": "Academic Attainment",
        "level_tier": p2_tier,
        "level_label": p2_level,
        "why": p2_desc,
    })

    # ── Part 3: Professional Background (Academic Rank & Experience) ───────────
    rank = str(record.get("academic_rank", "")).strip().lower()
    years = str(record.get("years_teaching", "")).strip().lower()
    train_count = str(record.get("trainings_last_3_years", "0")).strip()

    if any(k in rank for k in ["prof", "assoc"]):
        p3_tier = "High"
        p3_level = "Senior Academic Rank"
        p3_desc = f"Attained higher professorial rank ({record.get('academic_rank', 'Senior')}) with {years or 'solid'} teaching track record."
    elif "assist" in rank:
        p3_tier = "Mid"
        p3_level = "Intermediate Academic Rank"
        p3_desc = f"Assistant Professor rank with progressive teaching service ({years or 'mid-level'})."
    else:
        p3_tier = "Low"
        p3_level = "Entry Faculty Rank"
        p3_desc = f"Instructor level ({record.get('academic_rank', 'Instructor')}), focused on tenure and rank promotion."

    part_evals.append({
        "part_number": 3,
        "title": "Professional Background",
        "dimension": "Faculty Rank & Experience",
        "level_tier": p3_tier,
        "level_label": p3_level,
        "why": p3_desc,
    })

    # ── Part 5: Competency Assessment (Core Self-Assessed Skills) ──────────────
    raw_comp = record.get("competency", {})
    if isinstance(raw_comp, dict) and raw_comp:
        all_p = []
        all_g = []
        for v in raw_comp.values():
            if isinstance(v, dict):
                p = float(v.get("proficiency", 3))
                imp = float(v.get("importance", 3))
                all_p.append(p)
                all_g.append(max(0.0, imp - p))
        avg_p = sum(all_p) / len(all_p) if all_p else 3.0
        gaps_cnt = sum(1 for g in all_g if g > 0)
        
        if avg_p >= 4.25:
            p5_tier = "High"
            p5_level = "Advanced Competency"
            p5_desc = f"High proficiency ({avg_p:.2f}/5.0) across competencies with {gaps_cnt} flagged development gaps."
        elif avg_p >= 3.0:
            p5_tier = "Mid"
            p5_level = "Proficient Competency"
            p5_desc = f"Solid operational proficiency ({avg_p:.2f}/5.0) with {gaps_cnt} specific growth gaps flagged for upskilling."
        else:
            p5_tier = "Low"
            p5_level = "Developing Competency"
            p5_desc = f"Proficiency index of {avg_p:.2f}/5.0 shows essential training needs across core teaching functions."
    else:
        p5_tier = "Mid"
        p5_level = "Pending Assessment"
        p5_desc = "Competency evaluation pending or baseline values used."

    part_evals.append({
        "part_number": 5,
        "title": "Competency Assessment",
        "dimension": "Instructional Skills",
        "level_tier": p5_tier,
        "level_label": p5_level,
        "why": p5_desc,
    })

    # ── Part 6: Emerging Training Needs (Demand & Technology Urgency) ───────────
    emerging = record.get("emerging_training_needs", {})
    if isinstance(emerging, dict) and emerging:
        needs_vals = [float(v) for v in emerging.values() if isinstance(v, (int, float))]
        avg_need = sum(needs_vals) / len(needs_vals) if needs_vals else 3.0
        high_urgency = sum(1 for v in needs_vals if v >= 4)

        if avg_need >= 4.2 or high_urgency >= 5:
            p6_tier = "High"
            p6_level = "High Urgency / High Demand"
            p6_desc = f"Expressed strong urgency ({avg_need:.2f}/5.0 avg) across emerging tech and modern pedagogy."
        elif avg_need >= 3.0:
            p6_tier = "Mid"
            p6_level = "Moderate Urgency"
            p6_desc = f"Balanced learning demand ({avg_need:.2f}/5.0 avg) for targeted institutional technologies."
        else:
            p6_tier = "Low"
            p6_level = "Selective Need"
            p6_desc = f"Lower urgency ratings ({avg_need:.2f}/5.0 avg); selective participation requested."
    else:
        p6_tier = "Mid"
        p6_level = "Moderate Demand"
        p6_desc = "Standard technology demand profile."

    part_evals.append({
        "part_number": 6,
        "title": "Emerging Training Needs",
        "dimension": "Technology Demand",
        "level_tier": p6_tier,
        "level_label": p6_level,
        "why": p6_desc,
    })

    return part_evals


def evaluate_faculty_profile(
    record: dict[str, Any],
    prediction_details: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Evaluates a faculty questionnaire record and returns a comprehensive, compact Competency Profile.
    Features Model-Augmented Profiling:
    - 50% Self-Assessed Proficiency (Faculty Voice)
    - 25% Institutional Credential Baseline (Degree & Academic Rank)
    - 25% Random Forest ML Predictive Signal (Learned cohort competency deficits)
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
        domain_index = round(avg_p, 2)
        domain_level = _classify_level(domain_index)

        domain_results[domain_name] = {
            "index": domain_index,
            "level": domain_level,
            "level_tier": _level_tier(domain_level),
            "count": len(comp_keys),
            "gaps_count": sum(1 for g in domain_gaps if g > 0),
        }

    # ── Overall Calculations: Model-Augmented Hybrid Composite Index ─────────
    # Combines Self-Assessment (50%), Credential Baseline (25%), and ML Gap Signal (25%)
    all_profs = [it["proficiency"] for it in all_items]
    all_imps = [it["importance"] for it in all_items]
    all_gaps = [it["gap"] for it in all_items]

    self_prof_avg = sum(all_profs) / len(all_profs) if all_profs else 3.0
    overall_imp = sum(all_imps) / len(all_imps) if all_imps else 3.0

    # 1. Objective Credential Score (Degree + Rank)
    degree_str = str(record.get("highest_educational_attainment", "")).lower()
    rank_str = str(record.get("academic_rank", "")).lower()
    deg_score = 4.8 if any(k in degree_str for k in ["doc", "phd", "edd"]) else 3.8 if any(k in degree_str for k in ["mast", "ms", "ma", "mba"]) else 2.8
    rank_score = 4.8 if any(k in rank_str for k in ["prof", "assoc"]) else 3.8 if "assist" in rank_str else 2.8
    credential_avg = (deg_score + rank_score) / 2.0

    # 2. Machine Learning Predictive Gap Signal (Informed by Random Forest)
    ml_confidence_label = "Active Model Confirmed"
    ml_top_category = None
    if prediction_details and "all_predictions" in prediction_details:
        preds = prediction_details["all_predictions"]
        if preds:
            top_prob = float(preds[0].get("probability", 0.5))
            ml_top_category = preds[0].get("training_category", "Core Pedagogy")
            # Invert probability to competency mastery index (high deficit prob -> lower baseline mastery)
            ml_mastery_signal = max(1.5, min(4.8, 5.0 - (top_prob * 3.5)))
        else:
            ml_mastery_signal = 3.2
    else:
        ml_mastery_signal = credential_avg  # fallback if no ML prediction provided

    # Composite Index: 50% Self-Assessment + 25% Credentials + 25% Machine Learning
    overall_index = round((0.50 * self_prof_avg) + (0.25 * credential_avg) + (0.25 * ml_mastery_signal), 2)
    overall_level = _classify_level(overall_index)
    overall_tier = _level_tier(overall_level)

    # ── Identify Top Strengths & Critical Growth Areas ─────────────────────────
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
    ][:3]

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
            "reason": f"Rated high importance ({int(x['importance'])}/5) vs current self-assessed proficiency of {int(x['proficiency'])}/5.",
        }
        for x in sorted_by_gap[:3]
    ]

    # ── Part Levels Breakdown ─────────────────────────────────────────────────
    part_levels = evaluate_part_levels(record)

    # ── Concise Justification ─────────────────────────────────────────────────
    explanation = _generate_explanation(
        level=overall_level,
        index=overall_index,
        strengths=strengths,
        growth_areas=growth_areas,
    )

    return {
        "overall_level": overall_level,
        "level_tier": overall_tier,
        "level_title": _level_title(overall_level),
        "overall_index": overall_index,
        "average_proficiency": round(self_prof_avg, 2),
        "average_importance": round(overall_imp, 2),
        "ml_signal": {
            "applied": prediction_details is not None,
            "mastery_score": round(ml_mastery_signal, 2),
            "top_predicted_deficit": ml_top_category or "Pedagogical Specialization",
            "model_support_label": "Informed by Random Forest Inferences",
        },
        "total_gaps_count": len(items_with_gap),
        "domains": domain_results,
        "part_levels": part_levels,
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
) -> dict[str, str]:
    """Builds concise, user-friendly diagnostic text without information overload."""
    strength_names = [s["title"] for s in strengths[:2]]
    strength_str = ", ".join(strength_names) if strength_names else "core educational values"

    gap_names = [g["title"] for g in growth_areas[:2]]
    gap_str = ", ".join(gap_names) if gap_names else "specific specialized areas"

    if level == "Developing":
        headline = "Developing Baseline — Foundational Support Recommended"
        summary = (
            f"Your competency score is {index:.2f}/5.0 (Low Tier). "
            f"You demonstrate dedication in {strength_str}, but have key development opportunities in {gap_str}. "
            "Foundational workshops will accelerate your instructional growth."
        )
        focus = "Foundational Skills (Introductory Seminars & Direct Coaching)"

    elif level == "Proficient":
        headline = "Proficient & Competent — Ready for Applied Specialization"
        summary = (
            f"Your competency score is {index:.2f}/5.0 (Mid Tier), reflecting reliable performance in {strength_str}. "
            f"Upskilling in {gap_str} will elevate your standing toward exemplary academic output."
        )
        focus = "Applied Pedagogical & Research Workshops (Specialized Hands-on Modules)"

    else:  # Advanced
        headline = "Advanced & Exemplary — Leadership & Innovation Phase"
        summary = (
            f"Your competency score is {index:.2f}/5.0 (High Tier) with standout mastery in {strength_str}. "
            "You are ready for research commercialization, peer mentorship, and academic governance."
        )
        focus = "Masterclasses, Train-the-Trainer & Institutional Innovation"

    return {
        "headline": headline,
        "summary": summary,
        "target_training_focus": focus,
        "strengths_summary": strength_str,
        "gaps_summary": gap_str,
        "tier_label": "Low Tier" if level == "Developing" else "Mid Tier" if level == "Proficient" else "High Tier",
    }
