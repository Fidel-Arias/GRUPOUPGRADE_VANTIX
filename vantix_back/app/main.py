from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.api.v1.api import api_router
import os

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if settings.SHOW_DOCS else None,
    docs_url="/docs" if settings.SHOW_DOCS else None,
    redoc_url="/redoc" if settings.SHOW_DOCS else None,
    description="API para Sistema de Fuerza de Ventas y Gamificación"
)

# Configuración de CORS (Permitir que el frontend hable con el backend)
origins = [
    "http://localhost",
    "http://localhost:4200",
    "*" # Permite todos los orígenes para facilitar pruebas (especialmente desde móviles/Excel)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montar carpeta estática para servir las fotos
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(api_router, prefix=settings.API_V1_STR)