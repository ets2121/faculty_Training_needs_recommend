from app.ml.schema import COMPETENCY_TO_TOPIC, EMERGING_TO_TOPIC

def baseline_scores(record: dict) -> dict[str, float]:
    scores: dict[str, float] = {}

    competency = record.get("competency", {})
    for c, topic in COMPETENCY_TO_TOPIC.items():
        item = competency.get(c, {})
        p = item.get("proficiency", 3)
        imp = item.get("importance", 3)
        gap = max(0, imp - p)
        scores[topic] = scores.get(topic, 0) + gap * 0.6 + imp * 0.1

    emerging = record.get("emerging_training_needs", {})
    for key, topic in EMERGING_TO_TOPIC.items():
        scores[topic] = scores.get(topic, 0) + emerging.get(key, 3) * 0.8

    return scores
