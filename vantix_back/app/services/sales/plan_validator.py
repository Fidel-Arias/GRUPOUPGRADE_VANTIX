from typing import List, Optional
from datetime import date
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

    @staticmethod
    def get_day_name(target_date: date) -> str:
        """
        Mapea el día de la semana de Python al Enum del sistema.
        Python: 0=Lunes, 1=Martes, ..., 5=Sábado, 6=Domingo
        """
        from app.models.enums import DiaSemanaEnum
        days_mapping = {
            0: DiaSemanaEnum.LUNES,
            1: DiaSemanaEnum.MARTES,
            2: DiaSemanaEnum.MIERCOLES,
            3: DiaSemanaEnum.JUEVES,
            4: DiaSemanaEnum.VIERNES,
            5: DiaSemanaEnum.SABADO,
            6: 'Domingo'
        }
        return days_mapping.get(target_date.weekday())

    @staticmethod
    def validate_plan_exists_for_activity(db: Session, id_empleado: int, id_plan: Optional[int] = None):
        """
        Valida que el empleado tenga un plan aprobado para la semana actual
        y que existan actividades programadas para el día de hoy.
        """
        from app import crud
        today = date.today()
        day_name = PlanValidatorService.get_day_name(today)
        
        # 1. Buscar plan aprobado que cubra hoy
        if id_plan:
            active_plan = crud.plan.get(db, id=id_plan)
            if not active_plan or active_plan.id_empleado != id_empleado:
                raise HTTPException(status_code=404, detail="El plan especificado no existe o no te pertenece.")
            
            # Validar que el plan esté aprobado y cubra la fecha
            from app.models.enums import EstadoPlanEnum
            if active_plan.estado != EstadoPlanEnum.APROBADO:
                raise HTTPException(status_code=403, detail="El plan de trabajo debe estar APROBADO para registrar actividades.")
            
            if not (active_plan.fecha_inicio_semana <= today <= active_plan.fecha_fin_semana):
                raise HTTPException(status_code=403, detail="El plan no corresponde a la semana actual.")
        else:
            active_plan = crud.plan.get_active_plan_for_date(db, id_empleado=id_empleado, date_to_check=today)
        
        if not active_plan:
            raise HTTPException(
                status_code=403, 
                detail="No puedes registrar actividades sin un plan semanal aprobado para esta fecha."
            )
            
        # 2. Verificar que el plan tenga algo programado para hoy
        has_today_agenda = crud.detalle_plan.has_activity_for_day(
            db, 
            id_plan=active_plan.id_plan, 
            dia_semana=day_name
        )
        
        if not has_today_agenda:
            raise HTTPException(
                status_code=403, 
                detail=f"No tienes actividades programadas en tu plan para el día de hoy ({day_name})."
            )
            
        return active_plan
