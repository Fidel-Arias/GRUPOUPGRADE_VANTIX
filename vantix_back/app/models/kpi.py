from sqlalchemy import Column, Integer, DECIMAL, Date, String, ForeignKey, text, Computed, Numeric
from sqlalchemy.orm import relationship
from app.core.database import Base

class InformeProductividad(Base):
    __tablename__ = "informe_productividad_semanal"

    id_informe = Column(Integer, primary_key=True, index=True)
    id_plan = Column(Integer, ForeignKey("plan_trabajo_semanal.id_plan", ondelete="CASCADE"), unique=True)
    
    # 1. Relación al Maestro de Metas (Nuevo)
    id_maestro_meta = Column(Integer, ForeignKey("maestro_metas.id_maestro"))
    
    # 2. VALORES REALES (Lo avanzado por el empleado)
    real_visitas = Column(Integer, default=0)
    real_visitas_asistidas = Column(Integer, default=0)
    real_llamadas = Column(Integer, default=0)
    real_emails = Column(Integer, default=0)
    real_cotizaciones = Column(Integer, default=0)
    real_ventas_monto = Column(Numeric(18, 2), default=0.00)
    
    # 3. RESULTADO DE GAMIFICACIÓN
    puntos_alcanzados = Column(Integer, default=0)
    
    fecha_evaluacion = Column(Date, server_default=text("CURRENT_DATE"))

    # Relaciones
    plan = relationship("PlanTrabajoSemanal", back_populates="informe_kpi")
    maestro = relationship("MaestroMetas")

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

    # Relaciones
    empleado = relationship("Empleado", back_populates="incentivos")
    plan_origen = relationship("PlanTrabajoSemanal")

# 3. TABLA MAESTRA DE METAS (DEFINICIÓN GENERAL)
class MaestroMetas(Base):
    __tablename__ = "maestro_metas"

    id_maestro = Column(Integer, primary_key=True, index=True)
    nombre_meta = Column(String(100), nullable=False) # e.g. 'Semana Estándar'
    
    # Metas (Objetivos)
    meta_visitas = Column(Integer, default=25)
    meta_visitas_asistidas = Column(Integer, default=0)
    meta_llamadas = Column(Integer, default=30)
    meta_emails = Column(Integer, default=100)
    meta_cotizaciones = Column(Integer, default=0)
    meta_ventas = Column(Numeric(18, 2), default=0.00) # Objetivo en dinero
    
    # Pesos (Puntos por unidad)
    puntos_visita = Column(Integer, default=10)
    puntos_visita_asistida = Column(Integer, default=5)
    puntos_llamada = Column(Integer, default=1)
    puntos_email = Column(Integer, default=1)
    puntos_cotizacion = Column(Integer, default=0)
    puntos_venta = Column(Integer, default=0) # Puntos por cada 1.00 (o divisa base)
    
    # Objetivo Final
    puntaje_objetivo = Column(Integer, default=205)
    
    is_active = Column(Integer, default=1) # 1: Activa, 0: Inactiva
    fecha_creacion = Column(Date, server_default=text("CURRENT_DATE"))