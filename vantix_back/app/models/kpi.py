from sqlalchemy import Column, Integer, Numeric, Date, String, ForeignKey, text, Computed
from sqlalchemy.orm import relationship
from app.core.database import Base

# 1. Tabla de Informe de Productividad
class InformeProductividad(Base):
    __tablename__ = "informe_productividad_semanal"

    id_informe = Column(Integer, primary_key=True, index=True)
    id_plan = Column(Integer, ForeignKey("plan_trabajo_semanal.id_plan", ondelete="CASCADE"), unique=True)
    
    # Métricas Reales
    monto_ventas_real = Column(Numeric(12, 2), default=0)
    cant_clientes_nuevos = Column(Integer, default=0)
    cant_visitas_realizadas = Column(Integer, default=0)
    
    # PUNTOS (Gamificación)
    puntos_ventas = Column(Integer, default=0)
    puntos_nuevos_clientes = Column(Integer, default=0)
    puntos_visitas = Column(Integer, default=0)
    puntos_llamadas = Column(Integer, default=0)
    puntos_emails = Column(Integer, default=0)
    
    # Campo calculado en base de datos (PostgreSQL 12+)
    # Si usas una versión vieja, quita Computed y calcúlalo en Python
    puntaje_total_semanal = Column(Integer, Computed("puntos_ventas + puntos_nuevos_clientes + puntos_visitas + puntos_llamadas + puntos_emails"))
    
    fecha_evaluacion = Column(Date, server_default=text("CURRENT_DATE"))

    # --- RELACIÓN AGREGADA ---
    # Vincula este informe con su plan maestro
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