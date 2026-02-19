from sqlalchemy import Column, Integer, String, Date, Time, Text, ForeignKey, Enum as SQLEnum, text, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.enums import TipoActividadEnum

class PlanTrabajoSemanal(Base):
    __tablename__ = "plan_trabajo_semanal"

    id_plan = Column(Integer, primary_key=True, index=True)
    id_empleado = Column(Integer, ForeignKey("empleados.id_empleado"))
    
    fecha_inicio_semana = Column(Date, nullable=False)
    fecha_fin_semana = Column(Date, nullable=False)
    estado = Column(String(20), default='Borrador')
    
    observaciones_supervisor = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))
    
    # --- RELACIONES ---
    empleado = relationship("Empleado", back_populates="planes")
    detalles_agenda = relationship("DetallePlanTrabajo", back_populates="plan", cascade="all, delete-orphan")
    visitas = relationship("RegistroVisita", back_populates="plan", cascade="all, delete-orphan")
    llamadas = relationship("RegistroLlamada", back_populates="plan", cascade="all, delete-orphan")
    emails = relationship("RegistroEmail", back_populates="plan", cascade="all, delete-orphan")
    gastos = relationship("GastoMovilidad", back_populates="plan", cascade="all, delete-orphan")
    
    # Esta es la conexión con tu nuevo "Dashboard"
    informe_kpi = relationship("InformeProductividad", back_populates="plan", uselist=False, cascade="all, delete-orphan")


# EL DETALLE DEL PLAN (La Grilla)
class DetallePlanTrabajo(Base):
    __tablename__ = "detalle_plan_trabajo"

    id_detalle = Column(Integer, primary_key=True, index=True)
    id_plan = Column(Integer, ForeignKey("plan_trabajo_semanal.id_plan", ondelete="CASCADE"))
    
    dia_semana = Column(String(15), nullable=False) # Guardamos como string validado o usamos SQLEnum
    hora_programada = Column(Time, nullable=False)
    
    # ¡Enum de Actividad!
    tipo_actividad = Column(SQLEnum(TipoActividadEnum, name="tipo_actividad_enum", values_callable=lambda obj: [e.value for e in obj]), nullable=False)
    
    # ¡Apunta a la Cartera de Clientes!
    id_cliente = Column(Integer, ForeignKey("cartera_clientes.id_cliente", ondelete="RESTRICT"))

    # Relaciones
    plan = relationship("PlanTrabajoSemanal", back_populates="detalles_agenda")
    cliente = relationship("CarteraClientes")