from pydantic_settings import BaseSettings
from pydantic import PostgresDsn, computed_field
from typing import Any, Optional

class Settings(BaseSettings):
    PROJECT_NAME: str
    API_V1_STR: str = "/api/v1"

    # Base de datos
    POSTGRES_SERVER: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_PORT: int = 5432

    # Base de Datos Externa (Upgrade)
    EXTERNAL_DB_HOST: str
    EXTERNAL_DB_PORT: int
    EXTERNAL_DB_USER: str
    EXTERNAL_DB_PASSWORD: str
    EXTERNAL_DB_NAME: str

    # Seguridad
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    # Servidor de Imágenes Remoto
    REMOTE_STORAGE_HOST: Optional[str] = None
    REMOTE_STORAGE_USER: Optional[str] = None
    REMOTE_STORAGE_PASSWORD: Optional[str] = None
    REMOTE_STORAGE_PORT: int = 22
    REMOTE_STORAGE_BASE_PATH: str
    REMOTE_STORAGE_BASE_URL: str

    SHOW_DOCS: bool = True  # Por defecto True para desarrollo
    
    # Esto leerá automáticamente la variable FRONTEND_URL del .env
    FRONTEND_URL: str = "http://localhost:4200" # Valor por defecto


    @computed_field
    @property
    def SQLALCHEMY_DATABASE_URL(self) -> PostgresDsn:
        return PostgresDsn.build(
            scheme="postgresql+psycopg2",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_SERVER,
            port=self.POSTGRES_PORT,
            path=self.POSTGRES_DB,
        )

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

settings = Settings()
