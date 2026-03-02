from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.models.kpi import InformeProductividad, IncentivoPago, MaestroMetas
from app.models.plan import PlanTrabajoSemanal
from decimal import Decimal
from typing import List, Optional
from app.services.external.upgrade_db import ExternalDBService
from datetime import date

class KPIService:

    @staticmethod
    def update_kpi_metrics(
        db: Session, 
        *, 
        id_plan: int, 
        tipo_actividad: str, # Ej: 'visita', 'llamada'
        increment: int = 1
    ) -> Optional[InformeProductividad]:
        """
        Actualiza una métrica específica usando los pesos del Maestro de Metas vinculado.
        """
        informe = crud.kpi.get_by_plan(db, id_plan=id_plan)
        if not informe or not informe.id_maestro_meta:
            return None
        
        maestro = db.query(MaestroMetas).filter(MaestroMetas.id_maestro == informe.id_maestro_meta).first()
        if not maestro:
            return None

        # Mapeo de tipo de actividad a columna y peso
        mapping = {
            "visita": ("real_visitas", maestro.puntos_visita),
            "visita_asistida": ("real_visitas_asistidas", maestro.puntos_visita_asistida),
            "llamada": ("real_llamadas", maestro.puntos_llamada),
            "email": ("real_emails", maestro.puntos_email),
            "cotizacion": ("real_cotizaciones", maestro.puntos_cotizacion),
            "venta": ("real_ventas_monto", maestro.puntos_venta)
        }

        if tipo_actividad not in mapping:
            return informe

        col_name, peso = mapping[tipo_actividad]
        
        # 1. Actualizar valor real
        current_val = getattr(informe, col_name, 0)
        setattr(informe, col_name, max(0, current_val + increment))
        
        # 2. Sumar puntos
        informe.puntos_alcanzados = max(0, informe.puntos_alcanzados + (increment * peso))
        
        db.add(informe)
        db.commit()
        db.refresh(informe)
        
        # 3. Verificar bono (Cálculo de porcentaje manual ya que quitamos la columna Computed)
        porcentaje = (informe.puntos_alcanzados / maestro.puntaje_objetivo * 100) if maestro.puntaje_objetivo > 0 else 0
        if porcentaje >= 100:
            KPIService.check_and_generate_bonus(db, informe=informe)
            
        return informe

    @staticmethod
    def check_and_generate_bonus(db: Session, *, informe: InformeProductividad):
        """Genera un incentivo automático si se cumple la meta."""
        existe = db.query(IncentivoPago).filter(IncentivoPago.id_plan_origen == informe.id_plan).first()
        if not existe:
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
        """Obtiene el historial de rendimiento de un empleado."""
        return db.query(InformeProductividad).join(
            PlanTrabajoSemanal
        ).filter(
            PlanTrabajoSemanal.id_empleado == id_empleado
        ).order_by(InformeProductividad.fecha_evaluacion.desc()).all()

    @staticmethod
    def sync_real_time_metrics(db: Session, *, id_informe: int) -> Optional[InformeProductividad]:
        """Sincroniza los valores reales consultando las tablas de actividad."""
        from app.models.visita import RegistroVisita
        from app.models.crm import RegistroLlamada, RegistroEmail
        
        informe = crud.kpi.get(db, id=id_informe)
        if not informe or not informe.id_maestro_meta:
            return None

        maestro = db.query(MaestroMetas).filter(MaestroMetas.id_maestro == informe.id_maestro_meta).first()
        plan = db.query(PlanTrabajoSemanal).filter(PlanTrabajoSemanal.id_plan == informe.id_plan).first()
        if not plan or not maestro:
            return None

        # 1. Visitas
        informe.real_visitas = db.query(RegistroVisita).filter(
            RegistroVisita.id_empleado == plan.id_empleado,
            RegistroVisita.fecha_visita >= plan.fecha_inicio_semana,
            RegistroVisita.fecha_visita <= plan.fecha_fin_semana,
            RegistroVisita.id_visita_asistida == None
        ).count()
        
        informe.real_visitas_asistidas = db.query(RegistroVisita).filter(
            RegistroVisita.id_empleado == plan.id_empleado,
            RegistroVisita.fecha_visita >= plan.fecha_inicio_semana,
            RegistroVisita.fecha_visita <= plan.fecha_fin_semana,
            RegistroVisita.id_visita_asistida != None
        ).count()

        # 2. Llamadas
        informe.real_llamadas = db.query(RegistroLlamada).filter(
            RegistroLlamada.id_empleado == plan.id_empleado,
            RegistroLlamada.fecha_registro >= plan.fecha_inicio_semana,
            RegistroLlamada.fecha_registro <= plan.fecha_fin_semana
        ).count()

        # 3. Emails
        informe.real_emails = db.query(RegistroEmail).filter(
            RegistroEmail.id_empleado == plan.id_empleado,
            RegistroEmail.fecha_registro >= plan.fecha_inicio_semana,
            RegistroEmail.fecha_registro <= plan.fecha_fin_semana
        ).count()

        # 4. Cotizaciones y Ventas (Upgrade DB)
        empleado = plan.empleado
        if empleado and empleado.id_vendedor_externo:
            informe.real_cotizaciones = ExternalDBService.count_cotizaciones(
                vendedor_id_externo=empleado.id_vendedor_externo,
                fecha_inicio=plan.fecha_inicio_semana,
                fecha_fin=plan.fecha_fin_semana
            )
            informe.real_ventas_monto = ExternalDBService.sum_ventas_monto(
                vendedor_id_externo=empleado.id_vendedor_externo,
                fecha_inicio=plan.fecha_inicio_semana,
                fecha_fin=plan.fecha_fin_semana
            )

        # 4. Calcular Puntos Totales usando pesos del maestro vinculado
        puntos = (informe.real_visitas * maestro.puntos_visita)
        puntos += (informe.real_visitas_asistidas * maestro.puntos_visita_asistida)
        puntos += (informe.real_llamadas * maestro.puntos_llamada)
        puntos += (informe.real_emails * maestro.puntos_email)
        puntos += (informe.real_cotizaciones * maestro.puntos_cotizacion)
        puntos += int(informe.real_ventas_monto * (maestro.puntos_venta or 0))

        informe.puntos_alcanzados = puntos
        db.add(informe)
        db.commit()
        db.refresh(informe)
        
        porcentaje = (puntos / maestro.puntaje_objetivo * 100) if maestro.puntaje_objetivo > 0 else 0
        if porcentaje >= 100:
            KPIService.check_and_generate_bonus(db, informe=informe)

        return informe

    @staticmethod
    def sync_all_weekly_sales(db: Session, fecha_fin_sabado: date) -> int:
        """
        Sincroniza masivamente las ventas de todos los empleados para la semana
        que termina en la fecha indicada.
        """
        # 1. Buscar planes que terminen en esa fecha
        planes = db.query(PlanTrabajoSemanal).filter(
            PlanTrabajoSemanal.fecha_fin_semana == fecha_fin_sabado
        ).all()

        if not planes:
            return 0

        # Determinamos el rango basado en el primer plan 
        # (Asumimos que todos los planes que terminan el mismo sábado empezaron el mismo lunes)
        f_inicio = planes[0].fecha_inicio_semana
        f_fin = planes[0].fecha_fin_semana

        # 2. Traer todos los totales de Upgrade de una vez
        ventas_upgrade = ExternalDBService.fetch_resumen_ventas_vendedores(f_inicio, f_fin)

        actualizados = 0
        for plan in planes:
            # Solo si el empleado tiene ID externo
            if plan.empleado and plan.empleado.id_vendedor_externo:
                id_ext = plan.empleado.id_vendedor_externo
                monto_real = ventas_upgrade.get(id_ext, Decimal("0.00"))
                
                # Actualizar el informe asociado
                if plan.informe_kpi:
                    informe = plan.informe_kpi
                    informe.real_ventas_monto = monto_real
                    
                    # Forzamos una sincronización completa para recalcular puntos y verificar bonos
                    # usando la lógica ya existente en sync_real_time_metrics
                    KPIService.sync_real_time_metrics(db, id_informe=informe.id_informe)
                    actualizados += 1
        
        return actualizados

    @staticmethod
    def get_weekly_sales_report(db: Session, fecha_inicio: date, fecha_fin: date, id_empleado: Optional[int] = None):
        """
        Obtiene el resumen de ventas realizado por CADA empleado locallmente vinculado o uno específico.
        """
        if id_empleado:
            empleado = db.query(models.empleado.Empleado).filter(models.empleado.Empleado.id_empleado == id_empleado).first()
            if not empleado or not empleado.id_vendedor_externo:
                return []
            
            monto = ExternalDBService.sum_ventas_monto(
                vendedor_id_externo=empleado.id_vendedor_externo,
                fecha_inicio=fecha_inicio,
                fecha_fin=fecha_fin
            )
            return [{
                "id_vendedor_externo": empleado.id_vendedor_externo,
                "nombre_empleado": empleado.nombre_completo,
                "total_ventas": monto,
                "periodo": f"{fecha_inicio} al {fecha_fin}"
            }]

        # Lógica para todos (ya existente)
        ventas_upgrade = ExternalDBService.fetch_resumen_ventas_vendedores(fecha_inicio, fecha_fin)
        reporte = []
        for id_ext, monto in ventas_upgrade.items():
            emp = db.query(models.empleado.Empleado).filter(
                models.empleado.Empleado.id_vendedor_externo == id_ext
            ).first()
            
            reporte.append({
                "id_vendedor_externo": id_ext,
                "nombre_empleado": emp.nombre_completo if emp else f"Vendedor Externo ID: {id_ext}",
                "total_ventas": monto,
                "periodo": f"{fecha_inicio} al {fecha_fin}"
            })
        return reporte

kpi_service = KPIService()
