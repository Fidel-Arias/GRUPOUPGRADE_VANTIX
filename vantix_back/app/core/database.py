from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from typing import Generator
from app.core.config import settings

# 1. Crear el Engine (Motor)
engine = create_engine(
    str(settings.SQLALCHEMY_DATABASE_URL),
    pool_pre_ping=True,  # Verifica que la conexión esté viva antes de usarla
    pool_size=20,        # Aumentamos de 10 a 20
    max_overflow=10,     # Permite hasta 10 conexiones extra si el pool está lleno
    pool_recycle=3600,   # Recicla conexiones cada hora para evitar conexiones "fantasma"
    echo=False
)

# 2. Crear la Fábrica de Sesiones
SessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine
)

# 3. Crear la Clase Base para los Modelos
Base = declarative_base()

# 4. Dependencia para inyectar en las rutas de FastAPI
def get_db() -> Generator[Session, None, None]:
    """
    Dependencia que crea una sesión de base de datos y la cierra automáticamente.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()