from sqlalchemy import Column, Integer, DECIMAL, Date, String, ForeignKey, text, Computed, Numeric
from sqlalchemy.orm import relationship
from app.core.database import Base

class InformeProductividad(Base):
    __tablename__ = "informe_productividad_semanal"

    id_informe = Column(Integer, primary_key=True, index=True)
    id_plan = Column(Integer, ForeignKey("plan_trabajo_semanal.id_plan", ondelete="CASCADE"), unique=True)
    
    # 1. VISITAS NORMALES
    meta_visitas = Column(Integer, default=25)
    real_visitas = Column(Integer, default=0)
    
    # 2. VISITAS ASISTIDAS
    meta_visitas_asistidas = Column(Integer, default=0)
    real_visitas_asistidas = Column(Integer, default=0)
    
    # 3. LLAMADAS
    meta_llamadas = Column(Integer, default=30)
    real_llamadas = Column(Integer, default=0)
    
    # 4. EMAILS
    meta_emails = Column(Integer, default=100)
    real_emails = Column(Integer, default=0)
    
    # 5. COTIZACIONES
    meta_cotizaciones = Column(Integer, default=0)
    real_cotizaciones = Column(Integer, default=0)
    
    # 6. PUNTOS Y GAMIFICACIÓN
    puntos_alcanzados = Column(Integer, default=0)
    puntaje_objetivo = Column(Integer, default=205) # Lo que diga tu Excel/Reglas
    
    # 7. ALCANCE (La columna calculada automáticamente por Postgres)
    # SQLAlchemy le dice a Python que no intente enviar este dato, que la BD lo calcula.
    porcentaje_alcance = Column(
        DECIMAL(5, 2), 
        Computed("(puntos_alcanzados::numeric / NULLIF(puntaje_objetivo, 0)) * 100")
    )

    fecha_evaluacion = Column(Date, server_default=text("CURRENT_DATE"))

    # Relación con el Plan maestro
    plan = relationship("PlanTrabajoSemanal", back_populates="informe_kpi")


# 2. Tabla de Incentivos y Pagos
class IncentivoPago(Base):
    __tablename__ = "incentivos_pagos"

    id_incentivo = Column(Integer, primary_key=True, index=True)
    id_empleado = Column(Integer, ForeignKey("empleados.id_empleado"))
    id_plan_origen = Column(Integer, ForeignKey("plan_trabajo_semanal.id_plan"))
    
    monto_bono = Column(Numeric(10, 2), default=50.00)
    concepto = Column(String(100))
    fecha_generacion = Column(Date, server_default=text("CURRENT_DATE"))
    estado_pago = Column(String(20), default='Pendiente')

    # --- RELACIONES AGREGADAS ---
    # 1. Saber quién ganó el bono
    empleado = relationship("Empleado", back_populates="incentivos")
    
    # 2. Saber gracias a qué plan se ganó el bono (Unidireccional por ahora es suficiente)
    plan_origen = relationship("PlanTrabajoSemanal")