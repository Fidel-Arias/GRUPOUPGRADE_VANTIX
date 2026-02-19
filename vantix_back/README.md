# Vantix Backend

Este repositorio contiene el backend para el proyecto Vantix, desarrollado con **FastAPI**.

## Requisitos Previos

Asegúrate de tener instalado lo siguiente en tu sistema:

- **Python 3.10+**
- **pip** (gestor de paquetes de Python)
- **PostgreSQL** (Base de datos)
- **Git**

## Configuración del Entorno de Desarrollo

Sigue estos pasos para configurar el proyecto en tu máquina local.

### 1. Clonar el repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd vantix_back
```

### 2. Crear un Entorno Virtual

Es recomendable utilizar un entorno virtual para aislar las dependencias del proyecto.

```bash
# Crear el entorno virtual llamado 'venv'
python3 -m venv venv
```

### 3. Activar el Entorno Virtual

- **En Linux/macOS:**

    ```bash
    source venv/bin/activate
    ```

- **En Windows (PowerShell):**

    ```powershell
    venv\Scripts\Activate.ps1
    ```

- **En Windows (CMD):**

    ```cmd
    venv\Scripts\activate.bat
    ```

### 4. Instalar Dependencias

Una vez activado el entorno virtual, instala las librerías necesarias listadas en `requirements.txt`:

```bash
pip install -r requirements.txt
```

### 5. Configurar Variables de Entorno

El proyecto utiliza variables de entorno para la configuración sensible (credenciales de base de datos, claves secretas, etc.).

1.  Copia el archivo de ejemplo `.env.example` y renómbralo a `.env`:

    ```bash
    cp .env.example .env
    ```

2.  Abre el archivo `.env` y actualiza los valores con tu configuración local, especialmente las credenciales de la base de datos PostgreSQL:

    ```ini
    # Ejemplo de configuración en .env
    PROJECT_NAME="Vantix"
    API_V1_STR="/api/v1"

    # Credenciales de PostgreSQL
    POSTGRES_SERVER=localhost
    POSTGRES_USER=postgres
    POSTGRES_PASSWORD=tu_contraseña_real
    POSTGRES_DB=vantix
    POSTGRES_PORT=5432

    # Configuraciones de la autenticación
    SECRET_KEY="tu_clave_secreta_segura"
    ALGORITHM=HS256
    ACCESS_TOKEN_EXPIRE_MINUTES=10080
    ```

> **Nota:** El archivo `.env` está ignorado en git para proteger tus secretos. Nunca subas este archivo al repositorio.

### 6. Ejecutar Migraciones (Base de Datos)

Si el proyecto utiliza **Alembic** para las migraciones de base de datos, ejecuta el siguiente comando para aplicar los cambios a tu base de datos local:

```bash
alembic upgrade head
```

### 7. Ejecutar el Servidor de Desarrollo

Para iniciar el servidor localmente con recarga automática (hot-reload):

```bash
uvicorn app.main:app --reload
```

El servidor debería iniciar en `http://127.0.0.1:8000`.

## Documentación de la API

Una vez que el servidor esté corriendo, puedes acceder a la documentación interactiva de la API en:

- **Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
