import shutil
import os
from uuid import uuid4
from fastapi import UploadFile, HTTPException
from pathlib import Path
from typing import Optional
from app.core.config import settings
from app.services.external.remote_storage import RemoteStorageService

# Directorio base para archivos locales (como fallback o temporal)
BASE_UPLOAD_DIR = Path("static/uploads")

class FileManager:
    
    @staticmethod
    async def save_upload_file(
        file: UploadFile, 
        subdirectory: str = "general", 
        prefix: Optional[str] = None,
        employee_name: Optional[str] = None,
        activity_type: Optional[str] = None
    ) -> str:
        """
        Guarda un archivo subido. 
        Si el servidor remoto está configurado, lo sube allá con la estructura de carpetas solicitada.
        De lo contrario, lo guarda localmente.
        """
        if not file or not file.filename:
            raise HTTPException(status_code=400, detail="Archivo no válido o sin nombre")

        # 1. Validar extensión
        allowed_extensions = {".jpg", ".jpeg", ".png", ".pdf", ".docx", ".xlsx"}
        file_ext = os.path.splitext(file.filename)[1].lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"Extensión {file_ext} no permitida. Solo: {', '.join(allowed_extensions)}"
            )

        # 2. Generar nombre único
        unique_name = f"{uuid4()}{file_ext}"
        if prefix:
            unique_name = f"{prefix}_{unique_name}"
            
        # 3. GUARDAR LOCALMENTE PRIMERO (Temporalmente)
        temp_path = BASE_UPLOAD_DIR / "temp"
        temp_path.mkdir(parents=True, exist_ok=True)
        file_dest = temp_path / unique_name

        try:
            with open(file_dest, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error al procesar archivo temporal: {str(e)}")
        finally:
            await file.close()

        # 4. ¿TENEMOS SERVIDOR REMOTO CONFIGURADO?
        if settings.REMOTE_STORAGE_HOST and employee_name and activity_type:
            remote_url = RemoteStorageService.upload_file(
                local_path=str(file_dest),
                remote_filename=unique_name,
                employee_name=employee_name,
                activity_type=activity_type
            )
            
            if remote_url:
                # Borrar temporal después de subir exitosamente
                if os.path.exists(file_dest):
                    os.remove(file_dest)
                return remote_url

        # 5. SI NO HAY REMOTO O FALLÓ, MOVER A STATIC LOCAL (Fallback)
        final_local_dir = BASE_UPLOAD_DIR / subdirectory
        final_local_dir.mkdir(parents=True, exist_ok=True)
        final_local_path = final_local_dir / unique_name
        
        shutil.move(str(file_dest), str(final_local_path))
        
        return f"/static/uploads/{subdirectory}/{unique_name}"

    @staticmethod
    def delete_file(path_url: str):
        """
        Borra un archivo. Si es una URL remota, por ahora solo loguea (o se podría implementar delete SFTP).
        Si es local, lo borra del disco.
        """
        if not path_url:
            return
            
        if path_url.startswith("http"):
            # Intentar borrar remotamente si es una URL
            return RemoteStorageService.delete_file(path_url)

        # Limpiar el path por si viene con / inicial
        clean_path = path_url.lstrip("/")
        full_path = Path(clean_path)
        
        try:
            if full_path.exists() and full_path.is_file():
                os.remove(full_path)
        except Exception:
            pass