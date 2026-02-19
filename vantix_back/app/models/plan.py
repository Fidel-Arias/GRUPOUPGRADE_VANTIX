from sqlalchemy import Column, Integer, String, Date, Text, ForeignKey, text
from sqlalchemy.orm import relationship
from app.core.database import Base

class PlanTrabajoSemanal(Base):
    __tablename__ = "plan_trabajo_semanal"

    id_plan = Column(Integer, primary_key=True, index=True)
    id_empleado = Column(Integer, ForeignKey("empleados.id_empleado"))
    
    fecha_inicio_semana = Column(Date, nullable=False)
    fecha_fin_semana = Column(Date, nullable=False)
    estado = Column(String(20), default='Borrador') # Borrador, Aprobado, Cerrado
    
    # Contadores resumen (se llenan automáticos o manuales)
    total_visitas_programadas = Column(Integer, default=0)
    total_llamadas_realizadas = Column(Integer, default=0)
    total_emails_enviados = Column(Integer, default=0)
    observaciones_supervisor = Column(Text)
    
    # --- RELACIONES MAESTRAS (El corazón del sistema) ---
    
    # 1. Hacia arriba (Empleado)
    empleado = relationship("Empleado", back_populates="planes")

    # 2. Hacia abajo (Detalles de ejecución)
    # cascade="all, delete-orphan" significa: si borro el plan, se borran sus visitas/llamadas automáticamente.
    visitas = relationship("RegistroVisita", back_populates="plan", cascade="all, delete-orphan")
    llamadas = relationship("RegistroLlamada", back_populates="plan", cascade="all, delete-orphan") # Nombre de clase en crm.py
    emails = relationship("RegistroEmail", back_populates="plan", cascade="all, delete-orphan")     # Nombre de clase en crm.py
    gastos = relationship("GastoMovilidad", back_populates="plan", cascade="all, delete-orphan")    # Nombre de clase en finanzas.py
    
    # 3. Relación 1 a 1 con el Informe de KPI
    informe_kpi = relationship("InformeProductividad", back_populates="plan", uselist=False, cascade="all, delete-orphan")