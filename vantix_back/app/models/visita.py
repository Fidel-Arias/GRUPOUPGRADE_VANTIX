from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Numeric, Enum as SQLEnum, text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.enums import ResultadoEstadoEnum

class RegistroVisita(Base):
    __tablename__ = "registro_visitas"

    id_visita = Column(Integer, primary_key=True, index=True)
    id_plan = Column(Integer, ForeignKey("plan_trabajo_semanal.id_plan", ondelete="CASCADE"))
    
    # ¡Apunta a la Cartera de Clientes!
    id_cliente = Column(Integer, ForeignKey("cartera_clientes.id_cliente", ondelete="RESTRICT"))
    
    fecha_hora_checkin = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))
    observaciones = Column(Text)
    url_foto_evidencia = Column(Text, nullable=False)
    geolocalizacion_lat = Column(Numeric(10,8))
    geolocalizacion_lon = Column(Numeric(11,8))
    
    # ¡Enum de Resultado!
    resultado = Column(SQLEnum(ResultadoEstadoEnum, name="resultado_estado_enum"))

    # Relaciones
    plan = relationship("PlanTrabajoSemanal", back_populates="visitas")
    cliente = relationship("CarteraClientes")