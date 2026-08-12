from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.core.security import require_admin, log_audit
from app.db.session import get_db
from app.schemas.faculty import CatalogItemSchema
from app.services.catalog import get_catalog_service

router = APIRouter(prefix="/catalog", tags=["Training Catalog"])


@router.get("")
def list_catalog(include_inactive: bool = Query(default=False)):
    service = get_catalog_service()
    return {"items": service.get_all_items(include_inactive=include_inactive)}


@router.post("", dependencies=[Depends(require_admin)])
def add_catalog_item(item: CatalogItemSchema, request: Request, db: Session = Depends(get_db)):
    service = get_catalog_service()
    added = service.add_item(item.model_dump())

    log_audit(db, None, "add_catalog_item", entity_type="catalog", entity_id=added.get("training_id"),
              new_values=added, ip_address=request.client.host if request.client else None)

    return {
        "status": "success",
        "message": "Catalog item saved successfully to MySQL database without model retraining.",
        "item": added,
    }
