from fastapi import APIRouter, Request

router = APIRouter()

@router.get("/health")
def health(request: Request):
    model = request.app.state.model
    return {
        "status": "ok",
        "model_loaded": model.ready(),
        "model_version": model.version,
    }
