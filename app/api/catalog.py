from fastapi import APIRouter, Depends, Query
from app.core.security import require_admin
from app.schemas.faculty import CatalogItemSchema
from app.services.catalog import get_catalog_service

router = APIRouter(prefix="/catalog", tags=["Training Catalog"])


@router.get("")
def list_catalog(include_inactive: bool = Query(default=False)):
    service = get_catalog_service()
    service.reload()
    return {"items": service.get_all_items(include_inactive=include_inactive)}


@router.post("", dependencies=[Depends(require_admin)])
def add_catalog_item(item: CatalogItemSchema):
    service = get_catalog_service()
    added = service.add_item(item.model_dump())
    return {
        "status": "success",
        "message": "Catalog item saved successfully without model retraining.",
        "item": added,
    }
