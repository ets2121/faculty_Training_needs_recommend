# Questionnaire-aligned feature definitions.
# The source questionnaire uses:
# - Profile
# - Training History
# - Core/Functional/Leadership competencies with Proficiency and Importance 1-5
# - 9 emerging training needs
# - Learning modality
# - Schedule/duration
# - 7 barriers
# - Top Five priority training topics
#
# Department list is intentionally configurable because the questionnaire's printed list
# should be treated as the source baseline, while the application must support future departments.

CORE = [
    "delivering_service_excellence",
    "interpersonal_relationship",
    "professionalism",
    "achievement_orientation",
]

FUNCTIONAL = [
    "consultancy_advising",
    "critical_thinking_problem_solving",
    "effective_teaching_classroom_management",
    "innovative_instructional_material_development",
    "computer_literacy_digital_technologies",
    "research_competency",
    "publication_writing",
    "quality_assurance_management",
    "technology_transfer_innovation",
    "outcomes_based_education",
]

LEADERSHIP = [
    "strategic_thinking",
    "leading_change",
    "building_collaborative_relationships",
    "coaching_mentoring",
    "managing_performance",
]

EMERGING = [
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

TRAINING_AREAS = [
    "Instruction", "Research", "Extension", "Quality Assurance",
    "Information Technology", "Leadership", "Outcomes-Based Education"
]

SOURCE_DEPARTMENTS = [
    "BSCE", "BEED", "BSBA", "BSCS", "BAELS", "BSMATH", "BSHM", "BSMidwifery"
]

# Additional departments can be enabled without changing model architecture.
COMMON_EXTENSIONS = ["BSIT"]

COMPETENCY_TO_TOPIC = {
    "computer_literacy_digital_technologies": "Educational Technology",
    "research_competency": "Research Methods",
    "publication_writing": "Research and Publication Writing",
    "effective_teaching_classroom_management": "Effective Teaching and Classroom Management",
    "innovative_instructional_material_development": "Innovative Instructional Material Development",
    "outcomes_based_education": "Outcomes-Based Education",
    "quality_assurance_management": "Quality Assurance Management",
    "technology_transfer_innovation": "Technology Transfer and Innovation",
    "critical_thinking_problem_solving": "Critical Thinking and Problem Solving",
    "strategic_thinking": "Leadership and Strategic Management",
}

EMERGING_TO_TOPIC = {
    "artificial_intelligence": "Artificial Intelligence",
    "machine_learning": "Machine Learning",
    "data_analytics": "Data Analytics",
    "cybersecurity": "Cybersecurity",
    "cloud_computing": "Cloud Computing",
    "learning_management_systems": "Learning Management Systems",
    "educational_technology": "Educational Technology",
    "statistical_software": "Statistical Software",
    "research_methods": "Research Methods",
}
