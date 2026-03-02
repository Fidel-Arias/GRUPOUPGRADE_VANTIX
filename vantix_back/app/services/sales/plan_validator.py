from typing import List, Optional
from datetime import date
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.plan import PlanTrabajoSemanal, DetallePlanTrabajo
from app.models.kpi import InformeProductividad, MaestroMetas
from app.models.enums import TipoActividadEnum
from app.schemas.plan import PlanCreate

class PlanValidatorService:
    @staticmethod
    def create_weekly_plan(db: Session, plan_in: PlanCreate, id_empleado: int) -> PlanTrabajoSemanal:
        # 1. VALIDACIÓN CRÍTICA: Debe existir al menos un maestro de metas activo
        maestro_activo = db.query(MaestroMetas).filter(MaestroMetas.is_active == 1).first()
        if not maestro_activo:
            raise HTTPException(
                status_code=400,
                detail="No se puede crear el plan: No hay un Maestro de Metas activo configurado por el administrador."
            )

        # 2. Validar si ya existe un plan para esa fecha y ese empleado
        existing_plan = db.query(PlanTrabajoSemanal).filter(
            PlanTrabajoSemanal.id_empleado == id_empleado,
            PlanTrabajoSemanal.fecha_inicio_semana == plan_in.fecha_inicio_semana
        ).first()
        
        if existing_plan:
            raise HTTPException(
                status_code=400,
                detail=f"Ya existe un plan de trabajo para la semana del {plan_in.fecha_inicio_semana}"
            )

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
            
        # 5. CREAR AUTOMÁTICAMENTE EL INFORME DE PRODUCTIVIDAD vinculado al Maestro Activo
        informe = InformeProductividad(
            id_plan=db_plan.id_plan,
            id_maestro_meta=maestro_activo.id_maestro,
            real_visitas=0,
            real_llamadas=0,
            real_emails=0,
            real_visitas_asistidas=0,
            real_cotizaciones=0,
            real_ventas_monto=0,
            puntos_alcanzados=0
        )
        db.add(informe)
        
        db.commit()
        db.refresh(db_plan)
        return db_plan

    @staticmethod
    def get_day_name(target_date: date) -> str:
        """Mapea el día de la semana de Python al Enum del sistema."""
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
        """Valida que el empleado tenga un plan aprobado para la semana actual."""
        from app import crud
        today = date.today()
        day_name = PlanValidatorService.get_day_name(today)
        
        if id_plan:
            active_plan = crud.plan.get(db, id=id_plan)
            if not active_plan or active_plan.id_empleado != id_empleado:
                raise HTTPException(status_code=404, detail="El plan especificado no existe o no te pertenece.")
            
            from app.models.enums import EstadoPlanEnum
            if active_plan.estado != EstadoPlanEnum.APROBADO:
                raise HTTPException(status_code=403, detail="El plan de trabajo debe estar APROBADO para registrar actividades.")
            
            if not (active_plan.fecha_inicio_semana <= today <= active_plan.fecha_fin_semana):
                raise HTTPException(status_code=403, detail="El plan no corresponde a la semana actual.")
        else:
            active_plan = crud.plan.get_active_plan_for_date(db, id_empleado=id_empleado, date_to_check=today)
        
        if not active_plan:
            raise HTTPException(status_code=403, detail="No puedes registrar actividades sin un plan semanal aprobado.")
            
        has_today_agenda = crud.detalle_plan.has_activity_for_day(db, id_plan=active_plan.id_plan, dia_semana=day_name)
        if not has_today_agenda:
            raise HTTPException(status_code=403, detail=f"No tienes actividades programadas para hoy ({day_name}).")
            
        return active_plan
