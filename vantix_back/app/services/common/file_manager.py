import shutil
import os
from uuid import uuid4
from fastapi import UploadFile, HTTPException
from pathlib import Path

# Configuración: Dónde se guardarán las fotos en el servidor
UPLOAD_DIR = Path("static/evidencias")

# Aseguramos que la carpeta exista
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

class FileManager:
    
    @staticmethod
    async def save_upload_file(file: UploadFile) -> str:
        """
        Recibe un archivo, lo renombra con un UUID único para evitar duplicados,
        lo guarda en disco y devuelve la ruta relativa (URL) para la BD.
        """
        if not file.filename:
            raise HTTPException(status_code=400, detail="El archivo no tiene nombre")

        # 1. Validar extensión (Seguridad básica)
        allowed_extensions = {".jpg", ".jpeg", ".png"}
        file_ext = os.path.splitext(file.filename)[1].lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(status_code=400, detail="Solo se permiten imágenes JPG o PNG")

        # 2. Generar nombre único (Ej: a1b2c3d4.jpg)
        unique_filename = f"{uuid4()}{file_ext}"
        file_path = UPLOAD_DIR / unique_filename

        # 3. Guardar el archivo físicamente
        try:
            with open(file_path, "wb") as buffer:
                # Copiamos el contenido del archivo subido al disco
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error al guardar imagen: {str(e)}")
        finally:
            await file.close()

        # 4. Retornar la ruta relativa (string) para guardar en la BD
        # Ej: "static/evidencias/a1b2c3d4.jpg"
        return str(file_path)

    @staticmethod
    def delete_file(file_path: str):
        """Si borras una visita, deberías borrar su foto para ahorrar espacio"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception:
            pass # Si falla al borrar, no rompemos el flujo, solo logueamos error