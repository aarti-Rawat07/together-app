import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.database import engine, Base
import app.models  # Ensure all models are imported for metadata creation
from app.routers import (
    auth_router,
    users_router,
    contacts_router,
    rooms_router,
    messages_router,
    music_router,
    notifications_router,
    ws_router,
)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Together ❤️ - Private, Real-time Two-Person Connection Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure static directories exist
static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
music_dir = os.path.join(static_dir, "music")
os.makedirs(music_dir, exist_ok=True)

# Mount static files for audio & covers
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Mount API Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(users_router, prefix=settings.API_V1_STR)
app.include_router(contacts_router, prefix=settings.API_V1_STR)
app.include_router(rooms_router, prefix=settings.API_V1_STR)
app.include_router(messages_router, prefix=settings.API_V1_STR)
app.include_router(music_router, prefix=settings.API_V1_STR)
app.include_router(notifications_router, prefix=settings.API_V1_STR)
app.include_router(ws_router)


@app.get("/")
async def root():
    return {
        "app": "Together ❤️",
        "status": "running",
        "description": "Private real-time two-person connection platform",
        "version": "1.0.0"
    }


@app.get("/api/health")
async def health():
    return {"status": "healthy", "timestamp": settings.PROJECT_NAME}
