from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
#from app.api.v1.api import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="API para Sistema de Fuerza de Ventas y Gamificación"
)

# Configuración de CORS (Permitir que el frontend hable con el backend)
origins = [
    "http://localhost",
    "http://localhost:4200"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#app.include_router(api_router, prefix=settings.API_VERSION)

@app.get("/")
def root():
    return {"message": "El Sistema SFA está corriendo correctamente 🚀"}