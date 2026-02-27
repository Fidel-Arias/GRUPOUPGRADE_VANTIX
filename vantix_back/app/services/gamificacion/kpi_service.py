from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.models.kpi import InformeProductividad, IncentivoPago
from app.models.plan import PlanTrabajoSemanal
from decimal import Decimal
from typing import List, Optional
from app.services.external.upgrade_db import ExternalDBService

class KPIService:
    @staticmethod
    def update_kpi_metrics(
        db: Session, 
        *, 
        id_plan: int, 
        field: str, 
        increment: int = 1,
        puntos: int = 0
    ) -> Optional[InformeProductividad]:
        """
        Actualiza una métrica específica del informe de productividad y suma puntos.
        """
        informe = crud.kpi.get_by_plan(db, id_plan=id_plan)
        if not informe:
            return None
        
        # Actualizar el campo dinámicamente (Evitando negativos)
        current_val = getattr(informe, field, 0)
        new_val = max(0, current_val + increment)
        setattr(informe, field, new_val)
        
        # Sumar/Restar puntos
        if puntos != 0:
            informe.puntos_alcanzados = max(0, informe.puntos_alcanzados + puntos)
            
        db.add(informe)
        db.commit()
        db.refresh(informe)
        
        # Verificar si alcanzó la meta para generar bono (Lógica básica)
        if informe.porcentaje_alcance and informe.porcentaje_alcance >= 100:
            KPIService.check_and_generate_bonus(db, informe=informe)
            
        return informe

    @staticmethod
    def check_and_generate_bonus(db: Session, *, informe: InformeProductividad):
        """
        Lógica para generar un incentivo automático si se cumple la meta.
        """
        # Evitar duplicados para el mismo plan
        existe = db.query(IncentivoPago).filter(
            IncentivoPago.id_plan_origen == informe.id_plan
        ).first()
        
        if not existe:
            # Obtener el id_empleado del plan
            plan = crud.plan.get(db, id=informe.id_plan)
            if plan:
                bonus_in = schemas.kpi.IncentivoPagoCreate(
                    id_empleado=plan.id_empleado,
                    id_plan_origen=plan.id_plan,
                    monto_bono=Decimal("50.00"),
                    concepto="Bono por cumplimiento de meta semanal al 100%",
                    estado_pago="Pendiente"
                )
                crud.incentivo.create(db, obj_in=bonus_in)

    @staticmethod
    def get_performance_report(db: Session, id_empleado: int) -> List[InformeProductividad]:
        """
        Obtiene el historial de rendimiento de un empleado.
        """
        return db.query(InformeProductividad).join(
            PlanTrabajoSemanal
        ).filter(
            PlanTrabajoSemanal.id_empleado == id_empleado
        ).order_by(InformeProductividad.fecha_evaluacion.desc()).all()

    @staticmethod
    def sync_real_time_metrics(db: Session, *, id_informe: int) -> Optional[InformeProductividad]:
        """
        Sincroniza los valores 'reales' del informe consultando las tablas del sistema
        y la base de datos externa UpgradeDB.
        """
        informe = crud.kpi.get(db, id=id_informe)
        if not informe:
            return None
        
        plan = crud.plan.get(db, id=informe.id_plan)
        if not plan:
            return None

        # 1. Contar Visitas Reales (Local)
        informe.real_visitas = db.query(models.visita.RegistroVisita).filter(
            models.visita.RegistroVisita.id_plan == plan.id_plan
        ).count()

        # 2. Contar Llamadas (Local)
        informe.real_llamadas = db.query(models.crm.RegistroLlamada).filter(
            models.crm.RegistroLlamada.id_plan == plan.id_plan
        ).count()

        # 3. Contar Emails (Local)
        informe.real_emails = db.query(models.crm.RegistroEmail).filter(
            models.crm.RegistroEmail.id_plan == plan.id_plan
        ).count()

        # 4. Sincronizar Cotizaciones (UpgradeDB)
        empleado = plan.empleado
        if empleado and empleado.id_vendedor_externo:
            informe.real_cotizaciones = ExternalDBService.count_cotizaciones(
                vendedor_id_externo=empleado.id_vendedor_externo,
                fecha_inicio=plan.fecha_inicio_semana,
                fecha_fin=plan.fecha_fin_semana
            )

        # 5. Calcular Puntos Alcanzados (Reglas de negocio)
        # Visita = 10 pts, Llamada = 2 pts, Email = 1 pt, Cotización = 25 pts
        puntos = (informe.real_visitas * 10) + \
                 (informe.real_visitas_asistidas * 20) + \
                 (informe.real_llamadas * 2) + \
                 (informe.real_emails * 1) + \
                 (informe.real_cotizaciones * 25)
        
        informe.puntos_alcanzados = puntos
        
        db.add(informe)
        db.commit()
        db.refresh(informe)
        
        # 6. Verificar bono
        if informe.porcentaje_alcance and informe.porcentaje_alcance >= 100:
            KPIService.check_and_generate_bonus(db, informe=informe)

        return informe

kpi_service = KPIService()
