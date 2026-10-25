"""
Dedicated CLI Seed Script for QSU Training Catalog
Populates the MySQL database table 'training_catalog' directly from 'data/raw/training_catalog.json'
aligned with the 17 canonical training needs topics and questionnaire schemas.
"""
import json
import sys
from pathlib import Path
from sqlalchemy.orm import Session

# Add project root to sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from app.db.session import engine, SessionLocal
from app.db.models import Base, TrainingCatalog

JSON_PATH = ROOT_DIR / "data" / "raw" / "training_catalog.json"


def load_canonical_json_items() -> list[dict]:
    """Loads and returns canonical T001-T017 items from data/raw/training_catalog.json."""
    if not JSON_PATH.exists():
        raise FileNotFoundError(f"Canonical catalog JSON not found at {JSON_PATH}")

    with open(JSON_PATH, "r", encoding="utf-8") as f:
        items = json.load(f)

    # Load unique programs from json
    canonical_items = []
    seen_ids = set()
    for it in items:
        tid = it.get("training_id", "").strip()
        if not tid:
            continue
        if tid in seen_ids:
            continue
        seen_ids.add(tid)
        canonical_items.append(it)

    # Sort by training_id
    canonical_items.sort(key=lambda x: x["training_id"])
    return canonical_items


def seed_training_catalog(db: Session, force_reset: bool = True) -> int:
    """
    Seeds the training catalog items into MySQL 'training_catalog' table.
    If force_reset is True, deletes existing non-canonical items and cleanly syncs all 17 items.
    """
    Base.metadata.create_all(bind=engine)
    items = load_canonical_json_items()
    valid_tids = {it["training_id"] for it in items}

    # 1. Clean up stale/duplicate items not in canonical list (e.g. TRN-018 to TRN-021)
    stale_items = db.query(TrainingCatalog).filter(~TrainingCatalog.training_id.in_(valid_tids)).all()
    for stale in stale_items:
        db.delete(stale)
    if stale_items:
        db.commit()
        print(f"Removed {len(stale_items)} non-canonical catalog entries from database.")

    # 2. Fast upsert canonical entries
    inserted_count = 0
    updated_count = 0

    for item in items:
        tid = item["training_id"]
        existing = db.query(TrainingCatalog).filter(TrainingCatalog.training_id == tid).first()

        cat_list = item.get("categories", [])
        if isinstance(cat_list, str):
            cat_list = [c.strip() for c in cat_list.split(",") if c.strip()]
        target_comp = item.get("target_competencies", [])
        modalities = item.get("modalities", [])
        durations = item.get("durations", [])
        schedules = item.get("schedules", [])

        if existing:
            existing.title = item.get("title", "")
            existing.description = item.get("description", "")
            existing.categories_json = json.dumps(cat_list)
            existing.target_competencies_json = json.dumps(target_comp)
            existing.modalities_json = json.dumps(modalities)
            existing.durations_json = json.dumps(durations)
            existing.schedules_json = json.dumps(schedules)
            existing.status = item.get("status", "active")
            updated_count += 1
        else:
            db.add(TrainingCatalog(
                training_id=tid,
                title=item.get("title", ""),
                description=item.get("description", ""),
                categories_json=json.dumps(cat_list),
                target_competencies_json=json.dumps(target_comp),
                modalities_json=json.dumps(modalities),
                durations_json=json.dumps(durations),
                schedules_json=json.dumps(schedules),
                status=item.get("status", "active"),
            ))
            inserted_count += 1

    db.commit()

    # Re-save canonical JSON to ensure cleanliness
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(items, f, indent=2, ensure_ascii=False)

    print(f"Catalog DB Seed Complete: {inserted_count} added, {updated_count} updated (Total: {len(items)}).")
    return len(items)


if __name__ == "__main__":
    print("=" * 60)
    print("Seeding QSU Training Catalog from Canonical JSON...")
    print("=" * 60)
    db = SessionLocal()
    try:
        count = seed_training_catalog(db, force_reset=True)
        print("=" * 60)
        print(f"Successfully synced {count} canonical training programs to database!")
        print("=" * 60)
    finally:
        db.close()
