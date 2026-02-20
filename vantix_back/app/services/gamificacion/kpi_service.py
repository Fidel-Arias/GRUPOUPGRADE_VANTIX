from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.models.kpi import InformeProductividad, IncentivoPago
from app.models.plan import PlanTrabajoSemanal
from decimal import Decimal
from typing import List, Optional

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

kpi_service = KPIService()
