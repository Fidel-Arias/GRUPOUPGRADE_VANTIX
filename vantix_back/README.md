# Vantix Backend - Sistema de Fuerza de Ventas y Gamificación

Este repositorio contiene el backend robusto para el proyecto **Vantix**, desarrollado con **FastAPI**. El sistema está diseñado para gestionar fuerzas de ventas, automatizar el seguimiento de KPIs y motivar a los empleados mediante gamificación.

## 🚀 Características Principales

- **Gestión de Fuerza de Ventas**: Registro de visitas, llamadas, correos y cotizaciones en tiempo real.
- **Gamificación e Incentivos**: Sistema automático de puntos por actividades y generación de bonos semanales basados en cumplimiento de metas.
- **Rendimiento (KPI)**: Informes de productividad semanales sincronizados con bases de datos externas.
- **Almacenamiento Remoto Inteligente**: Soporte para subir imágenes de evidencia a servidores externos vía FTP con organización jerárquica automática (`Empleado/Actividad/Archivo`).
- **Seguridad Avanzada**: Autenticación JWT, gestión de roles (Administrador/Empleado) y control de visibilidad de documentación en producción.
- **Sincronización Externa**: Integración con bases de datos legadas (UpgradeDB) para importación de cotizaciones y métricas reales.

## 🛠️ Requisitos Previos

- **Python 3.10+**
- **pip** (gestor de paquetes de Python)
- **PostgreSQL 14+**
- **Servidor FTP/Web Hosting** (Opcional, para almacenamiento de imágenes)

## ⚙️ Configuración del Entorno

### 1. Clonar e Instalar
```bash
git clone <URL_DEL_REPOSITORIO>
cd vantix_back
python3 -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Variables de Entorno (.env)
Copia el archivo `.env.example` a `.env` y configura las siguientes secciones críticas:

#### Base de Datos (PostgreSQL)
```ini
POSTGRES_SERVER=tu_vps_ip
POSTGRES_USER=sistemas
POSTGRES_PASSWORD=tu_password
POSTGRES_DB=vantix
```

#### Base de Datos Externa (UpgradeDB)
```ini
EXTERNAL_DB_HOST=ip_del_servidor
EXTERNAL_DB_PORT=puerto_del_servidor
EXTERNAL_DB_USER=usuario_del_servidor
EXTERNAL_DB_PASSWORD=tu_password_externo
EXTERNAL_DB_NAME=nombre_base_de_datos
```

#### Almacenamiento Remoto (FTP)
```ini
REMOTE_STORAGE_HOST=tu_hosting_ip
REMOTE_STORAGE_USER=usuario@dominio.com
REMOTE_STORAGE_PASSWORD=tu_password_ftp
REMOTE_STORAGE_BASE_PATH=.
REMOTE_STORAGE_BASE_URL=https://tu-dominio-imagenes.com
```

#### Seguridad y Producción
```ini
SECRET_KEY="tu_clave_secreta"
SHOW_DOCS=False # Desactiva Swagger/ReDoc en producción
```

### 3. Base de Datos y Ejecución
```bash
# Aplicar migraciones
alembic upgrade head

# Iniciar servidor
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## 📂 Estructura del Proyecto

- `app/api/v1/controller/`: Endpoints de la API organizados por módulos (CRM, Visitas, KPI, Almacenamiento).
- `app/crud/`: Lógica de acceso a datos (Create, Read, Update, Delete).
- `app/models/`: Definición de tablas de base de datos (SQLAlchemy).
- `app/schemas/`: Modelos de validación de datos (Pydantic).
- `app/services/`: Lógica de negocio avanzada (Gamificación, Sincronización Externa, Gestión de Archivos).
- `app/core/`: Configuraciones centrales y seguridad.

## 📝 Documentación Interactiva

Si `SHOW_DOCS` está en `True`, puedes acceder a:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 🛡️ Seguridad en Producción

Para despliegues en VPS:
1. Asegúrate de que `SHOW_DOCS=False` en el `.env`.
2. Configura el firewall para permitir solo el tráfico necesario (Puerto 8000).
3. Usa un servidor ASGI como `gunicorn -k uvicorn.workers.UvicornWorker` para mayor estabilidad.

---
**Desarrollado para Grupo Upgrade - Vantix**
