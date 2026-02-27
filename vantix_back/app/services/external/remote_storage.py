import ftplib
import os
import logging
import unicodedata
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class RemoteStorageService:
    @staticmethod
    def _normalize_path_name(text: str) -> str:
        """
        Normaliza un texto para usarlo como nombre de carpeta:
        - Quita acentos (acentos, diéresis, etc.)
        - Reemplaza espacios con guiones bajos
        - Quita puntos
        - Convierte a minúsculas para evitar discrepancias
        """
        if not text:
            return "unknown"
        
        # 1. Quitar acentos usando unicodedata
        text = unicodedata.normalize('NFD', text)
        text = "".join([c for c in text if unicodedata.category(c) != 'Mn'])
        
        # 2. Limpieza de caracteres y formato
        normalized = text.replace(" ", "_").replace(".", "").lower()
        
        return normalized

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
            # 1. Normalizar nombres para carpetas
            safe_employee = RemoteStorageService._normalize_path_name(employee_name)
            safe_activity = RemoteStorageService._normalize_path_name(activity_type)
            
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

    @staticmethod
    def delete_file(path_url: str) -> bool:
        """
        Elimina un archivo del servidor FTP basándose en su URL pública.
        """
        if not path_url.startswith(settings.REMOTE_STORAGE_BASE_URL):
            return False

        ftp = RemoteStorageService.get_ftp_client()
        if not ftp:
            return False

        try:
            # 1. Obtener la ruta relativa eliminando el BASE_URL
            relative_path = path_url.replace(settings.REMOTE_STORAGE_BASE_URL, "").lstrip("/")
            
            # 2. Navegar a la ruta base configuración (public_html, etc)
            if settings.REMOTE_STORAGE_BASE_PATH and settings.REMOTE_STORAGE_BASE_PATH != ".":
                for part in settings.REMOTE_STORAGE_BASE_PATH.split('/'):
                    if part: ftp.cwd(part)

            # 3. Eliminar el archivo
            ftp.delete(relative_path)
            logger.info(f"Archivo eliminado exitosamente de FTP: {relative_path}")
            return True
        except Exception as e:
            logger.error(f"Error eliminando archivo '{path_url}' vía FTP: {e}")
            return False
        finally:
            ftp.quit()

    @staticmethod
    def list_files(employee_name: str, activity_type: str) -> list:
        """
        Lista todas las URLs de archivos en el hosting para un empleado y actividad.
        """
        ftp = RemoteStorageService.get_ftp_client()
        if not ftp:
            return []

        try:
            # 1. Normalizar nombres para la ruta
            safe_employee = RemoteStorageService._normalize_path_name(employee_name)
            safe_activity = RemoteStorageService._normalize_path_name(activity_type)
            remote_path = f"{safe_employee}/{safe_activity}"
            
            # 2. Navegar a la ruta base
            if settings.REMOTE_STORAGE_BASE_PATH and settings.REMOTE_STORAGE_BASE_PATH != ".":
                for part in settings.REMOTE_STORAGE_BASE_PATH.split('/'):
                    if part: ftp.cwd(part)

            # 3. Intentar entrar a la carpeta del empleado
            try:
                ftp.cwd(remote_path)
            except Exception:
                return [] # La carpeta aún no existe

            # 4. Obtener lista de archivos
            files = ftp.nlst()
            # Filtrar directorios ocultos si existen
            files = [f for f in files if f not in ('.', '..', 'cgi-bin')]
            
            # 5. Construir URLs completas
            base_url = settings.REMOTE_STORAGE_BASE_URL.rstrip("/")
            return [f"{base_url}/{safe_employee}/{safe_activity}/{f}" for f in files]

        except Exception as e:
            logger.error(f"Error listando archivos FTP para {employee_name}: {e}")
            return []
        finally:
            ftp.quit()
