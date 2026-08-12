import httpx
import json

BASE = "http://127.0.0.1:8000/api/v1"

# Health check
r = httpx.get(f"{BASE}/health")
print("=== Health ===")
print(json.dumps(r.json(), indent=2))

# Individual recommendation
payload = {
    "faculty": {
        "department": "BSED",
        "age": 35,
        "sex": "Female",
        "employment_status": "Permanent",
        "academic_rank": "Assistant Professor",
        "highest_educational_attainment": "Master's Degree",
        "field_of_specialization": "English",
        "years_teaching": "5-10 years",
        "trainings_last_3_years": "1-2",
        "emerging_training_needs": {
            "artificial_intelligence": 5,
            "educational_technology": 5,
            "research_methods": 4
        },
        "preferred_learning_modality": ["Webinar", "Blended Learning"],
        "preferred_schedule": ["Saturdays"]
    }
}

r2 = httpx.post(f"{BASE}/recommendations/individual", json=payload, timeout=30)
d = r2.json()

print()
print("=== Individual Recommendation ===")
print("status       :", d.get("status"))
model = d.get("model", {})
print("model version:", model.get("version"))
print("model status :", model.get("status"))

print()
print("Top ML Predictions (raw model probabilities):")
for p in d.get("prediction", {}).get("top_predictions", []):
    rank = p["rank"]
    cat = p["training_category"]
    prob = p["probability"]
    print(f"  [{rank}] {cat:<45s} prob={prob}")

print()
print("Catalog Recommendations (matched programs):")
for rec in d.get("recommendations", []):
    tid = rec["training_id"]
    title = rec["title"][:50]
    score = rec["match_score"]
    print(f"  [{tid}] {title:<52s} match_score={score}")
