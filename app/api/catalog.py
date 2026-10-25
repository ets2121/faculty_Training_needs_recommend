from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.core.security import require_admin, log_audit, get_current_user
from app.db.session import get_db
from app.db.models import TrainingCatalog, User
from app.schemas.faculty import CatalogItemSchema
from app.services.catalog import get_catalog_service

router = APIRouter(prefix="/catalog", tags=["Training Catalog"])


@router.get("")
def list_catalog(include_inactive: bool = Query(default=False)):
    service = get_catalog_service()
    return {"items": service.get_all_items(include_inactive=include_inactive)}


@router.get("/{training_id}")
def get_catalog_item(training_id: str):
    service = get_catalog_service()
    item = service.get_item_by_id(training_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Catalog item '{training_id}' not found.")
    return item


@router.post("")
def add_catalog_item(
    item: CatalogItemSchema,
    request: Request,
    db: Session = Depends(get_db),
    admin_user: User | None = Depends(require_admin),
):
    service = get_catalog_service()
    added = service.add_item(item.model_dump())

    log_audit(db, admin_user, "add_catalog_item", entity_type="catalog", entity_id=added.get("training_id"),
              new_values=added, ip_address=request.client.host if request.client else None)

    return {
        "status": "success",
        "message": "Catalog item saved successfully to MySQL database without model retraining.",
        "item": added,
    }


@router.put("/{training_id}")
def update_catalog_item(
    training_id: str,
    item: CatalogItemSchema,
    request: Request,
    db: Session = Depends(get_db),
    admin_user: User | None = Depends(require_admin),
):
    """Update an existing catalog item fully (all fields updatable)."""
    service = get_catalog_service()
    existing = service.get_item_by_id(training_id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Catalog item '{training_id}' not found.")

    # Force the same training_id
    data = item.model_dump()
    data["training_id"] = training_id
    updated = service.add_item(data)

    log_audit(db, admin_user, "update_catalog_item", entity_type="catalog", entity_id=training_id,
              old_values=existing, new_values=updated,
              ip_address=request.client.host if request.client else None)

    return {
        "status": "success",
        "message": f"Catalog item '{training_id}' updated successfully.",
        "item": updated,
    }


@router.patch("/{training_id}/status")
def toggle_catalog_item_status(
    training_id: str,
    request: Request,
    db: Session = Depends(get_db),
    admin_user: User | None = Depends(require_admin),
):
    """Toggle active/inactive status of a catalog item."""
    existing = db.query(TrainingCatalog).filter(TrainingCatalog.training_id == training_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail=f"Catalog item '{training_id}' not found.")

    old_status = existing.status
    existing.status = "inactive" if existing.status == "active" else "active"
    db.commit()

    # Refresh service cache
    service = get_catalog_service()
    service.reload()

    log_audit(db, admin_user, "toggle_catalog_status", entity_type="catalog", entity_id=training_id,
              old_values={"status": old_status}, new_values={"status": existing.status},
              ip_address=request.client.host if request.client else None)

    return {
        "status": "success",
        "message": f"Catalog item '{training_id}' status changed to '{existing.status}'.",
        "new_status": existing.status,
    }


@router.delete("/{training_id}")
def delete_catalog_item(
    training_id: str,
    request: Request,
    db: Session = Depends(get_db),
    admin_user: User | None = Depends(require_admin),
):
    """Permanently delete a catalog item from the database."""
    existing = db.query(TrainingCatalog).filter(TrainingCatalog.training_id == training_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail=f"Catalog item '{training_id}' not found.")

    db.delete(existing)
    db.commit()

    # Refresh service cache
    service = get_catalog_service()
    service.reload()

    log_audit(db, admin_user, "delete_catalog_item", entity_type="catalog", entity_id=training_id,
              ip_address=request.client.host if request.client else None)

    return {
        "status": "success",
        "message": f"Catalog item '{training_id}' permanently deleted.",
    }


@router.post("/sync")
def sync_canonical_catalog(
    request: Request,
    db: Session = Depends(get_db),
    admin_user: User | None = Depends(require_admin),
):
    """Sync MySQL training_catalog table with canonical 17 items from training_catalog.json."""
    from scripts.seed_catalog import seed_training_catalog
    count = seed_training_catalog(db, force_reset=True)

    service = get_catalog_service()
    service.reload()

    log_audit(db, admin_user, "sync_canonical_catalog", entity_type="catalog", entity_id="all",
              new_values={"synced_count": count}, ip_address=request.client.host if request.client else None)

    return {
        "status": "success",
        "message": f"Successfully synchronized database with {count} canonical training programs.",
        "count": count,
    }
