from sqlalchemy import Column, Integer, String, Text, Boolean, Date, DateTime, ForeignKey, Enum as SQLEnum, text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.enums import CategoriaClienteEnum

# 1. CARTERA DE CLIENTES (La Oficial del Excel)
class CarteraClientes(Base):
    __tablename__ = "cartera_clientes"

    id_cliente = Column(Integer, primary_key=True, index=True)
    nombre_cliente = Column(String(250), nullable=False)
    ruc_dni = Column(String(20), unique=True, index=True)
    categoria = Column(SQLEnum(CategoriaClienteEnum, name="categoria_cliente_enum"))
    
    direccion = Column(String(250))
    id_distrito = Column(Integer, ForeignKey("distritos.id_distrito", ondelete="RESTRICT"))
    fecha_ultima_visita = Column(Date)

    # Contactos
    nombre_contacto = Column(String(150))
    celular_contacto = Column(String(50))
    email_contacto = Column(String(100))
    
    nombre_gerente = Column(String(150))
    celular_gerente = Column(String(50))
    email_gerente = Column(String(100))
    
    nombre_logistico = Column(String(150))
    celular_logistico = Column(String(50))
    email_logistico = Column(String(100))

    observaciones = Column(Text)
    activo = Column(Boolean, default=True)

    # Relaciones
    distrito = relationship("Distrito")


# 2. MAESTRO DE ENTIDADES (Bandeja de Entrada / Prospectos Nuevos)
class MaestroEntidades(Base):
    __tablename__ = "maestro_entidades"

    id_entidad = Column(Integer, primary_key=True, index=True)
    poder = Column(String(100))
    sector = Column(String(100))
    ruc = Column(String(11), unique=True, index=True)
    nombre_entidad = Column(String(250), nullable=False)
    id_distrito = Column(Integer, ForeignKey("distritos.id_distrito", ondelete="RESTRICT"))
    grupo = Column(String(150))
    
    fecha_registro = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))
    activo = Column(Boolean, default=True)

    distrito = relationship("Distrito")