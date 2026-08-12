import json
from pathlib import Path
from typing import Any
import pandas as pd
from app.core.config import get_settings


class CatalogService:
    """
    Catalog Service handles loading, managing, and querying available training programs.
    The catalog is maintained separately from the ML model, allowing programs to be added,
    activated, or updated without retraining the model as long as categories match existing features.
    """

    def __init__(self, catalog_path: str | Path | None = None):
        settings = get_settings()
        if catalog_path is None:
            # Check for JSON catalog first, fallback to CSV path from settings
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
        """Reload catalog items from file."""
        if not self.catalog_path.exists():
            self.items = []
            return

        if self.catalog_path.suffix == ".json":
            with open(self.catalog_path, "r", encoding="utf-8") as f:
                self.items = json.load(f)
        elif self.catalog_path.suffix == ".csv":
            df = pd.read_csv(self.catalog_path).fillna("")
            records = df.to_dict(orient="records")
            self.items = []
            for r in records:
                categories = [c.strip() for c in str(r.get("category", "")).split(",") if c.strip()]
                self.items.append({
                    "training_id": str(r.get("training_id", "")),
                    "title": str(r.get("topic", r.get("title", ""))),
                    "description": str(r.get("description", "")),
                    "categories": categories,
                    "target_competencies": [],
                    "modalities": [],
                    "durations": [],
                    "schedules": [],
                    "status": str(r.get("status", "active")),
                })

    def get_all_items(self, include_inactive: bool = False) -> list[dict[str, Any]]:
        """Get all catalog items, optionally including inactive programs."""
        if include_inactive:
            return self.items
        return [item for item in self.items if item.get("status", "active") == "active"]

    def get_item_by_id(self, training_id: str) -> dict[str, Any] | None:
        for item in self.items:
            if item.get("training_id") == training_id:
                return item
        return None

    def add_item(self, item_data: dict[str, Any]) -> dict[str, Any]:
        """
        Add a new catalog item. If category matches existing categories,
        no retraining is required.
        """
        training_id = item_data.get("training_id")
        if not training_id:
            training_id = f"TRN-{len(self.items) + 1:03d}"

        categories = item_data.get("categories")
        if isinstance(categories, str):
            categories = [c.strip() for c in categories.split(",") if c.strip()]

        new_item = {
            "training_id": training_id,
            "title": item_data.get("title", ""),
            "description": item_data.get("description", ""),
            "categories": categories or [item_data.get("category", "")],
            "target_competencies": item_data.get("target_competencies", []),
            "modalities": item_data.get("modalities", []),
            "durations": item_data.get("durations", []),
            "schedules": item_data.get("schedules", []),
            "status": item_data.get("status", "active"),
        }

        # Replace existing or append
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
        """Save catalog items back to file."""
        if self.catalog_path.suffix == ".json":
            with open(self.catalog_path, "w", encoding="utf-8") as f:
                json.dump(self.items, f, indent=2)


_catalog_service_instance: CatalogService | None = None

def get_catalog_service() -> CatalogService:
    global _catalog_service_instance
    if _catalog_service_instance is None:
        _catalog_service_instance = CatalogService()
    return _catalog_service_instance
