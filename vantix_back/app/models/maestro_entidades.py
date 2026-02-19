from sqlalchemy import Column, String, Boolean, DateTime, Integer, text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class MaestroEntidad(Base):
    __tablename__ = "maestro_entidades"

    id_entidad = Column(Integer, primary_key=True, index=True)
    poder = Column(String(100))
    sector = Column(String(100))
    ruc = Column(String(11), unique=True, index=True)
    nombre_entidad = Column(String(250), nullable=False)
    grupo = Column(String(150))

    # Relación: Una entidad pertenece a un distrito
    id_distrito = Column(Integer, ForeignKey('distritos.id_distrito'))
    distrito = relationship("Distrito")

    # Auditoría
    fecha_registro = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))
    activo = Column(Boolean, default=True)