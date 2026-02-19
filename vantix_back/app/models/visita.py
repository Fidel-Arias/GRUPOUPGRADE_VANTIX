from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Numeric, text
from sqlalchemy.orm import relationship
from app.core.database import Base

class RegistroVisita(Base):
    __tablename__ = "registro_visitas"

    id_visita = Column(Integer, primary_key=True, index=True)
    id_plan = Column(Integer, ForeignKey("plan_trabajo_semanal.id_plan", ondelete="CASCADE"))
    
    # --- CONEXIÓN CON TU MAESTRO DE CLIENTES ---
    id_entidad = Column(Integer, ForeignKey("maestro_entidades.id_entidad"))
    
    # Campos de contacto específicos de ESTA visita
    direccion_actual = Column(Text) # Puede diferir de la del maestro
    nombre_contacto = Column(String(150))
    telefono_contacto = Column(String(50))
    email_contacto = Column(String(100))
    
    # Evidencia
    fecha_hora_checkin = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))
    observaciones = Column(Text)
    url_foto_evidencia = Column(Text, nullable=False) # ¡Obligatorio!
    geolocalizacion_lat = Column(Numeric(10,8))
    geolocalizacion_lon = Column(Numeric(11,8))

    # Relaciones
    plan = relationship("PlanTrabajoSemanal", back_populates="visitas")
    entidad = relationship("MaestroEntidades") # Para saber a qué empresa fuiste