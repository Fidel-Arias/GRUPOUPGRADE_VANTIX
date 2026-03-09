from sqlalchemy import Column, Integer, String, Text, Date, Boolean, Numeric, ForeignKey, text, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class Cotizacion(Base):
    __tablename__ = "cotizaciones"

    id_cotizacion = Column(Integer, primary_key=True, index=True)
    numero_cotizacion = Column(Integer, nullable=True, index=True)
    id_almacen = Column(Integer, nullable=False)
    fecha_emision = Column(Date, nullable=False, server_default=text("CURRENT_DATE"))
    
    # Utilizamos la llave interna hacia la base de datos Vantix en vez de los ID externos
    id_cliente = Column(Integer, ForeignKey("cartera_clientes.id_cliente", ondelete="RESTRICT"))
    id_empleado = Column(Integer, ForeignKey("empleados.id_empleado", ondelete="RESTRICT"))
    
    id_moneda = Column(Integer, nullable=False)
    total = Column(Numeric(15, 2), default=0.00)
    observaciones = Column(Text, nullable=True)
    
    # --- CAMPOS NUEVOS AGREGADOS ---
    garantia_meses = Column(Integer, nullable=True) 
    id_forma_pago = Column(Integer, nullable=True)
    descripcion = Column(Text, nullable=True)
    
    fecha_creacion = Column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))

    # Relaciones simples unidireccionales para no romper los modelos de empleado y cartera
    cliente = relationship("CarteraClientes")
    empleado = relationship("Empleado")
    # Relación bidireccional entre la cabecera y su detalle
    detalles = relationship("DetalleCotizacion", back_populates="cotizacion", cascade="all, delete-orphan")


class DetalleCotizacion(Base):
    __tablename__ = "cotizaciones_detalles"

    id_detalle = Column(Integer, primary_key=True, index=True)
    id_cotizacion = Column(Integer, ForeignKey("cotizaciones.id_cotizacion", ondelete="CASCADE"), nullable=False)
    
    id_producto = Column(Integer, nullable=False)
    cantidad = Column(Integer, nullable=False, default=1)
    precio_unitario = Column(Numeric(15, 2), nullable=False)
    precio_producto = Column(Numeric(15, 2), nullable=False)
    total = Column(Numeric(15, 2), nullable=False)
    regalo = Column(Boolean, default=False)
    id_moneda = Column(Integer, nullable=False)
    
    # El campo: precio_unitario_real (EXCLUIDO intencionalmente)

    # Relación
    cotizacion = relationship("Cotizacion", back_populates="detalles")