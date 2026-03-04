from typing import Optional
from datetime import date
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.empleado import Empleado
from app.schemas.finanzas import GastoCreate
from app import crud
from app.models.enums import EstadoPlanEnum, TipoActividadEnum
from app.models.plan import DetallePlanTrabajo
from app.models.finanzas import GastoMovilidad

class GastoValidatorService:
    @staticmethod
    def validate_gasto_creation(db: Session, gasto_in: GastoCreate, current_user: Empleado):
        """
        Contiene las reglas de negocio para validar la creación de un gasto de movilidad.
        """
        # 1. Validar que el plan existe
        plan = crud.plan.get(db, id=gasto_in.id_plan)
        if not plan:
            raise HTTPException(status_code=404, detail="El plan de trabajo especificado no existe")
        
        # 2. Validar que el plan pertenezca al usuario (o que sea admin)
        if plan.id_empleado != current_user.id_empleado and not current_user.is_admin:
            raise HTTPException(status_code=403, detail="No puedes registrar gastos para un plan que no te pertenece.")
            
        # 3. Validar que el plan esté aprobado
        if plan.estado != EstadoPlanEnum.APROBADO:
            raise HTTPException(status_code=403, detail="Solo puedes registrar gastos en un plan que ya ha sido Aprobado por el supervisor.")
            
        hoy = date.today()
        
        # 4. El gasto NO puede ser registrado en el FUTURO
        if gasto_in.fecha_gasto > hoy:
            raise HTTPException(status_code=400, detail="No puedes registrar un gasto de movilidad en una fecha futura.")
            
        # 5. El gasto NO puede pertenecer a un plan si la semana actual ya superó el fin de ese plan
        if hoy > plan.fecha_fin_semana:
            raise HTTPException(
                status_code=400, 
                detail="El plazo para rendir gastos de este plan ha vencido (finalizó el Sábado de esa semana). Ya pasaste a la siguiente semana."
            )

        # 6. La fecha del gasto DEBE estar dentro del rango de días del plan (lunes - sábado)
        if not (plan.fecha_inicio_semana <= gasto_in.fecha_gasto <= plan.fecha_fin_semana):
             raise HTTPException(
                status_code=400, 
                detail=f"La fecha del gasto ({gasto_in.fecha_gasto}) no pertenece a la semana de este plan programado ({plan.fecha_inicio_semana} al {plan.fecha_fin_semana})."
            )
        
        # 7. Validar límite de gastos por visitas y visitas asistidas programadas en la agenda del plan
        visitas_permitidas = db.query(DetallePlanTrabajo).filter(
            DetallePlanTrabajo.id_plan == gasto_in.id_plan,
            DetallePlanTrabajo.tipo_actividad.in_([TipoActividadEnum.VISITA, TipoActividadEnum.VISITA_ASISTIDA])
        ).count()

        gastos_actuales = db.query(GastoMovilidad).filter(
            GastoMovilidad.id_plan == gasto_in.id_plan
        ).count()

        if gastos_actuales >= visitas_permitidas:
            raise HTTPException(
                status_code=400,
                detail=f"Límite alcanzado: Solo puedes registrar {visitas_permitidas} gastos de movilidad según la cantidad de visitas programadas en tu agenda."
            )
