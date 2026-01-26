from fastapi import FastAPI
from app.health import router as health_router

app = FastAPI(
    title="IoT Platform API",
    version="0.1.0"
)

app.include_router(health_router)

@app.get("/")
def root():
    return {"message": "IoT Platform API running"}
