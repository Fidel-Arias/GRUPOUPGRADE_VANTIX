from typing import List
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.plan import PlanTrabajoSemanal, DetallePlanTrabajo
from app.models.kpi import InformeProductividad
from app.models.enums import TipoActividadEnum
from app.schemas.plan import PlanCreate

class PlanValidatorService:
    @staticmethod
    def create_weekly_plan(db: Session, plan_in: PlanCreate, id_empleado: int) -> PlanTrabajoSemanal:
        # 1. Validar si ya existe un plan para esa fecha y ese empleado
        existing_plan = db.query(PlanTrabajoSemanal).filter(
            PlanTrabajoSemanal.id_empleado == id_empleado,
            PlanTrabajoSemanal.fecha_inicio_semana == plan_in.fecha_inicio_semana
        ).first()
        
        if existing_plan:
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe un plan de trabajo para la semana del {plan_in.fecha_inicio_semana}"
            )

        # 2. Calcular estadisticas iniciales en base a la agenda propuesta
        visitas_programadas_count = 0
        for detalle in plan_in.detalles_agenda:
            if detalle.tipo_actividad == TipoActividadEnum.VISITA:
                visitas_programadas_count += 1
        
        # 3. Crear Cabecera del Plan
        db_plan = PlanTrabajoSemanal(
            id_empleado=id_empleado,
            fecha_inicio_semana=plan_in.fecha_inicio_semana,
            fecha_fin_semana=plan_in.fecha_fin_semana,
            observaciones_supervisor=plan_in.observaciones_supervisor,
            estado="Borrador"
        )
        db.add(db_plan)
        db.commit()
        db.refresh(db_plan)
        
        # 4. Crear Detalles (Agenda)
        for detalle in plan_in.detalles_agenda:
            db_detalle = DetallePlanTrabajo(
                id_plan=db_plan.id_plan,
                dia_semana=detalle.dia_semana,
                hora_programada=detalle.hora_programada,
                tipo_actividad=detalle.tipo_actividad,
                id_cliente=detalle.id_cliente
            )
            db.add(db_detalle)
            
        # 5. CREAR AUTOMÁTICAMENTE EL INFORME DE PRODUCTIVIDAD (Dashboard vacío)
        # Se asumen metas por defecto (pero podrían venir de configuración)
        informe = InformeProductividad(
            id_plan=db_plan.id_plan,
            # Las metas se toman por defecto del modelo (25 visitas, 30 llamadas, etc.)
            # Los reales inician en 0
        )
        db.add(informe)
        
        db.commit()
        db.refresh(db_plan) # Esto refrescará la relación informe_kpi
        return db_plan
