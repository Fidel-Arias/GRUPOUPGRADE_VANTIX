from sqlalchemy import Column, String, Boolean, DateTime, Integer, text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

# 1. DEPARTAMENTOS (La raiz)
class Departamento(Base):
    __tablename__ = "departamentos"

    id_departamento = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False, unique=True)
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

    # Relación: Un departamento tiene muchas provincias
    provincias = relationship("Provincia", back_populates="departamento")

# 2. PROVINCIAS (Heredan del departamento)
class Provincia(Base):
    __tablename__ = "provincias"

    id_provincia = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

    # Clave foránea que apunta a la tabla Departamento
    id_departamento = Column(Integer, ForeignKey("departamentos.id_departamento"))

    # Relación: Una provincia pertenece a un departamento
    departamento = relationship("Departamento", back_populates="provincias")
    # Relación: Una provincia tiene muchos distritos
    distritos = relationship("Distrito", back_populates="provincia")

# 3. DISTRITOS (Heredan de la provincia)
class Distrito(Base):
    __tablename__ = "distritos"

    id_distrito = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    ubigeo = Column(String(6))
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

    # Clave foránea que apunta a la tabla Provincia
    id_provincia = Column(Integer, ForeignKey("provincias.id_provincia"))

    # Relación: Un distrito pertenece a una provincia
    provincia = relationship("Provincia", back_populates="distritos")

    