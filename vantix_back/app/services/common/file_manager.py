import shutil
import os
from uuid import uuid4
from fastapi import UploadFile, HTTPException
from pathlib import Path
from typing import Optional

# Directorio base para archivos estáticos
BASE_UPLOAD_DIR = Path("static/uploads")

class FileManager:
    
    @staticmethod
    async def save_upload_file(file: UploadFile, subdirectory: str = "general", prefix: Optional[str] = None) -> str:
        """
        Guarda un archivo subido en el disco.
        :param file: El archivo UploadFile de FastAPI.
        :param subdirectory: Carpeta dentro de static/uploads (ej: 'visitas', 'gastos').
        :param prefix: Prefijo opcional para el nombre del archivo.
        :return: La URL relativa del archivo guardado.
        """
        if not file or not file.filename:
            raise HTTPException(status_code=400, detail="Archivo no válido o sin nombre")

        # 1. Preparar directorio
        upload_path = BASE_UPLOAD_DIR / subdirectory
        upload_path.mkdir(parents=True, exist_ok=True)

        # 2. Validar extensión
        allowed_extensions = {".jpg", ".jpeg", ".png", ".pdf", ".docx", ".xlsx"}
        file_ext = os.path.splitext(file.filename)[1].lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"Extensión {file_ext} no permitida. Solo: {', '.join(allowed_extensions)}"
            )

        # 3. Generar nombre único
        unique_name = f"{uuid4()}{file_ext}"
        if prefix:
            unique_name = f"{prefix}_{unique_name}"
            
        file_dest = upload_path / unique_name

        # 4. Guardar archivo
        try:
            with open(file_dest, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error crítico al guardar archivo: {str(e)}")
        finally:
            await file.close()

        # 5. Retornar URL relativa para la BD (Siempre usando slashes /)
        return f"/static/uploads/{subdirectory}/{unique_name}"

    @staticmethod
    def delete_file(relative_path: str):
        """
        Borra un archivo del disco dado su path relativo guardado en la BD.
        """
        if not relative_path:
            return
            
        # Limpiar el path por si viene con / inicial
        clean_path = relative_path.lstrip("/")
        full_path = Path(clean_path)
        
        try:
            if full_path.exists() and full_path.is_file():
                os.remove(full_path)
        except Exception:
            # No bloqueamos el proceso si falla el borrado físico
            pass