from typing import Any

import pandas as pd

from app.ml.schema import CORE, FUNCTIONAL, LEADERSHIP


MODALITIES = [
    "Face-to-Face Seminar",
    "Webinar",
    "Blended Learning",
    "Coaching",
    "Mentoring",
    "Benchmarking",
    "Project Immersion",
    "Formal Schooling",
    "Self-Paced Online Course",
]

SCHEDULES = [
    "Semester Break",
    "Summer",
    "Saturdays",
    "Fridays",
    "Anytime",
]

DURATIONS = [
    "Half-day",
    "One day",
    "Two days",
    "Three days",
    "One week",
]

TRAINING_AREAS = [
    "Instruction",
    "Research",
    "Extension",
    "Quality Assurance",
    "Information Technology",
    "Leadership",
    "Outcomes-Based Education",
]

EMERGING_NEEDS = [
    "artificial_intelligence",
    "machine_learning",
    "data_analytics",
    "cybersecurity",
    "cloud_computing",
    "learning_management_systems",
    "educational_technology",
    "statistical_software",
    "research_methods",
]

BARRIERS = [
    "heavy_teaching_workload",
    "administrative_responsibilities",
    "lack_of_budget",
    "time_constraints",
    "travel_distance",
    "family_responsibilities",
    "internet_connectivity",
]


def normalize_key(value: str) -> str:
    return (
        str(value)
        .strip()
        .lower()
        .replace("-", "_")
        .replace(" ", "_")
        .replace("/", "_")
        .replace("&", "and")
    )


def normalize_selected_values(values: Any) -> set[str]:
    if values is None:
        return set()

    if isinstance(values, str):
        values = [values]

    return {
        normalize_key(value)
        for value in values
        if value is not None
    }


def flatten_record(record: dict[str, Any]) -> dict[str, Any]:
    out: dict[str, Any] = {}

    # --------------------------------------------------------
    # BASIC FACULTY INFORMATION
    # faculty_id intentionally excluded from ML features.
    # --------------------------------------------------------

    basic_fields = [
        "department",
        "age",
        "sex",
        "employment_status",
        "academic_rank",
        "highest_educational_attainment",
        "field_of_specialization",
        "years_teaching",
        "administrative_designation",
        "trainings_last_3_years",
    ]

    for key in basic_fields:
        out[key] = record.get(key)

    # --------------------------------------------------------
    # TRAINING HISTORY
    # --------------------------------------------------------

    training_areas = normalize_selected_values(
        record.get("training_areas", [])
    )

    for area in TRAINING_AREAS:
        normalized = normalize_key(area)

        out[f"trained_{normalized}"] = int(
            normalized in training_areas
        )

    # --------------------------------------------------------
    # COMPETENCIES
    # --------------------------------------------------------

    competency = record.get("competency", {})

    if not isinstance(competency, dict):
        competency = {}

    all_competencies = (
        list(CORE)
        + list(FUNCTIONAL)
        + list(LEADERSHIP)
    )

    for competency_name in all_competencies:
        item = competency.get(
            competency_name,
            {}
        )

        if not isinstance(item, dict):
            item = {}

        proficiency = item.get(
            "proficiency",
            3
        )

        importance = item.get(
            "importance",
            3
        )

        try:
            proficiency = float(proficiency)
        except (TypeError, ValueError):
            proficiency = 3.0

        try:
            importance = float(importance)
        except (TypeError, ValueError):
            importance = 3.0

        out[
            f"{competency_name}_proficiency"
        ] = proficiency

        out[
            f"{competency_name}_importance"
        ] = importance

        out[
            f"{competency_name}_gap"
        ] = max(
            0.0,
            importance - proficiency
        )

    # --------------------------------------------------------
    # EMERGING TRAINING NEEDS
    # --------------------------------------------------------

    emerging = record.get(
        "emerging_training_needs",
        {}
    )

    if not isinstance(emerging, dict):
        emerging = {}

    for name in EMERGING_NEEDS:
        value = emerging.get(
            name,
            3
        )

        try:
            value = float(value)
        except (TypeError, ValueError):
            value = 3.0

        out[
            f"{name}_need"
        ] = value

    # --------------------------------------------------------
    # LEARNING MODALITY
    # --------------------------------------------------------

    selected_modalities = normalize_selected_values(
        record.get(
            "preferred_learning_modality",
            []
        )
    )

    for modality in MODALITIES:
        normalized = normalize_key(
            modality
        )

        out[
            f"modality_{normalized}"
        ] = int(
            normalized in selected_modalities
        )

    # --------------------------------------------------------
    # SCHEDULE
    # --------------------------------------------------------

    selected_schedules = normalize_selected_values(
        record.get(
            "preferred_schedule",
            []
        )
    )

    for schedule in SCHEDULES:
        normalized = normalize_key(
            schedule
        )

        out[
            f"schedule_{normalized}"
        ] = int(
            normalized in selected_schedules
        )

    # --------------------------------------------------------
    # DURATION
    # --------------------------------------------------------

    selected_durations = normalize_selected_values(
        record.get(
            "preferred_duration",
            []
        )
    )

    for duration in DURATIONS:
        normalized = normalize_key(
            duration
        )

        out[
            f"duration_{normalized}"
        ] = int(
            normalized in selected_durations
        )

    # --------------------------------------------------------
    # BARRIERS
    # --------------------------------------------------------

    barriers = record.get(
        "barriers",
        {}
    )

    if not isinstance(barriers, dict):
        barriers = {}

    for barrier in BARRIERS:
        value = barriers.get(
            barrier,
            0
        )

        try:
            value = float(value)
        except (TypeError, ValueError):
            value = 0.0

        out[
            f"barrier_{barrier}"
        ] = value

    return out


def to_frame(
    records: list[dict[str, Any]]
) -> pd.DataFrame:

    return pd.DataFrame(
        [
            flatten_record(record)
            for record in records
        ]
    )