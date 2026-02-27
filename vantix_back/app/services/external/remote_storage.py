import ftplib
import os
import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class RemoteStorageService:
    @staticmethod
    def get_ftp_client():
        """Establece una conexión FTP con el Web Hosting."""
        if not settings.REMOTE_STORAGE_HOST or not settings.REMOTE_STORAGE_USER:
            logger.warning("Configuración de almacenamiento remoto incompleta.")
            return None
            
        try:
            ftp = ftplib.FTP()
            ftp.connect(settings.REMOTE_STORAGE_HOST, 21, timeout=30)
            ftp.login(settings.REMOTE_STORAGE_USER, settings.REMOTE_STORAGE_PASSWORD)
            return ftp
        except Exception as e:
            logger.error(f"Error conectando al servidor FTP: {e}")
            return None

    @staticmethod
    def makedirs_ftp(ftp, remote_path):
        """Crea directorios recursivamente en FTP."""
        dirs = remote_path.split('/')
        for d in dirs:
            if not d: continue
            try:
                ftp.cwd(d)
            except ftplib.error_perm:
                ftp.mkd(d)
                ftp.cwd(d)

    @staticmethod
    def upload_file(local_path: str, remote_filename: str, employee_name: str, activity_type: str) -> Optional[str]:
        """
        Sube un archivo al Web Hosting siguiendo la estructura:
        public_html/Nombre_Empleado/Actividad/archivo.jpg
        """
        ftp = RemoteStorageService.get_ftp_client()
        if not ftp:
            return None
            
        try:
            # 1. Limpiar nombres
            safe_employee = employee_name.replace(" ", "_").replace(".", "")
            safe_activity = activity_type.replace(" ", "_")
            
            # 2. Navegar a la ruta base
            try:
                for part in settings.REMOTE_STORAGE_BASE_PATH.split('/'):
                    if part: 
                        ftp.cwd(part)
            except Exception as e:
                current_dir = ftp.pwd()
                visible = ftp.nlst()
                logger.error(f"Error en FTP. Intentamos entrar a '{settings.REMOTE_STORAGE_BASE_PATH}' pero falló en la parte '{part}'. Directorio actual: {current_dir}. Contenido visible: {visible}. Error: {e}")
                return None

            # 3. Crear y entrar en carpetas de Empleado/Actividad
            RemoteStorageService.makedirs_ftp(ftp, f"{safe_employee}/{safe_activity}")
            
            # 4. Subir el archivo
            with open(local_path, "rb") as f:
                ftp.storbinary(f"STOR {remote_filename}", f)
            
            # 5. Retornar la URL pública
            return f"{settings.REMOTE_STORAGE_BASE_URL}/{safe_employee}/{safe_activity}/{remote_filename}"
            
        except Exception as e:
            logger.error(f"Error subiendo archivo vía FTP: {e}")
            return None
        finally:
            ftp.quit()
