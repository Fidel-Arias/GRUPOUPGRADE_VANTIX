from fastapi import APIRouter
from app.api.v1.controller import maestro, cartera, admin, geo, empleado, plan

api_router = APIRouter()

# Incluimos los routers de los controladores
api_router.include_router(maestro.router, prefix="/maestro", tags=["Maestro Entidades"])
api_router.include_router(cartera.router, prefix="/cartera", tags=["Cartera Clientes"])
api_router.include_router(geo.router, prefix="/geo", tags=["Geografía"])
api_router.include_router(empleado.router, prefix="/empleados", tags=["Empleados"])
api_router.include_router(plan.router, prefix="/planes", tags=["Plan Trabajo Semanal"])