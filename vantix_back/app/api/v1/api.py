from fastapi import APIRouter
from app.api.v1.controller import maestro, cartera, admin, geo, empleado, plan, visita, finanzas, kpi, crm, auth, sync_externa, almacenamiento

api_router = APIRouter()

# Incluimos los routers de los controladores
api_router.include_router(auth.router, prefix="/auth", tags=["Autenticación"])
api_router.include_router(sync_externa.router, prefix="/sync-externa", tags=["Sincronización Externa Upgrade"])
api_router.include_router(maestro.router, prefix="/maestro", tags=["Maestro Entidades"])
api_router.include_router(cartera.router, prefix="/cartera", tags=["Cartera Clientes"])
api_router.include_router(geo.router, prefix="/geo", tags=["Geografía"])
api_router.include_router(empleado.router, prefix="/empleados", tags=["Empleados"])
api_router.include_router(plan.router, prefix="/planes", tags=["Plan Trabajo Semanal"])
api_router.include_router(visita.router, prefix="/visitas", tags=["Registro de Visitas"])
api_router.include_router(finanzas.router, prefix="/finanzas", tags=["Gastos de Movilidad"])
api_router.include_router(kpi.router, prefix="/kpi", tags=["Rendimiento (KPI) e Incentivos"])
api_router.include_router(crm.router, prefix="/crm", tags=["Gestión de Contactos (Llamadas/Emails)"])
api_router.include_router(almacenamiento.router, prefix="/almacenamiento", tags=["Explorador de Archivos Remoto"])