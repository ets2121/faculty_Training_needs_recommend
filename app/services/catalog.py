import json
from pathlib import Path
from typing import Any
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.models import TrainingCatalog
from app.db.session import SessionLocal


class CatalogService:
    """
    Catalog Service handles loading, managing, and querying available training programs.
    Supports MySQL database persistence (TrainingCatalog table) with JSON file fallback.
    """

    def __init__(self, catalog_path: str | Path | None = None):
        settings = get_settings()
        if catalog_path is None:
            json_path = Path("./data/raw/training_catalog.json")
            if json_path.exists():
                self.catalog_path = json_path
            else:
                self.catalog_path = Path(settings.training_catalog_path)
        else:
            self.catalog_path = Path(catalog_path)

        self.items: list[dict[str, Any]] = []
        self.reload()

    def reload(self) -> None:
        """Reload catalog items from database, falling back to JSON file if empty/unavailable."""
        db_items = self._load_from_db()
        if db_items:
            self.items = db_items
            return

        # Fallback to JSON file
        if self.catalog_path.exists() and self.catalog_path.suffix == ".json":
            try:
                with open(self.catalog_path, "r", encoding="utf-8") as f:
                    self.items = json.load(f)
            except Exception:
                self.items = []
        else:
            self.items = []

    def _load_from_db(self) -> list[dict[str, Any]]:
        """Try loading items from MySQL TrainingCatalog table."""
        try:
            db: Session = SessionLocal()
            try:
                records = db.query(TrainingCatalog).all()
                if not records:
                    return []
                results = []
                for r in records:
                    results.append({
                        "training_id": r.training_id,
                        "title": r.title,
                        "description": r.description or "",
                        "categories": json.loads(r.categories_json) if r.categories_json else [],
                        "target_competencies": json.loads(r.target_competencies_json) if r.target_competencies_json else [],
                        "modalities": json.loads(r.modalities_json) if r.modalities_json else [],
                        "durations": json.loads(r.durations_json) if r.durations_json else [],
                        "schedules": json.loads(r.schedules_json) if r.schedules_json else [],
                        "status": r.status,
                    })
                return results
            finally:
                db.close()
        except Exception:
            return []

    def get_all_items(self, include_inactive: bool = False) -> list[dict[str, Any]]:
        """Get all catalog items, optionally including inactive programs."""
        self.reload()  # Always read fresh state
        if include_inactive:
            return self.items
        return [item for item in self.items if item.get("status", "active") == "active"]

    def get_item_by_id(self, training_id: str) -> dict[str, Any] | None:
        for item in self.get_all_items(include_inactive=True):
            if item.get("training_id") == training_id:
                return item
        return None

    def add_item(self, item_data: dict[str, Any]) -> dict[str, Any]:
        """
        Add or update a catalog item in MySQL DB and JSON backup file.
        """
        training_id = item_data.get("training_id")
        if not training_id:
            all_items = self.get_all_items(include_inactive=True)
            training_id = f"TRN-{len(all_items) + 1:03d}"

        categories = item_data.get("categories", [])
        if isinstance(categories, str):
            categories = [c.strip() for c in categories.split(",") if c.strip()]

        target_competencies = item_data.get("target_competencies", [])
        modalities = item_data.get("modalities", [])
        durations = item_data.get("durations", [])
        schedules = item_data.get("schedules", [])

        new_item = {
            "training_id": training_id,
            "title": item_data.get("title", ""),
            "description": item_data.get("description", ""),
            "categories": categories or [item_data.get("category", "")],
            "target_competencies": target_competencies,
            "modalities": modalities,
            "durations": durations,
            "schedules": schedules,
            "status": item_data.get("status", "active"),
        }

        # 1. Save to MySQL DB
        try:
            db: Session = SessionLocal()
            try:
                existing = db.query(TrainingCatalog).filter(TrainingCatalog.training_id == training_id).first()
                if existing:
                    if "title" in item_data and item_data["title"]:
                        existing.title = item_data["title"]
                    if "description" in item_data and item_data["description"] is not None:
                        existing.description = item_data["description"]
                    if "categories" in item_data and item_data["categories"]:
                        existing.categories_json = json.dumps(new_item["categories"])
                    elif not new_item["categories"] and existing.categories_json:
                        new_item["categories"] = json.loads(existing.categories_json)

                    if "target_competencies" in item_data and item_data["target_competencies"] is not None:
                        existing.target_competencies_json = json.dumps(item_data["target_competencies"])
                    elif existing.target_competencies_json:
                        new_item["target_competencies"] = json.loads(existing.target_competencies_json)

                    if "modalities" in item_data and item_data["modalities"] is not None:
                        existing.modalities_json = json.dumps(item_data["modalities"])
                    elif existing.modalities_json:
                        new_item["modalities"] = json.loads(existing.modalities_json)

                    if "durations" in item_data and item_data["durations"] is not None:
                        existing.durations_json = json.dumps(item_data["durations"])
                    elif existing.durations_json:
                        new_item["durations"] = json.loads(existing.durations_json)

                    if "schedules" in item_data and item_data["schedules"] is not None:
                        existing.schedules_json = json.dumps(item_data["schedules"])
                    elif existing.schedules_json:
                        new_item["schedules"] = json.loads(existing.schedules_json)

                    if "status" in item_data and item_data["status"]:
                        existing.status = item_data["status"]
                    else:
                        new_item["status"] = existing.status
                else:
                    db.add(TrainingCatalog(
                        training_id=training_id,
                        title=new_item["title"],
                        description=new_item["description"],
                        categories_json=json.dumps(new_item["categories"]),
                        target_competencies_json=json.dumps(new_item["target_competencies"]),
                        modalities_json=json.dumps(new_item["modalities"]),
                        durations_json=json.dumps(new_item["durations"]),
                        schedules_json=json.dumps(new_item["schedules"]),
                        status=new_item["status"],
                    ))
                db.commit()
            finally:
                db.close()
        except Exception as e:
            print(f"Warning saving item to DB: {e}")

        # 2. Update JSON file backup
        self.reload()
        existing_index = None
        for idx, item in enumerate(self.items):
            if item.get("training_id") == training_id:
                existing_index = idx
                break

        if existing_index is not None:
            self.items[existing_index] = new_item
        else:
            self.items.append(new_item)

        self.save()
        return new_item

    def save(self) -> None:
        """Save catalog items back to JSON file backup."""
        if self.catalog_path.suffix == ".json":
            try:
                with open(self.catalog_path, "w", encoding="utf-8") as f:
                    json.dump(self.items, f, indent=2)
            except Exception:
                pass


_catalog_service_instance: CatalogService | None = None

def get_catalog_service() -> CatalogService:
    global _catalog_service_instance
    if _catalog_service_instance is None:
        _catalog_service_instance = CatalogService()
    return _catalog_service_instance
