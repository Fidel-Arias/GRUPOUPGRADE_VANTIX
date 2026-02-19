from sqlalchemy import Column, Integer, String, Date, Numeric, ForeignKey
from app.core.database import Base

class GastoMovilidad(Base):
    __tablename__ = "planilla_gastos_movilidad"

    id_gasto = Column(Integer, primary_key=True, index=True)
    id_plan = Column(Integer, ForeignKey("plan_trabajo_semanal.id_plan", ondelete="CASCADE"))
    
    fecha_gasto = Column(Date, nullable=False)
    lugar_origen = Column(String(150))
    lugar_destino = Column(String(150))
    motivo_visita = Column(String(200))
    empresa_visitada = Column(String(150))
    
    # Usamos Numeric para dinero en SQLAlchemy
    monto_gastado = Column(Numeric(10, 2), nullable=False)

    # --- RELACIÓN AGREGADA ---
    # Esto permite saber a qué plan pertenece este gasto
    plan = relationship("PlanTrabajoSemanal", back_populates="gastos")