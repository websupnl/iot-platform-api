from fastapi import APIRouter
from app.db.session import engine

router = APIRouter()

@router.get("/health")
def health():
    return {"status": "ok"}

@router.get("/health/db")
async def health_db():
    async with engine.connect():
        return {"database": "connected"}
